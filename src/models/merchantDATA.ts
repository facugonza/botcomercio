// merchantDATA.ts

// Definición de interfaces para los datos de comercio
export interface Certificado {
    total: string | null;
    fecha: string | null;
    idfechatotal: string | null;
    clave: number | null;
  }
  
  export interface Orden {
    total: number | null;
    fecha: string | null;
    idfechatotal: string | null;
    idorden: number | null;
  }
  
  export interface Venta {
    total: string | null;
    fecha: string | null;
    cuota: string | null;
    clave: number | null;
  }
  
  export interface ServicioResponse {
    isLogin: boolean;
    lastorden: number | null;
    cuit: string | null;
    lastordentotal: string | null;
    lastcertificado: number | null;
    descripcion: string | null;
    Certificado: Certificado[] | null;
    Orden: Orden[] | null;
    Venta: Venta[] | null;
    email: string | null;
    prevlastorden: number | null;
    latitud: string | null;
    prevordenfecha: string | null;
    isAdmin: boolean;
    longitud: string | null;
    prevlastordentotal: string | null;
    Coeficientes: any[] | null; // Si tienes un tipo más específico, puedes reemplazar `any[]`
    nroempresa: string | null;
    lastordenfecha: string | null;
  }
  
  let comercioDATA = {};
  const comerciosData = {};
  
  const setComercioData = (ctx, data) => {
    const from = ctx.from;
    comerciosData[from] = data;
  };
  
  const getComercioData = (ctx) => {
    const from = ctx.from;
    return comercioDATA[from] || {};
  };

  export  {  setComercioData,  getComercioData };
  
