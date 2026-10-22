import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { User } from './schemas/user.schema.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) {}

  async getOrCreateDemoUser() {
    return this.userModel
      .findOneAndUpdate(
        { username: 'demo' },
        {
          $setOnInsert: {
            username: 'demo',
            name: 'Usuaria de demostración',
          },
        },
        {
          upsert: true,
          new: true,
        },
      )
      .exec();
  }
}
