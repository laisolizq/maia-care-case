import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Entry } from './schemas/entry.schema.js';

@Injectable()
export class EntriesRepository {
  constructor(@InjectModel(Entry.name) private readonly entryModel: Model<Entry>) {}

  findAll(userId: Types.ObjectId) {
    return this.entryModel.find({ userId }).sort({ date: -1 }).exec();
  }

  create(entry: Entry) {
    return this.entryModel.create(entry);
  }

  findSymptoms(userId: Types.ObjectId): Promise<string[]> {
    return this.entryModel.distinct('symptoms', { userId }).exec();
  }

  findLatest(userId: Types.ObjectId, limit: number) {
    return this.entryModel.find({ userId }).sort({ date: -1 }).limit(limit).exec();
  }
}
