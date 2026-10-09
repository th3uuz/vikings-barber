"use client";

import { type ReactNode, useActionState } from "react";
import type { FormState } from "@/lib/types";
import { FormMessage } from "./form-feedback";

type Action = (previous: FormState, formData: FormData) => Promise<FormState>;

/**
 * Formulário ligado a uma Server Action que mostra a mensagem de retorno.
 * Com `confirmMessage`, pede confirmação antes de enviar.
 */
export function ActionForm({
  action,
  children,
  confirmMessage,
  className,
}: {
  action: Action;
  children: ReactNode;
  confirmMessage?: string;
  className?: string;
}) {
  const [state, formAction] = useActionState(action, null);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (confirmMessage && !window.confirm(confirmMessage)) event.preventDefault();
      }}
      className={className}
    >
      {children}
      <FormMessage state={state} className="mt-2" />
    </form>
  );
}
