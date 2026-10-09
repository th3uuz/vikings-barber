import type { Metadata } from "next";
import Link from "next/link";
import { DateNav } from "@/components/date-nav";
import { Badge, buttonClasses, Card, CardTitle, cn, EmptyState, PageHeader } from "@/components/ui";
import { api } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { formatLongDate, formatTime, isLocalDate, todayInShop } from "@/lib/dates";
import { formatPrice } from "@/lib/format";
import { isUuid } from "@/lib/ids";
import type { Appointment, PublicAgenda, Service } from "@/lib/types";
import { CancelAppointmentButton } from "./cancel-appointment-button";
import { NewAppointmentForm } from "./new-appointment-form";

export const metadata: Metadata = { title: "Agenda" };

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const isAdmin = user.role === "ADMIN";
  const date = isLocalDate(params.data) ? params.data : todayInShop();
  const barberFilter = isAdmin && isUuid(params.barbeiro) ? params.barbeiro : undefined;

  const [appointments, agenda, services] = await Promise.all([
    // Para barbeiros a API devolve só a agenda dele, independente do filtro.
    api<Appointment[]>("/appointments", { query: { date, barberId: barberFilter } }),
    api<PublicAgenda>("/public/agenda", { query: { date }, auth: false }),
    api<Service[]>("/services"),
  ]);

  // Server Component roda uma vez por requisição, então ler o relógio aqui é seguro.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const scheduled = appointments.filter((item) => item.status === "SCHEDULED");
  const cancelled = appointments.filter((item) => item.status === "CANCELLED");
  const expectedCents = scheduled.reduce((total, item) => total + item.priceCents, 0);
  const formBarbers = isAdmin ? agenda.barbers : agenda.barbers.filter((barber) => barber.id === user.barberId);
  const activeServices = services
    .filter((service) => service.active)
    .map(({ id, name, durationMinutes, priceCents }) => ({ id, name, durationMinutes, priceCents }));

  return (
    <>
      <PageHeader
        title={isAdmin ? "Agenda da barbearia" : "Minha agenda"}
        description={isAdmin ? "Agendamentos de todos os barbeiros." : "Seus atendimentos do dia."}
      >
        <DateNav basePath="/painel" date={date} extraParams={{ barbeiro: barberFilter }} />
      </PageHeader>

      {isAdmin && agenda.barbers.length > 0 && (
        <nav aria-label="Filtrar por barbeiro" className="mb-6 flex flex-wrap gap-2">
          {[{ id: undefined, name: "Todos" }, ...agenda.barbers].map((barber) => {
            const query = new URLSearchParams({ data: date });
            if (barber.id) query.set("barbeiro", barber.id);
            const active = barber.id === barberFilter;
            return (
              <Link
                key={barber.id ?? "todos"}
                href={`/painel?${query}`}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-full border px-3 py-1 text-sm transition-colors",
                  active
                    ? "border-gold-500 bg-gold-500/15 text-gold-300"
                    : "border-coal-600 text-bone-400 hover:border-gold-500/50 hover:text-bone-50",
                )}
              >
                {barber.name}
              </Link>
            );
          })}
        </nav>
      )}

      {agenda.opensAt !== null && (
        <a href="#novo-agendamento" className={buttonClasses("primary", "md", "mb-6 w-full lg:hidden")}>
          + Novo agendamento
        </a>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_360px]">
        <section aria-label="Agendamentos do dia" className="grid gap-4">
          <div className="grid grid-cols-2 gap-3 sm:max-w-md">
            <div className="rounded-lg border border-coal-700 bg-coal-900 p-4">
              <p className="text-xs uppercase tracking-wider text-bone-500">Agendados</p>
              <p className="mt-1 font-display text-2xl font-bold text-bone-50">{scheduled.length}</p>
            </div>
            <div className="rounded-lg border border-coal-700 bg-coal-900 p-4">
              <p className="text-xs uppercase tracking-wider text-bone-500">Previsto</p>
              <p className="mt-1 font-display text-2xl font-bold text-gold-300">{formatPrice(expectedCents)}</p>
            </div>
          </div>

          {agenda.opensAt === null && (
            <p className="rounded-lg border border-gold-500/30 bg-gold-500/10 px-4 py-3 text-sm text-gold-300">
              A barbearia não abre neste dia.
            </p>
          )}

          {scheduled.length === 0 ? (
            <EmptyState>Nenhum agendamento para {formatLongDate(date)}.</EmptyState>
          ) : (
            <ul className="grid gap-3">
              {scheduled.map((appointment) => (
                <AppointmentItem
                  key={appointment.id}
                  appointment={appointment}
                  timeZone={agenda.timeZone}
                  showBarber={isAdmin}
                />
              ))}
            </ul>
          )}

          {cancelled.length > 0 && (
            <details className="rounded-lg border border-coal-700 px-4 py-3">
              <summary className="cursor-pointer text-sm text-bone-400">Cancelados ({cancelled.length})</summary>
              <ul className="mt-3 grid gap-3">
                {cancelled.map((appointment) => (
                  <AppointmentItem
                    key={appointment.id}
                    appointment={appointment}
                    timeZone={agenda.timeZone}
                    showBarber={isAdmin}
                  />
                ))}
              </ul>
            </details>
          )}
        </section>

        <Card id="novo-agendamento" className="scroll-mt-4">
          <CardTitle description={formatLongDate(date)}>Novo agendamento</CardTitle>
          {agenda.opensAt === null || agenda.closesAt === null ? (
            <p className="text-sm text-bone-400">Escolha um dia em que a barbearia abre para agendar.</p>
          ) : (
            <NewAppointmentForm
              key={`${date}-${user.id}`}
              date={date}
              timeZone={agenda.timeZone}
              opensAt={agenda.opensAt}
              closesAt={agenda.closesAt}
              barbers={formBarbers}
              services={activeServices}
              now={now}
            />
          )}
        </Card>
      </div>
    </>
  );
}

function AppointmentItem({
  appointment,
  timeZone,
  showBarber,
}: {
  appointment: Appointment;
  timeZone: string;
  showBarber: boolean;
}) {
  const cancelled = appointment.status === "CANCELLED";
  const start = formatTime(appointment.startsAt, timeZone);

  return (
    <li className={cn("flex gap-4 rounded-lg border border-coal-700 bg-coal-900 p-4", cancelled && "opacity-60")}>
      <div className="w-16 shrink-0">
        <p className={cn("font-display text-lg font-bold text-gold-300", cancelled && "line-through")}>{start}</p>
        <p className="text-xs text-bone-500">até {formatTime(appointment.endsAt, timeZone)}</p>
      </div>
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2 font-medium text-bone-50">
          <span>{appointment.clientName}</span>
          {cancelled && <Badge tone="red">Cancelado</Badge>}
        </p>
        <p className="text-sm text-bone-400">
          {appointment.service.name} · {formatPrice(appointment.priceCents)}
          {showBarber && <> · com {appointment.barber.name}</>}
        </p>
        {appointment.clientPhone && (
          <a
            href={`tel:${appointment.clientPhone.replace(/[^\d+]/g, "")}`}
            className="text-sm text-gold-400 hover:underline"
          >
            {appointment.clientPhone}
          </a>
        )}
        {appointment.notes && <p className="mt-1 text-sm whitespace-pre-line text-bone-200">{appointment.notes}</p>}
      </div>
      {!cancelled && (
        <CancelAppointmentButton
          id={appointment.id}
          description={`o horário de ${appointment.clientName} às ${start}`}
        />
      )}
    </li>
  );
}
