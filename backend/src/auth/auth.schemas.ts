import { z } from 'zod';
import { emailSchema, passwordSchema } from '../common/schemas.js';

export const loginSchema = z.strictObject({
  email: emailSchema,
  // No login não aplicamos as regras de tamanho, só limitamos o tamanho máximo.
  password: z.string().min(1).max(128),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const changePasswordSchema = z.strictObject({
  currentPassword: z.string().min(1).max(128),
  newPassword: passwordSchema,
});
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
