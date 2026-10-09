# Vikings Barber Web

Site e painel da Vikings Barber em Next.js 16 (App Router).

## Como funciona

O navegador só conversa com o Next.js. As páginas e as Server Actions chamam a API pelo servidor (`src/lib/api.ts`), mandando o token da sessão que fica num cookie `httpOnly` (`vb_session`). Assim o token nunca fica exposto ao JavaScript da página.

| Rota                | Quem vê          | O que tem                                            |
| ------------------- | ---------------- | ---------------------------------------------------- |
| `/`                 | Qualquer pessoa  | Horários livres, serviços e horário de funcionamento |
| `/login`            | Qualquer pessoa  | Entrada da equipe                                    |
| `/painel`           | Admin e barbeiro | Agenda do dia e novo agendamento                     |
| `/painel/barbeiros` | Admin            | Cadastro, nome, senha e ativação de barbeiros        |
| `/painel/servicos`  | Admin            | Serviços, duração e preço                            |
| `/painel/horarios`  | Admin            | Horário de funcionamento                             |
| `/painel/conta`     | Admin e barbeiro | Dados da conta e troca de senha                      |

## Variáveis de ambiente

Copie `.env.example` para `.env.local`.

| Variável          | Para que serve                                                                     |
| ----------------- | ---------------------------------------------------------------------------------- |
| `API_URL`         | Endereço da API. Padrão: `http://localhost:3333`                                   |
| `SHOP_TIMEZONE`   | Fuso da barbearia, igual ao da API. Padrão: `America/Sao_Paulo`                    |
| `WHATSAPP_NUMBER` | Opcional. Com DDI e DDD (ex.: `5511999999999`), liga os horários ao WhatsApp       |
| `COOKIE_SECURE`   | Opcional. `false` libera o login em `http://` no build de produção (só para teste) |

## Scripts

| Comando             | O que faz                                  |
| ------------------- | ------------------------------------------ |
| `npm run dev`       | Sobe em modo desenvolvimento na porta 3000 |
| `npm run build`     | Gera o build de produção (`standalone`)    |
| `npm start`         | Roda o build de produção                   |
| `npm run lint`      | ESLint                                     |
| `npm run typecheck` | Checagem de tipos                          |
| `npm run format`    | Formata com Prettier                       |

## Detalhes que valem saber

- Em produção o cookie de sessão sai com `Secure`, então o site precisa estar em HTTPS (ou `COOKIE_SECURE=false` num teste em `http://`).
- O limite de tentativas de login da API usa o IP real do visitante, que o Next.js repassa no `X-Forwarded-For`. Em produção ele precisa ficar atrás de um proxy (o Traefik do Coolify faz isso).
- Isso vale quando o site e a API estão no mesmo servidor. Com o site em outro lugar (na sua máquina ou na Cloudflare, chamando a API pelo domínio dela), a API conta as tentativas pelo IP do servidor do site.
- Os formulários com campos controlados (agendamento e horários) usam `useFormAction` em vez de `<form action>`, porque o reset automático do React deixaria o select da tela diferente do estado.
