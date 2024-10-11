import { addKeyword } from '@builderbot/bot';

// Flujo para mostrar los requisitos de registro de un comercio
const flowRequisitosComercio = addKeyword("requisitos", { sensitive: false })
  .addAnswer(
    "Para registrar tu comercio, necesitas los siguientes documentos:\n" +
    "– CUIT del comercio\n" +
    "– Constancia de inscripción en la AFIP\n" +
    "– DNI del titular del comercio\n" +
    "– Última boleta de servicios a nombre del comercio o del titular\n" +
    "– Documentación que acredite ingresos (Ej: Recibo de sueldo, pagos de monotributo, Ingresos Brutos)\n" +
    "*Sujeto a evaluación Crediticia.*",
  )
  .addAnswer(
    "Gracias por utilizar nuestro asistente virtual para comercios. Si tienes más preguntas o necesitas ayuda en el futuro, no dudes en contactarnos nuevamente. ¡Que tengas un excelente día!"
  );

export default flowRequisitosComercio;
