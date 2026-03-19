import dotenv from 'dotenv';
dotenv.config();

import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger, emailLogger } from '../logger/logger';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

/**
 * Clasifica la intención del usuario en base a las opciones disponibles.
 * @param mensaje - Texto libre escrito por el usuario
 * @param opciones - Lista de opciones válidas (ej: ["LIQUIDACION", "CERTIFICADO", ...])
 * @param descripciones - Descripciones opcionales de cada opción para mejorar la clasificación
 * @returns La opción clasificada en mayúsculas, o null si no se pudo determinar
 */
const classifyIntent = async (
    mensaje: string,
    opciones: string[],
    descripciones?: Record<string, string>
): Promise<string | null> => {
    try {
        const opcionesTexto = opciones.map(op =>
            descripciones?.[op] ? `- ${op}: ${descripciones[op]}` : `- ${op}`
        ).join('\n');

        const prompt = `
Eres ComerBot, un clasificador de intenciones para el asistente virtual de WhatsApp de Tarjeta DATA, una tarjeta de crédito utilizada en San Juan, Argentina.

=== CONTEXTO DEL NEGOCIO ===
- Comercio: negocio adherido a Tarjeta DATA que acepta pagos con esta tarjeta.
- Liquidación: proceso mediante el cual Tarjeta DATA paga al comercio las ventas realizadas, incluyendo montos, comisiones y fechas de acreditación.
- Cupón: comprobante de una venta realizada con Tarjeta DATA que contiene los datos de la transacción.
- POS: dispositivo que usa el comercio para cobrar con tarjeta. Problemas comunes: no conecta, no imprime, error de comunicación.
- Acreditación: momento en que el dinero de las ventas se deposita en la cuenta del comercio.
- Certificado de retención: documento fiscal que detalla las retenciones impositivas aplicadas a las liquidaciones.
- Asesor: persona humana de Tarjeta DATA que puede ayudar con ventas, planes y consultas complejas.
- Desvincular: dar de baja un número de teléfono asociado a un comercio.
- Alta de comercio: proceso de registro de un nuevo comercio en Tarjeta DATA.

=== TAREA ===
El usuario escribió: "${mensaje}"

Clasificá su intención en UNA de estas opciones:
${opcionesTexto}
- OTRO: si el mensaje es un saludo, pregunta genérica o no encaja claramente con ninguna opción

=== REGLAS ESTRICTAS ===
- Usá OTRO para saludos ("hola", "buenas", "buen día") o mensajes sin intención clara
- Considerá español rioplatense, abreviaciones y errores de tipeo (ej: "liqui", "liq", "retencion", "pos", "maquinita")
- Si hay dudas entre dos opciones, elegí la más probable según el contexto del negocio
- Si el mensaje es ambiguo, preferí OTRO antes que forzar una opción incorrecta
- Si el mensaje no tiene ninguna relación con Tarjeta DATA ni con las consultas de un comercio adherido (por ejemplo preguntas sobre clima, deportes, política, otros negocios, etc.), devolvé siempre OTRO con confianza 0.0
- Tu único propósito es clasificar intenciones relacionadas a Tarjeta DATA para comercios. No respondas ni proceses nada fuera de ese contexto
- Respondé SOLO con JSON válido, sin texto antes ni después, sin markdown

Formato: {"intencion": "OPCION", "confianza": 0.0}
`.trim();

        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout Gemini')), 8000)
        );

        const result = await Promise.race([
            model.generateContent(prompt),
            timeoutPromise
        ]) as any;

        const text = result.response.text().trim();

        // Limpiar posibles bloques de markdown que Gemini a veces agrega
        const cleaned = text.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(cleaned);

        const intencion: string = parsed.intencion?.toUpperCase();
        const confianza: number = parsed.confianza ?? 0;

        logger.info(`[aiService] mensaje: "${mensaje}" → intención: ${intencion} (confianza: ${confianza})`);

        if (!intencion || intencion === 'OTRO' || confianza < 0.7) {
            return null;
        }

        if (!opciones.includes(intencion)) {
            return null;
        }

        return intencion;

    } catch (error) {
        logger.error('[aiService] Error al clasificar intención: ' + (error as Error).message);
        emailLogger.error('[aiService] Error al clasificar intención: ' + (error as Error).stack);
        return null;
    }
};

export { classifyIntent };
