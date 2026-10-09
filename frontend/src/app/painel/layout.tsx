import type { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { Badge, Button } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { type NavItem, PanelNav } from "./panel-nav";
import { logout } from "./session-actions";

export default async function PanelLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  const isAdmin = user.role === "ADMIN";

  // O menu só esconde o que a pessoa não pode usar; quem bloqueia de verdade é a API.
  const items: NavItem[] = [
    { href: "/painel", label: "Agenda" },
    ...(isAdmin
      ? [
          { href: "/painel/barbeiros", label: "Barbeiros" },
          { href: "/painel/servicos", label: "Serviços" },
          { href: "/painel/horarios", label: "Horários" },
        ]
      : []),
    { href: "/painel/conta", label: "Minha conta" },
  ];

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-coal-700 bg-coal-900/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 pt-4 pb-2">
          <div className="flex items-center justify-between gap-4">
            <Link href="/painel" aria-label="Início do painel">
              <Logo compact />
            </Link>
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium text-bone-50">{user.name}</p>
                <p className="text-xs text-bone-500">{user.email}</p>
              </div>
              <Badge tone={isAdmin ? "gold" : "neutral"}>{isAdmin ? "Administrador" : "Barbeiro"}</Badge>
              <form action={logout}>
                <Button type="submit" variant="ghost" size="sm">
                  Sair
                </Button>
              </form>
            </div>
          </div>
          <PanelNav items={items} />
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
