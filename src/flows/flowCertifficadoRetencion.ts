import { addKeyword } from '@builderbot/bot';
import { setComercioData } from '../models/merchantDATA';
import { findMerchant } from '../services/merchantService';
import databaseLogger from '../logger/databaseLogger';
import acciones from '../models/actions';
import { logger, emailLogger } from '~/logger/logger';
import axios from 'axios';
import fs from 'fs';
import { tmpdir } from 'os';
import path from 'path';

// Define un tipo para el cliente si no existe ya
interface Cliente {
    resumenfecha: string;
    resumennumero: string;
    documento: string;
    apellido?: string;
    hasVisaSummary?: boolean;
}

const flowUltimaLiquidacion = addKeyword("__flow_retencion__", { sensitive: false })
    .addAnswer(".",
        { delay: 500 },
        async (ctx: any, { endFlow, flowDynamic, provider }: any) => {
            
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
                        
                        const resumenURL = `${process.env.API_PUBLIC_URL}/AppMovil/ComercioCertPDF?certificado=${comercio.lastcertificado}`;

                        const response = await axios.get(resumenURL, { responseType: 'arraybuffer', timeout: 60000 });

                        if (!response.headers['content-type']?.includes('pdf')) {
                            throw new Error("La URL no devolvió un PDF válido");
                        }

                        const tempFile = path.join(tmpdir(), `Certificado-${comercio.lastcertificado}.pdf`);
                        fs.writeFileSync(tempFile, Buffer.from(response.data));
                        await provider.sendFile(ctx.from, tempFile);
                        fs.unlinkSync(tempFile);
                    }else {
                        await flowDynamic([{
                            body: `No se encontraron certificados Generados a la fecha.`
                        }]);
                    }

                } catch (error) {
                    await flowDynamic([{ body: "En estos momentos no puedo procesar la opción solicitada. *Reintenta más tarde.*" }]);
                    logger.error("Error obteniendo Certificado Retencion: " + error.stack);
                    emailLogger.error("Error obteniendo Certificado Retencion", error);
                }

                setComercioData(ctx, {});
                return endFlow("Si tienes más preguntas o necesitas ayuda, no dudes en contactarme nuevamente. *¡Tenes suerte, tenes DATA!*");
            } else {
                console.log(`Comercio no encontrado, length: ${Object.keys(comercio).length}`);
            }
        }
    );

export default flowUltimaLiquidacion;
