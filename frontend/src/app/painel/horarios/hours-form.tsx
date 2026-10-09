"use client";

import { useState } from "react";
import { FormMessage } from "@/components/form-feedback";
import { buttonClasses, cn, Input } from "@/components/ui";
import { useFormAction } from "@/components/use-form-action";
import { WEEKDAYS } from "@/lib/dates";
import type { DayHours } from "@/lib/types";
import { updateBusinessHours } from "./actions";

/** No Brasil a semana de trabalho começa na segunda, então domingo vai para o fim. */
const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export function HoursForm({ week }: { week: DayHours[] }) {
  const { state, pending, onSubmit } = useFormAction(updateBusinessHours);
  const [openDays, setOpenDays] = useState<Record<number, boolean>>(() =>
    Object.fromEntries(week.map((day) => [day.weekday, day.opensAt !== null])),
  );
  const days = DISPLAY_ORDER.map((weekday) => week.find((day) => day.weekday === weekday)).filter(
    (day): day is DayHours => day !== undefined,
  );

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <ul className="divide-y divide-coal-700 rounded-lg border border-coal-700 bg-coal-900">
        {days.map((day) => {
          const open = openDays[day.weekday] ?? false;
          return (
            <li key={day.weekday} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
              <label className="flex w-44 items-center gap-2 text-sm font-medium text-bone-50">
                <input
                  type="checkbox"
                  name={`open-${day.weekday}`}
                  checked={open}
                  onChange={(event) => setOpenDays((current) => ({ ...current, [day.weekday]: event.target.checked }))}
                  className="size-4 accent-gold-500"
                />
                {WEEKDAYS[day.weekday]}
              </label>
              <div className={cn("flex items-center gap-2", !open && "opacity-40")}>
                <Input
                  type="time"
                  step={900}
                  name={`opensAt-${day.weekday}`}
                  defaultValue={day.opensAt ?? "09:00"}
                  disabled={!open}
                  required={open}
                  aria-label={`Abertura de ${WEEKDAYS[day.weekday]}`}
                  className="w-32"
                />
                <span className="text-sm text-bone-500">às</span>
                <Input
                  type="time"
                  step={900}
                  name={`closesAt-${day.weekday}`}
                  defaultValue={day.closesAt ?? "18:00"}
                  disabled={!open}
                  required={open}
                  aria-label={`Fechamento de ${WEEKDAYS[day.weekday]}`}
                  className="w-32"
                />
              </div>
              {!open && <span className="text-sm text-bone-500">Fechado</span>}
            </li>
          );
        })}
      </ul>
      <FormMessage state={state} />
      <button type="submit" disabled={pending} className={buttonClasses("primary", "md", "justify-self-start")}>
        {pending ? "Salvando..." : "Salvar horários"}
      </button>
    </form>
  );
}
