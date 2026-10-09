import { StandardSchemaValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { type Env, parseTrustProxy } from './config/env.js';

/** Configuração compartilhada entre o main.ts e os testes e2e. */
export function configureApp(app: NestExpressApplication): void {
  const config = app.get<ConfigService<Env, true>>(ConfigService);

  // A API fica atrás do Next.js e do proxy do Coolify. Com isso o req.ip passa a
  // ser o IP real do cliente (vindo do X-Forwarded-For), mas só quando a
  // requisição chega de um proxy confiável da rede interna.
  app.set(
    'trust proxy',
    parseTrustProxy(config.get('TRUST_PROXY', { infer: true })),
  );

  app.use(helmet());
  app.useGlobalPipes(new StandardSchemaValidationPipe());
  app.enableShutdownHooks();
}
