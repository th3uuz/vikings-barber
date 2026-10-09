import type { Metadata } from "next";
import Link from "next/link";
import { DateNav } from "@/components/date-nav";
import { Logo } from "@/components/logo";
import { buttonClasses, cn, EmptyState } from "@/components/ui";
import { api } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { addDays, formatShortDate, isLocalDate, todayInShop, WEEKDAYS } from "@/lib/dates";
import { formatDuration, formatPrice } from "@/lib/format";
import { daySlots } from "@/lib/slots";
import type { DayHours, PublicAgenda, PublicService } from "@/lib/types";

export const metadata: Metadata = {
  title: { absolute: "Vikings Barber | Agenda e serviços" },
};

const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

function whatsappLink(number: string, message: string) {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const today = todayInShop();
  const date = isLocalDate(params.data) && params.data >= today ? params.data : today;
  const whatsapp = process.env.WHATSAPP_NUMBER?.replace(/\D/g, "") || null;

  const [agenda, services, week, user] = await Promise.all([
    api<PublicAgenda>("/public/agenda", { query: { date }, auth: false }),
    api<PublicService[]>("/public/services", { auth: false }),
    api<DayHours[]>("/business-hours", { auth: false }),
    getCurrentUser(),
  ]);

  // Server Component roda uma vez por requisição, então ler o relógio aqui é seguro.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
  const columns = agenda.barbers.map((barber) => ({
    ...barber,
    slots:
      agenda.opensAt && agenda.closesAt
        ? daySlots(date, agenda.opensAt, agenda.closesAt, barber.busy, agenda.timeZone).filter(
            // Para hoje, só mostra o que ainda não passou.
            (slot) => slot.end > now,
          )
        : [],
  }));
  const hasSlotsLeft = columns.some((column) => column.slots.length > 0);

  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-5">
        <Link href="/" aria-label="Vikings Barber, página inicial">
          <Logo />
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <a href="#servicos" className="hidden rounded-md px-3 py-2 text-bone-200 hover:text-gold-300 sm:block">
            Serviços
          </a>
          <a href="#funcionamento" className="hidden rounded-md px-3 py-2 text-bone-200 hover:text-gold-300 sm:block">
            Funcionamento
          </a>
          <Link href={user ? "/painel" : "/login"} className={buttonClasses("secondary", "sm")}>
            {user ? "Ir para o painel" : "Área da equipe"}
          </Link>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16">
        <section className="py-10 sm:py-14">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-gold-400">Barbearia</p>
          <h1 className="mt-3 max-w-3xl font-display text-4xl font-bold leading-tight tracking-wide sm:text-5xl">
            Corte de respeito, na hora marcada.
          </h1>
          <p className="mt-4 max-w-2xl text-bone-400">
            Veja os horários livres de cada barbeiro e{" "}
            {whatsapp ? "toque no horário para pedir pelo WhatsApp." : "fale com a gente para garantir o seu."}
          </p>
          {whatsapp && (
            <a
              href={whatsappLink(whatsapp, "Olá! Quero agendar um horário na Vikings Barber.")}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses("primary", "md", "mt-6")}
            >
              Agendar pelo WhatsApp
            </a>
          )}
        </section>

        <section aria-labelledby="agenda-titulo" className="grid gap-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 id="agenda-titulo" className="font-display text-2xl font-bold tracking-wide">
              Horários livres
            </h2>
            <DateNav basePath="/" date={date} />
          </div>

          {agenda.opensAt === null ? (
            <EmptyState>A barbearia não abre neste dia. Escolha outra data.</EmptyState>
          ) : agenda.barbers.length === 0 ? (
            <EmptyState>Nenhum barbeiro atendendo por enquanto.</EmptyState>
          ) : !hasSlotsLeft ? (
            <EmptyState>
              O expediente de hoje já acabou.{" "}
              <Link href={`/?data=${addDays(date, 1)}`} className="text-gold-300 underline">
                Ver o próximo dia
              </Link>
            </EmptyState>
          ) : (
            <>
              <div className="flex gap-4 text-xs text-bone-400">
                <span className="flex items-center gap-1.5">
                  <span className="size-3 rounded-sm border border-gold-500/60 bg-gold-500/15" /> Livre
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-3 rounded-sm border border-coal-700 bg-coal-800" /> Ocupado
                </span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {columns.map((barber) => (
                  <article key={barber.id} className="rounded-xl border border-coal-700 bg-coal-900/80 p-4">
                    <h3 className="mb-3 font-display text-lg font-bold tracking-wide">{barber.name}</h3>
                    {barber.slots.length === 0 ? (
                      <p className="text-sm text-bone-500">Sem horários restantes neste dia.</p>
                    ) : (
                      <ul className="grid grid-cols-4 gap-2">
                        {barber.slots.map((slot) => {
                          const chip = cn(
                            "block rounded-md border px-1 py-1.5 text-center text-sm tabular-nums",
                            slot.free
                              ? "border-gold-500/60 bg-gold-500/15 text-gold-300"
                              : "border-coal-700 bg-coal-800 text-bone-500 line-through",
                          );
                          return (
                            <li key={slot.time}>
                              {slot.free && whatsapp ? (
                                <a
                                  href={whatsappLink(
                                    whatsapp,
                                    `Olá! Quero agendar com ${barber.name} em ${formatShortDate(date)} às ${slot.time}.`,
                                  )}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={cn(chip, "hover:bg-gold-500/30")}
                                  aria-label={`${slot.time} livre com ${barber.name}, pedir pelo WhatsApp`}
                                >
                                  {slot.time}
                                </a>
                              ) : (
                                <span className={chip} aria-label={`${slot.time} ${slot.free ? "livre" : "ocupado"}`}>
                                  {slot.time}
                                </span>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </article>
                ))}
              </div>
            </>
          )}
        </section>

        <div className="mt-16 grid gap-10 lg:grid-cols-[3fr_2fr]">
          <section id="servicos" aria-labelledby="servicos-titulo" className="scroll-mt-6">
            <h2 id="servicos-titulo" className="mb-4 font-display text-2xl font-bold tracking-wide">
              Serviços
            </h2>
            {services.length === 0 ? (
              <EmptyState>Em breve.</EmptyState>
            ) : (
              <ul className="divide-y divide-coal-700 rounded-xl border border-coal-700 bg-coal-900/80">
                {services.map((service) => (
                  <li key={service.id} className="flex items-center justify-between gap-4 px-4 py-3">
                    <div>
                      <p className="font-medium text-bone-50">{service.name}</p>
                      <p className="text-xs text-bone-500">{formatDuration(service.durationMinutes)}</p>
                    </div>
                    <p className="font-display text-lg font-bold text-gold-300">{formatPrice(service.priceCents)}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section id="funcionamento" aria-labelledby="funcionamento-titulo" className="scroll-mt-6">
            <h2 id="funcionamento-titulo" className="mb-4 font-display text-2xl font-bold tracking-wide">
              Funcionamento
            </h2>
            <ul className="divide-y divide-coal-700 rounded-xl border border-coal-700 bg-coal-900/80 text-sm">
              {WEEK_ORDER.map((day) => {
                const hours = week.find((item) => item.weekday === day);
                return (
                  <li
                    key={day}
                    className={cn(
                      "flex justify-between px-4 py-2.5",
                      day === weekday && "bg-gold-500/10 text-gold-300",
                    )}
                  >
                    <span>{WEEKDAYS[day]}</span>
                    <span className="tabular-nums">
                      {hours?.opensAt && hours.closesAt ? `${hours.opensAt} às ${hours.closesAt}` : "Fechado"}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      </main>

      <footer className="border-t border-coal-700 py-6 text-center text-xs text-bone-500">© Vikings Barber</footer>
    </div>
  );
}
