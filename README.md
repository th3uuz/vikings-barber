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

**Produção**

- Imagens Docker da API e do site, prontas para o Coolify: `docker-compose.api.yaml` sobe só o banco e a API (com o site em outro lugar) e `docker-compose.prod.yaml` sobe tudo junto.
- A API aplica as migrations e cria o primeiro admin sozinha ao subir.

**Próximas etapas**

- Primeiro deploy da API no Coolify, com o site rodando local.
- Backup diário do banco para fora da VPS antes de entrar dado real.
- Site em produção na Cloudflare. O Cloudflare Pages só publica sites estáticos e o painel precisa de servidor (login e formulários), então o site vai rodar em Cloudflare Workers. Antes disso, o limite de tentativas de login precisa passar a contar pelo IP do visitante: com o site fora do servidor, a API só enxerga o IP de quem a chama.

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

## Deploy no Coolify

Há dois arquivos de produção. Escolha conforme onde o site vai rodar:

| Arquivo                    | O que sobe            | Quando usar                                                  |
| -------------------------- | --------------------- | ------------------------------------------------------------ |
| `docker-compose.api.yaml`  | Postgres + API        | O site roda em outro lugar (na sua máquina ou na Cloudflare) |
| `docker-compose.prod.yaml` | Postgres + API + site | Tudo no mesmo servidor                                       |

### Só a API e o banco

1. No Coolify, abra o projeto, clique em **+ New** e escolha **Public Repository**. Cole `https://github.com/th3uuz/vikings-barber` e clique em **Check Repository**.
2. Use a branch `main`, o build pack **Docker Compose**, **Base Directory** `/` e **Docker Compose Location** `/docker-compose.api.yaml`.
3. Em **Environment Variables**, preencha:
   - `POSTGRES_PASSWORD`: só letras e números (ex.: gerada com `openssl rand -hex 24`).
   - `ADMIN_EMAIL` e `ADMIN_PASSWORD` (mínimo 8 caracteres): o primeiro admin.
4. No serviço **api**, coloque um domínio HTTPS com a porta 3333, por exemplo `https://api.seudominio.com.br:3333`. Sem domínio próprio, use `https://api.IP-DA-VPS.sslip.io:3333`, trocando `IP-DA-VPS` pelo IP do servidor (com os pontos). O `:3333` só diz ao Coolify para qual porta do container mandar; o endereço público fica sem porta.
5. Faça o deploy. Ao subir, a API aplica as migrations, cria o horário de funcionamento padrão e o admin.
6. Abra `https://api.IP-DA-VPS.sslip.io/health`. Tem que aparecer `{"status":"ok"}`. O certificado HTTPS (Let's Encrypt) é emitido pelo Coolify e pode levar alguns segundos depois do deploy.

Para usar o site na sua máquina com essa API, coloque o endereço dela, sem a porta, em `API_URL` no `frontend/.env.local` e rode `npm run dev` (veja [Como rodar no Windows](#como-rodar-no-windows)). Entre em `/login` com o `ADMIN_EMAIL` e o `ADMIN_PASSWORD` e troque a senha em **Minha conta**.

Com a API exposta, as regras continuam as mesmas: tudo exige login, menos `/health`, o login e a agenda pública, e o Swagger fica desligado. A API não libera CORS: quem conversa com ela é o servidor do Next.js, nunca o navegador.

### API, banco e site juntos

1. Crie o recurso como acima, mas com **Docker Compose Location** `/docker-compose.prod.yaml`.
2. Além das variáveis acima, preencha `WHATSAPP_NUMBER` se quiser (opcional, com DDI e DDD, só números).
3. Coloque o domínio no serviço **web** com a porta 3000, por exemplo `https://agenda.seudominio.com.br:3000` ou `https://agenda.IP-DA-VPS.sslip.io:3000`. Tem que ser `https://`, porque o login só funciona em HTTPS.
4. Faça o deploy, entre em `/login` e troque a senha em **Minha conta**.

Nesse modo a API e o banco não ficam expostos para fora: só o serviço `web` recebe tráfego, pelo proxy do Coolify.

Nos dois casos os dados do banco ficam no volume `postgres-data`, e `ADMIN_PASSWORD` pode ser apagada depois do primeiro deploy: ela só é usada enquanto não existe nenhum admin.

Fora do Coolify, em qualquer servidor com Docker:

```bash
cp .env.prod.example .env.prod   # e preencha
docker compose -f docker-compose.prod.yaml --env-file .env.prod up -d --build
```

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
├── docker-compose.api.yaml   produção só de Postgres e API (site em outro lugar)
├── docker-compose.prod.yaml  produção: Postgres, API e site
└── .github/workflows/ci.yml  lint, build, testes e a stack de produção a cada PR
```
