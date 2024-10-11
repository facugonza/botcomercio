import dotenv from 'dotenv';
dotenv.config();

import axios from "axios";
import { emailLogger } from '../logger/logger';
import { getComercioData, setComercioData } from "../models/merchantDATA";

const API_URL_VERIFICAR_COMERCIO = "http://200.70.56.203:8021/AppMovil/Comercio?nroTelefono=";
const API_URL_VERIFICAR_COMERCIO_BKP = "http://200.70.56.203:8021/AppMovil/Comercio?nroTelefono=";

// Función para verificar si un comercio está registrado usando su número de comercio
const isRegisterMerchant = async (merchantNumber: string): Promise<any> => {
    try {
        const config = {
            method: "get",
            url: API_URL_VERIFICAR_COMERCIO + merchantNumber,
            headers: {},
            timeout: 30000
        };

        const response = await axios(config);
        return response.data;
    } catch (e) {
        console.log(e);
        emailLogger.error("ERROR en isRegisterMerchant > " + e.stack);
        return null;
    }
};

// Función para buscar datos de un comercio
const findMerchant = async (ctx: any): Promise<any> => {
    let comercio = getComercioData(ctx);

    // Función auxiliar para realizar la solicitud
    async function makeRequest(url: string): Promise<any> {
        try {
            console.log("INTENTANDO OBTENER DATOS DEL COMERCIO DESDE... : " + url + ctx.from);
            const config = {
                method: "get",
                url: url + ctx.from,
                headers: {},
                timeout: 30000
            };
            const response = await axios(config);
            return response.data;
        } catch (e) {
            emailLogger.error("ERROR en makeRequest > " + e.stack);
            console.log(e);
            return null;
        }
    }

    // Si el objeto comercio está vacío, intenta buscar los datos del comercio
    if (Object.keys(comercio).length === 0) {
        comercio = await makeRequest(API_URL_VERIFICAR_COMERCIO);

        // Si la solicitud al primer servidor falla, intenta con el segundo servidor
        if (!comercio) {
            comercio = await makeRequest(API_URL_VERIFICAR_COMERCIO_BKP);
        }

        // Si se encontraron los datos del comercio y el comercio ha iniciado sesión, almacena los datos en el contexto
        if (comercio != null && comercio.isLogin) {
            setComercioData(ctx, comercio);
        } else {
            comercio = {}; // Asegurarse de devolver un objeto vacío si no se encontraron datos
        }
    }

    return comercio; // Devuelve el objeto comercio, que puede estar lleno o vacío
};

// Ejemplo de función adicional que podrías necesitar (puedes adaptarla según las necesidades del comercio)
const asociarComercio = async (datosComercio: any): Promise<any> => {
    try {
        console.log("asociarComercio DATOS COMERCIO: " + JSON.stringify(datosComercio));

        const config = {
            method: "POST",
            url: process.env.API_URL_VINCULAR_COMERCIO, // Reemplaza con tu URL específica para comercio
            headers: {
                "Content-Type": "application/json",
            },
            data: JSON.stringify(datosComercio),
        };

        const response = await axios(config);
        return response.data;
    } catch (error) {
        emailLogger.error("ERROR VINCULANDO COMERCIO > : " + error);
        return null;
    }
};

export { isRegisterMerchant, findMerchant, asociarComercio };
