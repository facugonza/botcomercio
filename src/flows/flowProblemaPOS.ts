import { addKeyword } from '@builderbot/bot';
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
        Descripción del problema: ${problema?.descripcion}<br>
        
        Se adjunta una foto del error en el POS.`;

        const mailOptions = {
            from: "facundogonzalez@tarjetadata.com.ar",
            to: "luispalacio@tarjetadata.com.ar, GABRIELPEREZ@tarjetadata.com.ar, facugonza@gmail.com, angelachacongonzalez@gmail.com",
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
        console.log(error);
        console.error("ERROR createDirectoryIfNotExists :", error.stack);
    }
}

// Definimos un keyword para problemas con POS
const flowProblemaPOS = addKeyword('POS', { sensitive: false })
    .addAnswer('Por favor, describe el problema que estás teniendo con el POS.',
        { capture: true },
        async (ctx, { fallBack, state }) => {
            await state.update({ descripcion: ctx.body });
        }
    )
    .addAnswer('*Ahora, por favor envíame una foto del error que aparece en el POS.*',
        { capture: true },
        async (ctx, { fallBack, provider, state }) => {
            const merchantImagesDirectory = `./comercios/${ctx.from}/pos`;
            await createDirectoryIfNotExists(merchantImagesDirectory);
            try {
                const localPath = await provider.saveFile(ctx, { path: merchantImagesDirectory });
                console.log("Imagen del error > " + localPath);
                await state.update({ errorPhoto: localPath });
            } catch (error) {
                console.error("Error al guardar la imagen > " + error.stack);
                return fallBack("Ocurrió un error, por favor reintenta!");
            }
        }
    )
    .addAnswer('¡Gracias por proporcionar la información! He enviado los detalles a nuestro equipo de soporte, y te contactarán pronto para ayudarte.')
    .addAction(async (ctx, { state }) => {
        try {
            const imagesDirectory = `./comercios/${ctx.from}/pos`;

            const files = (await fs.readdir(imagesDirectory))
                .filter(file => file.endsWith('.jpeg'))
                .map(file => ({
                    path: join(imagesDirectory, file),
                    name: file
                }));

            await sendEmail(state, files);
        } catch (error) {
            console.error("Ocurrió un error, por favor reintenta!", error.stack);
        }
    });


export default flowProblemaPOS