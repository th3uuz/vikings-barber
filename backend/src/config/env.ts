import { z } from 'zod';

function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat('pt-BR', { timeZone });
    return true;
  } catch {
    return false;
  }
}

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3333),
  DATABASE_URL: z
    .string()
    .regex(/^postgres(ql)?:\/\//, 'Use uma URL no formato postgresql://'),
  SHOP_TIMEZONE: z
    .string()
    .default('America/Sao_Paulo')
    .refine(isValidTimeZone, 'Fuso horário inválido'),
  SESSION_TTL_HOURS: z.coerce.number().int().min(1).max(720).default(168),
  RATE_LIMIT_PER_MINUTE: z.coerce.number().int().min(1).default(300),
  TRUST_PROXY: z.string().default('loopback, linklocal, uniquelocal'),
  SWAGGER_ENABLED: z.stringbool().optional(),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(raw: Record<string, unknown>): Env {
  const result = envSchema.safeParse(raw);
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `- ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Variáveis de ambiente inválidas:\n${details}`);
  }
  return result.data;
}

/**
 * Converte TRUST_PROXY para o formato aceito pelo Express ("trust proxy").
 * Aceita true/false, um número de saltos ou uma lista de IPs/sub-redes.
 */
export function parseTrustProxy(value: string): boolean | number | string {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true') return true;
  if (normalized === 'false') return false;
  if (/^\d+$/.test(normalized)) return Number(normalized);
  return value;
}
