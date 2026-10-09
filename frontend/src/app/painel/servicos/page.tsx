import type { Metadata } from "next";
import { ActionForm } from "@/components/action-form";
import { SubmitButton } from "@/components/form-feedback";
import { Badge, Card, CardTitle, EmptyState, Field, Input, PageHeader } from "@/components/ui";
import { api } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { formatDuration, formatPrice } from "@/lib/format";
import type { Service } from "@/lib/types";
import { updateService } from "./actions";
import { CreateServiceForm } from "./create-service-form";

export const metadata: Metadata = { title: "Serviços" };

const priceInput = (cents: number) => (cents / 100).toFixed(2).replace(".", ",");

export default async function ServicesPage() {
  await requireAdmin();
  const services = await api<Service[]>("/services");

  return (
    <>
      <PageHeader
        title="Serviços"
        description="O que a barbearia oferece. Mudar o preço não altera agendamentos já marcados."
      />

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_360px]">
        <section aria-label="Lista de serviços">
          {services.length === 0 ? (
            <EmptyState>Nenhum serviço cadastrado ainda.</EmptyState>
          ) : (
            <ul className="grid gap-3">
              {services.map((service) => (
                <li key={service.id} className="rounded-lg border border-coal-700 bg-coal-900 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="flex items-center gap-2 font-medium text-bone-50">
                      {service.name}
                      {!service.active && <Badge>Fora do cardápio</Badge>}
                    </p>
                    <p className="text-sm text-bone-400">
                      {formatDuration(service.durationMinutes)} ·{" "}
                      <span className="font-medium text-gold-300">{formatPrice(service.priceCents)}</span>
                    </p>
                  </div>
                  <details className="mt-3 rounded-md border border-coal-700 px-3 py-2">
                    <summary className="cursor-pointer text-sm text-bone-200">Editar</summary>
                    <ActionForm action={updateService} className="mt-3 grid gap-3">
                      <input type="hidden" name="id" value={service.id} />
                      <Field label="Nome">
                        <Input name="name" defaultValue={service.name} required minLength={2} maxLength={60} />
                      </Field>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Duração (min)">
                          <Input
                            name="durationMinutes"
                            type="number"
                            min={5}
                            max={480}
                            step={5}
                            required
                            defaultValue={service.durationMinutes}
                          />
                        </Field>
                        <Field label="Preço (R$)">
                          <Input
                            name="price"
                            inputMode="decimal"
                            required
                            defaultValue={priceInput(service.priceCents)}
                          />
                        </Field>
                      </div>
                      <label className="flex items-center gap-2 text-sm text-bone-200">
                        <input
                          type="checkbox"
                          name="active"
                          defaultChecked={service.active}
                          className="size-4 accent-gold-500"
                        />
                        Disponível para agendar
                      </label>
                      <SubmitButton size="sm" variant="secondary">
                        Salvar alterações
                      </SubmitButton>
                    </ActionForm>
                  </details>
                </li>
              ))}
            </ul>
          )}
        </section>

        <Card>
          <CardTitle description="Aparece na agenda pública e no formulário de agendamento.">Novo serviço</CardTitle>
          <CreateServiceForm />
        </Card>
      </div>
    </>
  );
}
