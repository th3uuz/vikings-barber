import { z } from 'zod';
import { timeSchema } from '../common/schemas.js';
import { timeToMinutes } from '../common/shop-time.js';

const dayHoursSchema = z
  .strictObject({
    weekday: z.int().min(0).max(6),
    opensAt: timeSchema.nullable(),
    closesAt: timeSchema.nullable(),
  })
  .refine(
    (day) =>
      (day.opensAt === null && day.closesAt === null) ||
      (day.opensAt !== null &&
        day.closesAt !== null &&
        timeToMinutes(day.opensAt) < timeToMinutes(day.closesAt)),
    {
      message:
        'Informe abertura e fechamento (abertura antes do fechamento) ou deixe os dois vazios para dia fechado.',
    },
  );

export const updateBusinessHoursSchema = z
  .array(dayHoursSchema)
  .length(7, 'Envie os 7 dias da semana.')
  .refine((days) => new Set(days.map((day) => day.weekday)).size === 7, {
    message: 'Cada dia da semana deve aparecer uma única vez.',
  });
export type UpdateBusinessHoursInput = z.infer<
  typeof updateBusinessHoursSchema
>;
