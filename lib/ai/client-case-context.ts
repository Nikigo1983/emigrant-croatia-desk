import type { ClientDashboardCaseRow } from "@/lib/cases/fetch-client-case-for-dashboard";
import { CASE_STATUS_DESCRIPTIONS } from "@/lib/constants/case-status-descriptions";
import type { CaseStatus } from "@/lib/constants/case-statuses";
import { CASE_STATUSES } from "@/lib/constants/case-statuses";

export function buildClientCaseContextForAi(
  caseItem: ClientDashboardCaseRow | null,
): string {
  if (!caseItem) {
    return "Дело клиента ещё не создано в системе.";
  }

  const status = caseItem.current_status ?? CASE_STATUSES[0];
  const safeStatus = CASE_STATUSES.includes(status as CaseStatus)
    ? (status as CaseStatus)
    : CASE_STATUSES[0];
  const description = CASE_STATUS_DESCRIPTIONS[safeStatus];

  const lines = [
    `Текущий статус: ${safeStatus}`,
    `Пояснение статуса: ${description}`,
  ];

  if (caseItem.submission_date) {
    lines.push(`Дата подачи: ${caseItem.submission_date}`);
  }
  if (caseItem.submission_city) {
    lines.push(`Город подачи: ${caseItem.submission_city}`);
  }
  if (caseItem.case_number) {
    lines.push(`Номер дела: ${caseItem.case_number}`);
  }
  if (caseItem.consulate) {
    lines.push(`Консульство: ${caseItem.consulate}`);
  }
  if (caseItem.curator_comment_for_client?.trim()) {
    lines.push(`Комментарий куратора: ${caseItem.curator_comment_for_client.trim()}`);
  }

  return lines.join("\n");
}
