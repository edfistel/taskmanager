const API_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/;

export function normalizeApiDate(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  const match = API_DATE_PATTERN.exec(value.trim());
  if (!match) return null;

  const normalized = `${match[1]}-${match[2]}-${match[3]}`;
  const date = new Date(`${normalized}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== normalized) {
    return null;
  }

  return normalized;
}

export function formatApiDate(value: string, locale = "pt-BR"): string {
  const normalized = normalizeApiDate(value);
  if (!normalized) return "Sem prazo";

  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${normalized}T00:00:00.000Z`));
}
