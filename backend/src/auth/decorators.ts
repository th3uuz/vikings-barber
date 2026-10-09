import {
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import type { Role } from '../generated/prisma/enums.js';
import type {
  AuthContext,
  AuthenticatedRequest,
  AuthUser,
} from './auth.types.js';

export const IS_PUBLIC_KEY = 'isPublic';
export const ROLES_KEY = 'roles';

/** Libera a rota sem login. Todas as outras exigem sessão válida. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/** Restringe a rota aos papéis informados. */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

function getAuth(ctx: ExecutionContext): AuthContext {
  const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
  if (!request.auth) throw new UnauthorizedException();
  return request.auth;
}

export const CurrentAuth = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): AuthContext => getAuth(ctx),
);

export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): AuthUser => getAuth(ctx).user,
);
