import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Insight } from './schemas/insight.schema.js';

@Injectable()
export class InsightsRepository {
  constructor(@InjectModel(Insight.name) private readonly insightModel: Model<Insight>) {}

  findByEntriesKey(userId: Types.ObjectId, entriesKey: string) {
    return this.insightModel.findOne({ userId, entriesKey }).exec();
  }

  create(insight: Insight) {
    return this.insightModel.create(insight);
  }

  findAll(userId: Types.ObjectId) {
    return this.insightModel.find({ userId }).sort({ createdAt: -1 }).exec();
  }
}
