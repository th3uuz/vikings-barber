# Vikings Barber

Sistema de agendamento para barbearias. O admin e os barbeiros usam um painel; os clientes veem, sem login, quais horários de cada barbeiro já estão ocupados.

Projeto de portfólio de [Matheus Lacerda](https://github.com/th3uuz).

## O que já funciona

**Backend (API)**

- Login com e-mail e senha, com dois papéis: **Admin** e **Barbeiro**.
- O admin cadastra barbeiros, serviços (com duração e preço) e o horário de funcionamento, e agenda para qualquer barbeiro.
- O barbeiro agenda, consulta e cancela **só na própria agenda**.
- A agenda pública mostra os horários ocupados de cada barbeiro, sem nenhum dado dos clientes.
- O próprio banco impede dois agendamentos sobrepostos para o mesmo barbeiro, mesmo com pedidos simultâneos.

**Frontend (Next.js)**

- Página pública com os horários livres de cada barbeiro, serviços com preço e horário de funcionamento. Com `WHATSAPP_NUMBER` configurado, cada horário livre vira um link para pedir pelo WhatsApp.
- Painel do admin: agenda de todos os barbeiros com filtro, cadastro de barbeiros, serviços e horário de funcionamento.
- Painel do barbeiro: só a própria agenda.
- O formulário de agendamento mostra apenas os horários em que o serviço escolhido cabe inteiro.
- Funciona no celular.

**Próxima etapa**

- Docker Compose de produção e deploy no Coolify.

## Stack

| Parte    | Tecnologia                                             |
| -------- | ------------------------------------------------------ |
| Backend  | Node.js 24 LTS, NestJS 12, TypeScript, Prisma 7        |
| Banco    | PostgreSQL 18                                          |
| Testes   | Vitest e Supertest (e2e contra um Postgres de verdade) |
| CI       | GitHub Actions                                         |
| Frontend | Next.js 16, React 19, Tailwind CSS 4                   |

## Decisões de segurança

- **Senhas** com Argon2id, nos parâmetros mínimos recomendados pela OWASP.
- **Sessões revogáveis.** O login devolve um token aleatório de 256 bits e o banco guarda só o hash SHA-256 dele. Logout, troca de senha e desativação de barbeiro derrubam as sessões na hora.
- **Tudo fechado por padrão.** Toda rota exige login; as rotas abertas são marcadas uma a uma com `@Public()`.
- **Papéis e dono da agenda.** `@Roles(Role.ADMIN)` protege as rotas de cadastro, e a regra "barbeiro só mexe na própria agenda" fica no service de agendamentos, com testes.
- **Validação de toda entrada** com Zod. Campos desconhecidos são recusados, então ninguém consegue, por exemplo, mandar `"role": "ADMIN"` no cadastro.
- **Força bruta.** O login aceita 5 tentativas por minuto por IP e responde a mesma mensagem para e-mail inexistente e senha errada.
- **Privacidade.** A agenda pública nunca devolve nome, telefone ou observações dos clientes.
- **Agendamento duplo** bloqueado por uma constraint `EXCLUDE` do Postgres, e não só por código.
- **O token não chega ao navegador.** O navegador só conversa com o Next.js, que guarda o token num cookie `httpOnly` e chama a API pelo servidor. Um script injetado na página não consegue ler a sessão.
- **A tela não é a segurança.** O painel esconde o que o usuário não pode usar, mas quem bloqueia de verdade é a API, em toda requisição.

## Como rodar no Windows

Pré-requisitos: [Node.js 24 LTS](https://nodejs.org), [Docker Desktop](https://www.docker.com/products/docker-desktop/) (com WSL 2) e Git.

```powershell
git clone https://github.com/th3uuz/vikings-barber.git
cd vikings-barber

# 1. Sobe o Postgres em segundo plano
docker compose up -d

# 2. Prepara a API
cd backend
Copy-Item .env.example .env
npm install
npm run db:migrate   # cria as tabelas
npm run db:seed      # cria o admin, o horário de funcionamento e dados de exemplo

# 3. Roda a API recarregando a cada alteração
npm run start:dev
```

A API sobe em `http://localhost:3333` e a documentação interativa (Swagger) fica em `http://localhost:3333/docs`.

Em outro terminal, suba o frontend:

```powershell
cd vikings-barber/frontend
Copy-Item .env.example .env.local
npm install
npm run dev
```

O site abre em `http://localhost:3000`. O painel fica em `/painel` e o login em `/login`.

Usuários criados pelo seed:

| Papel    | E-mail                                                    | Senha                      |
| -------- | --------------------------------------------------------- | -------------------------- |
| Admin    | `admin@vikingsbarber.local`                               | `ADMIN_PASSWORD` do `.env` |
| Barbeiro | `ragnar@vikingsbarber.local`, `lagertha@...`, `bjorn@...` | `DEMO_PASSWORD` do `.env`  |

Se a porta 5432 já estiver em uso por outro Postgres, troque para `"127.0.0.1:5433:5432"` no `compose.yaml` e ajuste a porta no `DATABASE_URL`.

## Testes

```powershell
cd backend
npm test           # testes unitários
npm run test:e2e   # testes e2e (na primeira vez cria o banco vikings_barber_test)

cd ../frontend
npm run lint
npm run typecheck
npm run build
```

Os testes e2e sobem a aplicação inteira e conversam com o Postgres do `docker compose`. Eles só rodam num banco com "test" no nome, para nunca apagarem os seus dados de desenvolvimento.

## Rotas da API

| Rota                                    | Quem pode                         | O que faz                                 |
| --------------------------------------- | --------------------------------- | ----------------------------------------- |
| `POST /auth/login`                      | Qualquer pessoa                   | Entra e recebe o token da sessão          |
| `POST /auth/logout`                     | Logado                            | Encerra a sessão atual                    |
| `GET /auth/me`                          | Logado                            | Dados do usuário logado                   |
| `POST /auth/password`                   | Logado                            | Troca a própria senha                     |
| `GET /barbers`                          | Admin                             | Lista os barbeiros                        |
| `POST /barbers`                         | Admin                             | Cadastra barbeiro (e o login dele)        |
| `PATCH /barbers/:id`                    | Admin                             | Edita nome ou ativa/desativa              |
| `PUT /barbers/:id/password`             | Admin                             | Define uma nova senha para o barbeiro     |
| `GET /services`                         | Logado                            | Lista os serviços                         |
| `POST /services`, `PATCH /services/:id` | Admin                             | Cadastra e edita serviços                 |
| `GET /business-hours`                   | Qualquer pessoa                   | Horário de funcionamento da semana        |
| `PUT /business-hours`                   | Admin                             | Troca o horário de funcionamento          |
| `GET /appointments?date=`               | Admin (todos) ou barbeiro (o seu) | Agendamentos do dia                       |
| `POST /appointments`                    | Admin (todos) ou barbeiro (o seu) | Cria agendamento                          |
| `POST /appointments/:id/cancel`         | Admin (todos) ou barbeiro (o seu) | Cancela agendamento                       |
| `GET /public/agenda?date=`              | Qualquer pessoa                   | Horários ocupados de cada barbeiro no dia |
| `GET /public/services`                  | Qualquer pessoa                   | Serviços ativos com preço e duração       |
| `GET /health`                           | Qualquer pessoa                   | Verifica se a API e o banco estão no ar   |

As rotas logadas recebem o token no cabeçalho `Authorization: Bearer <token>`.

## Estrutura

```
vikings-barber/
├── backend/                  API em NestJS
│   ├── prisma/               schema e migrations do banco
│   ├── src/
│   │   ├── auth/             login, sessões, guards e papéis
│   │   ├── barbers/          cadastro de barbeiros
│   │   ├── services/         serviços da barbearia
│   │   ├── business-hours/   horário de funcionamento
│   │   ├── appointments/     agendamentos e regras da agenda
│   │   ├── public/           rotas da página pública
│   │   ├── health/           health check
│   │   └── database/seed.ts  dados iniciais
│   └── test/                 testes e2e
├── frontend/                 site e painel em Next.js
│   └── src/
│       ├── app/              páginas: agenda pública, login e /painel
│       ├── components/       botões, campos e formulários reutilizáveis
│       ├── lib/              cliente da API, sessão, datas e horários livres
│       └── proxy.ts          manda para o login quem abre o painel sem sessão
├── compose.yaml              Postgres para desenvolvimento
└── .github/workflows/ci.yml  lint, build e testes de cada parte a cada PR
```
