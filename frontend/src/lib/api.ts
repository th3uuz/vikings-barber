import "server-only";
import { cookies, headers } from "next/headers";

/**
 * Cliente da API. Só roda no servidor do Next.js: o navegador nunca fala direto
 * com a API e nunca vê o token, que fica num cookie httpOnly.
 */

export const SESSION_COOKIE = "vb_session";

const API_URL = process.env.API_URL ?? "http://localhost:3333";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    /** Mensagens de validação campo a campo, quando a API devolve uma lista. */
    readonly details: string[] = [],
  ) {
    super(message);
  }
}

/** Nomes dos campos da API como aparecem nas telas. */
const FIELD_LABELS: Record<string, string> = {
  name: "Nome",
  email: "E-mail",
  password: "Senha",
  currentPassword: "Senha atual",
  newPassword: "Nova senha",
  durationMinutes: "Duração",
  priceCents: "Preço",
  barberId: "Barbeiro",
  serviceId: "Serviço",
  startsAt: "Horário",
  clientName: "Nome do cliente",
  clientPhone: "Telefone",
  notes: "Observações",
};

/** "clientName: Pequeno demais..." -> "Nome do cliente: Pequeno demais..." */
function humanizeDetail(detail: string): string {
  const match = /^([\w.]+): (.*)$/.exec(detail);
  if (!match) return detail;
  const label = FIELD_LABELS[match[1]];
  return label ? `${label}: ${match[2]}` : match[2];
}

interface ApiOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, string | undefined>;
  /** Manda o token da sessão (padrão: true). */
  auth?: boolean;
}

export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const requestHeaders = new Headers({ Accept: "application/json" });

  // Repassa o IP real do visitante para a API aplicar o limite de tentativas por pessoa.
  const forwardedFor = (await headers()).get("x-forwarded-for");
  if (forwardedFor) requestHeaders.set("X-Forwarded-For", forwardedFor);

  if (options.auth !== false) {
    const token = (await cookies()).get(SESSION_COOKIE)?.value;
    if (token) requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  let body: string | undefined;
  if (options.body !== undefined) {
    requestHeaders.set("Content-Type", "application/json");
    body = JSON.stringify(options.body);
  }

  const url = new URL(path, API_URL);
  for (const [key, value] of Object.entries(options.query ?? {})) {
    if (value !== undefined) url.searchParams.set(key, value);
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: options.method ?? "GET",
      headers: requestHeaders,
      body,
      cache: "no-store",
    });
  } catch {
    throw new ApiError(503, "Não foi possível falar com o servidor. Tente de novo em instantes.");
  }

  if (response.status === 204) return undefined as T;

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message: unknown = data?.message;
    if (Array.isArray(message)) {
      throw new ApiError(
        response.status,
        "Confira os dados informados.",
        message.map((item) => humanizeDetail(String(item))),
      );
    }
    throw new ApiError(response.status, typeof message === "string" ? message : "Algo deu errado. Tente de novo.");
  }
  return data as T;
}
