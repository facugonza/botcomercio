import { addKeyword } from '@builderbot/bot';
import flowLiquidacion from "./flowUltimaLiquidacion";
import flowRetencion from "./flowCertifficadoRetencion";
import flowAsesor from "./flowAsesor";
import flowValidarCupon from "./flowValidarCupon";
import flowProblemaPOS from "./flowProblemaPOS";
import flowDesvincular from "./flowDesvincular";
import { classifyIntent } from '../services/aiService';

const opcionesPermitidas = ["LIQUIDACION", "CERTIFICADO", "ASESOR", "VALIDAR", "POS", "DESVINCULAR", "MENU"];

const descripciones = {
    LIQUIDACION:  "quiere descargar o ver su última liquidación de pagos",
    CERTIFICADO:  "quiere descargar su certificado o constancia de retención",
    ASESOR:       "quiere hablar o comunicarse con un asesor o vendedor comercial",
    VALIDAR:      "quiere validar o consultar un cupón de venta manual",
    POS:          "tiene un problema con su terminal o equipo POS",
    DESVINCULAR:  "quiere desvincular o quitar este número de teléfono del comercio",
    MENU:         "pregunta qué puede hacer el bot, qué opciones tiene disponibles, qué información puede consultar, o pide un menú de ayuda",
};

const mensajeMenu =
`Puedo ayudarte con lo siguiente:\n\n` +
`📄 *Liquidación* — consultá tu último pago\n` +
`📋 *Retención* — descargá tu certificado impositivo\n` +
`🖨️ *Problema con POS* — soporte para tu terminal\n` +
`✅ *Validar cupón* — verificá una venta manual\n` +
`👤 *Hablar con un asesor* — te conectamos con alguien del equipo\n` +
`🔓 *Desvincular número* — dar de baja este teléfono del comercio\n\n` +
`¿Sobre cuál de estas opciones querés que te ayude?`;

const routeIntent = async (intencion: string | null, gotoFlow: any): Promise<boolean> => {
    if (intencion === 'LIQUIDACION') { gotoFlow(flowLiquidacion); return true; }
    if (intencion === 'CERTIFICADO') { gotoFlow(flowRetencion);   return true; }
    if (intencion === 'ASESOR')      { gotoFlow(flowAsesor);      return true; }
    if (intencion === 'VALIDAR')     { gotoFlow(flowValidarCupon); return true; }
    if (intencion === 'POS')         { gotoFlow(flowProblemaPOS); return true; }
    if (intencion === 'DESVINCULAR') { gotoFlow(flowDesvincular); return true; }
    return false;
};

const flowSoyComercio = addKeyword("SoyComercioDeTarjetaDATA", { sensitive: false })
  .addAnswer(
    "¿En qué te puedo ayudar hoy?",
    { capture: true },
    async (ctx, { fallBack, gotoFlow, flowDynamic }) => {
      const intencion = await classifyIntent(ctx.body.trim(), opcionesPermitidas, descripciones);
      if (intencion === 'LIQUIDACION') return gotoFlow(flowLiquidacion);
      if (intencion === 'CERTIFICADO') return gotoFlow(flowRetencion);
      if (intencion === 'ASESOR')      return gotoFlow(flowAsesor);
      if (intencion === 'VALIDAR')     return gotoFlow(flowValidarCupon);
      if (intencion === 'POS')         return gotoFlow(flowProblemaPOS);
      if (intencion === 'DESVINCULAR') return gotoFlow(flowDesvincular);
      if (intencion === 'MENU')        return fallBack(mensajeMenu);
      return fallBack("No entendí bien tu consulta. " + mensajeMenu);
    },
    [flowLiquidacion, flowRetencion, flowAsesor, flowValidarCupon, flowProblemaPOS, flowDesvincular]
  );

export default flowSoyComercio;
