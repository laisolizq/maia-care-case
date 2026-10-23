import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { EntriesController } from '../src/entries/entries.controller.js';
import { EntriesService } from '../src/entries/entries.service.js';

describe('Entries API (E2E)', () => {
  let app: INestApplication;

  const mockEntriesService = {
    findAll: vi.fn(),
    create: vi.fn(),
    findSymptoms: vi.fn(),
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [EntriesController],
      providers: [
        {
          provide: EntriesService,
          useValue: mockEntriesService,
        },
      ],
    }).compile();

    app = module.createNestApplication();

    app.setGlobalPrefix('api');

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/entries should return entries', async () => {
    const entries = [
      { _id: '1', wellbeing: 4 },
      { _id: '2', wellbeing: 3 },
    ];

    mockEntriesService.findAll.mockResolvedValue(entries);

    const response = await request(app.getHttpServer()).get('/api/entries').expect(200);

    expect(response.body).toEqual(entries);
    expect(mockEntriesService.findAll).toHaveBeenCalledOnce();
  });

  it('POST /api/entries should create an entry', async () => {
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
      _id: 'mongo-id-123',
    };

    mockEntriesService.create.mockResolvedValue(savedEntry);

    const response = await request(app.getHttpServer())
      .post('/api/entries')
      .send(entry)
      .expect(201);

    expect(response.body).toEqual(savedEntry);
    expect(mockEntriesService.create).toHaveBeenCalledWith(entry);
  });

  it('POST /api/entries should reject invalid ratings', async () => {
    const invalidEntry = {
      date: '2026-10-22',
      wellbeing: 8,
      sleep: 3,
      energy: 4,
      stress: 2,
      symptoms: [],
    };

    const response = await request(app.getHttpServer())
      .post('/api/entries')
      .send(invalidEntry)
      .expect(400);

    expect(response.body.statusCode).toBe(400);
    expect(mockEntriesService.create).not.toHaveBeenCalled();
  });
});
