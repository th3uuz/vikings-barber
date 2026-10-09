import type { Request } from 'express';
import type { Role } from '../generated/prisma/enums.js';

/** Usuário autenticado, como as rotas enxergam. Nunca inclui o hash da senha. */
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  /** Perfil de barbeiro ligado ao usuário (null para admins sem agenda própria). */
  barberId: string | null;
}

export interface AuthContext {
  user: AuthUser;
  sessionId: string;
}

export type AuthenticatedRequest = Request & { auth?: AuthContext };

export function toAuthUser(user: {
  id: string;
  name: string;
  email: string;
  role: Role;
  barber: { id: string } | null;
}): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    barberId: user.barber?.id ?? null,
  };
}
