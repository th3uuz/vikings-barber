import type { App } from 'supertest/types.js';
import request from 'supertest';
import { hashPassword } from '../../src/auth/password.js';
import {
  addDays,
  timeToMinutes,
  toShopTime,
  weekdayOf,
  zonedInstant,
} from '../../src/common/shop-time.js';
import { Role } from '../../src/generated/prisma/enums.js';
import type { PrismaService } from '../../src/prisma/prisma.service.js';

export const PASSWORD = 'senha-de-teste-123';
const TIME_ZONE = 'America/Sao_Paulo';

let ipCounter = 0;
/**
 * Cada login dos testes sai de um IP diferente (via X-Forwarded-For), para o
 * limite de 5 tentativas por minuto só valer onde o teste quer testá-lo.
 */
export function uniqueIp(): string {
  ipCounter += 1;
  return `198.51.100.${(ipCounter % 250) + 1}`;
}

export async function createAdmin(
  prisma: PrismaService,
  overrides: { email?: string; active?: boolean } = {},
) {
  return prisma.user.create({
    data: {
      name: 'Admin',
      email: overrides.email ?? 'admin@test.local',
      passwordHash: await hashPassword(PASSWORD),
      role: Role.ADMIN,
      active: overrides.active ?? true,
    },
  });
}

export async function createBarber(
  prisma: PrismaService,
  name: string,
  overrides: { active?: boolean } = {},
) {
  const user = await prisma.user.create({
    data: {
      name,
      email: `${name.toLowerCase()}@test.local`,
      passwordHash: await hashPassword(PASSWORD),
      role: Role.BARBER,
      active: overrides.active ?? true,
      barber: {
        create: { displayName: name, active: overrides.active ?? true },
      },
    },
    include: { barber: true },
  });
  return { user, barber: user.barber! };
}

export function createService(
  prisma: PrismaService,
  data: { name?: string; durationMinutes?: number; priceCents?: number } = {},
) {
  return prisma.service.create({
    data: {
      name: data.name ?? 'Corte',
      durationMinutes: data.durationMinutes ?? 30,
      priceCents: data.priceCents ?? 4500,
    },
  });
}

export async function login(
  app: { getHttpServer(): App },
  email: string,
  password = PASSWORD,
): Promise<string> {
  const response = await request(app.getHttpServer())
    .post('/auth/login')
    .set('X-Forwarded-For', uniqueIp())
    .send({ email, password })
    .expect(200);
  return response.body.token as string;
}

export const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

/** Próxima data (a partir de amanhã) que cai no dia da semana pedido. 2 = terça. */
export function nextWeekday(weekday: number): string {
  let date = addDays(toShopTime(new Date(), TIME_ZONE).date, 1);
  while (weekdayOf(date) !== weekday) date = addDays(date, 1);
  return date;
}

/** Instante ISO de um horário local de São Paulo, ex.: at('2026-10-13', '10:00'). */
export function at(date: string, time: string): string {
  return zonedInstant(date, timeToMinutes(time), TIME_ZONE).toISOString();
}
