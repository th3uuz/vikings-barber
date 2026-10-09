import { TZDate } from '@date-fns/tz';

/** Data local no formato AAAA-MM-DD. */
export type LocalDate = string;

const pad = (value: number) => String(value).padStart(2, '0');

function splitDate(date: LocalDate): [number, number, number] {
  const [year, month, day] = date.split('-').map(Number);
  return [year, month, day];
}

/** Converte 'HH:mm' em minutos desde 00:00. */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/** Converte minutos desde 00:00 em 'HH:mm'. */
export function minutesToTime(totalMinutes: number): string {
  return `${pad(Math.floor(totalMinutes / 60))}:${pad(totalMinutes % 60)}`;
}

/** Instante exato de um horário local (minutos desde 00:00) numa data local. */
export function zonedInstant(
  date: LocalDate,
  minutesFromMidnight: number,
  timeZone: string,
): Date {
  const [year, month, day] = splitDate(date);
  const local = new TZDate(
    year,
    month - 1,
    day,
    0,
    minutesFromMidnight,
    0,
    0,
    timeZone,
  );
  return new Date(local.getTime());
}

/** Início e fim (exclusivo) de um dia local. */
export function zonedDayRange(
  date: LocalDate,
  timeZone: string,
): { start: Date; end: Date } {
  return {
    start: zonedInstant(date, 0, timeZone),
    end: zonedInstant(date, 24 * 60, timeZone),
  };
}

/** Como um instante aparece no relógio da barbearia. */
export function toShopTime(instant: Date, timeZone: string) {
  const local = new TZDate(instant.getTime(), timeZone);
  return {
    date: `${local.getFullYear()}-${pad(local.getMonth() + 1)}-${pad(local.getDate())}`,
    weekday: local.getDay(),
    minutes: local.getHours() * 60 + local.getMinutes(),
  };
}

/** Dia da semana de uma data local (0 = domingo ... 6 = sábado). */
export function weekdayOf(date: LocalDate): number {
  const [year, month, day] = splitDate(date);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

/** Data local daqui a `days` dias. */
export function addDays(date: LocalDate, days: number): LocalDate {
  const [year, month, day] = splitDate(date);
  const next = new Date(Date.UTC(year, month - 1, day + days));
  return `${next.getUTCFullYear()}-${pad(next.getUTCMonth() + 1)}-${pad(next.getUTCDate())}`;
}
