
import axios from 'axios';
import dotenv from 'dotenv';
import { addKeyword } from '@builderbot/bot';
import { findPlanActiveByComercio } from '../services/ventaService';


interface ClienteData {
    dni: string;
}

dotenv.config();

const FIXED_PHONE_NUMBER = "5492645726348"; // Número fijo al que se enviarán los datos

// Función para enviar mensaje al servidor de notificaciones
async function notifySale(number: string, message: string): Promise<void> {
    const url = 'http://localhost:3008/notifySale'; // Cambia al dominio y puerto de tu servidor
    try {
        const response = await axios.post(url, { number, message });
        console.log('Respuesta del servidor:', response.data);
    } catch (error) {
        console.error('Error al invocar /notify  Sale:', error.response?.data || error.message);
    }
} 

interface Plan {
    planesPK: {
        clavepln: number;
        cuotapln: number;
    };
    descrpln: string;
}


async function generarRequestId() {
    const fecha = new Date();
    const formatoFechaHora = 
        String(fecha.getDate()).padStart(2, '0') + // Día (dd)
        String(fecha.getMonth() + 1).padStart(2, '0') + // Mes (MM)
        fecha.getFullYear() + // Año (yyyy)
        String(fecha.getHours()).padStart(2, '0') + // Hora (HH)
        String(fecha.getMinutes()).padStart(2, '0') + // Minutos (mm)
        String(fecha.getSeconds()).padStart(2, '0'); // Segundos (ss)
        String(fecha.getMilliseconds()).padStart(2, '0'); // Segundos (ss)
    
    return `${formatoFechaHora}`; // Formato: tarjeta-fechaHora
  }

  async function makeJonSale (cliente,venta){
    const requestId = await generarRequestId();
    const compraQREstatico = {
        tipo_user_id: 9,
        tipo_user: "APP_QR",
        request_id: requestId,
        documento: cliente.dni,
        plastico: cliente.plastico.replace(/\s+/g, '').trim(),
        vtoplastico: cliente.vtotarjeta,
        cuitcomercio: venta.cuit,
        empresa: venta.numeroComercio,
        puntovta: 1,
        numcaja: 1,
        total: venta.importeCompra,
        planvta: venta.planActivo,
        cuotasvta: venta.cuotasSeleccionadas,
        fecha: new Date().toISOString(),
        observacionvta: "VENTA_API_REST_DATABOT",
        token: "",
      };

}

const API_URL_CLIENTE = "http://200.70.56.203:8021/AppMovil/Cliente";

