import { addKeyword } from '@builderbot/bot';
import { checkEscape } from '../utils/flowGuard';
import nodemailer from "nodemailer";
import { existsSync, mkdirSync } from "fs";
import fs from 'fs-extra';
import { join } from 'path';

import { emailLogger } from '../logger/logger';
import databaseLogger from '../logger/databaseLogger';
import acciones from '../models/actions';

// Función para enviar un correo electrónico con los documentos adjuntos
async function sendEmail(comercio: any, files: { path: string; name: string; }[]) {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: +(process.env.EMAIL_PORT ?? 587),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const attachments = files.map((file) => ({
      filename: file.name,
      path: file.path,
    }));

    const bodyHtml = `
    Nombre de Comercio: ${comercio.nombre}<br>
    CUIT: ${comercio.cuit}<br>
    Teléfono: ${comercio.telefono}<br>
    Email: ${comercio.email}<br>
    Dirección: ${comercio.direccion}<br>
    <br>
    Se adjunta la documentación del comercio.`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_TO,
      subject: "Solicitud de Registro de Comercio - CUIT: " + comercio.cuit,
      html: bodyHtml,
      attachments: attachments,
    };

    await transporter.sendMail(mailOptions);
    console.log("Email enviado exitosamente!");
  } catch (error) {
    emailLogger.error("Error al enviar el email: " + comercio.telefono, error.stack);
  }
}

// Función para crear un directorio si no existe
async function createDirectoryIfNotExists(directory: string) {
  try {
    if (!existsSync(directory)) {
      mkdirSync(directory, { recursive: true });
    }
  } catch (error) {
    console.log(error);
    emailLogger.error("ERROR createDirectoryIfNotExists :", error.stack);
  }
}

// Flujo de alta de comercio
const flowAltaComercio = addKeyword("__flow_alta__", { sensitive: false })
  .addAnswer(
    "Para registrar tu comercio necesito algunos datos. En cualquier momento podés escribir *cancelar* para salir.\n\n¿Cuál es el nombre de tu comercio?",
    { capture: true },
    async (ctx, { fallBack, endFlow, state }) => {
      databaseLogger.addLog(ctx.from, acciones.ADHERIR);
      if (await checkEscape(ctx, state, endFlow, 'intentos_nombre')) return;
      const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
      if (nameRegex.test(ctx.body)) {
        await state.update({ nombre: ctx.body });
      } else {
        return fallBack("¿Podés verificar el nombre? Solo letras por favor. Escribí *cancelar* para salir.");
      }
    }
  )
  .addAnswer(
    "El CUIT del comercio (11 dígitos, sin guiones ni espacios):",
    { capture: true },
    async (ctx, { fallBack, endFlow, state }) => {
      if (await checkEscape(ctx, state, endFlow, 'intentos_cuit')) return;
      const cuitRegex = /^\d{11}$/;
      if (cuitRegex.test(ctx.body)) {
        await state.update({ cuit: ctx.body });
      } else {
        return fallBack("¿Podés verificar el CUIT? Debe tener 11 dígitos. Escribí *cancelar* para salir.");
      }
    }
  )
  .addAnswer(
    "¡Perfecto! Agendaré el siguiente número de teléfono como contacto:",
    null,
    async (ctx, { flowDynamic, state }) => {
      await state.update({ telefono: "+" + ctx.from });
      return flowDynamic([{ body: "+" + ctx.from }]);
    }
  )
  .addAnswer(
    "Tu dirección de correo electrónico:",
    { capture: true },
    async (ctx, { fallBack, endFlow, state }) => {
      if (await checkEscape(ctx, state, endFlow, 'intentos_email')) return;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(ctx.body)) {
        await state.update({ email: ctx.body });
      } else {
        return fallBack("¿Podés verificar el email? Escribí *cancelar* para salir.");
      }
    }
  )
  .addAnswer(
    "Tu dirección física del comercio:",
    { capture: true },
    async (ctx, { fallBack, endFlow, state }) => {
      if (await checkEscape(ctx, state, endFlow, 'intentos_direccion')) return;
      if (ctx.body && ctx.body.trim().length > 0) {
        await state.update({ direccion: ctx.body });
      } else {
        return fallBack("¿Podés ingresar la dirección? No puede estar vacía. Escribí *cancelar* para salir.");
      }
    }
  )
  .addAnswer(
    "*Enviame una foto de la constancia de inscripción en AFIP:*",
    { capture: true },
    async (ctx, { fallBack, endFlow, provider, state }) => {
      if (await checkEscape(ctx, state, endFlow, 'intentos_afip')) return;
      const merchantImagesDirectory = "./comercios/" + ctx.from;
      await createDirectoryIfNotExists(merchantImagesDirectory);
      try {
        const localPath = await provider.saveFile(ctx, { path: merchantImagesDirectory });
        console.log("CONSTANCIA AFIP > " + localPath);
      } catch (error) {
        emailLogger.error("CONSTANCIA AFIP ERROR > " + error.stack);
        return fallBack("Ocurrió un error al recibir la imagen. Intentá de nuevo o escribí *cancelar*.");
      }
    }
  )
  .addAnswer(
    "Ahora enviame una foto del DNI del titular del comercio:",
    { capture: true },
    async (ctx, { fallBack, endFlow, provider, state }) => {
      if (await checkEscape(ctx, state, endFlow, 'intentos_dni')) return;
      const merchantImagesDirectory = "./comercios/" + ctx.from;
      await createDirectoryIfNotExists(merchantImagesDirectory);
      try {
        const localPath = await provider.saveFile(ctx, { path: merchantImagesDirectory });
        console.log("DNI TITULAR > " + localPath);
      } catch (error) {
        emailLogger.error("DNI ERROR > " + error.stack);
        return fallBack("Ocurrió un error al recibir la imagen. Intentá de nuevo o escribí *cancelar*.");
      }
    }
  )
  .addAnswer(
    "¡Excelente! He derivado toda la documentación a un asesor, el cual te contactará. ¡Muchas gracias por completar el proceso por este medio!"
  )
  .addAction(
    async (ctx, { state }) => {
      try {
        const comercio = state.getMyState();
        const data = JSON.stringify(comercio, null, 2);
        fs.writeFileSync("./comercios/" + ctx.from + "/" + ctx.from + ".json", data);

        const merchantImagesDirectory = "./comercios/" + ctx.from;

        const files = (await fs.readdir(merchantImagesDirectory))
          .filter(file => file.endsWith('.jpeg') || file.endsWith('.jpg') || file.endsWith('.png'))
          .map(file => ({
            path: join(merchantImagesDirectory, file),
            name: file
          }));

        await sendEmail(comercio, files);
      } catch (error) {
        emailLogger.error("Ocurrió un error, por favor reintenta!", error.stack);
      }
    }
  );

export default flowAltaComercio;
