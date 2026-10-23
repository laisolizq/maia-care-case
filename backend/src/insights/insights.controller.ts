import { Controller, Get, Post } from '@nestjs/common';
import { InsightsService } from './insights.service.js';

@Controller('insights')
export class InsightsController {
  constructor(private readonly insightsService: InsightsService) {}

  @Get()
  findAll() {
    return this.insightsService.findAll();
  }

  @Post()
  generate() {
    return this.insightsService.generate();
  }
}
