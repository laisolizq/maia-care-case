import { configureApp } from '../src/configure-app.js';
import { ConflictException, type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { EntriesController } from '../src/entries/entries.controller.js';
import { EntriesService } from '../src/entries/entries.service.js';

describe('Entries API (HTTP)', () => {
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

    configureApp(app);

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

  it.each(['2026-02-31', '2026-04-31', '2026-02-29', '2026-10-22T12:00:00Z'])(
    'POST /api/entries should reject invalid calendar date %s',
    async (date) => {
      await request(app.getHttpServer())
        .post('/api/entries')
        .send({
          date,
          wellbeing: 3,
          sleep: 3,
          energy: 3,
          stress: 3,
          symptoms: [],
        })
        .expect(400);

      expect(mockEntriesService.create).not.toHaveBeenCalled();
    },
  );

  it('POST /api/entries should accept a valid leap day', async () => {
    const entry = {
      date: '2024-02-29',
      wellbeing: 3,
      sleep: 3,
      energy: 3,
      stress: 3,
      symptoms: [],
    };
    mockEntriesService.create.mockResolvedValue(entry);

    await request(app.getHttpServer()).post('/api/entries').send(entry).expect(201);
    expect(mockEntriesService.create).toHaveBeenCalledWith(entry);
  });

  it('POST /api/entries should reject client-supplied user identifiers', async () => {
    await request(app.getHttpServer())
      .post('/api/entries')
      .send({
        date: '2026-10-22',
        wellbeing: 3,
        sleep: 3,
        energy: 3,
        stress: 3,
        symptoms: [],
        userId: 'other-user',
      })
      .expect(400);

    expect(mockEntriesService.create).not.toHaveBeenCalled();
  });

  it('POST /api/entries should return an actionable conflict message', async () => {
    mockEntriesService.create.mockRejectedValue(
      new ConflictException('Ya existe un registro para esta fecha; selecciona otra.'),
    );

    const response = await request(app.getHttpServer())
      .post('/api/entries')
      .send({
        date: '2026-10-22',
        wellbeing: 3,
        sleep: 3,
        energy: 3,
        stress: 3,
        symptoms: [],
      })
      .expect(409);

    expect(response.body.message).toBe('Ya existe un registro para esta fecha; selecciona otra.');
  });
});
