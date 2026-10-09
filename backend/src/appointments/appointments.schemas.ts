import { z } from 'zod';
import {
  idSchema,
  localDateSchema,
  personNameSchema,
} from '../common/schemas.js';

export const createAppointmentSchema = z.strictObject({
  barberId: idSchema,
  serviceId: idSchema,
  /** Início com fuso explícito, ex.: 2026-10-13T14:00:00-03:00 ou ...Z. */
  startsAt: z.iso
    .datetime({ offset: true })
    .transform((value) => new Date(value)),
  clientName: personNameSchema,
  clientPhone: z
    .string()
    .trim()
    .regex(/^[0-9()+\-\s]{8,20}$/, 'Telefone inválido')
    .optional(),
  notes: z.string().trim().max(500).optional(),
});
export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;

export const listAppointmentsQuerySchema = z.strictObject({
  date: localDateSchema,
  barberId: idSchema.optional(),
});
export type ListAppointmentsQuery = z.infer<typeof listAppointmentsQuerySchema>;
