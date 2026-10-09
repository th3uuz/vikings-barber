import { Module } from '@nestjs/common';
import { BusinessHoursController } from './business-hours.controller.js';
import { BusinessHoursService } from './business-hours.service.js';

@Module({
  controllers: [BusinessHoursController],
  providers: [BusinessHoursService],
  exports: [BusinessHoursService],
})
export class BusinessHoursModule {}
