import { addKeyword } from '@builderbot/bot';
import { checkEscape } from '../utils/flowGuard';
import nodemailer from "nodemailer";
import { readdirSync, writeFileSync, existsSync, mkdirSync } from "fs";
import fs from 'fs-extra';
import { join } from 'path';

import { logger, emailLogger } from '../logger/logger';
import databaseLogger from '../logger/databaseLogger';
import acciones from '../models/actions';



// Función para enviar un correo electrónico con la información del problema
async function sendEmail(state: any, files: { path: string; name: string; }[]) {
    try {
        const problema = state.getMyState();

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
        Descripción del problema: ${problema?.descripcion}<br>
        
        Se adjunta una foto del error en el POS.`;

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_TO,
            subject: "Reporte de problema con POS",
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
        console.error("Error al enviar el email: ", error.stack);
    }
}


// Función para crear un directorio si no existe
async function createDirectoryIfNotExists(directory: string) {
    try {
        if (!existsSync(directory)) {
            mkdirSync(directory);
        }
    } catch (error) {
        logger.error("Errror > createDirectoryIfNotExists ",error.stack);
        emailLogger.error("ERROR createDirectoryIfNotExists :", error.stack);
    }
}

// Definimos un keyword para problemas con POS
const flowProblemaPOS = addKeyword("__flow_pos__", { sensitive: false })
    .addAnswer('Vamos a reportar el problema con tu POS. En cualquier momento podés escribir *cancelar* para salir.\n\nDescribí el problema que estás teniendo:',
        { capture: true },
        async (ctx, { endFlow, state }) => {
            if (await checkEscape(ctx, state, endFlow, 'intentos_desc')) return;
            await state.update({ descripcion: ctx.body });
        }
    )
    .addAnswer('*Ahora enviame una foto del error que aparece en el POS:*',
        { capture: true },
        async (ctx, { fallBack, endFlow, provider, state }) => {
            if (await checkEscape(ctx, state, endFlow, 'intentos_foto')) return;
            const merchantImagesDirectory = `./comercios/${ctx.from}/pos`;
            await createDirectoryIfNotExists(merchantImagesDirectory);
            try {
                const localPath = await provider.saveFile(ctx, { path: merchantImagesDirectory });
                await state.update({ errorPhoto: localPath });
            } catch (error) {
                emailLogger.error("Error al guardar la imagen > " + error.stack);
                return fallBack("Ocurrió un error al recibir la imagen. Intentá de nuevo o escribí *cancelar*.");
            }
        }
    )
    .addAnswer('¡Gracias por proporcionar la información! He enviado los detalles a nuestro equipo de soporte, y te contactarán pronto para ayudarte.')
    .addAction(async (ctx, { state }) => {
        try {
            const imagesDirectory = `./comercios/${ctx.from}/pos`;

            const files = (await fs.readdir(imagesDirectory))
                .filter(file => file.endsWith('.jpeg') || file.endsWith('.jpg') || file.endsWith('.png'))
                .map(file => ({
                    path: join(imagesDirectory, file),
                    name: file
                }));

            await sendEmail(state, files);
        } catch (error) {
            emailLogger.error("Ocurrió un error, por favor reintenta!", error.stack);
        }
    });


export default flowProblemaPOS