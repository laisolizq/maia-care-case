import { Body, Controller, Get, Post } from '@nestjs/common';

import { EntriesService } from './entries.service.js';
import { CreateEntryDto } from './dto/create-entry.dto.js';

@Controller('entries')
export class EntriesController {
  constructor(private readonly entriesService: EntriesService) {}

  @Get()
  findAll() {
    return this.entriesService.findAll();
  }

  @Get('symptoms')
  findSymptoms() {
    return this.entriesService.findSymptoms();
  }

  @Post()
  create(@Body() entry: CreateEntryDto) {
    return this.entriesService.create(entry);
  }
}
