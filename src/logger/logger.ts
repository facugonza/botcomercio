// logger.ts
import log4js from 'log4js';

log4js.configure({
    appenders: {
        file: { 
            type: 'file', 
            filename: './logger/databot.log',
            maxLogSize: 1024 * 1024, // Tamaño máximo de 1 MB
            backups: 365 // Conservar un máximo de 365 archivos de log (uno por día durante un año)
        },
        console: { type: 'console' },
        email: {
            type: '@log4js-node/smtp',
            recipients: 'facugonza@gmail.com',
            sender: 'facundogonzalez@tarjetadata.com.ar',
            subject: 'ERROR GRAVE EN DATABOT COMERCIOS',
            SMTP: {
                host: 'sd-1973625-l.dattaweb.com',
                secure: true, // usa SSL
                port: 465,
                auth: {
                    user: 'facundogonzalez@tarjetadata.com.ar',
                    pass: 'Facundo2000@*' // ¡Nunca guardes contraseñas en texto plano en un código de producción!
                }
            }
        }
    },
    categories: {
        default: { appenders: ['file', 'console'], level: 'debug' },
        email: { appenders: ['email'], level: 'error' } // Sólo se enviarán emails para los logs de nivel 'error'
    }
});

const logger = log4js.getLogger(); // Logger para logs generales
const emailLogger = log4js.getLogger('email'); // Logger para logs críticos que necesitan ser enviados por correo electrónico

export { logger, emailLogger };
