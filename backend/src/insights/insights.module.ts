import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { EntriesModule } from '../entries/entries.module.js';
import { UsersModule } from '../users/users.module.js';

import { GeminiService } from './ai/gemini.service.js';
import { InsightsController } from './insights.controller.js';
import { InsightsService } from './insights.service.js';
import { Insight, InsightSchema } from './schemas/insight.schema.js';

@Module({
  imports: [
    UsersModule,
    EntriesModule, // ← IMPORTANTE
    MongooseModule.forFeature([
      {
        name: Insight.name,
        schema: InsightSchema,
      },
    ]),
  ],
  controllers: [InsightsController],
  providers: [InsightsService, GeminiService],
})
export class InsightsModule {}
