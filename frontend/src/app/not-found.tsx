import Link from "next/link";
import { HelmetIcon } from "@/components/logo";
import { buttonClasses } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <HelmetIcon className="size-16 opacity-80" />
      <h1 className="mt-4 font-display text-2xl font-bold tracking-wide">Página não encontrada</h1>
      <p className="mt-2 text-sm text-bone-400">O endereço pode ter mudado ou nunca ter existido.</p>
      <Link href="/" className={buttonClasses("primary", "md", "mt-6")}>
        Voltar para a agenda
      </Link>
    </main>
  );
}
