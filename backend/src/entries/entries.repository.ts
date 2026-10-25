import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Entry } from './schemas/entry.schema.js';

@Injectable()
export class EntriesRepository {
  constructor(@InjectModel(Entry.name) private readonly entryModel: Model<Entry>) {}

  // Obtiene todos los registros de entradas para un usuario específico, ordenados por fecha descendente
  findAll(userId: Types.ObjectId) {
    return this.entryModel.find({ userId }).sort({ date: -1 }).exec();
  }

  // Crea un nuevo registro de entrada en la base de datos
  create(entry: Entry) {
    return this.entryModel.create(entry);
  }

  // Obtiene todos los síntomas distintos registrados en las entradas de un usuario específico
  findSymptoms(userId: Types.ObjectId): Promise<string[]> {
    return this.entryModel.distinct('symptoms', { userId }).exec();
  }

  // Obtiene los registros de entradas más recientes para un usuario específico, limitando la cantidad de resultados
  findLatest(userId: Types.ObjectId, limit: number) {
    return this.entryModel.find({ userId }).sort({ date: -1 }).limit(limit).exec();
  }
}
