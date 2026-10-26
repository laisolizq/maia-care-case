import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GeminiService } from './gemini.service.js';
import { GeminiInvalidResponseError } from './gemini-error.js';

// Creamos el mock de la llamada a Gemini.
const { createMock, constructorMock } = vi.hoisted(() => ({
  createMock: vi.fn(),
  constructorMock: vi.fn(),
}));

// Sustituimos el SDK real por una implementación simulada.
vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    constructor(options: unknown) {
      constructorMock(options);
    }

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
      { timeout: 60_000, maxRetries: 0 },
    );
  });

  it('should generate a clearly labelled mock without a model or SDK client', async () => {
    constructorMock.mockClear();
    const config = new ConfigService({ GEMINI_API_KEY: 'MOCK' });
    const getConfig = vi.spyOn(config, 'getOrThrow');
    const mockService = new GeminiService(config);

    const result = await mockService.generateInsight('Registros de prueba');

    expect(mockService.isMock).toBe(true);
    expect(result.summary).toContain('Análisis simulado (MOCK)');
    expect(result.patterns).toEqual(expect.arrayContaining([expect.any(String)]));
    expect(result.topicsToDiscuss).toEqual(expect.arrayContaining([expect.any(String)]));
    expect(getConfig).toHaveBeenCalledExactlyOnceWith('GEMINI_API_KEY');
    expect(constructorMock).not.toHaveBeenCalled();
    expect(createMock).not.toHaveBeenCalled();
  });

  it('should not silently use the mock when the real API rejects a request', async () => {
    const quotaError = Object.assign(new Error('Quota exceeded'), { status: 429 });
    createMock.mockRejectedValue(quotaError);

    expect(service.isMock).toBe(false);
    await expect(service.generateInsight('Registros de prueba')).rejects.toBe(quotaError);
  });

  it('should reject an empty Gemini response', async () => {
    createMock.mockResolvedValue({
      output_text: '',
    });

    await expect(service.generateInsight('Analiza estos registros')).rejects.toThrow(
      'Gemini returned an empty response',
    );
  });

  it('should discard unexpected fields from the provider response', async () => {
    createMock.mockResolvedValue({
      output_text: JSON.stringify({
        summary: 'Resumen orientativo.',
        patterns: [],
        topicsToDiscuss: [],
        userId: 'unexpected-user',
        entryIds: ['unexpected-entry'],
        entriesKey: 'unexpected-key',
      }),
    });

    await expect(service.generateInsight('Analiza estos registros')).resolves.toEqual({
      summary: 'Resumen orientativo.',
      patterns: [],
      topicsToDiscuss: [],
    });
  });

  it('should reject malformed JSON', async () => {
    createMock.mockResolvedValue({
      output_text: '{ invalid json }',
    });

    await expect(service.generateInsight('Analiza estos registros')).rejects.toThrow(
      GeminiInvalidResponseError,
    );
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
