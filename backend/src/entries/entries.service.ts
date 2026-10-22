import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';

import { Entry } from './schemas/entry.schema.js';
import type { CreateEntryDto } from './dto/create-entry.dto.js';
import { UsersService } from '../users/users.service.js';

@Injectable()
export class EntriesService {
  constructor(
    @InjectModel(Entry.name)
    private readonly entryModel: Model<Entry>,
    private readonly usersService: UsersService,
  ) {}

  async findAll() {
    const user = await this.usersService.getOrCreateDemoUser();

    if (!user) {
      throw new InternalServerErrorException('Demo user unavailable');
    }

    return this.entryModel.find({ userId: user._id }).exec();
  }

  async create(entry: CreateEntryDto) {
    const user = await this.usersService.getOrCreateDemoUser();

    if (!user) {
      throw new InternalServerErrorException('Demo user unavailable');
    }

    return this.entryModel.create({
      ...entry,
      userId: user._id,
    });
  }

  async findSymptoms(): Promise<string[]> {
    const user = await this.usersService.getOrCreateDemoUser();

    if (!user) {
      throw new InternalServerErrorException('Demo user unavailable');
    }

    return this.entryModel
      .distinct('symptoms', {
        userId: user._id,
      })
      .exec();
  }
}
