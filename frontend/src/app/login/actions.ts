"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { api, ApiError, SESSION_COOKIE } from "@/lib/api";
import { rawText, text } from "@/lib/form-state";
import type { FormState, LoginResponse } from "@/lib/types";

export async function login(_previous: FormState, formData: FormData): Promise<FormState> {
  const email = text(formData, "email");
  const password = rawText(formData, "password");
  const values = { email };

  if (!email || !password) {
    return { ok: false, message: "Informe e-mail e senha.", values };
  }

  let session: LoginResponse;
  try {
    session = await api<LoginResponse>("/auth/login", {
      method: "POST",
      body: { email, password },
      auth: false,
    });
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    const message =
      error.status === 429
        ? "Muitas tentativas seguidas. Aguarde um minuto e tente de novo."
        : error.status === 400
          ? "E-mail ou senha inválidos."
          : error.message;
    return { ok: false, message, values };
  }

  // O token fica num cookie httpOnly: o JavaScript da página não consegue lê-lo.
  (await cookies()).set(SESSION_COOKIE, session.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(session.expiresAt),
  });

  redirect("/painel");
}
