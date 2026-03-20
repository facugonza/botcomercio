import dotenv from 'dotenv';
dotenv.config();

import { createPool, Pool, RowDataPacket } from 'mysql2';
import nodemailer from 'nodemailer';
import schedule from 'node-schedule';

interface MessageCountRow extends RowDataPacket {
  telefono: string;
  message_count: number;
}

interface KeywordCountRow extends RowDataPacket {
  Altas_Count: number;
  Liquidacion_Count: number;
  Certificado_Count: number;
  Asesor_Count: number;
  ValidarCupon_Count: number;
  POS_Count: number;
  Desvincular_Count: number;
  NoComercio_Count: number;
  Adherir_Count: number;
  Home_Count: number;
}

const pool: Pool = createPool({
  host: process.env.MYSQL_DB_HOST ?? 'localhost',
  user: process.env.MYSQL_DB_USER ?? 'root',
  password: process.env.MYSQL_DB_PASSWORD ?? 'password',
  database: process.env.MYSQL_DB_NAME ?? 'databot',
  port: +(process.env.MYSQL_DB_PORT ?? 3306),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

function getFormattedDate(): string {
  const date = new Date();
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

async function sendEmail(): Promise<void> {
  try {
    const connection = pool.promise();

    const [results] = await connection.query<MessageCountRow[]>(`
      SELECT telefono, COUNT(*) AS message_count
      FROM messagescomercio
      WHERE DATE(fecha_hora) = CURDATE()
      GROUP BY telefono
      ORDER BY message_count DESC;
    `);

    const [keywordResults] = await connection.query<KeywordCountRow[]>(`
      SELECT
        SUM(accion = 'NUEVO_COMERCIO_REGISTRADO') AS 'Altas_Count',
        SUM(accion = 'DESCARGAR_LIQUIDACION')      AS 'Liquidacion_Count',
        SUM(accion = 'DESCARGAR_RETENCION')        AS 'Certificado_Count',
        SUM(accion = 'ASESOR')                     AS 'Asesor_Count',
        SUM(accion = 'VALIDAR_CUPON')              AS 'ValidarCupon_Count',
        SUM(accion = 'PROBLEMA_POS')               AS 'POS_Count',
        SUM(accion = 'DESVINCULAR')                AS 'Desvincular_Count',
        SUM(accion = 'MENU_NO_COMERCIO')           AS 'NoComercio_Count',
        SUM(accion = 'ADHERIR')                    AS 'Adherir_Count',
        SUM(accion = 'MENU_PRINCIPAL')             AS 'Home_Count'
      FROM messagescomercio
      WHERE DATE(fecha_hora) = CURDATE()
    `);

    let totalMessages = 0;
    let totalPersonas = 0;

    results.forEach(row => {
      totalMessages += row.message_count;
      totalPersonas++;
    });

    const kw = keywordResults[0];

    let emailContent = '<h3><strong>Resumen Total del día:</strong></h3>';
    emailContent += '<table border="1" cellpadding="5" cellspacing="0">';
    emailContent += '<tr><th>Total de Personas</th><th>Total de Mensajes Procesados</th></tr>';
    emailContent += `<tr><td>${totalPersonas}</td><td>${totalMessages}</td></tr>`;
    emailContent += '</table><hr>';

    emailContent += '<h3><strong>Resumen de acciones del día:</strong></h3>';
    emailContent += '<table border="1" cellpadding="5" cellspacing="0">';
    emailContent += '<tr><th>Altas</th><th>Liquidación</th><th>Certificado</th><th>Asesor</th><th>Validar Cupón</th><th>Problema POS</th><th>Desvincular</th><th>No Comercio</th><th>Adherir</th><th>Home</th></tr>';
    emailContent += `<tr>
      <td>${kw.Altas_Count ?? 0}</td>
      <td>${kw.Liquidacion_Count ?? 0}</td>
      <td>${kw.Certificado_Count ?? 0}</td>
      <td>${kw.Asesor_Count ?? 0}</td>
      <td>${kw.ValidarCupon_Count ?? 0}</td>
      <td>${kw.POS_Count ?? 0}</td>
      <td>${kw.Desvincular_Count ?? 0}</td>
      <td>${kw.NoComercio_Count ?? 0}</td>
      <td>${kw.Adherir_Count ?? 0}</td>
      <td>${kw.Home_Count ?? 0}</td>
    </tr>`;
    emailContent += '</table><hr>';

    emailContent += '<h3><strong>Detalle de números de teléfonos:</strong></h3>';
    emailContent += '<table border="1" cellpadding="5" cellspacing="0">';
    emailContent += '<tr><th>Teléfono</th><th>Cantidad de mensajes</th></tr>';
    results.forEach(row => {
      emailContent += `<tr><td>${row.telefono}</td><td>${row.message_count}</td></tr>`;
    });
    emailContent += '</table>';

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: +(process.env.EMAIL_PORT ?? 587),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      }
    });

    const todayDate = getFormattedDate();
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_TO,
      subject: `DATABOT Comercios — Reporte diario: ${todayDate}`,
      html: emailContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Reporte diario enviado: ' + info.response);

  } catch (error) {
    console.error('Error enviando el reporte diario:', error);
  }
}

const rule = new schedule.RecurrenceRule();
rule.hour = 23;
rule.minute = 59;

if (process.argv[2] === 'run') {
  sendEmail();
  console.log('Reporte enviado manualmente.');
} else {
  schedule.scheduleJob(rule, () => {
    sendEmail();
    console.log('Reporte enviado a las 23:59.');
  });
  console.log('Tarea programada para las 23:59 cada día.');
}
