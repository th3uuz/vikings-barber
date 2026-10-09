import Form from "next/form";
import Link from "next/link";
import { addDays, formatLongDate, todayInShop } from "@/lib/dates";
import { buttonClasses, Input } from "./ui";

/**
 * Navegação entre dias usando só a URL (?data=AAAA-MM-DD), então funciona até
 * sem JavaScript e o link pode ser compartilhado.
 */
export function DateNav({
  basePath,
  date,
  extraParams = {},
}: {
  basePath: string;
  date: string;
  /** Outros filtros da página que devem continuar na URL (ex.: barbeiro). */
  extraParams?: Record<string, string | undefined>;
}) {
  const hrefFor = (target: string) => {
    const params = new URLSearchParams({ data: target });
    for (const [key, value] of Object.entries(extraParams)) {
      if (value) params.set(key, value);
    }
    return `${basePath}?${params}`;
  };
  const today = todayInShop();

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium text-gold-300">{formatLongDate(date)}</p>
      <div className="flex flex-wrap items-center gap-2">
        <Link href={hrefFor(addDays(date, -1))} className={buttonClasses("secondary", "md")} aria-label="Dia anterior">
          ←
        </Link>
        <Form action={basePath} className="flex items-center gap-2">
          {Object.entries(extraParams).map(([key, value]) =>
            value ? <input key={key} type="hidden" name={key} value={value} /> : null,
          )}
          <Input type="date" name="data" defaultValue={date} aria-label="Escolher dia" className="w-40" required />
          <button type="submit" className={buttonClasses("secondary", "md")}>
            Ver
          </button>
        </Form>
        <Link href={hrefFor(addDays(date, 1))} className={buttonClasses("secondary", "md")} aria-label="Próximo dia">
          →
        </Link>
        {date !== today && (
          <Link href={hrefFor(today)} className={buttonClasses("ghost", "md")}>
            Hoje
          </Link>
        )}
      </div>
    </div>
  );
}
