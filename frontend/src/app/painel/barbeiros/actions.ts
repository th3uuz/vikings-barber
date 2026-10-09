"use server";

import { refresh } from "next/cache";
import { api } from "@/lib/api";
import { formError, idFrom, rawText, text } from "@/lib/form-state";
import type { FormState } from "@/lib/types";

export async function createBarber(_previous: FormState, formData: FormData): Promise<FormState> {
  const values = { name: text(formData, "name"), email: text(formData, "email") };
  const password = rawText(formData, "password");

  try {
    await api("/barbers", { method: "POST", body: { ...values, password } });
  } catch (error) {
    return formError(error, values);
  }

  refresh();
  return { ok: true, message: `Cadastro de ${values.name} criado. Envie o e-mail e a senha para o primeiro acesso.` };
}

export async function renameBarber(_previous: FormState, formData: FormData): Promise<FormState> {
  const id = idFrom(formData);
  if (!id) return { ok: false, message: "Barbeiro inválido." };

  try {
    await api(`/barbers/${id}`, { method: "PATCH", body: { name: text(formData, "name") } });
  } catch (error) {
    return formError(error);
  }

  refresh();
  return { ok: true, message: "Nome atualizado." };
}

export async function setBarberActive(_previous: FormState, formData: FormData): Promise<FormState> {
  const id = idFrom(formData);
  if (!id) return { ok: false, message: "Barbeiro inválido." };
  const active = text(formData, "active") === "true";

  try {
    await api(`/barbers/${id}`, { method: "PATCH", body: { active } });
  } catch (error) {
    return formError(error);
  }

  refresh();
  return {
    ok: true,
    message: active ? "Acesso reativado." : "Acesso desativado. Quem estava conectado foi desconectado.",
  };
}

export async function resetBarberPassword(_previous: FormState, formData: FormData): Promise<FormState> {
  const id = idFrom(formData);
  if (!id) return { ok: false, message: "Barbeiro inválido." };

  try {
    await api(`/barbers/${id}/password`, { method: "PUT", body: { password: rawText(formData, "password") } });
  } catch (error) {
    return formError(error);
  }

  return { ok: true, message: "Senha redefinida. Quem estava conectado com a senha antiga foi desconectado." };
}
