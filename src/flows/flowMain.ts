import dotenv from "dotenv";
dotenv.config();

import { addKeyword, EVENTS } from '@builderbot/bot';
import { findMerchant } from "../services/merchantService";
import flowSoyComercio from "./flowSoyComercio";
import flowPrincipal from "./flowPrincipal";
import flowLiquidacion from "./flowUltimaLiquidacion";
import flowRetencion from "./flowCertifficadoRetencion";
import flowAsesor from "./flowAsesor";
import flowValidarCupon from "./flowValidarCupon";
import flowProblemaPOS from "./flowProblemaPOS";
import flowDesvincular from "./flowDesvincular";
import flowValidarComercio from "./flowValidarComercio";
import flowNoSoyComercio from "./flowNoSoyComercio";
import { logger, emailLogger } from '../logger/logger';
import databaseLogger from '../logger/databaseLogger';
import acciones from '../models/actions';
import { classifyIntent } from '../services/aiService';

const opcionesComercio = ["LIQUIDACION", "CERTIFICADO", "ASESOR", "VALIDAR", "POS", "DESVINCULAR"];
const opcionesNoComercio = ["VINCULAR", "INFORMACION"];

const descripciones = {
    LIQUIDACION:  "quiere descargar o ver su última liquidación de pagos",
    CERTIFICADO:  "quiere descargar su certificado o constancia de retención",
    ASESOR:       "quiere hablar o comunicarse con un asesor o vendedor comercial",
    VALIDAR:      "quiere validar o consultar un cupón de venta manual",
    POS:          "tiene un problema con su terminal o equipo POS",
    DESVINCULAR:  "quiere desvincular o quitar este número de teléfono del comercio",
    VINCULAR:     "ya es comercio registrado y quiere vincular este número de teléfono",
    INFORMACION:  "no está registrado como comercio y quiere información para adherirse",
};

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
          await flowDynamic(`Bienvenido, ${comercio.descripcion}!`);

          // Intentar clasificar el primer mensaje para evitar pregunta innecesaria
          const intencion = await classifyIntent(ctx.body.trim(), opcionesComercio, descripciones);
          if (intencion === 'LIQUIDACION') return gotoFlow(flowLiquidacion);
          if (intencion === 'CERTIFICADO') return gotoFlow(flowRetencion);
          if (intencion === 'ASESOR')      return gotoFlow(flowAsesor);
          if (intencion === 'VALIDAR')     return gotoFlow(flowValidarCupon);
          if (intencion === 'POS')         return gotoFlow(flowProblemaPOS);
          if (intencion === 'DESVINCULAR') return gotoFlow(flowDesvincular);

          return gotoFlow(flowSoyComercio);
        } else {
          await flowDynamic("Bienvenido! Parece que este número no está asociado a ningún comercio.");

          // Intentar clasificar el primer mensaje
          const intencion = await classifyIntent(ctx.body.trim(), opcionesNoComercio, descripciones);
          if (intencion === 'VINCULAR')    return gotoFlow(flowValidarComercio);
          if (intencion === 'INFORMACION') return gotoFlow(flowNoSoyComercio);

          return gotoFlow(flowPrincipal);
        }
      } catch (error) {
          logger.error((error as Error).stack);
          emailLogger.error((error as Error).stack);
      }
    }
  );

export default flowMain;
