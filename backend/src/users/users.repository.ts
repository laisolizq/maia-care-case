import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { User } from './schemas/user.schema.js';

@Injectable()
export class UsersRepository {
  // Inyectamos el modelo de usuario en el repositorio
  constructor(@InjectModel(User.name) private readonly userModel: Model<User>) {}

  // Este metodo permite obtener un usuario de demostración, o crear uno si no existe
  getOrCreate(username: string, name: string) {
    return this.userModel
      .findOneAndUpdate(
        { username },
        { $setOnInsert: { username, name } },
        { upsert: true, new: true },
      )
      .exec();
  }
}
