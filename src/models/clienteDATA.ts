interface ClienteData {
  isLogin?: boolean;
  apellido?: string;
  perfilimagen?: string;
  resumentotal?: string;
  disponibleprestamo?: number;
  Parametro?: any[];
  idreserva?: number;
  barcodeminimo?: string;
  documento?: number;
  resumennumero?: string;
  Compra?: {
      total: number;
      fecha: string;
      empresa: string;
  }[];
  resumenminimo?: string;
  disponible?: string;
  tarjeta?: string;
  barcodepland?: string;
  resumenfecha?: string;
  nombre?: string;
  fechaserver?: string;
  email?: string;
  vencimiento?: string;
  diavencimiento?: string;
  estadocuenta?: string;
  idturno?: number;
  barcodetotal?: string;
  digito?: string;
  [key: string]: any; // Permite campos adicionales no definidos explícitamente
}

const clientesData: Record<string, ClienteData> = {};

// Guarda los datos del cliente asociados a un contexto
const setClienteData = (ctx: { from: string }, data: ClienteData): void => {
  const from = ctx.from;
  clientesData[from] = data;
};

// Obtiene los datos del cliente asociados a un contexto
const getClienteData = (ctx: { from: string }): ClienteData => {
  const from = ctx.from;
  return clientesData[from] || {};
};

export { setClienteData, getClienteData };
