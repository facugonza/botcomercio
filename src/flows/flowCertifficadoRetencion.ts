import { addKeyword } from '@builderbot/bot';
import { setComercioData } from '../models/merchantDATA';
import { findMerchant } from '../services/merchantService';
import databaseLogger from '../logger/databaseLogger';
import acciones from '../models/actions';
import { emailLogger } from '~/logger/logger';

// Define un tipo para el cliente si no existe ya
interface Cliente {
    resumenfecha: string;
    resumennumero: string;
    documento: string;
    apellido?: string;
    hasVisaSummary?: boolean;
}

const flowUltimaLiquidacion = addKeyword("CERTFICADO", { sensitive: false })
    .addAnswer(".",
        { delay: 500 },
        async (ctx: any, { endFlow, flowDynamic }: any) => {
            
            databaseLogger.addLog(
                ctx.from,
                acciones.DESCARGAR_LIQUIDACION
            );

            const comercio = await findMerchant(ctx);

            if (Object.keys(comercio).length > 0) {
                try {
                    if (comercio.lastcertificado){
                        await flowDynamic([{
                            body: `Obteniendo tu último Certificado de retencion ${comercio.lastcertificadofecha}. *Aguarda unos instantes...*`
                        }]);
                        
                        const resumenURL = `https://chatbot.tarjetadata.com.ar/AppMovil/ComercioCertPDF?certificado=${comercio.lastcertificado}`;
                        
                        await flowDynamic([{
                            body: `Certificado N° ${comercio.lastcertificado}`,
                            media: resumenURL,
                        }]);
                    }else {
                        await flowDynamic([{
                            body: `No se encontraron certificados Generados a la fecha.`
                        }]);
                    }

                } catch (error) {
                    await flowDynamic([{ body: "En estos momentos no puedo procesar la opción solicitada. *Reintenta más tarde.*" }]);
                    emailLogger.error(error);
                }

                setComercioData(ctx, {});
                return endFlow("Si tienes más preguntas o necesitas ayuda, no dudes en contactarme nuevamente. *¡Tenes suerte, tenes DATA!*");
            } else {
                console.log(`Comercio no encontrado, length: ${Object.keys(comercio).length}`);
            }
        }
    );

export default flowUltimaLiquidacion;
