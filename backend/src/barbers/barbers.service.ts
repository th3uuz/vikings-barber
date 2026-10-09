import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { hashPassword } from '../auth/password.js';
import { Role } from '../generated/prisma/enums.js';
import { isUniqueViolation } from '../prisma/prisma-errors.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  CreateBarberInput,
  UpdateBarberInput,
} from './barbers.schemas.js';

const barberWithUser = {
  include: { user: { select: { email: true } } },
} as const;

function toBarberResponse(barber: {
  id: string;
  displayName: string;
  active: boolean;
  createdAt: Date;
  user: { email: string };
}) {
  return {
    id: barber.id,
    name: barber.displayName,
    email: barber.user.email,
    active: barber.active,
    createdAt: barber.createdAt,
  };
}

@Injectable()
export class BarbersService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const barbers = await this.prisma.barber.findMany({
      ...barberWithUser,
      orderBy: { displayName: 'asc' },
    });
    return barbers.map(toBarberResponse);
  }

  /** Cria o usuário de login (papel BARBER) e o perfil de barbeiro juntos. */
  async create(input: CreateBarberInput) {
    try {
      const user = await this.prisma.user.create({
        data: {
          name: input.name,
          email: input.email,
          passwordHash: await hashPassword(input.password),
          role: Role.BARBER,
          barber: { create: { displayName: input.name } },
        },
        include: { barber: barberWithUser },
      });
      return toBarberResponse(user.barber!);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('Já existe um usuário com este e-mail.');
      }
      throw error;
    }
  }

  /** Desativar um barbeiro bloqueia o login dele e derruba todas as sessões na hora. */
  async update(id: string, input: UpdateBarberInput) {
    const barber = await this.findOrThrow(id);

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: barber.userId },
        data: { name: input.name, active: input.active },
      });
      if (input.active === false) {
        await tx.session.deleteMany({ where: { userId: barber.userId } });
      }
      return tx.barber.update({
        where: { id },
        data: { displayName: input.name, active: input.active },
        ...barberWithUser,
      });
    });

    return toBarberResponse(updated);
  }

  /** Admin define uma nova senha; o barbeiro precisa entrar de novo em todos os aparelhos. */
  async resetPassword(id: string, password: string): Promise<void> {
    const barber = await this.findOrThrow(id);
    const passwordHash = await hashPassword(password);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: barber.userId },
        data: { passwordHash },
      }),
      this.prisma.session.deleteMany({ where: { userId: barber.userId } }),
    ]);
  }

  private async findOrThrow(id: string) {
    const barber = await this.prisma.barber.findUnique({ where: { id } });
    if (!barber) throw new NotFoundException('Barbeiro não encontrado.');
    return barber;
  }
}
