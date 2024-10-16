// Cambiar todas las importaciones de `import` a `require()`
import { createPool, Pool, RowDataPacket, ResultSetHeader } from 'mysql2';
import nodemailer from 'nodemailer';
import schedule from 'node-schedule';

// Definir un tipo para los resultados de la consulta de mensajes
interface MessageCountRow extends RowDataPacket {
  telefono: string;
  message_count: number;
}

// Definir un tipo para los resultados de la consulta de palabras clave
interface KeywordCountRow extends RowDataPacket {
  Altas_Count: number;
  Liquidacion_Count: number;
  Certificado_Count: number;
  Asesor_Count: number;
  Validar_Cupon_Count: number;
  POS_Count: number;
  Desvincular_Count: number;
  NOCOMERCIO_Count: number;
  Requisitos_Count: number;
  ADHERIR_Count: number;
  Home_Count: number;
}

// Configuración de la conexión de la base de datos
const pool: Pool = createPool({
  host: 'localhost',
  user: 'root',
  password: 'password', // Cambia a variables de entorno en producción
  database: 'databot',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Función para obtener la fecha formateada
function getFormattedDate(): string {
  const date = new Date();
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

// Función para enviar el correo electrónico
async function sendEmail(): Promise<void> {
  try {
    const connection = pool.promise();

    // Consulta de mensajes por teléfono
    const [results] = await connection.query<MessageCountRow[]>(`
      SELECT telefono, COUNT(*) AS message_count
      FROM messagescomercio
      WHERE DATE(fecha_hora) = CURDATE()
      GROUP BY telefono
      ORDER BY message_count DESC;
    `);

    // Consulta de palabras clave
    const [keywordResults] = await connection.query<KeywordCountRow[]>(`
      SELECT 
      IFNULL(SUM(accion = 'NUEVO_COMERCIO_REGISTRADO'), 0) AS 'Altas_Count',
      IFNULL(SUM(accion = 'DESCARGAR_LIQUIDACION'), 0) AS 'Liquidacion_Count',
      IFNULL(SUM(accion = 'DESCARGAR_RETENCION'), 0) AS 'Certificado_Count',
      IFNULL(SUM(accion = 'SOLICITAR_ASESOR'), 0) AS 'Asesor_Count',
      IFNULL(SUM(accion = 'VALIDAR_CUPON'), 0) AS 'Validar_Cupon_Count',
      IFNULL(SUM(accion = 'PROBLEMA_POS'), 0) AS 'POS_Count',
      IFNULL(SUM(accion = 'DESVINCULAR'), 0) AS 'Desvincular_Count',
      IFNULL(SUM(accion = 'MENU_NO_COMERCIO'), 0) AS 'NOCOMERCIO_Count',
      IFNULL(SUM(accion = 'REQUISITOS'), 0) AS 'Requisitos_Count',
      IFNULL(SUM(accion = 'ADHERIR'), 0) AS 'ADHERIR_Count',
      IFNULL(SUM(accion = 'MENU_PRINCIPAL'), 0) AS 'Home_Count'
      FROM messagescomercio
      WHERE DATE(fecha_hora) = CURDATE()
    `);

    let totalMessages = 0;
    let totalPersonas = 0;

    // Generación del contenido del correo
    let emailContent = '<h3><strong>Resumen Total:</strong></h3>';
    emailContent += '<table border="1" cellpadding="5" cellspacing="0">';
    emailContent += '<tr><th>Total de Personas</th><th>Total de Mensajes Procesados</th></tr>';

    results.forEach(row => {
      totalMessages += row.message_count;
      totalPersonas++;
    });

    emailContent += `<tr><td>${totalPersonas}</td><td>${totalMessages}</td></tr>`;
    emailContent += '</table>';
    emailContent += '<hr><hr>';

    emailContent += '<h3>Resumen de palabras clave para el día actual:</strong></h3>';
    emailContent += '<table border="1" cellpadding="5" cellspacing="0">';
    emailContent += '<tr><th>NuevoComercio</th><th>Liquidacion</th><th>Retencion</th><th>Asesor</th><th>Cupon</th><th>POS</th><th>Desvincular</th><th>NOComercio</th><th>Requisitos</th><th>Adherir</th><th>Home</th></tr>';

    keywordResults.forEach(keywordRow => {
      emailContent += `<tr><td>${keywordRow.Altas_Count}</td><td>${keywordRow.Liquidacion_Count}</td><td>${keywordRow.Certificado_Count}</td><td>${keywordRow.Asesor_Count}</td><td>${keywordRow.Validar_Cupon_Count}</td><td>${keywordRow.POS_Count}</td><td>${keywordRow.Desvincular_Count}</td><td>${keywordRow.NOCOMERCIO_Count}</td><td>${keywordRow.Requisitos_Count}</td><td>${keywordRow.ADHERIR_Count}</td><td>${keywordRow.Home_Count}</td></tr>`;
    });

    emailContent += '</table>';
    emailContent += '<h3>Detalle de números de teléfonos:</strong></h3>';
    emailContent += '<table border="1" cellpadding="5" cellspacing="0">';
    emailContent += '<tr><th>Teléfono</th><th>Cantidad de mensajes</th></tr>';

    results.forEach(row => {
      emailContent += `<tr><td>${row.telefono}</td><td>${row.message_count}</td></tr>`;
    });

    emailContent += '</table>';

    const transporter = nodemailer.createTransport({
      host: 'sd-1973625-l.dattaweb.com',
      port: 587,
      secure: false,
      auth: {
        user: 'facundogonzalez@tarjetadata.com.ar',
        pass: 'Facundo2000@*', // Usa variables de entorno en producción
      }
    });

    const todayDate = getFormattedDate();
    const mailOptions = {
      from: 'facundogonzalez@tarjetadata.com.ar',
      to: 'angelachacongonzalez@gmail.com',
      subject: `Cantidad de Personas Atendidas hoy: (${todayDate})`,
      html: emailContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email enviado: ' + info.response);

  } catch (error) {
    console.error('Error enviando el correo:', error);
  }
}

// Configuración de la tarea programada
const rule = new schedule.RecurrenceRule();
rule.hour = 23;
rule.minute = 59;

if (process.argv[2] === 'run') {
  sendEmail();
  console.log('Email enviado manualmente.');
} else {
  const job = schedule.scheduleJob(rule, () => {
    sendEmail();
    console.log('Correo enviado a las 23:59.');
  });
  console.log('Tarea programada para las 23:59 cada día.');
}
