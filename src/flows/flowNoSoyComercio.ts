import { addKeyword } from '@builderbot/bot';
import flowRequisitosComercio from "./flowRequisitosComercio";
import flowAltaComercio from "./flowAltaComercio";
import databaseLogger from '../logger/databaseLogger';
import acciones from '../models/actions';
import { classifyIntent } from '../services/aiService';

const opcionesPermitidas = ["SOLICITAR", "REQUISITOS"];

const descripciones = {
    SOLICITAR:  "quiere registrar su comercio o iniciar el proceso de adhesión a Tarjeta DATA",
    REQUISITOS: "quiere conocer los documentos y requisitos necesarios para afiliarse como comercio",
};

const routeIntent = async (intencion: string | null, gotoFlow: any) => {
    if (intencion === 'SOLICITAR')  return gotoFlow(flowAltaComercio);
    if (intencion === 'REQUISITOS') return gotoFlow(flowRequisitosComercio);
    return null;
};

const flowNoSoyComercio = addKeyword(["informacion", "información"], { sensitive: false })
  .addAction(async (ctx, { gotoFlow, state }) => {
    databaseLogger.addLog(ctx.from, acciones.MENU_NO_COMERCIO);
    const intencion = await classifyIntent(ctx.body.trim(), opcionesPermitidas, descripciones);
    const routed = await routeIntent(intencion, gotoFlow);
    if (routed) await state.update({ routed: true });
  })
  .addAnswer(
    "¿Querés registrar tu comercio o conocer los requisitos para hacerlo?",
    { capture: true },
    async (ctx, { fallBack, gotoFlow, state }) => {
      if (state.get('routed')) return;
      const intencion = await classifyIntent(ctx.body.trim(), opcionesPermitidas, descripciones);
      const routed = await routeIntent(intencion, gotoFlow);
      if (!routed) return fallBack("No pude entender tu consulta. ¿Podés contarme un poco más sobre lo que necesitás?");
    },
    [flowAltaComercio, flowRequisitosComercio]
  );

export default flowNoSoyComercio;
