import { Module } from '@nestjs/common';
import { BusinessHoursModule } from '../business-hours/business-hours.module.js';
import { AppointmentsController } from './appointments.controller.js';
import { AppointmentsService } from './appointments.service.js';

@Module({
  imports: [BusinessHoursModule],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
})
export class AppointmentsModule {}
