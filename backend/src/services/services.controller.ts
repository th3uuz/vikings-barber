import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators.js';
import { idSchema } from '../common/schemas.js';
import { Role } from '../generated/prisma/enums.js';
import {
  type CreateServiceInput,
  createServiceSchema,
  type UpdateServiceInput,
  updateServiceSchema,
} from './services.schemas.js';
import { ServicesService } from './services.service.js';

@ApiTags('services')
@ApiBearerAuth()
@Controller('services')
export class ServicesController {
  constructor(private readonly services: ServicesService) {}

  /** Qualquer usuário logado vê a lista completa (inclusive inativos). */
  @Get()
  list() {
    return this.services.list();
  }

  @Roles(Role.ADMIN)
  @Post()
  create(@Body({ schema: createServiceSchema }) body: CreateServiceInput) {
    return this.services.create(body);
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  update(
    @Param('id', { schema: idSchema }) id: string,
    @Body({ schema: updateServiceSchema }) body: UpdateServiceInput,
  ) {
    return this.services.update(id, body);
  }
}
