"use client";

import { useActionState } from "react";
import { FormMessage, SubmitButton } from "@/components/form-feedback";
import { Field, Input } from "@/components/ui";
import { login } from "./actions";

export function LoginForm() {
  const [state, formAction] = useActionState(login, null);

  return (
    <form action={formAction} className="grid gap-4">
      <Field label="E-mail">
        <Input
          type="email"
          name="email"
          autoComplete="username"
          required
          autoFocus
          defaultValue={state?.values?.email}
          placeholder="voce@vikingsbarber.com"
        />
      </Field>
      <Field label="Senha">
        <Input type="password" name="password" autoComplete="current-password" required maxLength={128} />
      </Field>
      <FormMessage state={state} />
      <SubmitButton pendingText="Entrando..." className="w-full">
        Entrar
      </SubmitButton>
    </form>
  );
}
