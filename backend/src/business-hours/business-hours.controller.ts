import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public, Roles } from '../auth/decorators.js';
import { Role } from '../generated/prisma/enums.js';
import {
  type UpdateBusinessHoursInput,
  updateBusinessHoursSchema,
} from './business-hours.schemas.js';
import { BusinessHoursService } from './business-hours.service.js';

@ApiTags('business-hours')
@Controller('business-hours')
export class BusinessHoursController {
  constructor(private readonly businessHours: BusinessHoursService) {}

  @Public()
  @Get()
  get() {
    return this.businessHours.getWeekAsTimes();
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Put()
  replace(
    @Body({ schema: updateBusinessHoursSchema }) body: UpdateBusinessHoursInput,
  ) {
    return this.businessHours.replaceWeek(body);
  }
}
