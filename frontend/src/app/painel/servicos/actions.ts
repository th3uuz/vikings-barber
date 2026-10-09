"use server";

import { refresh } from "next/cache";
import { api } from "@/lib/api";
import { formError, idFrom, text } from "@/lib/form-state";
import { parsePriceToCents } from "@/lib/format";
import type { FormState } from "@/lib/types";

/** Lê nome, duração e preço do formulário; devolve uma mensagem se algo estiver errado. */
function readService(formData: FormData) {
  const values = {
    name: text(formData, "name"),
    durationMinutes: text(formData, "durationMinutes"),
    price: text(formData, "price"),
  };
  const durationMinutes = Number(values.durationMinutes);
  const priceCents = parsePriceToCents(values.price);

  if (!Number.isInteger(durationMinutes)) {
    return { values, error: "Informe a duração em minutos (ex.: 30)." };
  }
  if (Number.isNaN(priceCents)) {
    return { values, error: "Preço inválido. Use o formato 45,00." };
  }
  return { values, body: { name: values.name, durationMinutes, priceCents } };
}

export async function createService(_previous: FormState, formData: FormData): Promise<FormState> {
  const { values, error, body } = readService(formData);
  if (!body) return { ok: false, message: error, values };

  try {
    await api("/services", { method: "POST", body });
  } catch (apiError) {
    return formError(apiError, values);
  }

  refresh();
  return { ok: true, message: `${body.name} adicionado aos serviços.` };
}

export async function updateService(_previous: FormState, formData: FormData): Promise<FormState> {
  const id = idFrom(formData);
  if (!id) return { ok: false, message: "Serviço inválido." };

  const { values, error, body } = readService(formData);
  if (!body) return { ok: false, message: error, values };

  try {
    await api(`/services/${id}`, {
      method: "PATCH",
      body: { ...body, active: formData.get("active") === "on" },
    });
  } catch (apiError) {
    return formError(apiError, values);
  }

  refresh();
  return { ok: true, message: "Serviço atualizado." };
}
