"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/form-feedback";
import { cancelAppointment } from "./agenda-actions";

export function CancelAppointmentButton({ id, description }: { id: string; description: string }) {
  const [state, formAction] = useActionState(cancelAppointment, null);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!window.confirm(`Cancelar ${description}?`)) event.preventDefault();
      }}
      className="flex flex-col items-end gap-1"
    >
      <input type="hidden" name="id" value={id} />
      <SubmitButton variant="danger" size="sm" pendingText="Cancelando...">
        Cancelar
      </SubmitButton>
      {state && !state.ok && (
        <p role="alert" className="max-w-48 text-right text-xs text-blood-400">
          {state.message}
        </p>
      )}
    </form>
  );
}
