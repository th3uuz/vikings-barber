"use client";

import { type FormEvent, useState, useTransition } from "react";
import type { FormState } from "@/lib/types";

type Action = (previous: FormState, formData: FormData) => Promise<FormState>;

/**
 * Envia o formulário para uma Server Action sem o reset automático que o React
 * faz em `<form action>`. Esse reset volta selects e checkboxes controlados ao
 * valor inicial na tela enquanto o estado continua com o valor escolhido, e o
 * formulário enviaria uma coisa mostrando outra. Use nos formulários com campos
 * controlados.
 */
export function useFormAction(action: Action, onSuccess?: () => void) {
  const [state, setState] = useState<FormState>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await action(null, formData);
      setState(result);
      if (result?.ok) onSuccess?.();
    });
  }

  return { state, pending, onSubmit };
}
