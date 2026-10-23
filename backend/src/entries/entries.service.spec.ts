import { Test, type TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { vi, afterEach } from 'vitest';
import { BadRequestException, ConflictException } from '@nestjs/common';

import { EntriesService } from './entries.service.js';
import { EntriesRepository } from './entries.repository.js';
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
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-23T12:00:00Z'));

    mockUsersService.getOrCreateDemoUser.mockResolvedValue({
      _id: demoUserId,
      username: 'demo',
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EntriesService,
        EntriesRepository,
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

  afterEach(() => vi.useRealTimers());

  describe('findAll', () => {
    it('should return entries belonging to the demo user', async () => {
      const entries = [
        { wellbeing: 4, energy: 3 },
        { wellbeing: 2, energy: 2 },
      ];

      mockEntryModel.find.mockReturnValue({
        sort: vi.fn().mockReturnValue({ exec: vi.fn().mockResolvedValue(entries) }),
      });

      const result = await service.findAll();

      expect(result).toEqual(entries);
      expect(mockEntryModel.find).toHaveBeenCalledWith({
        userId: demoUserId,
      });
    });
  });

  describe('create', () => {
    it('should reject future dates before accessing persistence', async () => {
      await expect(
        service.create({
          date: '2026-10-24',
          wellbeing: 3,
          sleep: 3,
          energy: 3,
          stress: 3,
          symptoms: [],
        }),
      ).rejects.toThrow(BadRequestException);

      expect(mockEntryModel.create).not.toHaveBeenCalled();
      expect(mockUsersService.getOrCreateDemoUser).not.toHaveBeenCalled();
    });

    it('should accept today in Madrid even when UTC is still the previous day', async () => {
      vi.setSystemTime(new Date('2026-10-22T22:30:00Z'));
      const entry = {
        date: '2026-10-23',
        wellbeing: 3,
        sleep: 3,
        energy: 3,
        stress: 3,
        symptoms: [],
      };
      mockEntryModel.create.mockResolvedValue({ ...entry, userId: demoUserId });

      await service.create(entry);

      expect(mockEntryModel.create).toHaveBeenCalledOnce();
    });

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

    it('should throw ConflictException when creating a duplicate entry', async () => {
      const duplicateError = Object.assign(new Error('E11000 duplicate key error'), {
        code: 11000,
      });

      mockEntryModel.create.mockRejectedValue(duplicateError);

      await expect(
        service.create({
          date: '2026-10-22',
          wellbeing: 4,
          sleep: 3,
          energy: 4,
          stress: 2,
          symptoms: [],
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findLatest', () => {
    it('should retrieve the latest entries ordered by date', async () => {
      const entries = [
        { _id: new Types.ObjectId(), date: '2026-10-22' },
        { _id: new Types.ObjectId(), date: '2026-10-21' },
      ];

      const execMock = vi.fn().mockResolvedValue(entries);

      const limitMock = vi.fn().mockReturnValue({
        exec: execMock,
      });

      const sortMock = vi.fn().mockReturnValue({
        limit: limitMock,
      });

      mockEntryModel.find.mockReturnValue({
        sort: sortMock,
      });

      const result = await service.findLatest(7);

      expect(mockEntryModel.find).toHaveBeenCalledWith({
        userId: demoUserId,
      });

      expect(sortMock).toHaveBeenCalledWith({
        date: -1,
      });

      expect(limitMock).toHaveBeenCalledWith(7);

      expect(result).toEqual(entries);
    });
  });
});
