import { addKeyword } from '@builderbot/bot';
import flowLiquidacion from "./flowUltimaLiquidacion";
import flowRetencion from "./flowCertifficadoRetencion";
import flowAsesor from "./flowAsesor";
import flowValidarCupon from "./flowValidarCupon";
import flowProblemaPOS from "./flowProblemaPOS";
import flowDesvincular from "./flowDesvincular";
import { classifyIntent } from '../services/aiService';

const opcionesPermitidas = ["LIQUIDACION", "CERTIFICADO", "ASESOR", "VALIDAR", "POS", "DESVINCULAR"];

const descripciones = {
    LIQUIDACION:  "quiere descargar o ver su última liquidación de pagos",
    CERTIFICADO:  "quiere descargar su certificado o constancia de retención",
    ASESOR:       "quiere hablar o comunicarse con un asesor o vendedor comercial",
    VALIDAR:      "quiere validar o consultar un cupón de venta manual",
    POS:          "tiene un problema con su terminal o equipo POS",
    DESVINCULAR:  "quiere desvincular o quitar este número de teléfono del comercio",
};

const routeIntent = async (intencion: string | null, gotoFlow: any) => {
    if (intencion === 'LIQUIDACION') return gotoFlow(flowLiquidacion);
    if (intencion === 'CERTIFICADO') return gotoFlow(flowRetencion);
    if (intencion === 'ASESOR')      return gotoFlow(flowAsesor);
    if (intencion === 'VALIDAR')     return gotoFlow(flowValidarCupon);
    if (intencion === 'POS')         return gotoFlow(flowProblemaPOS);
    if (intencion === 'DESVINCULAR') return gotoFlow(flowDesvincular);
    return null;
};

const flowSoyComercio = addKeyword("SoyComercioDeTarjetaDATA", { sensitive: false })
  // Intenta clasificar el primer mensaje del usuario directamente
  .addAction(async (ctx, { gotoFlow, state }) => {
    const intencion = await classifyIntent(ctx.body.trim(), opcionesPermitidas, descripciones);
    const routed = await routeIntent(intencion, gotoFlow);
    if (routed) await state.update({ routed: true });
  })
  // Si la IA no pudo con el primer mensaje, pregunta naturalmente y espera respuesta
  .addAnswer(
    "¿En qué te puedo ayudar hoy?",
    { capture: true },
    async (ctx, { fallBack, gotoFlow, state }) => {
      if (state.get('routed')) return;
      const intencion = await classifyIntent(ctx.body.trim(), opcionesPermitidas, descripciones);
      const routed = await routeIntent(intencion, gotoFlow);
      if (!routed) return fallBack("No pude entender tu consulta. ¿Podés contarme un poco más sobre lo que necesitás?");
    },
    [flowLiquidacion, flowRetencion, flowAsesor, flowValidarCupon, flowProblemaPOS, flowDesvincular]
  );

export default flowSoyComercio;
