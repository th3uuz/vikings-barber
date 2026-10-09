import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { Card } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Quem já tem sessão válida vai direto para o painel.
  if (await getCurrentUser()) redirect("/painel");

  const { sessao } = await searchParams;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
      <Link href="/" className="mb-8 self-center">
        <Logo />
      </Link>
      <Card className="p-6 sm:p-8">
        <h1 className="font-display text-xl font-bold tracking-wide">Área da equipe</h1>
        <p className="mb-6 mt-1 text-sm text-bone-400">Entre com o e-mail e a senha que o administrador cadastrou.</p>
        {sessao === "expirada" && (
          <p className="mb-4 rounded-md border border-gold-500/40 bg-gold-500/10 px-3 py-2 text-sm text-gold-300">
            Sua sessão terminou. Entre de novo para continuar.
          </p>
        )}
        <LoginForm />
      </Card>
      <Link href="/" className="mt-6 self-center text-sm text-bone-400 hover:text-gold-300">
        ← Ver a agenda da barbearia
      </Link>
    </main>
  );
}
