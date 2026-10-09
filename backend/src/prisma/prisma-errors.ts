import { Prisma } from '../generated/prisma/client.js';

/** Código do Postgres quando um valor duplicado quebra um índice único. */
export function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}

/** Erro 23P01 do Postgres: uma constraint EXCLUDE (ex.: horário sobreposto) foi violada. */
export function isExclusionViolation(
  error: unknown,
  constraint?: string,
): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return false;
  const cause = (
    error.meta as
      { driverAdapterError?: { cause?: { originalCode?: string } } } | undefined
  )?.driverAdapterError?.cause;
  if (cause?.originalCode !== '23P01') return false;
  return constraint === undefined || error.message.includes(constraint);
}
