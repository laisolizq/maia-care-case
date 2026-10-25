import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';

import { EntriesRepository } from './entries.repository.js';
import { getTodayDate } from '../common/calendar.js';
import type { CreateEntryDto } from './dto/create-entry.dto.js';
import { UsersService } from '../users/users.service.js';

@Injectable()
export class EntriesService {
  constructor(
    private readonly entriesRepository: EntriesRepository,
    private readonly usersService: UsersService,
  ) {}

  // Obtiene todos los registros disponibles en el sistema
  async findAll() {
    const user = await this.usersService.getOrCreateDemoUser();

    if (!user) {
      throw new InternalServerErrorException('Demo user unavailable');
    }

    return this.entriesRepository.findAll(user._id);
  }

  // Crea un nuevo registro, asegurándose de que la fecha no sea futura y manejando posibles conflictos de duplicados
  async create(entry: CreateEntryDto) {
    if (entry.date > getTodayDate()) {
      throw new BadRequestException('No puedes registrar una fecha futura.');
    }

    const user = await this.usersService.getOrCreateDemoUser();

    if (!user) {
      throw new InternalServerErrorException('Demo user unavailable');
    }

    // Intentamos crear el registro y manejamos posibles errores de duplicado
    try {
      return await this.entriesRepository.create({
        date: entry.date,
        wellbeing: entry.wellbeing,
        sleep: entry.sleep,
        energy: entry.energy,
        stress: entry.stress,
        symptoms: entry.symptoms,
        notes: entry.notes,
        userId: user._id,
      });
    } catch (error: unknown) {
      if (error instanceof Error && 'code' in error && error.code === 11000) {
        throw new ConflictException('Ya existe un registro para esta fecha; selecciona otra.');
      }

      throw error;
    }
  }

  // Obtiene todos los síntomas distintos registrados de un usuario específico
  async findSymptoms(): Promise<string[]> {
    const user = await this.usersService.getOrCreateDemoUser();

    if (!user) {
      throw new InternalServerErrorException('Demo user unavailable');
    }

    return this.entriesRepository.findSymptoms(user._id);
  }

  // Obtiene los registros más recientes para un usuario específico, limitando la cantidad de resultados
  async findLatest(limit: number) {
    const user = await this.usersService.getOrCreateDemoUser();

    if (!user) {
      throw new InternalServerErrorException('Demo user unavailable');
    }

    return this.entriesRepository.findLatest(user._id, limit);
  }
}
