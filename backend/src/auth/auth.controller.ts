import { Body, Controller, Get, HttpCode, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import {
  type ChangePasswordInput,
  changePasswordSchema,
  type LoginInput,
  loginSchema,
} from './auth.schemas.js';
import { AuthService } from './auth.service.js';
import type { AuthContext, AuthUser } from './auth.types.js';
import { CurrentAuth, CurrentUser, Public } from './decorators.js';
import { SessionsService } from './sessions.service.js';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly sessions: SessionsService,
  ) {}

  /** No máximo 5 tentativas por minuto por IP, para dificultar ataques de força bruta. */
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  @HttpCode(200)
  login(
    @Body({ schema: loginSchema }) body: LoginInput,
    @Req() request: Request,
  ) {
    return this.auth.login(body, {
      ip: request.ip,
      userAgent: request.get('user-agent'),
    });
  }

  @ApiBearerAuth()
  @Post('logout')
  @HttpCode(204)
  async logout(@CurrentAuth() auth: AuthContext): Promise<void> {
    await this.sessions.revoke(auth.sessionId);
  }

  @ApiBearerAuth()
  @Get('me')
  me(@CurrentUser() user: AuthUser): AuthUser {
    return user;
  }

  @ApiBearerAuth()
  @Post('password')
  @HttpCode(204)
  async changePassword(
    @CurrentAuth() auth: AuthContext,
    @Body({ schema: changePasswordSchema }) body: ChangePasswordInput,
  ): Promise<void> {
    await this.auth.changePassword(auth, body);
  }
}
