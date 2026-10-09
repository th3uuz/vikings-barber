"use server";

import { refresh } from "next/cache";
import { api } from "@/lib/api";
import { formError, text } from "@/lib/form-state";
import { WEEKDAYS } from "@/lib/dates";
import type { DayHours, FormState } from "@/lib/types";

export async function updateBusinessHours(_previous: FormState, formData: FormData): Promise<FormState> {
  const days: DayHours[] = [];

  for (let weekday = 0; weekday < 7; weekday++) {
    const open = formData.get(`open-${weekday}`) === "on";
    const opensAt = text(formData, `opensAt-${weekday}`);
    const closesAt = text(formData, `closesAt-${weekday}`);

    if (open && (!opensAt || !closesAt)) {
      return { ok: false, message: `Informe abertura e fechamento de ${WEEKDAYS[weekday].toLowerCase()}.` };
    }
    days.push({ weekday, opensAt: open ? opensAt : null, closesAt: open ? closesAt : null });
  }

  try {
    await api("/business-hours", { method: "PUT", body: days });
  } catch (error) {
    return formError(error);
  }

  refresh();
  return { ok: true, message: "Horário de funcionamento salvo." };
}
