import { existsSync, readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';

// Carrega o .env.test sem sobrescrever o que já veio do ambiente (ex.: DATABASE_URL da CI).
const envFile = new URL('../../.env.test', import.meta.url);
if (existsSync(envFile)) {
  const values = parseEnv(readFileSync(envFile, 'utf8'));
  for (const [key, value] of Object.entries(values)) {
    process.env[key] ??= value;
  }
}
