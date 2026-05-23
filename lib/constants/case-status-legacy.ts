import { CASE_STATUSES, type CaseStatus } from "@/lib/constants/case-statuses";

/** Старые названия статусов → актуальные (после обновления списка этапов). */
export const LEGACY_CASE_STATUS_MAP: Record<string, CaseStatus> = {
  "Документы на одобрении": "Ожидание одобрения",
  "Документы переданы куратору-референту": "Отчёты переданы куратору",
  "Ожидание ответа службы безопасности": "Ожидание от службы безопасности",
};

export function isKnownCaseStatus(status: string): status is CaseStatus {
  return (CASE_STATUSES as readonly string[]).includes(status);
}

export function normalizeCaseStatus(status: string | null | undefined): CaseStatus {
  const raw = status?.trim();
  if (!raw) {
    return CASE_STATUSES[0];
  }
  if (isKnownCaseStatus(raw)) {
    return raw;
  }
  const mapped = LEGACY_CASE_STATUS_MAP[raw];
  if (mapped) {
    return mapped;
  }
  return CASE_STATUSES[0];
}

export function getLegacyStatusLabel(status: string | null | undefined): string | null {
  const raw = status?.trim();
  if (!raw || isKnownCaseStatus(raw) || !LEGACY_CASE_STATUS_MAP[raw]) {
    return null;
  }
  return raw;
}
