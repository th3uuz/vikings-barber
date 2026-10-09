import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BusinessHoursService } from '../business-hours/business-hours.service.js';
import {
  minutesToTime,
  zonedDayRange,
  type LocalDate,
} from '../common/shop-time.js';
import type { Env } from '../config/env.js';
import { AppointmentStatus } from '../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class PublicService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly businessHours: BusinessHoursService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  /**
   * Agenda do dia para os clientes: só mostra quais horários estão ocupados.
   * Nome, telefone e observações dos clientes nunca saem por aqui.
   */
  async agenda(date: LocalDate) {
    const timeZone = this.config.get('SHOP_TIMEZONE', { infer: true });
    const { start, end } = zonedDayRange(date, timeZone);

    const [hours, barbers] = await Promise.all([
      this.businessHours.getForDate(date),
      this.prisma.barber.findMany({
        where: { active: true },
        orderBy: { displayName: 'asc' },
        select: {
          id: true,
          displayName: true,
          appointments: {
            where: {
              status: AppointmentStatus.SCHEDULED,
              startsAt: { gte: start, lt: end },
            },
            orderBy: { startsAt: 'asc' },
            select: { startsAt: true, endsAt: true },
          },
        },
      }),
    ]);

    return {
      date,
      timeZone,
      opensAt: hours.opensAt === null ? null : minutesToTime(hours.opensAt),
      closesAt: hours.closesAt === null ? null : minutesToTime(hours.closesAt),
      barbers: barbers.map((barber) => ({
        id: barber.id,
        name: barber.displayName,
        busy: barber.appointments,
      })),
    };
  }
}
