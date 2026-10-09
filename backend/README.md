# Vikings Barber API

API em NestJS do Vikings Barber. Instruções completas, decisões de segurança e lista de rotas estão no [README da raiz](../README.md).

## Scripts

| Comando              | O que faz                                               |
| -------------------- | ------------------------------------------------------- |
| `npm run start:dev`  | Sobe a API recarregando a cada alteração                |
| `npm run build`      | Compila para `dist/`                                    |
| `npm run start:prod` | Roda a versão compilada                                 |
| `npm run db:migrate` | Cria uma migration a partir do schema e aplica no banco |
| `npm run db:deploy`  | Aplica as migrations pendentes (produção)               |
| `npm run db:seed`    | Cria admin, horário de funcionamento e dados de exemplo |
| `npm run db:studio`  | Abre o Prisma Studio para ver os dados                  |
| `npm test`           | Testes unitários                                        |
| `npm run test:e2e`   | Testes e2e contra o banco de teste                      |
| `npm run lint`       | Lint com oxlint                                         |
| `npm run typecheck`  | Checagem de tipos do TypeScript                         |

## Observações

- O `prisma` está fixado na versão 7. Hoje a tag `latest` do npm aponta para um release candidate da versão 8, então não rode `npm install prisma@latest`.
- O npm 11 só executa scripts de instalação dos pacotes liberados no campo `allowScripts` do `package.json` (Prisma e esbuild). Se aparecer um aviso sobre outro pacote, ele não é necessário.
- Se o Vitest reclamar de "native binding" depois de instalar, apague `node_modules` e rode `npm install` de novo (bug conhecido do npm com dependências opcionais).
- O `prisma` (CLI) fica em `dependencies`, e não em `devDependencies`, porque a imagem de produção roda `prisma migrate deploy` ao subir.

## Docker

O `Dockerfile` gera a imagem de produção. Ao subir, o `docker-entrypoint.sh`:

1. aplica as migrations pendentes (`prisma migrate deploy`);
2. roda o seed, que cria o horário de funcionamento padrão e o primeiro admin só se ainda não existirem;
3. inicia a API na porta 3333.

A imagem tem health check em `/health`, usado pelo Docker Compose para só subir o site depois que a API estiver de pé.
