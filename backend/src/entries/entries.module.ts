import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { UsersModule } from '../users/users.module.js';
import { EntriesController } from './entries.controller.js';
import { EntriesService } from './entries.service.js';
import { EntriesRepository } from './entries.repository.js';
import { Entry, EntrySchema } from './schemas/entry.schema.js';

@Module({
  imports: [
    UsersModule,
    MongooseModule.forFeature([
      {
        name: Entry.name,
        schema: EntrySchema,
      },
    ]),
  ],
  controllers: [EntriesController],
  providers: [EntriesService, EntriesRepository],
  exports: [EntriesService],
})
export class EntriesModule {}
