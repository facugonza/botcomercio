import { addKeyword } from '@builderbot/bot';
import nodemailer from "nodemailer";
import { readdirSync, writeFileSync, existsSync, mkdirSync } from "fs";
import fs from 'fs-extra';
import { join } from 'path';

import { logger, emailLogger } from '../logger/logger';
import databaseLogger from '../logger/databaseLogger';
import acciones from '../models/actions';

// Objeto para almacenar los datos del comercio durante el flujo
let comercio = {
  nombre: "",
  cuit: "",
  telefono: "",
  email: "",
  direccion: "",
};

// Función para enviar un correo electrónico con los documentos adjuntos
async function sendEmail(files: { path: string; name: string; }[]) {
  try {
    const transporter = nodemailer.createTransport({
      host: "sd-1973625-l.dattaweb.com",
      port: 587,
      secure: false,
      auth: {
        user: "facundogonzalez@tarjetadata.com.ar",
        pass: "Facundo2000@*",
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
      from: "facundogonzalez@tarjetadata.com.ar",
      to: "luispalacio@tarjetadata.com.ar, GABRIELPEREZ@tarjetadata.com.ar, facugonza@gmail.com, angelachacon@gmail.com",
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
      mkdirSync(directory);
    }
  } catch (error) {
    console.log(error);
    emailLogger.error("ERROR createDirectoryIfNotExists :", error.stack);
  }
}

// Función para capturar respuestas y actualizar el objeto comercio
function capturarRespuesta(ctx: any, fallBack: any, campo: keyof typeof comercio) {
  if (!ctx.body) {
    return fallBack();
  }
  comercio[campo] = ctx.body;
}

// Flujo de alta de comercio
const flowAltaComercio = addKeyword("solicitar", { sensitive: false })
  .addAnswer(
    "Para registrar tu comercio, necesito algunos datos. ¿Me podrías proporcionar el nombre de tu comercio, por favor?",
    { capture: true },
    (ctx, { fallBack }) => {
      databaseLogger.addLog(
        ctx.from,
        acciones.ADHERIR
      );

      const nameRegex = /^[a-zA-Z\s]+$/;
      if (nameRegex.test(ctx.body)) {
        capturarRespuesta(ctx, fallBack, "nombre");
      } else {
        return fallBack("¿Puedes verificar el nombre ingresado? Gracias.");
      }
    }
  )
  .addAnswer(
    "Gracias! Ahora necesito el número de CUIT de tu comercio (sin guiones ni espacios).",
    { capture: true },
    (ctx, { fallBack }) => {
      const cuitRegex = /^\d{11}$/; // El CUIT debe tener 11 dígitos
      if (cuitRegex.test(ctx.body)) {
        capturarRespuesta(ctx, fallBack, "cuit");
      } else {
        return fallBack("¿Puedes verificar el CUIT ingresado? Debe ser un número de 11 dígitos. Gracias.");
      }
    }
  )
  .addAnswer(
    "¡Perfecto! Agendaré el siguiente número de teléfono como tu contacto.",
    null,
    async (ctx, { flowDynamic }) => {
      comercio.telefono = "+" + ctx.from;
      return flowDynamic([
        {
          body: "+" + ctx.from,
        },
      ]);
    }
  )
  .addAnswer(
    "Por último, ¿podrías proporcionarme tu dirección de correo electrónico?",
    { capture: true },
    (ctx, { fallBack }) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(ctx.body)) {
        capturarRespuesta(ctx, fallBack, "email");
      } else {
        return fallBack("¿Puedes verificar el email ingresado? Gracias.");
      }
    }
  )
  .addAnswer(
    "*Por favor, envíame una copia de la constancia de inscripción en la AFIP.* (Esto es obligatorio)",
    { capture: true },
    async (ctx, { fallBack, provider }) => {
      const merchantImagesDirectory = "./comercios/" + ctx.from; 
      await createDirectoryIfNotExists(merchantImagesDirectory);        
      try {
        const localPath = await provider.saveFile(ctx, { path: merchantImagesDirectory });
        console.log("CONSTANCIA DE INSCRIPCIÓN > " + localPath);
        return;
      } catch (error) {
        console.error("CONSTANCIA DE INSCRIPCIÓN ERROR > " + error.stack);
        return fallBack("Ocurrió un error, por favor reintenta!");
      }
    }
  )
  
  .addAnswer(
    "Excelente! Ahora envíame una foto del DNI del titular del comercio. *Si no tienes una, envía una foto en blanco*.",
    { capture: true },
    async (ctx, { fallBack, provider }) => {
      const merchantImagesDirectory = "./comercios/" + ctx.from; 
      await createDirectoryIfNotExists(merchantImagesDirectory);        
      try {
        const localPath = await provider.saveFile(ctx, { path: merchantImagesDirectory });
        console.log("DNI TITULAR > " + localPath);
        return; 
      } catch (error) {
        return fallBack("Ocurrió un error, por favor reintenta!");
      }
    }
  )
  .addAnswer(
    "¡Excelente! He derivado toda la documentación a un asesor, el cual te contactará. ¡Muchas gracias por completar el proceso por este medio!"
  )
  .addAction(
    async (ctx) => {
      try {
        const data = JSON.stringify(comercio, null, 2);
        fs.writeFileSync("./comercios/" + ctx.from + "/" + ctx.from + ".json", data);

        const merchantImagesDirectory = "./comercios/" + ctx.from; 

        const files = (await fs.readdir(merchantImagesDirectory))
          .filter(file => file.endsWith('.jpeg'))
          .map(file => ({
            path: join(merchantImagesDirectory, file),
            name: file
          }));

        await sendEmail(files);
      } catch (error) {
        console.error("Ocurrió un error, por favor reintenta!", error.stack);
      }
    }
  );

export default flowAltaComercio;