// Función para validar cliente en el servidor
const obtenerCliente = async (dni: string): Promise<any> => {
    try {
        console.log("Obteniendo cliente con DNI:", dni);

        // Construir la URL con el DNI como parámetro
        const url = `${API_URL_CLIENTE}?dni=${dni}`;
        const response = await axios.get(url);
        if (response.data?.disponible) {
            response.data.disponible = parseFloat(
                response.data.disponible
                    .replace(/[\$.]/g, '') // Eliminar "$" y "."
            ); 
        } return response.data;
     } catch (error) {
        console.error("Error al obtener cliente:", error.message);
        // Devolver un valor por defecto en caso de error
        return null;
        }
    };

    const flowVender = addKeyword("vender", { sensitive: false })
    .addAnswer(
        ["¡Claro! 😄 Ingresa el DNI del Cliente al que quieres realizar la venta. Ej. 21001222 *sin puntos*"],
        { capture: true },
        async (ctx, { fallBack, state }) => {
            state.clear();
            console.log("flowVenta > DNI:", ctx.body);
            const dniRegex = /^\d+$/;

            if (dniRegex.test(ctx.body)) {
                await state.update({ dni: ctx.body });
            } else {
                return fallBack("⚠️ ¿Puedes verificar el número ingresado? Debe contener solo números. Gracias.");
            }
        }
    )
    .addAnswer(
        ["⏳ Estoy validando los datos del cliente, un momento por favor..."],
        { capture: false },
        async (ctx, { state, fallBack, flowDynamic }) => {
            const dni = state.get("dni");

            const cliente = await obtenerCliente(dni);

            if (!cliente || !cliente.isLogin) {
                return fallBack("❌ No encontramos al cliente en el sistema. Por favor, verifica los datos.");
            }

            if (!cliente.nombre || !cliente.apellido || !cliente.disponible) {
                return fallBack("❌ No se pudo obtener el nombre del cliente. Intenta nuevamente.");
            }

            const nombreCompleto = `${cliente.apellido} ${cliente.nombre}`;
            const disponible = cliente.disponible;
            const telefonoCliente = cliente.telefono;

 
            console.log(`Cliente validado: ${nombreCompleto}, Disponible limpio: ${disponible}, Teléfono: ${telefonoCliente}`);

            // Guardar el nombre y el disponible en el estado
            await state.update({ nombreCliente: nombreCompleto, disponible, telefonoCliente });

            await flowDynamic([
                {
                    body: `El cliente encontrado es *${nombreCompleto}*. ¿Deseas continuar con esta venta? Escribe *SI* para confirmar o *NO* para cancelar.`,
                },
            ]);
        }
    )
    .addAnswer(
        null,
        { capture: true },
        async (ctx, { state, fallBack }) => {
            const confirmacion = ctx.body.trim().toLowerCase();

            if (confirmacion !== "si") {
                return fallBack("Operación cancelada. Si deseas realizar otra operación, por favor inicia nuevamente.");
            }

            console.log("Comercio confirmó la venta para el cliente:", state.get("nombreCliente"));
        }
    )
 
    .addAnswer(
        ["Genial! Ahora, por favor, ingresa el monto total de la venta (ejemplo: 1234.56):"],
        { capture: true },
        async (ctx, { state, fallBack }) => {
            const monto = parseFloat(ctx.body.trim());
            const montoRegex = /^\d+(\.\d{1,2})?$/;

            if (!montoRegex.test(ctx.body)) {
                return fallBack("⚠️ El monto ingresado no es válido. Debe ser un número positivo con hasta dos decimales.");
            }

            const disponible = state.get("disponible");
            if (monto > disponible) {
                return fallBack("❌ Esta persona no tiene un disponible suficiente para realizar esta venta.");
            }

            await state.update({ monto });
        }
    )
    .addAnswer(
        ["⏳ Estoy obteniendo los planes disponibles para este comercio, un momento por favor..."],
        { capture: false },
        async (ctx, { state, fallBack, flowDynamic }) => {
            try {
                const comercio: { nombre: string; numeroComercio: number; planes: Plan[] } = state.get("comercio") || {
                    nombre: "Comercio Ejemplo",
                    numeroComercio: 1,
                    planes: [
                        { planesPK: { clavepln: 53, cuotapln: 1 }, descrpln: "PLAN D" },
                        { planesPK: { clavepln: 53, cuotapln: 3 }, descrpln: "PLAN D" },
                        { planesPK: { clavepln: 2, cuotapln: 1 }, descrpln: "PLAN SIN INTERES" },
                        { planesPK: { clavepln: 2, cuotapln: 3 }, descrpln: "PLAN SIN INTERES" },
                    ],
                };
    
                // Obtener los planes únicos por clave y descripción
                const planesDisponibles = comercio.planes.reduce((planes: { clavepln: number; descrpln: string }[], plan) => {
                    if (!planes.some(p => p.clavepln === plan.planesPK.clavepln)) {
                        planes.push({
                            clavepln: plan.planesPK.clavepln,
                            descrpln: plan.descrpln,
                        });
                    }
                    return planes;
                }, []);
    
                if (planesDisponibles.length === 0) {
                    return fallBack("❌ No hay planes de pago disponibles para este comercio.");
                }
    
                // Guardar los planes en el estado
                await state.update({ planesDisponibles });
    
                let mensajePlanes = `💳 *ELIGE EL PLAN QUE DESEAS PARA REALIZAR LA VENTA*\n\n`;
                planesDisponibles.forEach(plan => {
                    mensajePlanes += `- ${plan.descrpln} (escriba ${plan.clavepln})\n`;
                });
    
                mensajePlanes += `\nPor favor, escribe la clave del plan que deseas seleccionar.`;
    
                // Enviar los planes disponibles al usuario
                await flowDynamic([{ body: mensajePlanes }]);
            } catch (error) {
                console.error("Error al obtener planes del comercio:", error.message);
                return fallBack("❌ Ocurrió un error al obtener los planes disponibles. Por favor, intenta nuevamente.");
            }
        }
    )
    .addAnswer(
        null,
        { capture: true },
        async (ctx, { state, fallBack }) => {
            const planesDisponibles: { clavepln: number; descrpln: string }[] = state.get("planesDisponibles");
            const clavePlan = parseInt(ctx.body.trim(), 10);
    
            if (isNaN(clavePlan) || !planesDisponibles.some(plan => plan.clavepln === clavePlan)) {
                return fallBack(`⚠️ La clave ingresada no es válida. Por favor, selecciona una de las claves mostradas.`);
            }
    
            const planSeleccionado = planesDisponibles.find(plan => plan.clavepln === clavePlan);
    
            console.log(`Plan seleccionado: ${planSeleccionado?.descrpln} (clave: ${clavePlan})`);
    
            // Guardar el plan seleccionado en el estado
            await state.update({ planSeleccionado: clavePlan, descripcionPlan: planSeleccionado?.descrpln });
        }
    )
    .addAnswer(
        ["⏳ Obteniendo las opciones de cuotas disponibles para el plan seleccionado, por favor espera un momento..."],
        { capture: false },
        async (ctx, { state, fallBack, flowDynamic }) => {
            try {
                const comercio: { nombre: string; numeroComercio: number; planes: Plan[] } = state.get("comercio") || {
                    nombre: "Comercio Ejemplo",
                    numeroComercio: 1,
                    planes: [
                        { planesPK: { clavepln: 53, cuotapln: 1 }, descrpln: "PLAN D" },
                        { planesPK: { clavepln: 53, cuotapln: 3 }, descrpln: "PLAN D" },
                        { planesPK: { clavepln: 2, cuotapln: 1 }, descrpln: "PLAN SIN INTERES" },
                        { planesPK: { clavepln: 2, cuotapln: 3 }, descrpln: "PLAN SIN INTERES" },
                        { planesPK: { clavepln: 2, cuotapln: 6 }, descrpln: "PLAN SIN INTERES" },
                        { planesPK: { clavepln: 2, cuotapln: 9 }, descrpln: "PLAN SIN INTERES" },
                        { planesPK: { clavepln: 2, cuotapln: 12 }, descrpln: "PLAN SIN INTERES" },
                    ],
                };
    
                const planSeleccionado = state.get("planSeleccionado");
    
                // Filtrar las cuotas disponibles para el plan seleccionado
                const opcionesCuotas = comercio.planes
                    .filter(plan => plan.planesPK.clavepln === planSeleccionado)
                    .map(plan => plan.planesPK.cuotapln);
    
                if (opcionesCuotas.length === 0) {
                    return fallBack(`❌ No hay cuotas disponibles para el plan seleccionado.`);
                }
    
                const monto = state.get("monto");
    
                let mensajeCuotas = `💳 *Opciones de cuotas para el plan seleccionado:*\n\n`;
                opcionesCuotas.forEach(cuota => {
                    const valorCuota = (monto / cuota).toFixed(2);
                    mensajeCuotas += `\n${cuota} cuota${cuota > 1 ? "s" : ""} x $${valorCuota}`;
                });
    
                // Guardar las cuotas disponibles en el estado
                await state.update({ opcionesCuotas });
    
                // Enviar el mensaje con las cuotas disponibles
                await flowDynamic([{ body: mensajeCuotas }]);
            } catch (error) {
                console.error("Error al obtener opciones de cuotas para el plan:", error.message);
                return fallBack("❌ Ocurrió un error al obtener las opciones de cuotas. Por favor, intenta nuevamente.");
            }
        }
    )
    .addAnswer(
        ["📌 Por favor, escribe la cantidad de cuotas en las que deseas realizar la venta. Ejemplo: 3"],
        { capture: true },
        async (ctx, { state, fallBack }) => {
            const opcionesCuotas: number[] = state.get("opcionesCuotas") || [];
            const cuotasSeleccionadas = parseInt(ctx.body.trim(), 10);
    
            if (isNaN(cuotasSeleccionadas) || !opcionesCuotas.includes(cuotasSeleccionadas)) {
                return fallBack(`⚠️ La cantidad de cuotas ingresada no es válida. Por favor, selecciona entre: ${opcionesCuotas.join(", ")}.`);
            }
    
            console.log(`Cuotas seleccionadas: ${cuotasSeleccionadas}`);
            await state.update({ cuotasSeleccionadas });
        }
    )
    .addAnswer(
        ["⏳ Procesando los datos de la venta..."],
        { capture: false },
        async (_, { state, flowDynamic }) => {
            const nombreCliente = state.get("nombreCliente");
            const monto = state.get("monto");
            const planSeleccionado = state.get("descripcionPlan");
            const cuotasSeleccionadas = state.get("cuotasSeleccionadas");
    
            // Crear mensaje dinámico para mostrar la confirmación de venta
            const mensaje = `
    ✅ Venta a realizar:
    - Cliente: ${nombreCliente}
    - Monto: $${monto}
    - Plan: ${planSeleccionado}
    - Cuotas: ${cuotasSeleccionadas}
    Confirma escribiendo *SI* para realizar la venta o *NO* para cancelarla.
            `;
    
            // Enviar mensaje dinámico
            await flowDynamic([{ body: mensaje }]);
        }
    )
    .addAnswer(
        null,
        { capture: true },
        async (ctx, { state, fallBack, flowDynamic }) => {
            const confirmacion = ctx.body.trim().toLowerCase();
    
            if (confirmacion !== "si") {
                return fallBack("❌ Venta cancelada. Si deseas realizar otra operación, por favor inicia nuevamente.");
            }
    
            console.log("Venta confirmada para el cliente:", state.get("nombreCliente"));
            console.log("Detalles de la venta:", {
                monto: state.get("monto"),
                plan: state.get("descripcionPlan"),
                cuotas: state.get("cuotasSeleccionadas"),
            });
    
            
            await flowDynamic([
                {
                    body: `✅ *Genial, enviamos tu solicitud de pago al cliente.* Apenas recibamos su confirmación, te haremos saber. Gracias.\n\n*¡Tenés Suerte, Tenés Data!*`,
                },
            ]);
        }
    );
    
    
    
    
    
    /*.addAnswer(
        
    
            // Obtener datos del cliente y venta del estado
            const nombreCliente = state.get ? state.get("nombreCliente") : state["nombreCliente"];
            const dni = state.get("dni");
            const monto = state.get("monto");
            const cuotas = state.get("opcionesCuotas");
            const nrocomercio = state.get("nrocomercio");
            const nroplan = state.get("nroplan");
            const descripcion = state.get("descripcion") || "Sin descripción";
            //const telefonoCliente = state.get("telefonoCliente"); // Se asume que se guarda el teléfono en el estado previamente
    
            // Estructurar los datos en un JSON
            const dataVenta = {

                venta: {
                    nombre: nombreCliente,
                    dni: dni,
                    telefono: telefonoCliente, // Agregar el teléfono del cliente desde el JSON de la API
                    monto: parseFloat(monto), // Asegurarnos de enviar el monto como número
                    cuotas: parseInt(cuotas, 10), // Convertir cuotas a número
                    descripcion: descripcion,
                },
            };
    
            const cliente = {
                cliente: {
                    nombre: nombreCliente,
                    dni: dni,
                    telefono: telefonoCliente, // Agregar el teléfono del cliente desde el JSON de la API
                    plastico: parseFloat(monto), // Asegurarnos de enviar el monto como número
                    vtoplastico: parseInt(cuotas, 10)
                },
            };

            try {
                // Convertir el objeto JSON a string antes de enviarlo
                const jsonVenta = await makeJonSale(cliente,venta);
                
                // Enviar la data como JSON en formato string al endpoint
                await notifySale(FIXED_PHONE_NUMBER, jsonVenta);
                //PUSH TO REDIS  >>> 

            } catch (error) {
                console.error("Error al notificar la venta:", error.message);
                return fallBack("Ocurrió un problema al notificar la venta. Por favor, inténtalo nuevamente.");
            }
        }
    );*/
    export default flowVender;