import { addKeyword } from '@builderbot/bot';
import { getComercioData, setComercioData } from "../models/merchantDATA"; // Cambiado a merchantDATA para comercios
import createGroup from '../services/createGroups';
import { logger, emailLogger } from '../logger/logger';
import databaseLogger from '../logger/databaseLogger';
import acciones from '../models/actions';

// Función para verificar si está dentro del horario laboral
function isWithinWorkingHours(): boolean {
  const currentHour = new Date().getHours();
  
  // Franja horaria: 08:00 a 21:00
  const isWithinNewHours = currentHour >= 8 && currentHour < 21;

  // Días laborables: lunes (1) a viernes (5)
  const currentDay = new Date().getDay();
  const isWorkingDay = currentDay >= 1 && currentDay <= 5;

  console.log("currentHour: " + currentHour);
  console.log("isWithinNewHours: " + isWithinNewHours);
  console.log("currentDay: " + currentDay);
  console.log("isWorkingDay: " + isWorkingDay);

  return isWithinNewHours && isWorkingDay;
}

// Función para generar un código alfabético
async function generateAlphabeticCode(length: number): Promise<string> {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const charactersLength = characters.length;
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

// Flujo adaptado para comercio (Asesor)
const flowAsesor = addKeyword("asesor", { sensitive: false })
  .addAnswer(
    "Recuerda que solo podemos ayudarte si tienes agendado este número como contacto. Aguarda un instante..."
  )
  .addAction(async (ctx, { provider, flowDynamic }) => {
    // Log en la base de datos para la acción de asesor
    databaseLogger.addLog(
      ctx.from,
      acciones.ASESOR // Cambiado de OPERADOR a ASESOR para diferenciar
    );

    const refProvider = await provider.getInstance();

    if (isWithinWorkingHours()) {
      const ID_GROUP = await generateAlphabeticCode(7);
      const groupCreated = await refProvider.groupCreate(`Comercios DATA (${ID_GROUP})`, [
        `${ctx.from}@c.us`,
        `5492644711445@c.us`, // SOPORTE DEPARTAMENTOS CÓDIGOS
      ]);
      
      const addedGroupMessage = "Te hemos agregado a un grupo de WhatsApp con nuestros asesores comerciales, ellos te ayudarán con tus consultas. ¡Muchas Gracias!";

      try {
        const comercio = getComercioData(ctx);
        
        const grouParams = {
          numeroTelefono: ctx.from,
          whatsappId: groupCreated.id,
          groupCode: ID_GROUP,
          comercioCUIT: comercio.cuit
        };
        
        const insertId = await createGroup(grouParams);          
        logger.log('Grupo insertado con éxito, ID:', insertId);
      } catch (error) {
        logger.error('Error insertando Grupo Code:', ID_GROUP + "  > " + (error as Error).stack);
      }

      return flowDynamic([{ body: addedGroupMessage }]);

    } else {
      const outsideWorkingHoursMessage = 'Nuestros horarios de atención de los asesores comerciales es de 08:00 a 21:00 hs de Lunes a Viernes.';
      return flowDynamic([{ body: outsideWorkingHoursMessage }]);
    }

    setComercioData(ctx, {}); // Restablece los datos del comercio si es necesario
  });

export default flowAsesor;
