import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { AppController } from './app.controller.js';
import { EntriesModule } from './entries/entries.module.js';
import { UsersModule } from './users/users.module.js';
import { InsightsModule } from './insights/insights.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.getOrThrow<string>('MONGODB_URI'),
      }),
    }),

    EntriesModule,

    UsersModule,

    InsightsModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
