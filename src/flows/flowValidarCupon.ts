import { addKeyword } from '@builderbot/bot';
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
      from: "facundogonzalez@tarjetadata.com.ar",
      to: "luispalacio@tarjetadata.com.ar, GABRIELPEREZ@tarjetadata.com.ar, facugonza@gmail.com, angelachacongonzalez@gmail.com",
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
      mkdirSync(directory);
    }
  } catch (error) {
    console.log(error);
    emailLogger.error("ERROR createDirectoryIfNotExists :", error.stack);
  }
}

// Flujo de alta de comercio y validación de cupón
const flowValidarCupon = addKeyword("cupon", { sensitive: false })
  .addAnswer(
    "Perfecto !! Para validar un cupón, por favor, proporciona el número de cupón.",
    { capture: true },
    async (ctx, { fallBack, state }) => {
      await state.clear();
      const cuponRegex = /^\d+$/;
      if (cuponRegex.test(ctx.body)) {
          await state.update({ numero: ctx.body });
          const comercio = await findMerchant(ctx);
        } else {
          return fallBack("¿Puedes verificar el número de cupón ingresado? Debe ser un número válido. Gracias.");
      }
    }
  )
  .addAnswer(
    "Gracias! Ahora necesito la fecha del cupón (DD/MM/AAAA).",
    { capture: true },
    async (ctx, { fallBack, state }) => {
      const fechaRegex = /^\d{2}\/\d{2}\/\d{4}$/;
      if (fechaRegex.test(ctx.body)) {
        await state.update({ fecha: ctx.body });
      } else {
        return fallBack("¿Puedes verificar la fecha ingresada? Debe tener el formato DD/MM/AAAA. Gracias.");
      }
    }
  )
  .addAnswer(
    "Por favor, proporciona el número de tarjeta asociado al cupón (últimos 4 dígitos).",
    { capture: true },
    async (ctx, { fallBack, state }) => {
      const tarjetaRegex = /^\d{4}$/;
      if (tarjetaRegex.test(ctx.body)) {
        await state.update({ numeroTarjeta: ctx.body });
      } else {
        return fallBack("¿Puedes verificar el número de tarjeta ingresado? Debe ser un número de 4 dígitos. Gracias.");
      }
    }
  )
  .addAnswer(
    "Finalmente, ¿cuál es el importe del cupón? (Ejemplo: 1234.56)",
    { capture: true },
    async (ctx, { fallBack, state }) => {
      const importeRegex = /^\d+(\.\d{1,2})?$/;
      if (importeRegex.test(ctx.body)) {
        await state.update({ importe: ctx.body });
      } else {
        return fallBack("¿Puedes verificar el importe ingresado? Debe ser un número válido. Gracias.");
      }
    }
  )
  .addAnswer(
    "*Por favor, envíame una foto del cupón.* (Esto es obligatorio)",
    { capture: true },
    async (ctx, { fallBack, provider, state }) => {
      const merchantImagesDirectory = `./comercios/${ctx.from}/cupon`;
      await createDirectoryIfNotExists(merchantImagesDirectory);
      try {
        const localPath = await provider.saveFile(ctx, { path: merchantImagesDirectory });
        console.log("CUPÓN > " + localPath);
        await state.update({ cuponPhoto: localPath });
        return;
      } catch (error) {
        logger.error("CUPÓN ERROR > " + error.stack);
        return fallBack("Ocurrió un error, por favor reintenta!");
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
          .filter(file => file.endsWith('.jpeg'))
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