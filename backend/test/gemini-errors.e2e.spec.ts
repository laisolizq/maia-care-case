import { Logger, type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Types } from 'mongoose';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { configureApp } from '../src/configure-app.js';
import { EntriesService } from '../src/entries/entries.service.js';
import { UsersService } from '../src/users/users.service.js';
import { GeminiInvalidResponseError } from '../src/insights/ai/gemini-error.js';
import { GeminiService } from '../src/insights/ai/gemini.service.js';
import { InsightsController } from '../src/insights/insights.controller.js';
import { InsightsRepository } from '../src/insights/insights.repository.js';
import { InsightsService } from '../src/insights/insights.service.js';

describe('Gemini error handling (HTTP)', () => {
  let app: INestApplication;
  const generateInsight = vi.fn();
  const create = vi.fn();
  const logWarning = vi.fn();
  const sensitiveMessage = 'private-api-key private-wellbeing-notes';

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [InsightsController],
      providers: [
        InsightsService,
        { provide: GeminiService, useValue: { generateInsight } },
        {
          provide: UsersService,
          useValue: { getOrCreateDemoUser: async () => ({ _id: new Types.ObjectId() }) },
        },
        {
          provide: EntriesService,
          useValue: {
            findLatest: async () =>
              Array.from({ length: 3 }, () => ({ _id: new Types.ObjectId() })),
          },
        },
        {
          provide: InsightsRepository,
          useValue: { findByEntriesKey: async () => null, create },
        },
      ],
    }).compile();
    app = module.createNestApplication();
    configureApp(app);
    await app.init();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(Logger.prototype, 'warn').mockImplementation(logWarning);
  });

  afterAll(async () => {
    vi.restoreAllMocks();
    await app.close();
  });

  it.each([
    [{ status: 429 }, 429, 'GEMINI_RATE_LIMITED'],
    [{ statusCode: 429 }, 429, 'GEMINI_RATE_LIMITED'],
    [{ status: 401 }, 503, 'GEMINI_ACCESS_DENIED'],
    [{ status: 403 }, 503, 'GEMINI_ACCESS_DENIED'],
    [{ status: 404 }, 503, 'GEMINI_MODEL_UNAVAILABLE'],
    [{ status: 400 }, 503, 'GEMINI_REQUEST_REJECTED'],
    [{ status: 422 }, 503, 'GEMINI_REQUEST_REJECTED'],
    [{ status: 408 }, 504, 'GEMINI_TIMEOUT'],
    [{ status: 504 }, 504, 'GEMINI_TIMEOUT'],
    [{ name: 'APIConnectionTimeoutError' }, 504, 'GEMINI_TIMEOUT'],
    [{ name: 'TimeoutError' }, 504, 'GEMINI_TIMEOUT'],
    [{ cause: { code: 'ETIMEDOUT' } }, 504, 'GEMINI_TIMEOUT'],
    [{ status: 500 }, 503, 'GEMINI_UNAVAILABLE'],
    [{ status: 503 }, 503, 'GEMINI_UNAVAILABLE'],
    [{ name: 'APIConnectionError' }, 503, 'GEMINI_UNAVAILABLE'],
    [{ cause: { code: 'ECONNRESET' } }, 503, 'GEMINI_UNAVAILABLE'],
    [new GeminiInvalidResponseError(), 502, 'GEMINI_INVALID_RESPONSE'],
    [new Error(), 502, 'GEMINI_GENERATION_FAILED'],
  ])('maps provider error %j to HTTP %i (%s)', async (providerError, status, code) => {
    generateInsight.mockRejectedValue(Object.assign(providerError, { message: sensitiveMessage }));

    const response = await request(app.getHttpServer()).post('/api/insights').expect(status);

    expect(response.body).toEqual({ statusCode: status, code, message: expect.any(String) });
    expect(response.body.message.length).toBeGreaterThan(20);
    expect(JSON.stringify(response.body)).not.toContain(sensitiveMessage);
    expect(JSON.stringify(logWarning.mock.calls)).not.toContain(
      sensitiveMessage,
    );
    expect(generateInsight).toHaveBeenCalledOnce();
    expect(create).not.toHaveBeenCalled();
  });

  it.each([null, undefined, 'unexpected error'])(
    'handles non-Error rejections: %j',
    async (error) => {
      generateInsight.mockRejectedValue(error);
      const response = await request(app.getHttpServer()).post('/api/insights').expect(502);
      expect(response.body.code).toBe('GEMINI_GENERATION_FAILED');
      expect(create).not.toHaveBeenCalled();
    },
  );
});
