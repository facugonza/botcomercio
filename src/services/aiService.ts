import dotenv from 'dotenv';
dotenv.config();

import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger, emailLogger } from '../logger/logger';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

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
Eres un asistente virtual de Tarjeta DATA Argentina que ayuda a comercios afiliados.
Un comercio te escribió el siguiente mensaje: "${mensaje}"

Tu tarea es clasificar su intención en UNA de estas opciones:
${opcionesTexto}
- OTRO: si el mensaje no se relaciona claramente con ninguna opción

Reglas:
- Considerá el español rioplatense, errores de tipeo y abreviaciones
- Si hay dudas entre dos opciones, elegí la más probable
- Respondé ÚNICAMENTE con un JSON válido, sin texto adicional

Formato de respuesta: {"intencion": "OPCION", "confianza": 0.0}
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

        if (!intencion || intencion === 'OTRO' || confianza < 0.6) {
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
