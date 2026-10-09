import { Injectable } from '@nestjs/common';
import {
  minutesToTime,
  timeToMinutes,
  weekdayOf,
  type LocalDate,
} from '../common/shop-time.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { UpdateBusinessHoursInput } from './business-hours.schemas.js';

export interface DayHours {
  weekday: number;
  /** Minutos desde 00:00; null quando a barbearia não abre no dia. */
  opensAt: number | null;
  closesAt: number | null;
}

@Injectable()
export class BusinessHoursService {
  constructor(private readonly prisma: PrismaService) {}

  /** Os 7 dias da semana; um dia sem registro conta como fechado. */
  async getWeek(): Promise<DayHours[]> {
    const rows = await this.prisma.businessHours.findMany();
    const byWeekday = new Map(rows.map((row) => [row.weekday, row]));
    return Array.from({ length: 7 }, (_, weekday) => ({
      weekday,
      opensAt: byWeekday.get(weekday)?.opensAt ?? null,
      closesAt: byWeekday.get(weekday)?.closesAt ?? null,
    }));
  }

  async getForDate(date: LocalDate): Promise<DayHours> {
    const weekday = weekdayOf(date);
    const row = await this.prisma.businessHours.findUnique({
      where: { weekday },
    });
    return {
      weekday,
      opensAt: row?.opensAt ?? null,
      closesAt: row?.closesAt ?? null,
    };
  }

  async getWeekAsTimes() {
    return (await this.getWeek()).map(toTimes);
  }

  async replaceWeek(days: UpdateBusinessHoursInput) {
    await this.prisma.$transaction(
      days.map((day) => {
        const data = {
          opensAt: day.opensAt === null ? null : timeToMinutes(day.opensAt),
          closesAt: day.closesAt === null ? null : timeToMinutes(day.closesAt),
        };
        return this.prisma.businessHours.upsert({
          where: { weekday: day.weekday },
          create: { weekday: day.weekday, ...data },
          update: data,
        });
      }),
    );
    return this.getWeekAsTimes();
  }
}

/** Formato usado na API: horários como 'HH:mm'. */
export function toTimes(day: DayHours) {
  return {
    weekday: day.weekday,
    opensAt: day.opensAt === null ? null : minutesToTime(day.opensAt),
    closesAt: day.closesAt === null ? null : minutesToTime(day.closesAt),
  };
}
