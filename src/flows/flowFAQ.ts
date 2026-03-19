import { addKeyword } from '@builderbot/bot';

const flowFaq = addKeyword("__flow_faq__", { sensitive: false })
  .addAnswer(
    "*REQUISITOS PARA TU ADHESIÓN DE COMERCIO*\n" +
    "Empresas Unipersonales:\n" +
    "– Inscripción en AFIP.\n" +
    "– Inscripción en Rentas.\n" +
    "– DNI.\n\n" +
    "Sociedades:\n" +
    "– Inscripción en AFIP.\n" +
    "– Inscripción en Rentas.\n" +
    "– Contrato social.\n" +
    "– Poder habilitante para quien representa la sociedad.\n" +
    "– DNI.",
    {delay : 2000}
  )
  .addAnswer(
    "*PLANES DE VENTA*\n" +
    "Tarjeta Data posee tres planes de venta:\n\n" +
    "Plan D: 1, 2 y 3 cuotas sin interés.\n" +
    "Plan B: 6 cuotas sin interés.\n" +
    "Plan H: 12 cuotas sin interés.\n\n" +
    "Importante: Todo lo que el cliente pacte en 1 cuota en Plan D puede financiarlo en 1, 2 o 3 cuotas sin interés o en 6, 9 o 12 cuotas fijas en pesos."
,{delay : 2000}  
)
  .addAnswer(
    "*PRESENTACIÓN DE CUPONES*\n" +
    "Cada comercio tiene una presentación mensual. Ese día es el cierre de las ventas y a partir de esa fecha se generan los pagos.\n\n" +
    "Para saber la fecha de presentación de cupones, envía un correo a:\n" +
    "📧 gabrielperez@tarjetadata.com.ar\n" +
    "📧 luispalacio@tarjetadata.com.ar\n" +
    "Proporciona tu número de comercio."
  )
  .addAnswer(
    "*RECOMENDACIONES*\n" +
    "Recomendaciones para el comercio:\n\n" +
    "– Solicitar POS a su asesor de la zona.\n" +
    "– Solicitar \"Código de Autorización\" para ventas con cupones manuales.\n" +
    "– En ventas de planes largos, colocar el importe de la compra, la cantidad de cuotas e importe de la cuota.\n" +
    "– En Plan D, colocar el importe total sin cuotas; el cliente elegirá las cuotas al pagar el resumen.\n" +
    "– Presentar siempre la tarjeta de crédito con DNI del cliente.",
    {delay : 2000}
  )
  .addAnswer(
    "*MOTIVOS DE RECHAZO DE CUPONES*\n" +
    "Motivos comunes de rechazo de cupones:\n\n" +
    "– Cupón ilegible o sin firma.\n" +
    "– Tarjeta fuera de vigencia o extraviada.\n" +
    "– Importes que no coinciden con el código de autorización.\n" +
    "– Cupones con fecha vencida o enmendada.\n" +
    "– Cupón sin número de tarjeta.\n" +
    "– Cupón duplicado o adulterado.",
    {delay : 2000}
  )
  .addAnswer(
    "*VENTAS ONLINE*\n" +
    "Tarjeta Data ha implementado un servicio para ventas online. El proceso es automático y se valida instantáneamente. Solo debes hacer firmar el cupón generado y guardarlo para posibles reclamos. La operación se liquida automáticamente en la próxima liquidación."
  );

export default flowFaq;
