/**
 * Seed do banco. Pode rodar quantas vezes quiser: só cria o que ainda não existe.
 *
 * - Horário de funcionamento padrão (se a tabela estiver vazia).
 * - Primeiro admin, com os dados de ADMIN_NAME, ADMIN_EMAIL e ADMIN_PASSWORD
 *   (só quando ainda não existe nenhum admin).
 * - Com SEED_DEMO_DATA=true (nunca em produção): serviços, barbeiros e agendamentos de exemplo.
 *
 * Desenvolvimento: npm run db:seed
 * Produção (depois do build): node dist/database/seed.js
 */
import { existsSync } from 'node:fs';
import { PrismaPg } from '@prisma/adapter-pg';
import { hashPassword } from '../auth/password.js';
import { DEFAULT_BUSINESS_HOURS } from '../business-hours/default-hours.js';
import {
  addDays,
  toShopTime,
  weekdayOf,
  zonedInstant,
} from '../common/shop-time.js';
import { PrismaClient } from '../generated/prisma/client.js';
import { Role } from '../generated/prisma/enums.js';

if (existsSync('.env')) process.loadEnvFile('.env');

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Defina a variável de ambiente ${name}.`);
  return value;
}

const isProduction = process.env.NODE_ENV === 'production';
const timeZone = process.env.SHOP_TIMEZONE ?? 'America/Sao_Paulo';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: requireEnv('DATABASE_URL') }),
});

async function seedBusinessHours() {
  if ((await prisma.businessHours.count()) > 0) return;
  await prisma.businessHours.createMany({ data: DEFAULT_BUSINESS_HOURS });
  console.log('Horário de funcionamento padrão criado.');
}

/**
 * Cria o primeiro admin. Se já existe algum admin, não faz nada, então
 * ADMIN_EMAIL e ADMIN_PASSWORD só são necessários no primeiro deploy.
 */
async function seedAdmin() {
  const existing = await prisma.user.findFirst({
    where: { role: Role.ADMIN },
    select: { email: true },
  });
  if (existing) {
    console.log(`Admin ${existing.email} já existe; nada a fazer.`);
    return;
  }

  const email = requireEnv('ADMIN_EMAIL').toLowerCase();
  const password = requireEnv('ADMIN_PASSWORD');
  if (password.length < 8) {
    throw new Error('ADMIN_PASSWORD precisa ter pelo menos 8 caracteres.');
  }
  if (isProduction && password === 'troque-esta-senha') {
    throw new Error(
      'Troque o ADMIN_PASSWORD de exemplo antes de rodar em produção.',
    );
  }

  await prisma.user.create({
    data: {
      name: process.env.ADMIN_NAME?.trim() || 'Administrador',
      email,
      passwordHash: await hashPassword(password),
      role: Role.ADMIN,
    },
  });
  console.log(`Admin ${email} criado.`);
}

const DEMO_SERVICES = [
  { name: 'Corte', durationMinutes: 30, priceCents: 4500 },
  { name: 'Barba', durationMinutes: 20, priceCents: 3000 },
  { name: 'Corte + barba', durationMinutes: 50, priceCents: 7000 },
  { name: 'Pezinho', durationMinutes: 15, priceCents: 1500 },
];

const DEMO_BARBERS = [
  { name: 'Ragnar', email: 'ragnar@vikingsbarber.local' },
  { name: 'Lagertha', email: 'lagertha@vikingsbarber.local' },
  { name: 'Bjorn', email: 'bjorn@vikingsbarber.local' },
];

async function seedDemoData() {
  if (isProduction) {
    console.log('SEED_DEMO_DATA ignorado em produção.');
    return;
  }
  const password = requireEnv('DEMO_PASSWORD');
  const passwordHash = await hashPassword(password);

  for (const service of DEMO_SERVICES) {
    await prisma.service.upsert({
      where: { name: service.name },
      create: service,
      update: {},
    });
  }

  for (const barber of DEMO_BARBERS) {
    const exists = await prisma.user.findUnique({
      where: { email: barber.email },
    });
    if (exists) continue;
    await prisma.user.create({
      data: {
        name: barber.name,
        email: barber.email,
        passwordHash,
        role: Role.BARBER,
        barber: { create: { displayName: barber.name } },
      },
    });
  }

  if ((await prisma.appointment.count()) > 0) return;

  // Alguns agendamentos no próximo dia útil, para a agenda não começar vazia.
  const admin = await prisma.user.findFirstOrThrow({
    where: { role: Role.ADMIN },
  });
  const barbers = await prisma.barber.findMany({
    orderBy: { displayName: 'asc' },
  });
  const services = await prisma.service.findMany();
  const corte = services.find((service) => service.name === 'Corte')!;
  const combo = services.find((service) => service.name === 'Corte + barba')!;

  let date = addDays(toShopTime(new Date(), timeZone).date, 1);
  while (weekdayOf(date) === 0) date = addDays(date, 1);

  const demo = [
    { barber: barbers[0], service: corte, time: 10 * 60, client: 'Floki' },
    { barber: barbers[0], service: combo, time: 14 * 60, client: 'Rollo' },
    { barber: barbers[1], service: corte, time: 11 * 60, client: 'Ivar' },
    { barber: barbers[2], service: combo, time: 9 * 60 + 30, client: 'Ubbe' },
  ];
  for (const item of demo) {
    const startsAt = zonedInstant(date, item.time, timeZone);
    await prisma.appointment.create({
      data: {
        barberId: item.barber.id,
        serviceId: item.service.id,
        clientName: item.client,
        startsAt,
        endsAt: new Date(
          startsAt.getTime() + item.service.durationMinutes * 60_000,
        ),
        priceCents: item.service.priceCents,
        createdById: admin.id,
      },
    });
  }
  console.log(`Dados de demonstração criados (agendamentos em ${date}).`);
}

try {
  await seedBusinessHours();
  await seedAdmin();
  if (process.env.SEED_DEMO_DATA === 'true') await seedDemoData();
} finally {
  await prisma.$disconnect();
}
