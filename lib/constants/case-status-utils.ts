/** Статус, при котором клиенту и админу показываются данные о подаче заявки в МВД. */
export const STATUS_SUBMISSION_DETAILS = "Заявка подана" as const;

export function showsSubmissionDetails(status: string | null | undefined): boolean {
  return status === STATUS_SUBMISSION_DETAILS;
}
