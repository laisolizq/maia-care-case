import { Test, type TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { vi } from 'vitest';

import { EntriesService } from './entries.service.js';
import { Entry } from './schemas/entry.schema.js';
import { UsersService } from '../users/users.service.js';

describe('EntriesService', () => {
  let service: EntriesService;

  const demoUserId = new Types.ObjectId();

  const mockEntryModel = {
    find: vi.fn(),
    create: vi.fn(),
  };

  const mockUsersService = {
    getOrCreateDemoUser: vi.fn(),
  };

  beforeEach(async () => {
    vi.resetAllMocks();

    mockUsersService.getOrCreateDemoUser.mockResolvedValue({
      _id: demoUserId,
      username: 'demo',
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EntriesService,
        {
          provide: getModelToken(Entry.name),
          useValue: mockEntryModel,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    service = module.get<EntriesService>(EntriesService);
  });

  describe('findAll', () => {
    it('should return entries belonging to the demo user', async () => {
      const entries = [
        { wellbeing: 4, energy: 3 },
        { wellbeing: 2, energy: 2 },
      ];

      mockEntryModel.find.mockReturnValue({
        exec: vi.fn().mockResolvedValue(entries),
      });

      const result = await service.findAll();

      expect(result).toEqual(entries);
      expect(mockEntryModel.find).toHaveBeenCalledWith({
        userId: demoUserId,
      });
    });
  });

  describe('create', () => {
    it('should create an entry associated with the demo user', async () => {
      const entry = {
        date: '2026-10-22',
        wellbeing: 4,
        sleep: 3,
        energy: 4,
        stress: 2,
        symptoms: [],
      };

      const savedEntry = {
        ...entry,
        _id: new Types.ObjectId(),
        userId: demoUserId,
      };

      mockEntryModel.create.mockResolvedValue(savedEntry);

      const result = await service.create(entry);

      expect(result).toEqual(savedEntry);
      expect(mockEntryModel.create).toHaveBeenCalledWith({
        ...entry,
        userId: demoUserId,
      });
    });
  });
});
