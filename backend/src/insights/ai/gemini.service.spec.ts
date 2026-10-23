import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GeminiService } from './gemini.service.js';

// Creamos el mock de la llamada a Gemini.
const { createMock } = vi.hoisted(() => ({
  createMock: vi.fn(),
}));

// Sustituimos el SDK real por una implementación simulada.
vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    interactions = {
      create: createMock,
    };
  },
}));

describe('GeminiService', () => {
  let service: GeminiService;

  beforeEach(async () => {
    vi.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeminiService,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: vi.fn((key: string) => {
              if (key === 'GEMINI_API_KEY') {
                return 'fake-api-key';
              }

              if (key === 'GEMINI_MODEL') {
                return 'fake-model';
              }

              throw new Error(`Missing configuration: ${key}`);
            }),
          },
        },
      ],
    }).compile();

    service = module.get<GeminiService>(GeminiService);
  });

  it('should return a valid insight from Gemini', async () => {
    const aiResponse = {
      summary: 'El bienestar ha mejorado.',
      patterns: ['La energía ha aumentado en los últimos registros.'],
      topicsToDiscuss: ['Comentar el cansancio recurrente con un profesional.'],
    };

    createMock.mockResolvedValue({
      output_text: JSON.stringify(aiResponse),
    });

    const result = await service.generateInsight('Analiza estos registros');

    expect(result).toEqual(aiResponse);

    expect(createMock).toHaveBeenCalledOnce();

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'fake-model',
        input: 'Analiza estos registros',
      }),
    );
  });

  it('should reject an empty Gemini response', async () => {
    createMock.mockResolvedValue({
      output_text: '',
    });

    await expect(service.generateInsight('Analiza estos registros')).rejects.toThrow(
      'Gemini returned an empty response',
    );
  });

  it('should reject malformed JSON', async () => {
    createMock.mockResolvedValue({
      output_text: '{ invalid json }',
    });

    await expect(service.generateInsight('Analiza estos registros')).rejects.toThrow(SyntaxError);
  });

  it('should reject an insight without summary', async () => {
    createMock.mockResolvedValue({
      output_text: JSON.stringify({
        patterns: ['Mejora del descanso'],
        topicsToDiscuss: [],
      }),
    });

    await expect(service.generateInsight('Analiza estos registros')).rejects.toThrow(
      'Gemini returned an invalid insight',
    );
  });

  it('should reject an insight with invalid patterns', async () => {
    createMock.mockResolvedValue({
      output_text: JSON.stringify({
        summary: 'El bienestar ha mejorado.',
        patterns: 'La energía ha aumentado.',
        topicsToDiscuss: [],
      }),
    });

    await expect(service.generateInsight('Analiza estos registros')).rejects.toThrow(
      'Gemini returned an invalid insight',
    );
  });

  it('should reject an insight with an empty summary', async () => {
    createMock.mockResolvedValue({
      output_text: JSON.stringify({
        summary: '   ',
        patterns: [],
        topicsToDiscuss: [],
      }),
    });

    await expect(service.generateInsight('Analiza estos registros')).rejects.toThrow(
      'Gemini returned an invalid insight',
    );
  });

  it('should propagate Gemini API errors', async () => {
    createMock.mockRejectedValue(new Error('Gemini API unavailable'));

    await expect(service.generateInsight('Analiza estos registros')).rejects.toThrow(
      'Gemini API unavailable',
    );
  });
});
