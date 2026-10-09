import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module.js';
import { configureApp } from '../../src/app.setup.js';
import { DEFAULT_BUSINESS_HOURS } from '../../src/business-hours/default-hours.js';
import { PrismaService } from '../../src/prisma/prisma.service.js';

export interface TestApp {
  app: NestExpressApplication;
  prisma: PrismaService;
  http: () => ReturnType<typeof request>;
}

/** Sobe a aplicação inteira (com os mesmos guards e pipes do main.ts) apontando para o banco de teste. */
export async function createTestApp(): Promise<TestApp> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication<NestExpressApplication>({
    logger: false,
  });
  configureApp(app);
  await app.init();

  return {
    app,
    prisma: app.get(PrismaService),
    http: () => request(app.getHttpServer()),
  };
}

/** Limpa todas as tabelas e recoloca o horário de funcionamento padrão. */
export async function resetDatabase(prisma: PrismaService): Promise<void> {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE appointments, sessions, barbers, services, users, business_hours CASCADE',
  );
  await prisma.businessHours.createMany({ data: DEFAULT_BUSINESS_HOURS });
}
