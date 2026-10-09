import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { assertCanManageAgenda } from '../auth/access.js';
import type { AuthUser } from '../auth/auth.types.js';
import { BusinessHoursService } from '../business-hours/business-hours.service.js';
import {
  minutesToTime,
  toShopTime,
  zonedDayRange,
  zonedInstant,
} from '../common/shop-time.js';
import type { Env } from '../config/env.js';
import { AppointmentStatus, Role } from '../generated/prisma/enums.js';
import { isExclusionViolation } from '../prisma/prisma-errors.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  CreateAppointmentInput,
  ListAppointmentsQuery,
} from './appointments.schemas.js';

const appointmentInclude = {
  barber: { select: { id: true, displayName: true } },
  service: { select: { id: true, name: true, durationMinutes: true } },
} as const;

type AppointmentWithRelations = {
  id: string;
  clientName: string;
  clientPhone: string | null;
  notes: string | null;
  startsAt: Date;
  endsAt: Date;
  priceCents: number;
  status: AppointmentStatus;
  createdAt: Date;
  cancelledAt: Date | null;
  barber: { id: string; displayName: string };
  service: { id: string; name: string; durationMinutes: number };
};

function toAppointmentResponse(appointment: AppointmentWithRelations) {
  return {
    id: appointment.id,
    barber: { id: appointment.barber.id, name: appointment.barber.displayName },
    service: appointment.service,
    clientName: appointment.clientName,
    clientPhone: appointment.clientPhone,
    notes: appointment.notes,
    startsAt: appointment.startsAt,
    endsAt: appointment.endsAt,
    priceCents: appointment.priceCents,
    status: appointment.status,
    createdAt: appointment.createdAt,
    cancelledAt: appointment.cancelledAt,
  };
}

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly businessHours: BusinessHoursService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  private get timeZone(): string {
    return this.config.get('SHOP_TIMEZONE', { infer: true });
  }

  /**
   * Admin vê o dia de todos os barbeiros (ou de um, filtrando por barberId).
   * Barbeiro vê os detalhes só da própria agenda; a dos colegas ele vê pela agenda pública.
   */
  async list(user: AuthUser, query: ListAppointmentsQuery) {
    let barberId = query.barberId;
    if (user.role === Role.BARBER) {
      if (!user.barberId || (barberId && barberId !== user.barberId)) {
        throw new ForbiddenException(
          'Você só pode ver os detalhes da sua própria agenda.',
        );
      }
      barberId = user.barberId;
    }

    const { start, end } = zonedDayRange(query.date, this.timeZone);
    const appointments = await this.prisma.appointment.findMany({
      where: { barberId, startsAt: { gte: start, lt: end } },
      include: appointmentInclude,
      orderBy: [{ startsAt: 'asc' }, { createdAt: 'asc' }],
    });
    return appointments.map(toAppointmentResponse);
  }

  async create(user: AuthUser, input: CreateAppointmentInput) {
    assertCanManageAgenda(user, input.barberId);

    const [barber, service] = await Promise.all([
      this.prisma.barber.findUnique({ where: { id: input.barberId } }),
      this.prisma.service.findUnique({ where: { id: input.serviceId } }),
    ]);
    if (!barber?.active) {
      throw new UnprocessableEntityException(
        'Barbeiro não encontrado ou inativo.',
      );
    }
    if (!service?.active) {
      throw new UnprocessableEntityException(
        'Serviço não encontrado ou inativo.',
      );
    }

    const startsAt = input.startsAt;
    const endsAt = new Date(
      startsAt.getTime() + service.durationMinutes * 60_000,
    );

    if (startsAt.getTime() <= Date.now()) {
      throw new UnprocessableEntityException(
        'Não é possível agendar um horário que já passou.',
      );
    }
    await this.assertWithinBusinessHours(startsAt, endsAt);

    try {
      const appointment = await this.prisma.appointment.create({
        data: {
          barberId: barber.id,
          serviceId: service.id,
          clientName: input.clientName,
          clientPhone: input.clientPhone,
          notes: input.notes,
          startsAt,
          endsAt,
          priceCents: service.priceCents,
          createdById: user.id,
        },
        include: appointmentInclude,
      });
      return toAppointmentResponse(appointment);
    } catch (error) {
      // Quem garante que não há conflito é a constraint do banco, inclusive
      // quando duas pessoas tentam o mesmo horário ao mesmo tempo.
      if (isExclusionViolation(error, 'appointments_no_overlap')) {
        throw new ConflictException(
          'Esse horário já está ocupado para este barbeiro.',
        );
      }
      throw error;
    }
  }

  async cancel(user: AuthUser, id: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
    });
    if (!appointment) {
      throw new NotFoundException('Agendamento não encontrado.');
    }
    assertCanManageAgenda(user, appointment.barberId);

    // O filtro por status torna o cancelamento atômico: se outra pessoa cancelou
    // no meio do caminho, nenhuma linha é alterada.
    const { count } = await this.prisma.appointment.updateMany({
      where: { id, status: AppointmentStatus.SCHEDULED },
      data: {
        status: AppointmentStatus.CANCELLED,
        cancelledAt: new Date(),
        cancelledById: user.id,
      },
    });
    if (count === 0) {
      throw new ConflictException('Este agendamento já foi cancelado.');
    }

    const cancelled = await this.prisma.appointment.findUniqueOrThrow({
      where: { id },
      include: appointmentInclude,
    });
    return toAppointmentResponse(cancelled);
  }

  /** O atendimento inteiro precisa caber no horário de funcionamento do dia em que começa. */
  private async assertWithinBusinessHours(startsAt: Date, endsAt: Date) {
    const { date } = toShopTime(startsAt, this.timeZone);
    const hours = await this.businessHours.getForDate(date);
    if (hours.opensAt === null || hours.closesAt === null) {
      throw new UnprocessableEntityException('A barbearia não abre neste dia.');
    }

    const opensAt = zonedInstant(date, hours.opensAt, this.timeZone);
    const closesAt = zonedInstant(date, hours.closesAt, this.timeZone);
    if (startsAt < opensAt || endsAt > closesAt) {
      throw new UnprocessableEntityException(
        `Fora do horário de funcionamento (${minutesToTime(hours.opensAt)} às ${minutesToTime(hours.closesAt)}).`,
      );
    }
  }
}
