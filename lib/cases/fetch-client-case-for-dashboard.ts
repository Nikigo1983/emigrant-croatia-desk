import type { SupabaseClient } from "@supabase/supabase-js";

/** Поля дела для главной страницы кабинета клиента (без внутренних полей админки). */
export type ClientDashboardCaseRow = {
  current_status: string | null;
  status_updated_at: string | null;
  submission_date: string | null;
  submission_city: string | null;
  case_number: string | null;
  consulate: string | null;
  curator_comment_for_client?: string | null;
  status_reached_at?: unknown;
};

const CLIENT_CASE_COLUMNS =
  "current_status, status_updated_at, submission_date, submission_city, case_number, consulate, curator_comment_for_client, status_reached_at";

/**
 * Читает строку дела для клиента из view `cases_client_public`.
 * Если миграция view ещё не применена — fallback на таблицу cases (без internal_comment в запросе).
 */
export async function fetchClientCaseForDashboard(
  supabase: SupabaseClient,
  clientId: string,
): Promise<ClientDashboardCaseRow | null> {
  const { data: fromView, error: viewError } = await supabase
    .from("cases_client_public")
    .select(CLIENT_CASE_COLUMNS)
    .eq("client_id", clientId)
    .maybeSingle();

  if (!viewError && fromView) {
    return fromView as ClientDashboardCaseRow;
  }

  const baseColumns =
    "current_status, status_updated_at, submission_date, submission_city, case_number";

  const { data: base, error: baseError } = await supabase
    .from("cases")
    .select(baseColumns)
    .eq("client_id", clientId)
    .maybeSingle();

  if (baseError || !base) {
    return null;
  }

  const row: ClientDashboardCaseRow = { ...base, consulate: null };

  const { data: extraRow, error: extraError } = await supabase
    .from("cases")
    .select("consulate, curator_comment_for_client, status_reached_at")
    .eq("client_id", clientId)
    .maybeSingle();

  if (!extraError && extraRow) {
    if ("consulate" in extraRow) {
      row.consulate = extraRow.consulate as string | null;
    }
    if ("curator_comment_for_client" in extraRow) {
      row.curator_comment_for_client = extraRow.curator_comment_for_client as string | null;
    }
    if ("status_reached_at" in extraRow) {
      row.status_reached_at = (extraRow as { status_reached_at?: unknown }).status_reached_at;
    }
  }

  return row;
}
