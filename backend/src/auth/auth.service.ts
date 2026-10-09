import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { ChangePasswordInput, LoginInput } from './auth.schemas.js';
import { type AuthContext, toAuthUser } from './auth.types.js';
import { hashPassword, verifyPassword } from './password.js';
import { type SessionMeta, SessionsService } from './sessions.service.js';

// Mesma mensagem para e-mail inexistente, senha errada ou usuário desativado,
// para não revelar quais e-mails estão cadastrados.
const INVALID_CREDENTIALS = 'E-mail ou senha inválidos.';

@Injectable()
export class AuthService {
  /** Hash usado quando o e-mail não existe, para o login levar o mesmo tempo nos dois casos. */
  private readonly dummyHash = hashPassword('vikings-barber-timing-guard');

  constructor(
    private readonly prisma: PrismaService,
    private readonly sessions: SessionsService,
  ) {}

  async login(input: LoginInput, meta: SessionMeta) {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
      include: { barber: { select: { id: true } } },
    });

    if (!user) {
      await verifyPassword(await this.dummyHash, input.password);
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    const passwordMatches = await verifyPassword(
      user.passwordHash,
      input.password,
    );
    if (!passwordMatches || !user.active) {
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    await this.sessions.deleteExpiredForUser(user.id);
    const session = await this.sessions.create(user.id, meta);

    return {
      token: session.token,
      expiresAt: session.expiresAt,
      user: toAuthUser(user),
    };
  }

  /** Troca a senha e derruba as outras sessões do usuário (a atual continua valendo). */
  async changePassword(auth: AuthContext, input: ChangePasswordInput) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: auth.user.id },
    });

    const currentMatches = await verifyPassword(
      user.passwordHash,
      input.currentPassword,
    );
    if (!currentMatches) {
      throw new BadRequestException('A senha atual está incorreta.');
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: await hashPassword(input.newPassword) },
      }),
      this.prisma.session.deleteMany({
        where: { userId: user.id, id: { not: auth.sessionId } },
      }),
    ]);
  }
}
