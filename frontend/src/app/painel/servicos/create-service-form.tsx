"use client";

import { useActionState } from "react";
import { FormMessage, SubmitButton } from "@/components/form-feedback";
import { Field, Input } from "@/components/ui";
import { createService } from "./actions";

export function CreateServiceForm() {
  const [state, formAction] = useActionState(createService, null);

  return (
    <form action={formAction} className="grid gap-4">
      <Field label="Nome">
        <Input
          name="name"
          required
          minLength={2}
          maxLength={60}
          placeholder="Corte degradê"
          defaultValue={state?.values?.name}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Duração (min)">
          <Input
            name="durationMinutes"
            type="number"
            required
            min={5}
            max={480}
            step={5}
            defaultValue={state?.values?.durationMinutes ?? "30"}
          />
        </Field>
        <Field label="Preço (R$)">
          <Input name="price" required inputMode="decimal" placeholder="45,00" defaultValue={state?.values?.price} />
        </Field>
      </div>
      <FormMessage state={state} />
      <SubmitButton pendingText="Salvando..." className="w-full">
        Adicionar serviço
      </SubmitButton>
    </form>
  );
}
