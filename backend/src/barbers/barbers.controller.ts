import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators.js';
import { idSchema } from '../common/schemas.js';
import { Role } from '../generated/prisma/enums.js';
import {
  type CreateBarberInput,
  createBarberSchema,
  type ResetBarberPasswordInput,
  resetBarberPasswordSchema,
  type UpdateBarberInput,
  updateBarberSchema,
} from './barbers.schemas.js';
import { BarbersService } from './barbers.service.js';

/** Cadastro de barbeiros: só o admin. */
@ApiTags('barbers')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller('barbers')
export class BarbersController {
  constructor(private readonly barbers: BarbersService) {}

  @Get()
  list() {
    return this.barbers.list();
  }

  @Post()
  create(@Body({ schema: createBarberSchema }) body: CreateBarberInput) {
    return this.barbers.create(body);
  }

  @Patch(':id')
  update(
    @Param('id', { schema: idSchema }) id: string,
    @Body({ schema: updateBarberSchema }) body: UpdateBarberInput,
  ) {
    return this.barbers.update(id, body);
  }

  @Put(':id/password')
  @HttpCode(204)
  async resetPassword(
    @Param('id', { schema: idSchema }) id: string,
    @Body({ schema: resetBarberPasswordSchema }) body: ResetBarberPasswordInput,
  ): Promise<void> {
    await this.barbers.resetPassword(id, body.password);
  }
}
