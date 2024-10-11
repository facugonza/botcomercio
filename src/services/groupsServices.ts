import mysql, { Pool } from 'mysql2/promise';

// Configuración de la conexión a la base de datos utilizando un pool de conexiones
const pool: Pool = mysql.createPool({
  host: process.env.MYSQL_DB_HOST || 'localhost',
  user: process.env.MYSQL_DB_USER || 'root',
  password: process.env.MYSQL_DB_PASSWORD || 'password',
  database: process.env.MYSQL_DB_NAME || 'databot',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Función para crear un grupo y almacenar la información en la base de datos
const createGroup = async (comercioTelefono: string, whatsappGroupId: string, groupCode: string): Promise<number> => {
  const query = `INSERT INTO grupos (COMERCIOTELEFONO, WHATSAPPGROUPID, GROUPCODE) VALUES (?, ?, ?)`;

  try {
    const [results] = await pool.execute(query, [comercioTelefono, whatsappGroupId, groupCode]);
    console.log('Grupo insertado, ID:', (results as any).insertId);
    return (results as any).insertId;
  } catch (error) {
    console.error('Error al insertar grupo:', error);
    throw error;
  }
};

// Función para cerrar la conexión del pool
const closeConnection = async () => {
  try {
    await pool.end();
    console.log('Conexión al pool de base de datos cerrada.');
  } catch (error) {
    console.error('Error al cerrar la conexión del pool:', error);
  }
};

export { createGroup, closeConnection };
