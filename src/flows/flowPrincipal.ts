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

const routeIntent = async (intencion: string | null, gotoFlow: any) => {
    if (intencion === 'VINCULAR')    return gotoFlow(flowValidarComercio);
    if (intencion === 'INFORMACION') return gotoFlow(flowNoSoyComercio);
    if (intencion === 'FAQ')         return gotoFlow(flowFAQ);
    return null;
};

const flowPrincipalComercio = addKeyword("flowPrincipalTelefonoNoAsociadoComercio", { sensitive: false })
  // Intenta clasificar el primer mensaje del usuario directamente
  .addAction(async (ctx, { gotoFlow, state }) => {
    const intencion = await classifyIntent(ctx.body.trim(), opcionesPermitidas, descripciones);
    const routed = await routeIntent(intencion, gotoFlow);
    if (routed) await state.update({ routed: true });
  })
  // Si la IA no pudo con el primer mensaje, pregunta naturalmente y espera respuesta
  .addAnswer(
    "¿En qué te puedo ayudar?",
    { capture: true },
    async (ctx, { fallBack, gotoFlow, state }) => {
      if (state.get('routed')) return;
      const intencion = await classifyIntent(ctx.body.trim(), opcionesPermitidas, descripciones);
      const routed = await routeIntent(intencion, gotoFlow);
      if (!routed) return fallBack("No pude entender tu consulta. ¿Podés contarme un poco más sobre lo que necesitás?");
    },
    [flowValidarComercio, flowNoSoyComercio, flowFAQ]
  );

export default flowPrincipalComercio;
