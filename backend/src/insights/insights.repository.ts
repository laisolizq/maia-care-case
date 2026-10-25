import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Insight } from './schemas/insight.schema.js';

@Injectable()
export class InsightsRepository {
  constructor(@InjectModel(Insight.name) private readonly insightModel: Model<Insight>) {}

  // Buscamos un insight existente basado en el ID del usuario y la clave de los registros
  findByEntriesKey(userId: Types.ObjectId, entriesKey: string) {
    return this.insightModel.findOne({ userId, entriesKey }).exec();
  }

  // Creamos un nuevo insight en la base de datos
  create(insight: Insight) {
    return this.insightModel.create(insight);
  }

  // Obtenemos todos los insights generados para un usuario específico, ordenados por fecha de creación
  findAll(userId: Types.ObjectId) {
    return this.insightModel.find({ userId }).sort({ createdAt: -1 }).exec();
  }
}
