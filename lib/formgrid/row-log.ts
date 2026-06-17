import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { GoogleSheetsConfig } from "@/lib/google-sheets/config";

export type FormgridRowStatus = "baseline" | "imported";

export function buildSheetScopeKey(config: GoogleSheetsConfig) {
  return `${config.spreadsheetId}:${config.sheetGid}`;
}

export async function loadKnownFormgridRowKeys(): Promise<Set<string>> {
  const supabaseAdmin = createSupabaseAdminClient();
  const { data, error } = await supabaseAdmin.from("formgrid_row_log").select("row_key");

  if (error) {
    throw new Error(error.message);
  }

  return new Set((data ?? []).map((row) => row.row_key));
}

export async function hasFormgridBaseline(config: GoogleSheetsConfig): Promise<boolean> {
  const scopePrefix = `${buildSheetScopeKey(config)}:`;
  const supabaseAdmin = createSupabaseAdminClient();
  const { count, error } = await supabaseAdmin
    .from("formgrid_row_log")
    .select("row_key", { count: "exact", head: true })
    .like("row_key", `${scopePrefix}%`);

  if (error) {
    throw new Error(error.message);
  }

  return (count ?? 0) > 0;
}

export async function recordFormgridBaselineRows(rowKeys: string[]) {
  if (rowKeys.length === 0) {
    return;
  }

  const supabaseAdmin = createSupabaseAdminClient();
  const { error } = await supabaseAdmin.from("formgrid_row_log").upsert(
    rowKeys.map((rowKey) => ({
      row_key: rowKey,
      status: "baseline" as const,
      client_id: null,
    })),
    { onConflict: "row_key", ignoreDuplicates: true },
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function recordFormgridImportedRow(rowKey: string, clientId: string) {
  const supabaseAdmin = createSupabaseAdminClient();
  const { error } = await supabaseAdmin.from("formgrid_row_log").upsert(
    {
      row_key: rowKey,
      status: "imported" as const,
      client_id: clientId,
    },
    { onConflict: "row_key" },
  );

  if (error) {
    throw new Error(error.message);
  }
}
