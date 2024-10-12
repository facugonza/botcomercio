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
const opcionesPermitidas = ["LIQUIDACION", "CERTIFICADO", "PLANES", "ASESOR", "VALIDAR", "POS", "DESVINCULAR"];

// Adaptamos el flujo a SoyComercio con las nuevas opciones
const flowSoyComercio = addKeyword("SoyComercioDeTarjetaDATA", { sensitive: false })
  .addAnswer(
    [
      "*-* Descargar la última liquidación. Responde *LIQUIDACION*",
      "*-* Descargar la última retención. Responde *CERTIFICADO*",
      //"*-* Consultar planes vigentes. Responde *PLANES*",
      "*-* Solicitar asesor comercial. Responde *ASESOR*",
      "*-* Validar un cupón manualmente. Responde *VALIDAR*",
      "*-* Tengo problemas con mi equipo de POS. Responde *POS*",
      //"*-* Acelerar mi liquidación. Responde *ACELERAR*",      
      //"*-* Reclamo de liquidación o cupón no liquidado. Responde *RECLAMO*",
      "*-* Desvincular este número de teléfono del comercio. Responde *DESVINCULAR*",
      " ",
      "*Por incovenientes en Ventas, comunícate al 4292002 o 4292003 en horarios de 09:00hs a 13:00hs y 16:30hs a 20:30hs.*"
    ],
    { capture: true },
    async (ctx, { endFlow, fallBack }) => {
      // Validamos si la opción ingresada es válida
      if (!opcionesPermitidas.includes(ctx.body.toUpperCase())) {
        return fallBack(`Lo siento, *${ctx.body}* no es una opción válida. Por favor, intenta de nuevo. *(LIQUIDACION, CERTIFICADO, ASESOR, VALIDAR, POS, DESVINCULAR)*`);
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
