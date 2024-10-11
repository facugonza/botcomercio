import { addKeyword, EVENTS } from '@builderbot/bot';
import flowValidarComercio from "./flowValidarComercio";
import flowNoSoyComercio from "./flowNoSoyComercio";
import flowFAQ from "./flowFAQ";

// Definir las opciones permitidas para el comercio
const opcionesPermitidas = ["VINCULAR", "INFORMACION", "INFORMACIÓN","FAQ"]; 

// Adaptar el flujo principal para el comercio
const flowPrincipalComercio = addKeyword("flowPrincipalTelefonoNoAsociadoComercio", { sensitive: false })
  .addAnswer(
    [
      "*-* Si ya eres un comercio registrado en DATA y necesitas vincular este numero responde *VINCULAR*.", 
      "",
      "*-* Si aún no estás registrado como comercio y deseas obtener información, responde con la palabra *INFORMACION*.",
      "", 
      "*-* Preguntas frecuentes. Responde *FAQ*", 
    ],
    { capture: true },
    async (ctx, { fallBack }) => {
      if (!opcionesPermitidas.includes(ctx.body.toUpperCase())) {
        return fallBack("Lo siento, *" + ctx.body + "* no es una opción válida. Por favor, intenta de nuevo. *(VINCULAR, INFORMACION,FAQ)*");
      }
    },
    [flowValidarComercio, flowNoSoyComercio,flowFAQ] // Flujos adaptados para comercio
  );

export default flowPrincipalComercio;
