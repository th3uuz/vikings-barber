import type { Metadata } from "next";
import { ActionForm } from "@/components/action-form";
import { SubmitButton } from "@/components/form-feedback";
import { Badge, Card, CardTitle, EmptyState, Input, PageHeader } from "@/components/ui";
import { api } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { SHOP_TIME_ZONE } from "@/lib/dates";
import type { Barber } from "@/lib/types";
import { renameBarber, resetBarberPassword, setBarberActive } from "./actions";
import { CreateBarberForm } from "./create-barber-form";

export const metadata: Metadata = { title: "Barbeiros" };

const joinedAt = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: SHOP_TIME_ZONE });

export default async function BarbersPage() {
  await requireAdmin();
  const barbers = await api<Barber[]>("/barbers");

  return (
    <>
      <PageHeader title="Barbeiros" description="Quem pode entrar no painel e atender pela agenda." />

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_360px]">
        <section aria-label="Lista de barbeiros">
          {barbers.length === 0 ? (
            <EmptyState>Nenhum barbeiro cadastrado ainda.</EmptyState>
          ) : (
            <ul className="grid gap-3">
              {barbers.map((barber) => (
                <li key={barber.id} className="rounded-lg border border-coal-700 bg-coal-900 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="flex items-center gap-2 font-medium text-bone-50">
                        {barber.name}
                        <Badge tone={barber.active ? "green" : "neutral"}>{barber.active ? "Ativo" : "Inativo"}</Badge>
                      </p>
                      <p className="text-sm text-bone-400">{barber.email}</p>
                      <p className="text-xs text-bone-500">Desde {joinedAt.format(new Date(barber.createdAt))}</p>
                    </div>
                    <ActionForm
                      action={setBarberActive}
                      confirmMessage={
                        barber.active
                          ? `Desativar ${barber.name}? O acesso ao painel é bloqueado e a agenda some da página pública. Os horários já marcados continuam na agenda.`
                          : undefined
                      }
                      className="flex flex-col items-end"
                    >
                      <input type="hidden" name="id" value={barber.id} />
                      <input type="hidden" name="active" value={barber.active ? "false" : "true"} />
                      <SubmitButton
                        variant={barber.active ? "danger" : "secondary"}
                        size="sm"
                        pendingText="Salvando..."
                      >
                        {barber.active ? "Desativar" : "Reativar"}
                      </SubmitButton>
                    </ActionForm>
                  </div>

                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <details className="rounded-md border border-coal-700 px-3 py-2">
                      <summary className="cursor-pointer text-sm text-bone-200">Editar nome</summary>
                      <ActionForm action={renameBarber} className="mt-3 grid gap-2">
                        <input type="hidden" name="id" value={barber.id} />
                        <Input
                          name="name"
                          defaultValue={barber.name}
                          required
                          minLength={2}
                          maxLength={80}
                          aria-label="Nome"
                        />
                        <SubmitButton size="sm" variant="secondary">
                          Salvar nome
                        </SubmitButton>
                      </ActionForm>
                    </details>
                    <details className="rounded-md border border-coal-700 px-3 py-2">
                      <summary className="cursor-pointer text-sm text-bone-200">Redefinir senha</summary>
                      <ActionForm action={resetBarberPassword} className="mt-3 grid gap-2">
                        <input type="hidden" name="id" value={barber.id} />
                        <Input
                          name="password"
                          type="password"
                          required
                          minLength={8}
                          maxLength={128}
                          autoComplete="new-password"
                          placeholder="Nova senha (mín. 8)"
                          aria-label="Nova senha"
                        />
                        <SubmitButton size="sm" variant="secondary">
                          Redefinir senha
                        </SubmitButton>
                      </ActionForm>
                    </details>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <Card>
          <CardTitle description="O acesso é feito com este e-mail e só vale para a própria agenda.">
            Novo barbeiro
          </CardTitle>
          <CreateBarberForm />
        </Card>
      </div>
    </>
  );
}
