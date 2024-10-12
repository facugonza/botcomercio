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
  Saldo_Count: number;
  Movimientos_Count: number;
  Prestamo_Count: number;
  Resumen_Count: number;
  Operador_Count: number;
  Promos_Count: number;
  Pagar_Count: number;
  Solicitar_Count: number;
  Requisitos_Count: number;
  No_Cliente_Count: number;
  Registros_Count: number;
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
      FROM messages
      WHERE DATE(fecha_hora) = CURDATE()
      GROUP BY telefono
      ORDER BY message_count DESC;
    `);

    // Consulta de palabras clave
    const [keywordResults] = await connection.query<KeywordCountRow[]>(`
      SELECT 
        SUM(accion = 'NUEVO_COMERCIO_REGISTRADO') AS 'Altas_Count',
        SUM(accion = 'DESCARGAR_LIQUIDACION') AS 'Liquidacion_Count',
        SUM(accion = 'DESCARGAR_RETENCION') AS 'Certificado_Count',
        SUM(accion = 'SOLICITAR_ASESOR') AS 'Asesor_Count',
        SUM(accion = 'VALIDAR_CUPON') AS 'Validar_Cupon_Count',
        SUM(accion = 'PROBLEMA_POS') AS 'POS_Count',
        SUM(accion = 'DESVINCULAR') AS 'Desvincular_Count',
        SUM(accion = 'MENU_NO_COMERCIO') AS 'NOCOMERCIO_Count',
        SUM(accion = 'REQUISITOS') AS 'Requisitos_Count',
        SUM(accion = 'ADHERIR') AS 'ADHERIR_Count',
        SUM(accion = 'MENU_PRINCIPAL') AS 'Home_Count'
      FROM messages
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
    emailContent += '<tr><th>Saldo</th><th>Movimientos</th><th>Prestamo</th><th>Resumen</th><th>Operador</th><th>Promos</th><th>Pagar</th><th>Solicitar</th><th>Requisitos</th><th>No Cliente</th><th>Registros</th><th>Home</th></tr>';

    keywordResults.forEach(keywordRow => {
      emailContent += `<tr><td>${keywordRow.Saldo_Count}</td><td>${keywordRow.Movimientos_Count}</td><td>${keywordRow.Prestamo_Count}</td><td>${keywordRow.Resumen_Count}</td><td>${keywordRow.Operador_Count}</td><td>${keywordRow.Promos_Count}</td><td>${keywordRow.Pagar_Count}</td><td>${keywordRow.Solicitar_Count}</td><td>${keywordRow.Requisitos_Count}</td><td>${keywordRow.No_Cliente_Count}</td><td>${keywordRow.Registros_Count}</td><td>${keywordRow.Home_Count}</td></tr>`;
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
      to: 'facugonza@gmail.com',
      subject: `Cantidad de Personas Atendidas hoy: (${todayDate})`,
      html: emailContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email enviado: ' + info.response);

  } catch (error) {
    console.error('Error enviando el correo:', error);
    //logger.error('Error enviando el correo:', error);
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
