import { TZDate } from "@date-fns/tz";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

/** Fuso da barbearia. Precisa ser o mesmo SHOP_TIMEZONE configurado na API. */
export const SHOP_TIME_ZONE = process.env.SHOP_TIMEZONE ?? "America/Sao_Paulo";

const pad = (value: number) => String(value).padStart(2, "0");

export function isLocalDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

/** Hoje no relógio da barbearia, como AAAA-MM-DD. */
export function todayInShop(timeZone = SHOP_TIME_ZONE): string {
  const now = new TZDate(Date.now(), timeZone);
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function addDays(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + days));
  return `${next.getUTCFullYear()}-${pad(next.getUTCMonth() + 1)}-${pad(next.getUTCDate())}`;
}

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(totalMinutes: number): string {
  return `${pad(Math.floor(totalMinutes / 60))}:${pad(totalMinutes % 60)}`;
}

/** Instante exato (ISO) de um horário local da barbearia. */
export function zonedIso(date: string, time: string, timeZone = SHOP_TIME_ZONE): string {
  const [year, month, day] = date.split("-").map(Number);
  const local = new TZDate(year, month - 1, day, 0, timeToMinutes(time), 0, 0, timeZone);
  return new Date(local.getTime()).toISOString();
}

/** "14:30" de um instante, no relógio da barbearia. */
export function formatTime(iso: string, timeZone = SHOP_TIME_ZONE): string {
  return format(new TZDate(iso, timeZone), "HH:mm");
}

/** "Terça-feira, 13 de outubro" */
export function formatLongDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  const text = format(new Date(year, month - 1, day), "EEEE, d 'de' MMMM", { locale: ptBR });
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** "ter, 13/10" */
export function formatShortDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  return format(new Date(year, month - 1, day), "EEE, dd/MM", { locale: ptBR });
}

export const WEEKDAYS = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];
