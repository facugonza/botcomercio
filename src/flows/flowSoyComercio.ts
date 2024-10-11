import { addKeyword } from '@builderbot/bot';
import flowLiquidacion from "./flowUltimaLiquidacion";
import flowRetencion from "./flowCertifficadoRetencion";
//import flowPlanes from "./flowPlanes";
import flowAsesor from "./flowAsesor";
import flowValidarCupon from "./flowValidarCupon";
import flowProblemaPOS from "./flowProblemaPOS";
//import flowAcelerarLiquidacion from "./flowAcelerarLiquidacion";
//import flowReclamo from "./flowReclamo";
import flowDesvincular from "./flowDesvincular";


// Definimos las opciones permitidas para los comercios
const opcionesPermitidas = ["LIQUIDACION", "RETENCION", "PLANES", "ASESOR", "VALIDAR", "POS", "ACELERAR", "RECLAMO", "DESVINCULAR", "COMPRAR"];

// Adaptamos el flujo a SoyComercio con las nuevas opciones
const flowSoyComercio = addKeyword("SoyComercioDeTarjetaDATA", { sensitive: false })
  .addAnswer(
    [
      "*-* Descargar la última liquidación. Responde *LIQUIDACION*",
      "*-* Descargar la última retención. Responde *RETENCION*",
      //"*-* Consultar planes vigentes. Responde *PLANES*",
      "*-* Solicitar asesor comercial. Responde *ASESOR*",
      "*-* Validar un cupón manualmente. Responde *VALIDAR*",
      "*-* Tengo problemas con mi equipo de POS. Responde *POS*",
      //"*-* Acelerar mi liquidación. Responde *ACELERAR*",      
      //"*-* Reclamo de liquidación o cupón no liquidado. Responde *RECLAMO*",
      "*-* Desvincular este número de teléfono del comercio. Responde *DESVINCULAR*"
    ],
    { capture: true },
    async (ctx, { endFlow, fallBack }) => {
      // Validamos si la opción ingresada es válida
      if (!opcionesPermitidas.includes(ctx.body.toUpperCase())) {
        return fallBack(`Lo siento, *${ctx.body}* no es una opción válida. Por favor, intenta de nuevo. *(LIQUIDACION, RETENCION, PLANES, ASESOR, VALIDAR, POS, ACELERAR, FAQ, RECLAMO, DESVINCULAR)*`);
      }

      // Aquí podrías agregar lógica adicional basada en la opción seleccionada, si fuera necesario
    },
    [
      flowLiquidacion, 
      flowRetencion,
   
      // flowPlanes, 
      flowAsesor,
      flowValidarCupon,
      flowProblemaPOS, 
      //flowAcelerarLiquidacion,
      //flowReclamo, 
      flowDesvincular
    ]
  );

export default flowSoyComercio;
