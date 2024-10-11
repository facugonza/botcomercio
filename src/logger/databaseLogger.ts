import mysql, { Pool } from 'mysql2';
import { logger } from '../logger/logger';

// Configuración de la conexión de la base de datos
const pool: Pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'password', // Asegúrate de usar variables de entorno en un entorno de producción para la seguridad
  database: 'databot',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Función para agregar un registro de log en la base de datos
function addLog(telefono: string, accion: string): void {
  try {
    const sql = `INSERT INTO messagescomercio (telefono, accion) VALUES (?, ?)`;
    const params: [string, string] = [telefono, accion];

    pool.execute(sql, params, (error, results) => {
      if (error) {
        logger.error('Error al insertar en la base de datos', error);
        return;
      }
      
      // Asegúrate de que `results` se interpreta correctamente como `ResultSetHeader`
      const result = results as mysql.ResultSetHeader;
      logger.info(`Registro insertado: >${telefono}< / ${accion} : # ${result.insertId}`);
    });
  } catch (error) {
    logger.error('Error inesperado al intentar agregar un registro de log:', (error as Error).message);
  }
}

export default { addLog };