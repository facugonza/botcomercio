import { addKeyword } from '@builderbot/bot';
import { setComercioData } from "../models/merchantDATA";
import { findMerchant } from "../services/merchantService";
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { emailLogger } from '~/logger/logger';
import databaseLogger from '../logger/databaseLogger';
import acciones from '../models/actions';


interface DatosComercio {
  cuit: string;
  numeroTelefono: string;
}

const desvincularComercio = async (datosCliente: DatosComercio): Promise<any> => {
    console.log("desvincularCuenta : " + datosCliente.cuit + " / " + datosCliente.numeroTelefono);
    try {
        const config: AxiosRequestConfig = {
            method: "POST",
            url: "http://200.70.56.203:8021/AppMovil/DesvincularComercio",
            headers: {
                "Content-Type": "application/json",
            },
            data: JSON.stringify(datosCliente),
        };

        const response: AxiosResponse = await axios(config);
        return response.data;
    } catch (e) {
        emailLogger.log("ERROR desvincular Cuenta: " + e.stack);
        return null;
    }
};

const flowDesvincular = addKeyword("desvincular", { sensitive: false })
    .addAnswer(
        "¿Confirmas desvincular este número de teléfono ? Responde *SI o NO* para confirmar o cancelar.",
        { capture: true },
        async (ctx: any, { endFlow, flowDynamic }: any) => {
            
            databaseLogger.addLog(
                ctx.from,
                acciones.DESVINCULAR
            );
                      
            const comercio = await findMerchant(ctx);
            if (Object.keys(comercio).length > 0) {
                if (ctx.body.toLowerCase() === "si") {
                    const datosComercio: DatosComercio = {
                        numeroTelefono: ctx.from,
                        cuit: comercio.cuit
                    };
                    const desvincularCliente = await desvincularComercio(datosComercio);
                    setComercioData(ctx, {});
                    if (desvincularCliente != null && desvincularCliente.success) {
                        return endFlow(`Desvinculamos este número (*+${ctx.from}*) de Teléfono del comercio *:${comercio.descripcion}* !!`);
                    } else {
                        return flowDynamic("*No se pudo procesar la solicitud en este momento .... reintenta luego !!*");
                    }
                } else {
                    setComercioData(ctx, {});
                    return endFlow("*OPERACIÓN CANCELADA*. Si tienes más preguntas o necesitas ayuda, no dudes en contactarme nuevamente. *¡Tienes suerte, tienes DATA!*");
                }
            }
        }
    );

export default flowDesvincular;
