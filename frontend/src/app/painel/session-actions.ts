"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { api, SESSION_COOKIE } from "@/lib/api";

export async function logout() {
  try {
    // Encerra a sessão na API também, não só no navegador.
    await api("/auth/logout", { method: "POST" });
  } catch {
    // Se a sessão já tinha expirado, basta apagar o cookie.
  }
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}
