import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { AuthUser } from '../auth/auth.types.js';
import { CurrentUser } from '../auth/decorators.js';
import { idSchema } from '../common/schemas.js';
import {
  type CreateAppointmentInput,
  createAppointmentSchema,
  type ListAppointmentsQuery,
  listAppointmentsQuerySchema,
} from './appointments.schemas.js';
import { AppointmentsService } from './appointments.service.js';

/** Admin e barbeiros. As regras de quem pode mexer em qual agenda ficam no service. */
@ApiTags('appointments')
@ApiBearerAuth()
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointments: AppointmentsService) {}

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Query({ schema: listAppointmentsQuerySchema })
    query: ListAppointmentsQuery,
  ) {
    return this.appointments.list(user, query);
  }

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body({ schema: createAppointmentSchema }) body: CreateAppointmentInput,
  ) {
    return this.appointments.create(user, body);
  }

  @Post(':id/cancel')
  @HttpCode(200)
  cancel(
    @CurrentUser() user: AuthUser,
    @Param('id', { schema: idSchema }) id: string,
  ) {
    return this.appointments.cancel(user, id);
  }
}
