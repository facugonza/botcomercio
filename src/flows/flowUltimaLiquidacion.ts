import { addKeyword } from '@builderbot/bot';
import { setComercioData } from '../models/merchantDATA';
import { findMerchant } from '../services/merchantService';
import databaseLogger from '../logger/databaseLogger';
import acciones from '../models/actions';
import { emailLogger, logger } from '~/logger/logger';


const flowUltimaLiquidacion = addKeyword("liquidacion", { sensitive: false })
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
                    if (comercio.lastorden){
                        await flowDynamic([{
                            body: `Obteniendo tu última Liquidacion DATA generado con fecha ${comercio.lastordenfecha}. *Aguarda unos instantes...*`
                        }]);
                        
                        const resumenURL = `https://chatbot.tarjetadata.com.ar/AppMovil/ComercioOrdenPDF?nroorden=${comercio.lastorden}`;
                        
                        await flowDynamic([{
                            body: `Liquidacion N° ${comercio.lastorden}`,
                            media: resumenURL,
                        }]);
                    }else {
                        await flowDynamic([{
                            body: `No se encontraron Liquidaciones Generadas a la fecha.`
                        }]);
                    }

                } catch (error) {
                    await flowDynamic([{ body: "En estos momentos no puedo procesar la opción solicitada. *Reintenta más tarde.*" }]);
                    emailLogger.error("Error obteniendo Liquidacion Comercio ",error.stack);
                }

                setComercioData(ctx, {});
                return endFlow("Si tienes más preguntas o necesitas ayuda, no dudes en contactarme nuevamente. *¡Tenes suerte, tenes DATA!*");
            } else {
                logger.warn(`Comercio no encontrado, length: ${Object.keys(comercio).length}`);
            }
        }
    );

export default flowUltimaLiquidacion;
