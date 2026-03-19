import dotenv from "dotenv";
dotenv.config();

import { createBot, createProvider, createFlow, addKeyword, utils } from '@builderbot/bot';
import { MemoryDB as Database } from '@builderbot/bot';
import { MetaProvider as Provider } from '@builderbot/provider-meta';

import https from 'https';

// Importaciones adaptadas para Comercio
import flowMain from "./flows/flowMain";
import flowAltaComercio from "./flows/flowAltaComercio";
import flowValidarComercio from "./flows/flowValidarComercio";
import flowNoSoyComercio from './flows/flowNoSoyComercio';
import flowSoyComercio from './flows/flowSoyComercio';
import flowLiquidacion from './flows/flowUltimaLiquidacion';
import flowPrincipal from './flows/flowPrincipal';
import flowRetencion from './flows/flowCertifficadoRetencion';
import flowProblemaPOS from "./flows/flowProblemaPOS";
import flowValidarCupon from "./flows/flowValidarCupon";
import flowFAQ from "./flows/flowFAQ";
import flowDesvincular from "./flows/flowDesvincular";

const PORT: number = +(process.env.PORT ?? 3099);

// Configuración para la base de datos MySQL
const MYSQL_DB_HOST = process.env.MYSQL_DB_HOST ?? "localhost";
const MYSQL_DB_USER = process.env.MYSQL_DB_USER ?? "root";
const MYSQL_DB_PASSWORD = process.env.MYSQL_DB_PASSWORD ?? "password";
const MYSQL_DB_NAME = process.env.MYSQL_DB_NAME ?? "databot";
const MYSQL_DB_PORT = process.env.MYSQL_DB_PORT ?? "3306";

const main = async () => {

    // Crear flujo de conversación
    const adapterFlow = createFlow([
        flowMain,
        flowSoyComercio,
        flowLiquidacion,
        flowNoSoyComercio,
        flowAltaComercio,
        flowValidarComercio,
        flowPrincipal,
        flowRetencion,
        flowProblemaPOS,
        flowValidarCupon,
        flowFAQ,
        flowDesvincular
    ]);

    const adapterProvider = createProvider(Provider, {
        jwtToken: process.env.ACCESS_TOKEN,
        numberId: process.env.PHONE_NUMBER_ID,
        verifyToken: process.env.VERIFY_TOKEN,
        version: 'v20.0'
    });
    const adapterDB = new Database();

    // Configuración del bot
    const { handleCtx, httpServer } = await createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    });

    // Ruta de salud para el servidor
    adapterProvider.server.get('/health', (req, res) => {
        const number = "5492644736151";
        const message = "DATABOT ALIVE";
        try {
            console.log("SENDING MESSAGE TO : " + number);
            adapterProvider.sendMessage(number, message, { media: null });
            console.log("MESSAGE SENT: " + "DATABOT COMERCIO ALIVE" + " to " + number);
    
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('OK');
        } catch (error) {
            res.writeHead(503, { 'Content-Type': 'text/plain' });
            res.end('FAIL');
        }
    });

    // Iniciar servidor HTTP
    httpServer(PORT);
};

main();
