import { Test, type TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { vi } from 'vitest';

import { InsightsController } from './insights.controller.js';
import { InsightsService } from './insights.service.js';

describe('InsightsController', () => {
  let controller: InsightsController;

  const mockInsightsService = {
    findAll: vi.fn(),
    generate: vi.fn(),
  };

  beforeEach(async () => {
    vi.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [InsightsController],
      providers: [
        {
          provide: InsightsService,
          useValue: mockInsightsService,
        },
      ],
    }).compile();

    controller = module.get<InsightsController>(InsightsController);
  });

  describe('findAll', () => {
    it('should return all insights from the service', async () => {
      const insights = [
        {
          _id: new Types.ObjectId(),
          summary: 'Primer análisis',
          patterns: ['Mejora del descanso'],
          topicsToDiscuss: [],
        },
        {
          _id: new Types.ObjectId(),
          summary: 'Segundo análisis',
          patterns: [],
          topicsToDiscuss: [],
        },
      ];

      mockInsightsService.findAll.mockResolvedValue(insights);

      const result = await controller.findAll();

      expect(mockInsightsService.findAll).toHaveBeenCalledOnce();
      expect(result).toEqual(insights);
    });
  });

  describe('generate', () => {
    it('should return the generated insight from the service', async () => {
      const insight = {
        _id: new Types.ObjectId(),
        summary: 'El bienestar ha mejorado.',
        patterns: ['La energía ha aumentado.'],
        topicsToDiscuss: [],
      };

      mockInsightsService.generate.mockResolvedValue(insight);

      const result = await controller.generate();

      expect(mockInsightsService.generate).toHaveBeenCalledOnce();
      expect(result).toEqual(insight);
    });
  });
});
