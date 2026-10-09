/** Tipos das respostas da API (backend/). */

export type Role = "ADMIN" | "BARBER";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  barberId: string | null;
}

export interface LoginResponse {
  token: string;
  expiresAt: string;
  user: AuthUser;
}

export interface Barber {
  id: string;
  name: string;
  email: string;
  active: boolean;
  createdAt: string;
}

export interface Service {
  id: string;
  name: string;
  durationMinutes: number;
  priceCents: number;
  active: boolean;
}

export interface DayHours {
  weekday: number;
  opensAt: string | null;
  closesAt: string | null;
}

export type AppointmentStatus = "SCHEDULED" | "CANCELLED";

export interface Appointment {
  id: string;
  barber: { id: string; name: string };
  service: { id: string; name: string; durationMinutes: number };
  clientName: string;
  clientPhone: string | null;
  notes: string | null;
  startsAt: string;
  endsAt: string;
  priceCents: number;
  status: AppointmentStatus;
  createdAt: string;
  cancelledAt: string | null;
}

export interface BusyInterval {
  startsAt: string;
  endsAt: string;
}

export interface PublicAgenda {
  date: string;
  timeZone: string;
  opensAt: string | null;
  closesAt: string | null;
  barbers: { id: string; name: string; busy: BusyInterval[] }[];
}

export interface PublicService {
  id: string;
  name: string;
  durationMinutes: number;
  priceCents: number;
}

/** Resultado que as Server Actions devolvem para os formulários. */
export type FormState = {
  ok: boolean;
  message?: string;
  details?: string[];
  /** Valores enviados, para preencher o formulário de novo quando der erro. */
  values?: Record<string, string>;
} | null;
