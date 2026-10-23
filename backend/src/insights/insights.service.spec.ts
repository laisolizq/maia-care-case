import { BadRequestException, BadGatewayException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { InsightsService } from './insights.service.js';
import { Insight } from './schemas/insight.schema.js';
import { EntriesService } from '../entries/entries.service.js';
import { UsersService } from '../users/users.service.js';
import { GeminiService } from './ai/gemini.service.js';

describe('InsightsService', () => {
  let service: InsightsService;

  const user = {
    _id: new Types.ObjectId(),
  };

  const entriesServiceMock = {
    findLatest: vi.fn(),
  };

  const usersServiceMock = {
    getOrCreateDemoUser: vi.fn(),
  };

  const geminiServiceMock = {
    generateInsight: vi.fn(),
  };

  const insightModelMock = {
    findOne: vi.fn(),
    create: vi.fn(),
    find: vi.fn(),
  };

  beforeEach(async () => {
    vi.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InsightsService,
        {
          provide: getModelToken(Insight.name),
          useValue: insightModelMock,
        },
        {
          provide: EntriesService,
          useValue: entriesServiceMock,
        },
        {
          provide: UsersService,
          useValue: usersServiceMock,
        },
        {
          provide: GeminiService,
          useValue: geminiServiceMock,
        },
      ],
    }).compile();

    service = module.get<InsightsService>(InsightsService);

    usersServiceMock.getOrCreateDemoUser.mockResolvedValue(user);
  });

  it('should reject insight generation with fewer than 3 entries', async () => {
    entriesServiceMock.findLatest.mockResolvedValue([
      { _id: new Types.ObjectId() },
      { _id: new Types.ObjectId() },
    ]);

    await expect(service.generate()).rejects.toThrow(BadRequestException);

    expect(entriesServiceMock.findLatest).toHaveBeenCalledWith(7);
    expect(geminiServiceMock.generateInsight).not.toHaveBeenCalled();
    expect(insightModelMock.create).not.toHaveBeenCalled();
  });

  it('should reuse an existing insight without calling Gemini', async () => {
    const entries = [
      { _id: new Types.ObjectId() },
      { _id: new Types.ObjectId() },
      { _id: new Types.ObjectId() },
    ];

    const existingInsight = {
      _id: new Types.ObjectId(),
      summary: 'Análisis existente',
      patterns: [],
      topicsToDiscuss: [],
    };

    entriesServiceMock.findLatest.mockResolvedValue(entries);

    insightModelMock.findOne.mockReturnValue({
      exec: vi.fn().mockResolvedValue(existingInsight),
    });

    const result = await service.generate();

    expect(result).toEqual(existingInsight);
    expect(geminiServiceMock.generateInsight).not.toHaveBeenCalled();
    expect(insightModelMock.create).not.toHaveBeenCalled();
  });

  it('should generate and save a new insight', async () => {
    const entries = [
      {
        _id: new Types.ObjectId(),
        date: '2026-10-20',
        wellbeing: 3,
        sleep: 2,
        energy: 2,
        stress: 4,
        symptoms: ['Cansancio'],
        notes: '',
      },
      {
        _id: new Types.ObjectId(),
        date: '2026-10-21',
        wellbeing: 4,
        sleep: 3,
        energy: 3,
        stress: 3,
        symptoms: [],
        notes: '',
      },
      {
        _id: new Types.ObjectId(),
        date: '2026-10-22',
        wellbeing: 5,
        sleep: 4,
        energy: 4,
        stress: 2,
        symptoms: [],
        notes: '',
      },
    ];

    const aiResponse = {
      summary: 'El bienestar ha mejorado.',
      patterns: ['La energía ha aumentado.'],
      topicsToDiscuss: [],
    };

    const savedInsight = {
      _id: new Types.ObjectId(),
      userId: user._id,
      entryIds: entries.map((entry) => entry._id),
      ...aiResponse,
    };

    // Simulamos que MongoDB devuelve tres registros.
    entriesServiceMock.findLatest.mockResolvedValue(entries);

    // Simulamos que todavía no existe un insight.
    insightModelMock.findOne.mockReturnValue({
      exec: vi.fn().mockResolvedValue(null),
    });

    // Simulamos la respuesta de Gemini.
    geminiServiceMock.generateInsight.mockResolvedValue(aiResponse);

    // Simulamos que MongoDB guarda el insight.
    insightModelMock.create.mockResolvedValue(savedInsight);

    const result = await service.generate();

    expect(entriesServiceMock.findLatest).toHaveBeenCalledWith(7);

    expect(geminiServiceMock.generateInsight).toHaveBeenCalledOnce();

    expect(insightModelMock.create).toHaveBeenCalledWith({
      userId: user._id,
      entryIds: entries.map((entry) => entry._id),
      entriesKey: entries
        .map((entry) => entry._id.toString())
        .sort()
        .join(','),
      ...aiResponse,
    });

    expect(result).toEqual(savedInsight);
  });

  it('should not save an insight when Gemini fails', async () => {
    const entries = [
      { _id: new Types.ObjectId() },
      { _id: new Types.ObjectId() },
      { _id: new Types.ObjectId() },
    ];

    // Tenemos suficientes registros.
    entriesServiceMock.findLatest.mockResolvedValue(entries);

    // No existe un insight anterior.
    insightModelMock.findOne.mockReturnValue({
      exec: vi.fn().mockResolvedValue(null),
    });

    // Simulamos un error de la API de Gemini.
    geminiServiceMock.generateInsight.mockRejectedValue(new Error('Gemini API unavailable'));

    await expect(service.generate()).rejects.toThrow(BadGatewayException);

    // Comprobamos que no hemos guardado nada.
    expect(insightModelMock.create).not.toHaveBeenCalled();
  });

  it('should generate the same entriesKey regardless of entry order', async () => {
    const idA = new Types.ObjectId();
    const idB = new Types.ObjectId();
    const idC = new Types.ObjectId();

    const entries = [
      {
        _id: idC,
        date: '2026-10-22',
        wellbeing: 4,
        sleep: 3,
        energy: 4,
        stress: 2,
        symptoms: [],
      },
      {
        _id: idA,
        date: '2026-10-20',
        wellbeing: 3,
        sleep: 3,
        energy: 3,
        stress: 3,
        symptoms: [],
      },
      {
        _id: idB,
        date: '2026-10-21',
        wellbeing: 4,
        sleep: 4,
        energy: 4,
        stress: 2,
        symptoms: [],
      },
    ];

    entriesServiceMock.findLatest.mockResolvedValue(entries);

    const existingInsight = {
      _id: new Types.ObjectId(),
      summary: 'Análisis existente',
    };

    insightModelMock.findOne.mockReturnValue({
      exec: vi.fn().mockResolvedValue(existingInsight),
    });

    await service.generate();

    const expectedKey = [idA, idB, idC]
      .map((id) => id.toString())
      .sort()
      .join(',');

    expect(insightModelMock.findOne).toHaveBeenCalledWith({
      userId: user._id,
      entriesKey: expectedKey,
    });

    expect(geminiServiceMock.generateInsight).not.toHaveBeenCalled();
  });

  it('should return the existing insight when a duplicate is created concurrently', async () => {
    const entries = [
      { _id: new Types.ObjectId() },
      { _id: new Types.ObjectId() },
      { _id: new Types.ObjectId() },
    ];

    const existingInsight = {
      _id: new Types.ObjectId(),
      summary: 'Análisis guardado por otra petición',
      patterns: [],
      topicsToDiscuss: [],
    };

    entriesServiceMock.findLatest.mockResolvedValue(entries);

    // Primera consulta: todavía no existe.
    // Segunda consulta: otra petición ya lo ha guardado.
    const findOneExec = vi.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(existingInsight);

    insightModelMock.findOne.mockReturnValue({
      exec: findOneExec,
    });

    geminiServiceMock.generateInsight.mockResolvedValue({
      summary: 'Nuevo análisis',
      patterns: [],
      topicsToDiscuss: [],
    });

    // MongoDB rechaza la creación por el índice único.
    const duplicateError = Object.assign(new Error('E11000 duplicate key error'), { code: 11000 });

    insightModelMock.create.mockRejectedValue(duplicateError);

    const result = await service.generate();

    expect(result).toEqual(existingInsight);

    expect(insightModelMock.findOne).toHaveBeenCalledTimes(2);
    expect(insightModelMock.create).toHaveBeenCalledOnce();
  });

  it('should return the user insights ordered by creation date', async () => {
    const insights = [
      {
        _id: new Types.ObjectId(),
        summary: 'Análisis más reciente',
      },
      {
        _id: new Types.ObjectId(),
        summary: 'Análisis anterior',
      },
    ];

    const execMock = vi.fn().mockResolvedValue(insights);
    const sortMock = vi.fn().mockReturnValue({
      exec: execMock,
    });

    insightModelMock.find.mockReturnValue({
      sort: sortMock,
    });

    const result = await service.findAll();

    expect(insightModelMock.find).toHaveBeenCalledWith({
      userId: user._id,
    });

    expect(sortMock).toHaveBeenCalledWith({
      createdAt: -1,
    });

    expect(result).toEqual(insights);
  });
});
