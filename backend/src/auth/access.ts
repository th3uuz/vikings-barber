import { ForbiddenException } from '@nestjs/common';
import { Role } from '../generated/prisma/enums.js';
import type { AuthUser } from './auth.types.js';

/** Admin mexe em qualquer agenda; barbeiro só na própria. */
export function canManageAgenda(user: AuthUser, barberId: string): boolean {
  return (
    user.role === Role.ADMIN ||
    (user.barberId !== null && user.barberId === barberId)
  );
}

export function assertCanManageAgenda(user: AuthUser, barberId: string): void {
  if (!canManageAgenda(user, barberId)) {
    throw new ForbiddenException('Você só pode mexer na sua própria agenda.');
  }
}
