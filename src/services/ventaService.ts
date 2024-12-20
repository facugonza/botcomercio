import dotenv from "dotenv";
dotenv.config();

interface Plan {
    planesPK: {
        clavepln: number;
    };
}

interface Comercio {
    planes: Plan[];
}

const comercioAutorizados = [21, 4840, 4500, 5000]; // Comercios con autorización especial

/**
 * Genera un request ID basado en la fecha y hora actual
 */
export function generarRequestId(): string {
    const fecha = new Date();
    const formatoFechaHora =
        String(fecha.getDate()).padStart(2, '0') + // Día (dd)
        String(fecha.getMonth() + 1).padStart(2, '0') + // Mes (MM)
        fecha.getFullYear() + // Año (yyyy)
        String(fecha.getHours()).padStart(2, '0') + // Hora (HH)
        String(fecha.getMinutes()).padStart(2, '0') + // Minutos (mm)
        String(fecha.getSeconds()).padStart(2, '0') + // Segundos (ss)
        String(fecha.getMilliseconds()).padStart(3, '0'); // Milisegundos

    return `${formatoFechaHora}`;
}

/**
 * Encuentra el plan activo basado en el comercio y su número
 * @param comercio - Objeto comercio que contiene los planes
 * @param numeroComercio - Número del comercio
 * @returns El ID del plan activo o 0 si no se encuentra ninguno
 */
export function findPlanActiveByComercio(comercio: Comercio | null, numeroComercio: number): number {
    if (!comercio || !comercio.planes) {
        console.log("El comercio o los planes no existen:", comercio);
        return 0; // Retorna 0 si no existen planes
    }

    // Primero verificar si existe el plan 53 (Plan D)
    const hasPlanD = comercio.planes.find(plan => plan.planesPK.clavepln === 53);
    if (hasPlanD) {
        return 53;
    }

    // Si no tiene plan 53, verificar el plan 1
    const hasPlan1 = comercio.planes.find(plan => plan.planesPK.clavepln === 1);
    if (hasPlan1) {
        return 1;
    }

    // Verificar si el comercio está autorizado para Plan 2
    if (comercioAutorizados.includes(Number(numeroComercio))) {
        const hasPlan2 = comercio.planes.some(plan => plan.planesPK.clavepln === 2);
        if (hasPlan2) {
            return 2;
        }
    }

    return 0; // Si no tiene ninguno de los planes anteriores, retornar 0
}
export default findPlanActiveByComercio