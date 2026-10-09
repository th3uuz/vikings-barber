"use client";

import { HelmetIcon } from "@/components/logo";
import { Button } from "@/components/ui";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <HelmetIcon className="size-16 opacity-80" />
      <h1 className="mt-4 font-display text-2xl font-bold tracking-wide">Algo deu errado</h1>
      <p className="mt-2 text-sm text-bone-400">
        Não conseguimos carregar esta página agora. Tente de novo em alguns instantes.
      </p>
      <Button variant="primary" className="mt-6" onClick={() => reset()}>
        Tentar de novo
      </Button>
    </main>
  );
}
