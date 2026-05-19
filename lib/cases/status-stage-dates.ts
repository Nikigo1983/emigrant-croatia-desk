import type { CaseStatus } from "@/lib/constants/case-statuses";

/** Нормализует JSON из БД в карту статус → ISO-строка. */
export function parseStatusReachedAt(raw: unknown): Partial<Record<CaseStatus, string>> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }
  const out: Partial<Record<CaseStatus, string>> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value === "string" && value.trim()) {
      out[key as CaseStatus] = value;
    }
  }
  return out;
}

/** Дата этапа для прогресса: только календарная дата (без времени). */
export function formatStageDateRu(iso: string | undefined | null): string {
  if (!iso) {
    return "—";
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return "—";
  }
  return d.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/** Слияние карты при смене статуса (server action). */
export function mergeStatusReachedAt(
  raw: unknown,
  newStatus: string,
  setReachedNow: boolean,
): Record<string, string> {
  const parsed = parseStatusReachedAt(raw) as Record<string, string>;
  if (setReachedNow) {
    parsed[newStatus] = new Date().toISOString();
  }
  return parsed;
}
