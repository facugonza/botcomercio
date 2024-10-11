// acciones.ts

const Acciones = {
    VALIDAR_COMERCIO: "VALIDAR_COMERCIO",  // Validación de datos de comercio
    DESCARGAR_LIQUIDACION: "DESCARGAR_LIQUIDACION",  // Descargar la última liquidación
    DESCARGAR_RETENCION: "DESCARGAR_RETENCION",  // Descargar la última retención
    CONSULTAR_PLANES: "CONSULTAR_PLANES",  // Consultar planes vigentes
    SOLICITAR_ASESOR: "SOLICITAR_ASESOR",  // Solicitar un asesor comercial
    VALIDAR_CUPON: "VALIDAR_CUPON",  // Validar cupón manual
    PROBLEMA_POS: "PROBLEMA_POS",  // Reportar un problema con el equipo POS
    ACELERAR_LIQUIDACION: "ACELERAR_LIQUIDACION",  // Acelerar la liquidación
    PREGUNTAS_FRECUENTES: "PREGUNTAS_FRECUENTES",  // Consultar preguntas frecuentes
    RECLAMO_LIQUIDACION: "RECLAMO_LIQUIDACION",  // Reclamo de liquidación o cupón no liquidado
    VINCULAR: "NUEVO_COMERCIO_REGISTRADO",
    DESVINCULAR: "DESVINCULAR",  // Desvincular el número de teléfono del comercio
    MENU_PRINCIPAL: "MENU_PRINCIPAL",  // Volver al menú principal
    NUEVO_COMERCIO_REGISTRADO: "NUEVO_COMERCIO_REGISTRADO",  // Registrar un nuevo comercio
    MENU_NO_COMERCIO: "MENU_NO_COMERCIO",  // Mostrar el menú para usuarios no registrados como comercios
    HOME: "MENU_PRINCIPAL",
    ASESOR: "ASESOR",
    ADHERIR: "ADHERIR",
  };
  
  export default Acciones;
  