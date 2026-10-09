"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import type { FormState } from "@/lib/types";
import { buttonClasses, cn } from "./ui";

/** Botão de envio que se desativa enquanto a Server Action roda. */
export function SubmitButton({
  children,
  pendingText = "Salvando...",
  variant = "primary",
  size = "md",
  className,
}: {
  children: ReactNode;
  pendingText?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={buttonClasses(variant, size, className)}>
      {pending ? pendingText : children}
    </button>
  );
}

/** Mensagem de sucesso ou erro devolvida pela Server Action. */
export function FormMessage({ state, className }: { state: FormState; className?: string }) {
  if (!state?.message) return null;
  return (
    <div
      role={state.ok ? "status" : "alert"}
      className={cn(
        "rounded-md border px-3 py-2 text-sm",
        state.ok
          ? "border-moss-400/40 bg-moss-400/10 text-moss-400"
          : "border-blood-500/40 bg-blood-500/10 text-blood-400",
        className,
      )}
    >
      <p>{state.message}</p>
      {state.details && state.details.length > 0 && (
        <ul className="mt-1 list-disc pl-5 text-xs">
          {state.details.map((detail) => (
            <li key={detail}>{detail}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
