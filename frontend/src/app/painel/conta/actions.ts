"use server";

import { api } from "@/lib/api";
import { formError, rawText } from "@/lib/form-state";
import type { FormState } from "@/lib/types";

export async function changePassword(_previous: FormState, formData: FormData): Promise<FormState> {
  const currentPassword = rawText(formData, "currentPassword");
  const newPassword = rawText(formData, "newPassword");

  if (newPassword !== rawText(formData, "confirmPassword")) {
    return { ok: false, message: "A confirmação não bate com a nova senha." };
  }

  try {
    await api("/auth/password", { method: "POST", body: { currentPassword, newPassword } });
  } catch (error) {
    return formError(error);
  }

  return { ok: true, message: "Senha alterada. Outros aparelhos conectados na sua conta foram desconectados." };
}
