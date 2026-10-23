import { Test, type TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';

import { EntriesController } from './entries.controller.js';
import { EntriesService } from './entries.service.js';

describe('EntriesController', () => {
  let controller: EntriesController;

  const mockEntriesService = {
    findAll: vi.fn(),
    create: vi.fn(),
    findSymptoms: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EntriesController],
      providers: [
        {
          provide: EntriesService,
          useValue: mockEntriesService,
        },
      ],
    }).compile();

    controller = module.get<EntriesController>(EntriesController);
  });

  describe('findAll', () => {
    it('should return all entries', async () => {
      const entries = [
        { id: '1', wellbeing: 4 },
        { id: '2', wellbeing: 3 },
      ];

      mockEntriesService.findAll.mockResolvedValue(entries);

      const result = await controller.findAll();

      expect(result).toEqual(entries);
      expect(mockEntriesService.findAll).toHaveBeenCalledOnce();
    });
  });

  describe('create', () => {
    it('should create an entry', async () => {
      const entry = {
        date: '2026-10-21',
        wellbeing: 4,
        sleep: 3,
        energy: 4,
        stress: 2,
        symptoms: [],
      };

      const savedEntry = {
        ...entry,
        _id: 'mongo-id-123',
      };

      mockEntriesService.create.mockResolvedValue(savedEntry);

      const result = await controller.create(entry);

      expect(result).toEqual(savedEntry);
      expect(mockEntriesService.create).toHaveBeenCalledWith(entry);
    });
  });

  describe('findSymptoms', () => {
    it('should return the user symptoms', async () => {
      const symptoms = ['Cansancio', 'Dolor de cabeza', 'Insomnio'];

      mockEntriesService.findSymptoms.mockResolvedValue(symptoms);

      const result = await controller.findSymptoms();

      expect(result).toEqual(symptoms);
      expect(mockEntriesService.findSymptoms).toHaveBeenCalledOnce();
    });
  });
});
