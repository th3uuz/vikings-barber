import { Module } from '@nestjs/common';
import { BusinessHoursModule } from '../business-hours/business-hours.module.js';
import { ServicesModule } from '../services/services.module.js';
import { PublicController } from './public.controller.js';
import { PublicService } from './public.service.js';

@Module({
  imports: [BusinessHoursModule, ServicesModule],
  controllers: [PublicController],
  providers: [PublicService],
})
export class PublicModule {}
