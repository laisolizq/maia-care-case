import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { EntriesController } from './entries.controller.js';
import { EntriesService } from './entries.service.js';
import { Entry, EntrySchema } from './schemas/entry.schema.js';
import { UsersModule } from '../users/users.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Entry.name,
        schema: EntrySchema,
      },
    ]),
    UsersModule,
  ],
  controllers: [EntriesController],
  providers: [EntriesService],
})
export class EntriesModule {}
