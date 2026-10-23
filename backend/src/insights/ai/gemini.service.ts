import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import type { InsightContent } from './insight-content.interface.js';

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

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.getOrThrow<string>('GEMINI_API_KEY');

    this.model = this.configService.getOrThrow<string>('GEMINI_MODEL');

    this.ai = new GoogleGenAI({ apiKey });
  }

  async generateInsight(prompt: string): Promise<InsightContent> {
    const response = await this.ai.interactions.create({
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
    });

    const text = response.output_text;

    if (!text) {
      throw new Error('Gemini returned an empty response');
    }

    const result: unknown = JSON.parse(text);

    if (!isInsightContent(result)) {
      throw new Error('Gemini returned an invalid insight');
    }

    return {
      summary: result.summary,
      patterns: result.patterns,
      topicsToDiscuss: result.topicsToDiscuss,
    };
  }
}
