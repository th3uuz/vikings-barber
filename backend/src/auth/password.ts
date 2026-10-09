import { hash, verify } from '@node-rs/argon2';

// Argon2id com 19 MiB de memória, 2 iterações e 1 thread:
// os parâmetros mínimos recomendados pela OWASP para senhas.
const ARGON2_OPTIONS = { memoryCost: 19_456, timeCost: 2, parallelism: 1 };

export function hashPassword(password: string): Promise<string> {
  return hash(password, ARGON2_OPTIONS);
}

export function verifyPassword(
  passwordHash: string,
  password: string,
): Promise<boolean> {
  return verify(passwordHash, password);
}
