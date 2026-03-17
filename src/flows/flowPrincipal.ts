import { addKeyword, EVENTS } from '@builderbot/bot';
import flowValidarComercio from "./flowValidarComercio";
import flowNoSoyComercio from "./flowNoSoyComercio";
import flowFAQ from "./flowFAQ";
import { classifyIntent } from '../services/aiService';

const opcionesPermitidas = ["VINCULAR", "INFORMACION", "FAQ"];

const descripciones = {
    VINCULAR:    "ya es comercio registrado en DATA y quiere vincular este número de teléfono",
    INFORMACION: "no está registrado como comercio y quiere información para adherirse",
    FAQ:         "quiere ver preguntas frecuentes sobre planes, cupones, liquidaciones o requisitos",
};

const routeIntent = async (intencion: string | null, gotoFlow: any): Promise<boolean> => {
    if (intencion === 'VINCULAR')    { gotoFlow(flowValidarComercio); return true; }
    if (intencion === 'INFORMACION') { gotoFlow(flowNoSoyComercio);   return true; }
    if (intencion === 'FAQ')         { gotoFlow(flowFAQ);             return true; }
    return false;
};

const flowPrincipalComercio = addKeyword("flowPrincipalTelefonoNoAsociadoComercio", { sensitive: false })
  .addAnswer(
    "¿En qué te puedo ayudar?",
    { capture: true },
    async (ctx, { fallBack, gotoFlow }) => {
      const intencion = await classifyIntent(ctx.body.trim(), opcionesPermitidas, descripciones);
      if (intencion === 'VINCULAR')    return gotoFlow(flowValidarComercio);
      if (intencion === 'INFORMACION') return gotoFlow(flowNoSoyComercio);
      if (intencion === 'FAQ')         return gotoFlow(flowFAQ);
      return fallBack("No pude entender tu consulta. ¿Podés contarme un poco más sobre lo que necesitás?");
    },
    [flowValidarComercio, flowNoSoyComercio, flowFAQ]
  );

export default flowPrincipalComercio;
