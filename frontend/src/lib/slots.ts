import type { BusyInterval } from "./types";
import { minutesToTime, timeToMinutes, zonedIso } from "./dates";

export interface Slot {
  time: string;
  /** Início e fim do bloco em milissegundos (epoch). */
  start: number;
  end: number;
  free: boolean;
}

function overlaps(start: number, end: number, busy: BusyInterval[]): boolean {
  return busy.some((interval) => {
    const busyStart = Date.parse(interval.startsAt);
    const busyEnd = Date.parse(interval.endsAt);
    return start < busyEnd && busyStart < end;
  });
}

/**
 * Divide o dia em blocos (ex.: de 30 em 30 minutos) e marca quais estão livres.
 * Usado na agenda pública.
 */
export function daySlots(
  date: string,
  opensAt: string,
  closesAt: string,
  busy: BusyInterval[],
  timeZone: string,
  stepMinutes = 30,
): Slot[] {
  const slots: Slot[] = [];
  const close = timeToMinutes(closesAt);
  for (let minute = timeToMinutes(opensAt); minute < close; minute += stepMinutes) {
    const time = minutesToTime(minute);
    const start = Date.parse(zonedIso(date, time, timeZone));
    const end = Date.parse(zonedIso(date, minutesToTime(Math.min(minute + stepMinutes, close)), timeZone));
    slots.push({ time, start, end, free: !overlaps(start, end, busy) });
  }
  return slots;
}

/**
 * Horários em que um serviço de `durationMinutes` cabe inteiro: dentro do
 * expediente, sem bater em outro agendamento e (se for hoje) ainda no futuro.
 */
export function availableStartTimes(
  date: string,
  opensAt: string,
  closesAt: string,
  busy: BusyInterval[],
  durationMinutes: number,
  timeZone: string,
  now: number,
  stepMinutes = 15,
): string[] {
  const times: string[] = [];
  const close = timeToMinutes(closesAt);
  for (let minute = timeToMinutes(opensAt); minute + durationMinutes <= close; minute += stepMinutes) {
    const time = minutesToTime(minute);
    const start = Date.parse(zonedIso(date, time, timeZone));
    const end = start + durationMinutes * 60_000;
    if (start > now && !overlaps(start, end, busy)) times.push(time);
  }
  return times;
}
