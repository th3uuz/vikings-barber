import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { Public } from '../auth/decorators.js';
import { localDateSchema } from '../common/schemas.js';
import { ServicesService } from '../services/services.service.js';
import { PublicService } from './public.service.js';

const agendaQuerySchema = z.strictObject({ date: localDateSchema });

/** Rotas abertas, usadas pela página pública da barbearia. */
@ApiTags('public')
@Public()
@Controller('public')
export class PublicController {
  constructor(
    private readonly publicService: PublicService,
    private readonly services: ServicesService,
  ) {}

  @Get('services')
  listServices() {
    return this.services.list({ onlyActive: true });
  }

  @Get('agenda')
  agenda(
    @Query({ schema: agendaQuerySchema })
    query: z.infer<typeof agendaQuerySchema>,
  ) {
    return this.publicService.agenda(query.date);
  }
}
