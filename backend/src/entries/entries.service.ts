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

  async findAll() {
    const user = await this.usersService.getOrCreateDemoUser();

    if (!user) {
      throw new InternalServerErrorException('Demo user unavailable');
    }

    return this.entriesRepository.findAll(user._id);
  }

  async create(entry: CreateEntryDto) {
    if (entry.date > getTodayDate()) {
      throw new BadRequestException('No puedes registrar una fecha futura.');
    }

    const user = await this.usersService.getOrCreateDemoUser();

    if (!user) {
      throw new InternalServerErrorException('Demo user unavailable');
    }

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

  async findSymptoms(): Promise<string[]> {
    const user = await this.usersService.getOrCreateDemoUser();

    if (!user) {
      throw new InternalServerErrorException('Demo user unavailable');
    }

    return this.entriesRepository.findSymptoms(user._id);
  }

  async findLatest(limit: number) {
    const user = await this.usersService.getOrCreateDemoUser();

    if (!user) {
      throw new InternalServerErrorException('Demo user unavailable');
    }

    return this.entriesRepository.findLatest(user._id, limit);
  }
}
