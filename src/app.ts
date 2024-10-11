import dotenv from "dotenv";
dotenv.config();

import { createBot, createProvider, createFlow, addKeyword, utils } from '@builderbot/bot';
import { MemoryDB as Database } from '@builderbot/bot';
import { BaileysProvider as Provider } from '@builderbot/provider-baileys';

import https from 'https';

// Importaciones adaptadas para Comercio
import flowMain from "./flows/flowMain";
//import flowAltaComercio from "./flows/flowAltaComercio";
import flowValidarComercio from "./flows/flowValidarComercio";
import flowNoSoyComercio from './flows/flowNoSoyComercio';
import flowSoyComercio from './flows/flowSoyComercio';
import flowLiquidacion from './flows/flowUltimaLiquidacion';
import flowPrincipal from './flows/flowPrincipal';
import flowRetencion from './flows/flowCertifficadoRetencion';
//import flowPlanes from "./flows/flowPlanes";
//import flowAcelerarLiquidacion from "./flows/flowAcelerarLiquidacion";
//import flowProblemaPOS from "./flows/flowProblemaPOS";
//import flowValidarCupon from "./flows/flowValidarCupon";
//import flowFAQ from "./flows/flowFAQ";
//import flowReclamo from "./flows/flowReclamo";
//import flowDesvincular from "./flows/flowDesvincular";

const PORT: number = +(process.env.PORT ?? 3008);

// Configuración para la base de datos MySQL
const MYSQL_DB_HOST = process.env.MYSQL_DB_HOST ?? "localhost";
const MYSQL_DB_USER = process.env.MYSQL_DB_USER ?? "root";
const MYSQL_DB_PASSWORD = process.env.MYSQL_DB_PASSWORD ?? "password";
const MYSQL_DB_NAME = process.env.MYSQL_DB_NAME ?? "databot";
const MYSQL_DB_PORT = process.env.MYSQL_DB_PORT ?? "3018";

const main = async () => {

    // Crear flujo de conversación
    const adapterFlow = createFlow([
        flowMain,
        flowSoyComercio,
        flowLiquidacion,
        flowNoSoyComercio,
        //flowAltaComercio,
        flowValidarComercio,
        flowPrincipal,
        flowRetencion,
        //flowAcelerarLiquidacion,
        //flowPlanes,
        //flowProblemaPOS,
        //flowValidarCupon,
        //flowFAQ,
        //flowReclamo,
        //flowDesvincular
    ]);

    const adapterProvider = createProvider(Provider);
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
