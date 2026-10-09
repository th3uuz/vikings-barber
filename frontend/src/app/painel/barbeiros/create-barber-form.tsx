"use client";

import { useActionState } from "react";
import { FormMessage, SubmitButton } from "@/components/form-feedback";
import { Field, Input } from "@/components/ui";
import { createBarber } from "./actions";

export function CreateBarberForm() {
  const [state, formAction] = useActionState(createBarber, null);

  return (
    <form action={formAction} className="grid gap-4">
      <Field label="Nome">
        <Input name="name" required minLength={2} maxLength={80} defaultValue={state?.values?.name} />
      </Field>
      <Field label="E-mail de acesso">
        <Input name="email" type="email" required autoComplete="off" defaultValue={state?.values?.email} />
      </Field>
      <Field label="Senha inicial" hint="Mínimo de 8 caracteres. Dá para trocar depois em Minha conta.">
        <Input name="password" type="password" required minLength={8} maxLength={128} autoComplete="new-password" />
      </Field>
      <FormMessage state={state} />
      <SubmitButton pendingText="Cadastrando..." className="w-full">
        Cadastrar barbeiro
      </SubmitButton>
    </form>
  );
}
