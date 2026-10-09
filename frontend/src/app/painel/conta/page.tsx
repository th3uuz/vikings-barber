import type { Metadata } from "next";
import { Card, CardTitle, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { PasswordForm } from "./password-form";

export const metadata: Metadata = { title: "Minha conta" };

export default async function AccountPage() {
  const user = await requireUser();

  return (
    <>
      <PageHeader title="Minha conta" />
      <div className="grid max-w-3xl items-start gap-6 md:grid-cols-2">
        <Card>
          <CardTitle>Seus dados</CardTitle>
          <dl className="grid gap-3 text-sm">
            <div>
              <dt className="text-bone-500">Nome</dt>
              <dd className="font-medium text-bone-50">{user.name}</dd>
            </div>
            <div>
              <dt className="text-bone-500">E-mail</dt>
              <dd className="font-medium text-bone-50">{user.email}</dd>
            </div>
            <div>
              <dt className="text-bone-500">Perfil</dt>
              <dd className="font-medium text-bone-50">
                {user.role === "ADMIN"
                  ? "Administrador: gerencia barbeiros, serviços, horários e todas as agendas."
                  : "Barbeiro: agenda e cancela os próprios atendimentos."}
              </dd>
            </div>
          </dl>
          {user.role === "BARBER" && (
            <p className="mt-4 text-xs text-bone-500">Para mudar nome ou e-mail, fale com o administrador.</p>
          )}
        </Card>
        <Card>
          <CardTitle>Trocar senha</CardTitle>
          <PasswordForm />
        </Card>
      </div>
    </>
  );
}
