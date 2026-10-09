import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { api } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import type { DayHours } from "@/lib/types";
import { HoursForm } from "./hours-form";

export const metadata: Metadata = { title: "Horários" };

export default async function BusinessHoursPage() {
  await requireAdmin();
  const week = await api<DayHours[]>("/business-hours");

  return (
    <>
      <PageHeader
        title="Horário de funcionamento"
        description="Só dá para agendar dentro destes horários. Agendamentos já marcados não mudam."
      />
      <div className="max-w-2xl">
        <HoursForm week={week} />
      </div>
    </>
  );
}
