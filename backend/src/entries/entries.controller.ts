import { Body, Controller, Get, Post } from '@nestjs/common';

import { EntriesService } from './entries.service.js';
import { CreateEntryDto } from './dto/create-entry.dto.js';

@Controller('entries')
export class EntriesController {
  constructor(private readonly entriesService: EntriesService) {}

  // Obtiene todos los registros de entradas disponibles en el sistema
  @Get()
  findAll() {
    return this.entriesService.findAll();
  }

  // Obtiene todos los síntomas registrados en las entradas, útil para análisis y generación de insights
  @Get('symptoms')
  findSymptoms() {
    return this.entriesService.findSymptoms();
  }

  // Crea un nuevo registro
  @Post()
  create(@Body() entry: CreateEntryDto) {
    return this.entriesService.create(entry);
  }
}
