import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'node:crypto';
import type { Env } from '../config/env.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { type AuthContext, toAuthUser } from './auth.types.js';

export interface SessionMeta {
  ip?: string;
  userAgent?: string;
}

/** Atualiza o "visto por último" no máximo a cada 5 minutos, para não escrever no banco a cada requisição. */
const LAST_SEEN_UPDATE_INTERVAL_MS = 5 * 60_000;

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Sessões opacas guardadas no banco. O cliente recebe um token aleatório de 256 bits;
 * o banco guarda só o hash dele, então um vazamento do banco não entrega sessões válidas.
 */
@Injectable()
export class SessionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async create(userId: string, meta: SessionMeta) {
    const token = randomBytes(32).toString('base64url');
    const ttlHours = this.config.get('SESSION_TTL_HOURS', { infer: true });
    const expiresAt = new Date(Date.now() + ttlHours * 3_600_000);

    await this.prisma.session.create({
      data: {
        tokenHash: hashToken(token),
        userId,
        expiresAt,
        ip: meta.ip,
        userAgent: meta.userAgent?.slice(0, 255),
      },
    });

    return { token, expiresAt };
  }

  /** Devolve a sessão se o token existir, não tiver expirado e o usuário estiver ativo. */
  async validate(token: string): Promise<AuthContext | null> {
    const session = await this.prisma.session.findUnique({
      where: { tokenHash: hashToken(token) },
      include: { user: { include: { barber: { select: { id: true } } } } },
    });

    const now = new Date();
    if (!session || session.expiresAt <= now || !session.user.active) {
      return null;
    }

    if (
      now.getTime() - session.lastSeenAt.getTime() >
      LAST_SEEN_UPDATE_INTERVAL_MS
    ) {
      await this.prisma.session.update({
        where: { id: session.id },
        data: { lastSeenAt: now },
      });
    }

    return { sessionId: session.id, user: toAuthUser(session.user) };
  }

  async revoke(sessionId: string): Promise<void> {
    await this.prisma.session.deleteMany({ where: { id: sessionId } });
  }

  async revokeAllForUser(userId: string, exceptSessionId?: string) {
    await this.prisma.session.deleteMany({
      where: {
        userId,
        ...(exceptSessionId ? { id: { not: exceptSessionId } } : {}),
      },
    });
  }

  async deleteExpiredForUser(userId: string): Promise<void> {
    await this.prisma.session.deleteMany({
      where: { userId, expiresAt: { lte: new Date() } },
    });
  }
}
