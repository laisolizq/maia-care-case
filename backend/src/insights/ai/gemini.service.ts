import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import type { InsightContent } from './insight-content.interface.js';
import { GeminiInvalidResponseError } from './gemini-error.js';

function isInsightContent(value: unknown): value is InsightContent {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const data = value as Record<string, unknown>;

  return (
    typeof data.summary === 'string' &&
    data.summary.trim().length > 0 &&
    Array.isArray(data.patterns) &&
    data.patterns.every((item: unknown) => typeof item === 'string') &&
    Array.isArray(data.topicsToDiscuss) &&
    data.topicsToDiscuss.every((item: unknown) => typeof item === 'string')
  );
}

@Injectable()
export class GeminiService {
  private readonly ai: GoogleGenAI;
  private readonly model: string;

  // Inyectamos el servicio de configuración para obtener las credenciales y configuraciones necesarias
  constructor(private readonly configService: ConfigService) {
    // Obtenemos la clave de API de Gemini desde las variables de entorno
    const apiKey = this.configService.getOrThrow<string>('GEMINI_API_KEY');
    // Obtenemos el modelo de Gemini desde las variables de entorno
    this.model = this.configService.getOrThrow<string>('GEMINI_MODEL');
    // Inicializamos el cliente de Gemini con la clave de API
    this.ai = new GoogleGenAI({ apiKey });
  }

  // Este método genera un insight utilizando el modelo de Gemini basado en el prompt proporcionado
  async generateInsight(prompt: string): Promise<InsightContent> {
    const response = await this.ai.interactions.create(
      {
        model: this.model,
        input: prompt,
        response_format: {
          type: 'text',
          mime_type: 'application/json',
          schema: {
            type: 'object',
            properties: {
              summary: {
                type: 'string',
              },
              patterns: {
                type: 'array',
                items: { type: 'string' },
              },
              topicsToDiscuss: {
                type: 'array',
                items: { type: 'string' },
              },
            },
            required: ['summary', 'patterns', 'topicsToDiscuss'],
          },
        },
      },
      { timeout: 60_000, maxRetries: 0 },
    );

    // Verificamos si la respuesta de Gemini contiene texto; si no, lanzamos un error
    const text = response.output_text;

    if (!text) {
      throw new GeminiInvalidResponseError('Gemini returned an empty response');
    }

    let result: unknown;
    // Intentamos parsear la respuesta de Gemini como JSON; si falla, lanzamos un error
    try {
      result = JSON.parse(text);
    } catch {
      throw new GeminiInvalidResponseError('Gemini returned malformed JSON');
    }

    // Verificamos si el resultado parseado cumple con la estructura esperada de InsightContent; si no, lanzamos un error
    if (!isInsightContent(result)) {
      throw new GeminiInvalidResponseError('Gemini returned an invalid insight');
    }

    return {
      summary: result.summary,
      patterns: result.patterns,
      topicsToDiscuss: result.topicsToDiscuss,
    };
  }
}
