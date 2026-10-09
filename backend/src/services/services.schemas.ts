import { z } from 'zod';

const nameSchema = z.string().trim().min(2).max(60);
const durationSchema = z
  .int()
  .min(5)
  .max(480)
  .multipleOf(5, 'A duração precisa ser múltipla de 5 minutos');
// Preço em centavos, para não ter problema de arredondamento com dinheiro.
const priceSchema = z.int().min(0).max(1_000_000);

export const createServiceSchema = z.strictObject({
  name: nameSchema,
  durationMinutes: durationSchema,
  priceCents: priceSchema,
});
export type CreateServiceInput = z.infer<typeof createServiceSchema>;

export const updateServiceSchema = z
  .strictObject({
    name: nameSchema.optional(),
    durationMinutes: durationSchema.optional(),
    priceCents: priceSchema.optional(),
    active: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Informe pelo menos um campo para atualizar.',
  });
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
