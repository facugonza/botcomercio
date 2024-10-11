import dotenv from "dotenv";
dotenv.config();

import { addKeyword, EVENTS } from '@builderbot/bot';
import { findMerchant } from "../services/merchantService";
import flowSoyComercio from "./flowSoyComercio";
import flowPrincipal from "./flowPrincipal";
import { logger, emailLogger } from '../logger/logger';
import databaseLogger from '../logger/databaseLogger';
import { getComercioData } from "../models/merchantDATA";
import acciones from '../models/actions';

// Función principal del flujo, utilizando tipos de TypeScript
const flowMain = addKeyword(EVENTS.WELCOME)
  .addAnswer(
    [
      "Hola, soy *DATABOT* tu asistente virtual para comercios.",
      "*Aguarda un instante, estoy verificando si este número está asociado a un comercio....*"
    ],
    null,
    async (ctx, { gotoFlow, flowDynamic }) => {
      try {
        // Registramos el evento en el log de la base de datos
        databaseLogger.addLog(
          ctx.from,
          acciones.HOME
        );

        // Buscamos si el número está asociado a un comercio
        const comercio = await findMerchant(ctx);

        if (comercio && comercio.isLogin) {
          // Si se encuentra un comercio asociado, se personaliza la respuesta
          await flowDynamic(`Bienvenido, ${comercio.descripcion}! ¿En qué puedo ayudarte hoy?`);
          
          return gotoFlow(flowSoyComercio); // Flujo específico para comercios
        } else {
          // Si no se encuentra ningún comercio asociado
          await flowDynamic("Bienvenido! Parece que este número no está asociado a ningún comercio.");
          return gotoFlow(flowPrincipal); // Flujo general
        }
      } catch (error) {
          logger.error((error as Error).stack);
          emailLogger.error((error as Error).stack);
      }
    }
  );

export default flowMain;
