import { addKeyword } from '@builderbot/bot';
import { checkEscape } from '../utils/flowGuard';
import nodemailer from "nodemailer";
import { readdirSync, writeFileSync, existsSync, mkdirSync } from "fs";
import fs from 'fs-extra';
import { join } from 'path';
import { findMerchant } from '../services/merchantService';
import { logger, emailLogger } from '../logger/logger';
import databaseLogger from '../logger/databaseLogger';
import acciones from '../models/actions';

// Función para enviar un correo electrónico con los documentos adjuntos
// Función para enviar un correo electrónico con los documentos adjuntos
async function sendEmail(ctx, state: any, files: { path: string; name: string; }[]) {
  try {
    const comercio = await findMerchant(ctx);
    const cupon = state.getMyState().cupon;

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
    Nombre de Comercio: ${comercio.descripcion}<br>
    CUIT: ${comercio.cuit}<br>
    Teléfono: ${ctx.from}<br>
    Email: ${comercio?.email}<br>
    <br>
    Número de Cupón: ${state.getMyState().numero}<br>
    Fecha: ${state.getMyState().fecha}<br>
    Número de Tarjeta: ${state.getMyState().numeroTarjeta}<br>
    Importe: ${state.getMyState().importe}<br>
    <br>
    Se adjunta el cupon adjuntado por comercio.`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_TO,
      subject: "Solicitud de Validación de Cupón - Número de Cupón: " + state.getMyState().numero + " de comercio N° " +comercio.nroempresa ,
      html: bodyHtml,
      attachments: attachments,
    };

    await transporter.sendMail(mailOptions);
    console.log("Email enviado exitosamente!");

    // Eliminar las imágenes después de enviar el correo
    for (const file of files) {
      await fs.unlink(file.path);
    }
  } catch (error) {
    emailLogger.error("Error al enviar el email: " + state.getMyState().comercio?.telefono, error.stack);
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

// Flujo de alta de comercio y validación de cupón
const flowValidarCupon = addKeyword("__flow_cupon__", { sensitive: false })
  .addAnswer(
    "Perfecto! Para validar un cupón necesito algunos datos. En cualquier momento podés escribir *cancelar* para salir.\n\nProporciona el número de cupón:",
    { capture: true },
    async (ctx, { fallBack, endFlow, state }) => {
      await state.clear();
      if (await checkEscape(ctx, state, endFlow, 'intentos_numero')) return;
      const cuponRegex = /^\d+$/;
      if (cuponRegex.test(ctx.body)) {
        await state.update({ numero: ctx.body });
      } else {
        return fallBack("¿Podés verificar el número de cupón? Debe ser solo números. Escribí *cancelar* para salir.");
      }
    }
  )
  .addAnswer(
    "Ahora necesito la fecha del cupón (DD/MM/AAAA):",
    { capture: true },
    async (ctx, { fallBack, endFlow, state }) => {
      if (await checkEscape(ctx, state, endFlow, 'intentos_fecha')) return;
      const fechaRegex = /^\d{2}\/\d{2}\/\d{4}$/;
      if (fechaRegex.test(ctx.body)) {
        await state.update({ fecha: ctx.body });
      } else {
        return fallBack("¿Podés verificar la fecha? Debe tener el formato DD/MM/AAAA. Escribí *cancelar* para salir.");
      }
    }
  )
  .addAnswer(
    "Los últimos 4 dígitos del número de tarjeta:",
    { capture: true },
    async (ctx, { fallBack, endFlow, state }) => {
      if (await checkEscape(ctx, state, endFlow, 'intentos_tarjeta')) return;
      const tarjetaRegex = /^\d{4}$/;
      if (tarjetaRegex.test(ctx.body)) {
        await state.update({ numeroTarjeta: ctx.body });
      } else {
        return fallBack("¿Podés verificar? Deben ser exactamente 4 dígitos. Escribí *cancelar* para salir.");
      }
    }
  )
  .addAnswer(
    "¿Cuál es el importe del cupón? (Ejemplo: 1234.56)",
    { capture: true },
    async (ctx, { fallBack, endFlow, state }) => {
      if (await checkEscape(ctx, state, endFlow, 'intentos_importe')) return;
      const importeRegex = /^\d+(\.\d{1,2})?$/;
      if (importeRegex.test(ctx.body)) {
        await state.update({ importe: ctx.body });
      } else {
        return fallBack("¿Podés verificar el importe? Debe ser un número válido. Escribí *cancelar* para salir.");
      }
    }
  )
  .addAnswer(
    "*Por favor, enviame una foto del cupón.* (Obligatorio)",
    { capture: true },
    async (ctx, { fallBack, endFlow, provider, state }) => {
      if (await checkEscape(ctx, state, endFlow, 'intentos_foto')) return;
      const merchantImagesDirectory = `./comercios/${ctx.from}/cupon`;
      await createDirectoryIfNotExists(merchantImagesDirectory);
      try {
        const localPath = await provider.saveFile(ctx, { path: merchantImagesDirectory });
        await state.update({ cuponPhoto: localPath });
      } catch (error) {
        logger.error("CUPÓN ERROR > " + error.stack);
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
        const merchantImagesDirectory = `./comercios/${ctx.from}/cupon`;

        const files = (await fs.readdir(merchantImagesDirectory))
          .filter(file => file.endsWith('.jpeg') || file.endsWith('.jpg') || file.endsWith('.png'))
          .map(file => ({
            path: join(merchantImagesDirectory, file),
            name: file
          }));

        await sendEmail(ctx,state, files);
      } catch (error) {
        emailLogger.error("Ocurrió un error, por favor reintenta!", error.stack);
      }
    }
  );

export default flowValidarCupon;