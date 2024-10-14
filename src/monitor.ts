import { exec } from 'child_process';
import * as http from 'http';
import { logger, emailLogger } from './logger/logger.js'; // Ajusta esta ruta si es necesario
import  { Pool } from 'mysql2/promise';
import * as mysql from 'mysql2/promise';

// Crear pool de conexiones con MySQL
const pool: Pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'databot',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const checkLastMessageTime = async (): Promise<void> => {
    try {
        const [rows]: any = await pool.query('SELECT MAX(fecha_hora) as lastMessageTime FROM messagescomercio');
        const lastMessageTime: Date = new Date(rows[0].lastMessageTime);
        const currentTime: Date = new Date();
        const timeDiff: number = (currentTime.getTime() - lastMessageTime.getTime()) / (1000 * 60); // Diferencia en minutos
        
        logger.info('Starting to check bot-comercio Status > ');
        logger.info('currentTime     > ' + currentTime);
        logger.info('lastMessageTime > ' + lastMessageTime); 
        logger.info('timeDiff        > ' + timeDiff);

        if (timeDiff > 15) {
            logger.warn('No se han registrado mensajes en los últimos 15 minutos, reiniciando la aplicación...');
            emailLogger.warn('No se han registrado mensajes en los últimos 15 minutos, reiniciando la aplicación...');
            restartApp();
        } else {
            logger.info('La aplicación está registrando mensajes correctamente.');
        }
    } catch (error) {
        logger.error('Error al verificar el tiempo del último mensaje:', error);
        emailLogger.error('Error al verificar el tiempo del último mensaje:', error);
    }
};

const checkAppStatus = (): void => {
    exec('pm2 status bot-comercio', (err: Error | null, stdout: string, stderr: string): void => {
        logger.info('START TO CHECK DATABOT STATUS ....');
        checkHealthEndpoint();
        logger.info('FINISHED CHECK DATABOT STATUS ....');
        
        // Código comentado puede ser restaurado si es necesario
        /*
        if (err) {
            logger.error(`Error ejecutando pm2 status: ${stderr}`);
            emailLogger.error(`Error ejecutando pm2 status: ${stderr}`);
            return;
        }

        if (stdout.includes('errored') || stdout.includes('stopped')) {
            logger.error('La aplicación está detenida o con errores, reiniciando...');
            emailLogger.error('La aplicación está detenida o con errores, reiniciando...');
            restartApp();
        } else {
            // Verificar el estado de salud de la aplicación
            checkHealthEndpoint();
        }
        */
    });
};

const checkHealthEndpoint = (): void => {
    const options = {
        hostname: 'localhost',
        port: 3099,
        path: '/health',
        method: 'GET',
        timeout: 30000 // 30 segundos
    };

    const req = http.request(options, (res) => {
        logger.info('STATUS HTTP CODE :' + res.statusCode);
        if (res.statusCode === 200) {
            logger.info('La aplicación está respondiendo correctamente.');
        } else {
            logger.log('La aplicación no está respondiendo correctamente, reiniciando...');
            emailLogger.log('La aplicación no está respondiendo correctamente, reiniciando...');
            restartApp();
        }
    });

    req.on('error', (e: Error) => {
        logger.info('Error al verificar el endpoint de salud, reiniciando...', e);
        emailLogger.info('Error al verificar el endpoint de salud, reiniciando...');

        exec('pm2 restart app', (err: Error | null, stdout: string, stderr: string): void => {
            if (err) {
                logger.error(`Error reiniciando la aplicación: ${stderr}`);
                emailLogger.error(`Error reiniciando la aplicación: ${stderr}`);
                return;
            }
            logger.info('Aplicación reiniciada exitosamente.');
            emailLogger.info('Aplicación reiniciada exitosamente.');
        });
    });

    req.end();
};

const restartApp = (): void => {
    exec('pm2 restart bot-comercio', (err: Error | null, stdout: string, stderr: string): void => {
        if (err) {
            logger.error(`Error reiniciando la aplicación bot-comercio: ${stderr}`);
            emailLogger.error(`Error reiniciando la aplicación bot-comercio: ${stderr}`);
            return;
        }
        logger.info('Aplicación reiniciada exitosamente.: bot-comercio');
        emailLogger.info('Aplicación reiniciada exitosamente.: bot-comercio');
    });
};

// Verificar el estado de la aplicación, verificando el último mensaje procesado cada 15 minutos
setInterval(checkLastMessageTime, 15 * 60 * 1000);

// Ejecutar la verificación de inmediato al iniciar el script
checkLastMessageTime();
