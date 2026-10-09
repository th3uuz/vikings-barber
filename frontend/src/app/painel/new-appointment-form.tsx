"use client";

import { useState } from "react";
import { FormMessage } from "@/components/form-feedback";
import { buttonClasses, Field, Input, Select, Textarea } from "@/components/ui";
import { useFormAction } from "@/components/use-form-action";
import { minutesToTime, timeToMinutes, zonedIso } from "@/lib/dates";
import { formatDuration, formatPrice } from "@/lib/format";
import { availableStartTimes } from "@/lib/slots";
import type { BusyInterval } from "@/lib/types";
import { createAppointment } from "./agenda-actions";

interface Props {
  date: string;
  timeZone: string;
  opensAt: string;
  closesAt: string;
  barbers: { id: string; name: string; busy: BusyInterval[] }[];
  services: { id: string; name: string; durationMinutes: number; priceCents: number }[];
  /** Horário do servidor, para a lista de horários ser igual no servidor e no navegador. */
  now: number;
}

export function NewAppointmentForm({ date, timeZone, opensAt, closesAt, barbers, services, now }: Props) {
  const [barberId, setBarberId] = useState(barbers[0]?.id ?? "");
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [time, setTime] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [notes, setNotes] = useState("");
  // Depois de agendar, limpa só os dados do cliente; barbeiro e serviço continuam escolhidos.
  const { state, pending, onSubmit } = useFormAction(createAppointment, () => {
    setClientName("");
    setClientPhone("");
    setNotes("");
  });

  const barber = barbers.find((item) => item.id === barberId);
  const service = services.find((item) => item.id === serviceId);
  const times =
    barber && service
      ? availableStartTimes(date, opensAt, closesAt, barber.busy, service.durationMinutes, timeZone, now)
      : [];
  // Se o horário escolhido deixou de estar livre, cai no primeiro disponível.
  const selectedTime = times.includes(time) ? time : (times[0] ?? "");
  const endsAt = service && selectedTime ? minutesToTime(timeToMinutes(selectedTime) + service.durationMinutes) : null;

  if (barbers.length === 0) {
    return <p className="text-sm text-bone-400">Nenhum barbeiro ativo para receber agendamentos.</p>;
  }
  if (services.length === 0) {
    return <p className="text-sm text-bone-400">Cadastre pelo menos um serviço ativo para agendar.</p>;
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <input type="hidden" name="startsAt" value={selectedTime ? zonedIso(date, selectedTime, timeZone) : ""} />

      {barbers.length > 1 ? (
        <Field label="Barbeiro">
          <Select name="barberId" value={barberId} onChange={(event) => setBarberId(event.target.value)}>
            {barbers.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Select>
        </Field>
      ) : (
        <input type="hidden" name="barberId" value={barberId} />
      )}

      <Field label="Serviço">
        <Select name="serviceId" value={serviceId} onChange={(event) => setServiceId(event.target.value)}>
          {services.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} ({formatDuration(item.durationMinutes)} · {formatPrice(item.priceCents)})
            </option>
          ))}
        </Select>
      </Field>

      <Field
        label="Horário"
        hint={endsAt ? `Termina às ${endsAt}.` : "Só aparecem horários em que o serviço cabe inteiro."}
      >
        <Select
          value={selectedTime}
          onChange={(event) => setTime(event.target.value)}
          disabled={times.length === 0}
          required
        >
          {times.length === 0 ? (
            <option value="">Nenhum horário livre neste dia</option>
          ) : (
            times.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))
          )}
        </Select>
      </Field>

      <Field label="Nome do cliente">
        <Input
          name="clientName"
          required
          minLength={2}
          maxLength={80}
          value={clientName}
          onChange={(event) => setClientName(event.target.value)}
        />
      </Field>
      <Field label="Telefone (opcional)">
        <Input
          name="clientPhone"
          type="tel"
          inputMode="tel"
          maxLength={20}
          placeholder="(11) 98888-7777"
          value={clientPhone}
          onChange={(event) => setClientPhone(event.target.value)}
        />
      </Field>
      <Field label="Observações (opcional)">
        <Textarea
          name="notes"
          maxLength={500}
          rows={2}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
      </Field>

      <FormMessage state={state} />
      <button
        type="submit"
        disabled={pending || times.length === 0}
        className={buttonClasses("primary", "md", "w-full")}
      >
        {pending ? "Agendando..." : "Agendar"}
      </button>
    </form>
  );
}
