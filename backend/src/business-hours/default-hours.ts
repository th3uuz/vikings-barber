/** Horário padrão criado pelo seed: segunda a sexta 9h-19h, sábado 9h-17h, domingo fechado. */
export const DEFAULT_BUSINESS_HOURS = [
  { weekday: 0, opensAt: null, closesAt: null },
  { weekday: 1, opensAt: 9 * 60, closesAt: 19 * 60 },
  { weekday: 2, opensAt: 9 * 60, closesAt: 19 * 60 },
  { weekday: 3, opensAt: 9 * 60, closesAt: 19 * 60 },
  { weekday: 4, opensAt: 9 * 60, closesAt: 19 * 60 },
  { weekday: 5, opensAt: 9 * 60, closesAt: 19 * 60 },
  { weekday: 6, opensAt: 9 * 60, closesAt: 17 * 60 },
];
