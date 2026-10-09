import { z } from 'zod';

export const idSchema = z.uuid();

/** Data local da barbearia, no formato AAAA-MM-DD. */
export const localDateSchema = z.iso.date();

/** Horário local no formato HH:mm (24:00 representa o fim do dia). */
export const timeSchema = z
  .string()
  .regex(/^(([01]\d|2[0-3]):[0-5]\d|24:00)$/, 'Use o formato HH:mm');

export const personNameSchema = z.string().trim().min(2).max(80);

export const emailSchema = z.string().trim().toLowerCase().pipe(z.email());

export const passwordSchema = z
  .string()
  .min(8, 'A senha precisa ter pelo menos 8 caracteres')
  .max(128, 'A senha pode ter no máximo 128 caracteres');
