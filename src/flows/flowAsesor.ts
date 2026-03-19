import { addKeyword } from '@builderbot/bot';
import databaseLogger from '../logger/databaseLogger';
import acciones from '../models/actions';

const flowAsesor = addKeyword("__flow_asesor__", { sensitive: false })
  .addAction(async (ctx, { endFlow }) => {
    databaseLogger.addLog(ctx.from, acciones.ASESOR);
    return endFlow("En este momento no contamos con asesores disponibles. Podés comunicarte directamente al *+54 9 264 471-1445* o escribir a *gabrielperez@tarjetadata.com.ar*. ¡Muchas gracias!");
  });

export default flowAsesor;
