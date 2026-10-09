import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isUniqueViolation } from '../prisma/prisma-errors.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  CreateServiceInput,
  UpdateServiceInput,
} from './services.schemas.js';

const serviceSelect = {
  id: true,
  name: true,
  durationMinutes: true,
  priceCents: true,
  active: true,
} as const;

const DUPLICATE_NAME = 'Já existe um serviço com este nome.';

/**
 * Serviços da barbearia (corte, barba...). Não existe exclusão: um serviço que já
 * foi agendado é desativado, para o histórico continuar consistente.
 */
@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  list(options: { onlyActive?: boolean } = {}) {
    return this.prisma.service.findMany({
      where: options.onlyActive ? { active: true } : undefined,
      select: serviceSelect,
      orderBy: { name: 'asc' },
    });
  }

  async create(input: CreateServiceInput) {
    try {
      return await this.prisma.service.create({
        data: input,
        select: serviceSelect,
      });
    } catch (error) {
      if (isUniqueViolation(error)) throw new ConflictException(DUPLICATE_NAME);
      throw error;
    }
  }

  async update(id: string, input: UpdateServiceInput) {
    const exists = await this.prisma.service.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Serviço não encontrado.');

    try {
      return await this.prisma.service.update({
        where: { id },
        data: input,
        select: serviceSelect,
      });
    } catch (error) {
      if (isUniqueViolation(error)) throw new ConflictException(DUPLICATE_NAME);
      throw error;
    }
  }
}
