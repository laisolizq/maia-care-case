import { Controller, Get, Post } from '@nestjs/common';
import { InsightsService } from './insights.service.js';

@Controller('insights')
export class InsightsController {
  constructor(private readonly insightsService: InsightsService) {}

  // Este endpoint permite obtener todos los insights generados para el usuario de demostración
  @Get()
  findAll() {
    return this.insightsService.findAll();
  }

  // Este endpoint permite generar un nuevo insight basado en los registros más recientes del usuario de demostración
  @Post()
  generate() {
    return this.insightsService.generate();
  }
}
