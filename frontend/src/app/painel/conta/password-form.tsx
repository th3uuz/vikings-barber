"use client";

import { useActionState } from "react";
import { FormMessage, SubmitButton } from "@/components/form-feedback";
import { Field, Input } from "@/components/ui";
import { changePassword } from "./actions";

export function PasswordForm() {
  const [state, formAction] = useActionState(changePassword, null);

  return (
    <form action={formAction} className="grid gap-4">
      <Field label="Senha atual">
        <Input name="currentPassword" type="password" required maxLength={128} autoComplete="current-password" />
      </Field>
      <Field label="Nova senha" hint="Mínimo de 8 caracteres.">
        <Input name="newPassword" type="password" required minLength={8} maxLength={128} autoComplete="new-password" />
      </Field>
      <Field label="Confirme a nova senha">
        <Input
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          maxLength={128}
          autoComplete="new-password"
        />
      </Field>
      <FormMessage state={state} />
      <SubmitButton pendingText="Alterando..." className="justify-self-start">
        Alterar senha
      </SubmitButton>
    </form>
  );
}
