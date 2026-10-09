const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Ids vindos da URL ou de formulários só entram no caminho da API se forem UUIDs. */
export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID.test(value);
}
