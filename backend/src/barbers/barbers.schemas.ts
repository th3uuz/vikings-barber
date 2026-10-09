import { z } from 'zod';
import {
  emailSchema,
  passwordSchema,
  personNameSchema,
} from '../common/schemas.js';

export const createBarberSchema = z.strictObject({
  name: personNameSchema,
  email: emailSchema,
  password: passwordSchema,
});
export type CreateBarberInput = z.infer<typeof createBarberSchema>;

export const updateBarberSchema = z
  .strictObject({
    name: personNameSchema.optional(),
    active: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Informe pelo menos um campo para atualizar.',
  });
export type UpdateBarberInput = z.infer<typeof updateBarberSchema>;

export const resetBarberPasswordSchema = z.strictObject({
  password: passwordSchema,
});
export type ResetBarberPasswordInput = z.infer<
  typeof resetBarberPasswordSchema
>;
