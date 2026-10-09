"use server";

import { refresh } from "next/cache";
import { api } from "@/lib/api";
import { formError, idFrom, text } from "@/lib/form-state";
import type { FormState } from "@/lib/types";

export async function createAppointment(_previous: FormState, formData: FormData): Promise<FormState> {
  const values = {
    barberId: text(formData, "barberId"),
    serviceId: text(formData, "serviceId"),
    startsAt: text(formData, "startsAt"),
    clientName: text(formData, "clientName"),
    clientPhone: text(formData, "clientPhone"),
    notes: text(formData, "notes"),
  };

  if (!values.startsAt) {
    return { ok: false, message: "Escolha um horário livre.", values };
  }

  try {
    // Quem garante que o barbeiro só mexe na própria agenda é a API, não esta tela.
    await api("/appointments", {
      method: "POST",
      body: {
        barberId: values.barberId,
        serviceId: values.serviceId,
        startsAt: values.startsAt,
        clientName: values.clientName,
        clientPhone: values.clientPhone || undefined,
        notes: values.notes || undefined,
      },
    });
  } catch (error) {
    // Se alguém ocupou o horário antes, a lista de horários livres é atualizada.
    refresh();
    return formError(error, values);
  }

  refresh();
  return { ok: true, message: `Horário de ${values.clientName} agendado.` };
}

export async function cancelAppointment(_previous: FormState, formData: FormData): Promise<FormState> {
  const id = idFrom(formData);
  if (!id) return { ok: false, message: "Agendamento inválido." };

  try {
    await api(`/appointments/${id}/cancel`, { method: "POST" });
  } catch (error) {
    return formError(error);
  }

  refresh();
  return { ok: true, message: "Agendamento cancelado." };
}
