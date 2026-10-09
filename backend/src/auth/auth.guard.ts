import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthenticatedRequest } from './auth.types.js';
import { IS_PUBLIC_KEY } from './decorators.js';
import { SessionsService } from './sessions.service.js';

/** Tokens gerados pela API têm 43 caracteres; qualquer coisa muito maior é descartada sem consultar o banco. */
const MAX_TOKEN_LENGTH = 128;

function extractBearerToken(header: string | undefined): string | null {
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null;
  if (token.length > MAX_TOKEN_LENGTH) return null;
  return token;
}

/**
 * Guard global: toda rota exige login, a menos que esteja marcada com @Public().
 * Assim uma rota nova nunca fica aberta por esquecimento.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly sessions: SessionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = extractBearerToken(request.headers.authorization);
    if (!token) {
      throw new UnauthorizedException('Faça login para continuar.');
    }

    const auth = await this.sessions.validate(token);
    if (!auth) {
      throw new UnauthorizedException(
        'Sua sessão expirou. Faça login novamente.',
      );
    }

    request.auth = auth;
    return true;
  }
}
