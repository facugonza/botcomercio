import { addKeyword } from '@builderbot/bot';
import flowRequisitosComercio from "./flowRequisitosComercio"; // Flujo para mostrar requisitos específicos de comercio
import flowAltaComercio from "./flowAltaComercio"; // Flujo para alta de un nuevo comercio
import databaseLogger from '../logger/databaseLogger';
import acciones from '../models/actions';

// Opciones permitidas adaptadas para el comercio
const opcionesPermitidas = ["SOLICITAR", "REQUISITOS"];

// Adaptar el flujo para usuarios que no son comercios
const flowNoSoyComercio = addKeyword(["informacion", "información"], { sensitive: false })
  .addAnswer(
    [
      "*-* Si deseas registrar tu comercio, responde *SOLICITAR*.", "",
      "*-* Si quieres conocer los requisitos para registrar tu comercio, responde *REQUISITOS*.",
    ],
    { capture: true },
    async (ctx, { fallBack }) => {
      // Registrar la acción en el logger de base de datos
      databaseLogger.addLog(
        ctx.from,
        acciones.MENU_NO_COMERCIO // Acción específica para comercio
      );

      if (!opcionesPermitidas.includes(ctx.body.toUpperCase())) {
        return fallBack("Lo siento, *" + ctx.body + "* no es una opción válida. Por favor, intenta de nuevo. *(SOLICITAR, REQUISITOS)*");
      }
    },
    [flowAltaComercio, flowRequisitosComercio] // Flujos adaptados para comercio
  );

export default flowNoSoyComercio;
