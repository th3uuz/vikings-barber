import "server-only";
import { redirect } from "next/navigation";
import { ApiError } from "./api";
import { isUuid } from "./ids";
import type { FormState } from "./types";

/**
 * Converte um erro da API numa mensagem para o formulário. Sessão expirada volta
 * para o login; erros inesperados sobem normalmente.
 */
export function formError(error: unknown, values?: Record<string, string>): FormState {
  if (error instanceof ApiError && error.status === 401) {
    redirect("/login?sessao=expirada");
  }
  if (error instanceof ApiError) {
    return { ok: false, message: error.message, details: error.details, values };
  }
  throw error;
}

export function text(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

/** Senhas não levam trim: espaço no começo ou no fim faz parte da senha. */
export function rawText(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export function optionalText(formData: FormData, name: string): string | undefined {
  return text(formData, name) || undefined;
}

/** Lê um id do formulário e garante que é um UUID antes de usá-lo na URL da API. */
export function idFrom(formData: FormData, name = "id"): string | null {
  const value = text(formData, name);
  return isUuid(value) ? value : null;
}
