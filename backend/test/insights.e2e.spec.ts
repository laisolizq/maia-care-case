import { configureApp } from '../src/configure-app.js';
import { BadGatewayException, BadRequestException, type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { InsightsController } from '../src/insights/insights.controller.js';
import { InsightsService } from '../src/insights/insights.service.js';

describe('Insights API (HTTP)', () => {
  let app: INestApplication;

  const mockInsightsService = {
    findAll: vi.fn(),
    generate: vi.fn(),
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [InsightsController],
      providers: [
        {
          provide: InsightsService,
          useValue: mockInsightsService,
        },
      ],
    }).compile();

    app = module.createNestApplication();

    configureApp(app);

    await app.init();
  });

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/insights', () => {
    it('should return the insight history', async () => {
      const insights = [
        {
          _id: 'insight-1',
          summary: 'Primer análisis',
          patterns: ['Mejora del descanso'],
          topicsToDiscuss: [],
        },
        {
          _id: 'insight-2',
          summary: 'Segundo análisis',
          patterns: [],
          topicsToDiscuss: [],
        },
      ];

      mockInsightsService.findAll.mockResolvedValue(insights);

      const response = await request(app.getHttpServer()).get('/api/insights').expect(200);

      expect(response.body).toEqual(insights);
      expect(mockInsightsService.findAll).toHaveBeenCalledOnce();
    });
  });

  describe('POST /api/insights', () => {
    it('should return a generated insight', async () => {
      const insight = {
        _id: 'insight-1',
        summary: 'El bienestar ha mejorado.',
        patterns: ['La energía ha aumentado.'],
        topicsToDiscuss: [],
      };

      mockInsightsService.generate.mockResolvedValue(insight);

      const response = await request(app.getHttpServer()).post('/api/insights').expect(201);

      expect(response.body).toEqual(insight);
      expect(mockInsightsService.generate).toHaveBeenCalledOnce();
    });

    it('should return 400 when there are fewer than 3 entries', async () => {
      mockInsightsService.generate.mockRejectedValue(
        new BadRequestException('Necesitas al menos 3 registros para generar un insight'),
      );

      const response = await request(app.getHttpServer()).post('/api/insights').expect(400);

      expect(response.body).toEqual({
        message: 'Necesitas al menos 3 registros para generar un insight',
        error: 'Bad Request',
        statusCode: 400,
      });

      expect(mockInsightsService.generate).toHaveBeenCalledOnce();
    });

    it('should return 502 when Gemini fails', async () => {
      mockInsightsService.generate.mockRejectedValue(
        new BadGatewayException('No se ha podido generar el insight con Gemini'),
      );

      const response = await request(app.getHttpServer()).post('/api/insights').expect(502);

      expect(response.body).toEqual({
        message: 'No se ha podido generar el insight con Gemini',
        error: 'Bad Gateway',
        statusCode: 502,
      });

      expect(mockInsightsService.generate).toHaveBeenCalledOnce();
    });
  });
});
