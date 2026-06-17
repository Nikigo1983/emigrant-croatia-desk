import { createClientRecord } from "@/lib/clients/create-client-record";
import { isRowEmpty, mapSheetRowToClient } from "@/lib/formgrid/map-row";
import {
  hasFormgridBaseline,
  loadKnownFormgridRowKeys,
  recordFormgridBaselineRows,
  recordFormgridImportedRow,
} from "@/lib/formgrid/row-log";
import {
  buildFormgridRowKey,
  fetchSheetRows,
} from "@/lib/google-sheets/fetch-sheet-values";
import { getGoogleSheetsConfig } from "@/lib/google-sheets/config";

export type FormgridSyncItem = {
  rowNumber: number;
  email: string;
  status: "created" | "skipped" | "error" | "baselined";
  message: string;
  clientId?: string;
};

export type FormgridSyncResult = {
  ok: boolean;
  configured: boolean;
  scanned: number;
  created: number;
  skipped: number;
  baselined: number;
  errors: number;
  baselineEstablished?: boolean;
  items: FormgridSyncItem[];
  error?: string;
};

export async function syncFormgridClients(): Promise<FormgridSyncResult> {
  const config = getGoogleSheetsConfig();
  if (!config) {
    return {
      ok: false,
      configured: false,
      scanned: 0,
      created: 0,
      skipped: 0,
      baselined: 0,
      errors: 0,
      items: [],
      error:
        "Google Sheets не настроен. Задайте GOOGLE_SHEETS_FORMGRID_SPREADSHEET_ID, GOOGLE_SHEETS_FORMGRID_GID, GOOGLE_SERVICE_ACCOUNT_EMAIL и GOOGLE_PRIVATE_KEY.",
    };
  }

  let rows: string[][];
  try {
    rows = await fetchSheetRows(config);
  } catch (error) {
    return {
      ok: false,
      configured: true,
      scanned: 0,
      created: 0,
      skipped: 0,
      baselined: 0,
      errors: 1,
      items: [],
      error: error instanceof Error ? error.message : "Не удалось прочитать таблицу.",
    };
  }

  if (rows.length < 2) {
    return {
      ok: true,
      configured: true,
      scanned: 0,
      created: 0,
      skipped: 0,
      baselined: 0,
      errors: 0,
      items: [],
    };
  }

  const [headerRow, ...dataRows] = rows;
  const items: FormgridSyncItem[] = [];
  let created = 0;
  let skipped = 0;
  let baselined = 0;
  let errors = 0;

  const needsBaseline = !(await hasFormgridBaseline(config));

  if (needsBaseline) {
    const baselineKeys: string[] = [];

    for (let index = 0; index < dataRows.length; index += 1) {
      const row = dataRows[index];
      if (isRowEmpty(row)) {
        continue;
      }

      const rowNumber = index + 2;
      const rowKey = buildFormgridRowKey(config.spreadsheetId, config.sheetGid, rowNumber);
      baselineKeys.push(rowKey);
      baselined += 1;
      items.push({
        rowNumber,
        email: "",
        status: "baselined",
        message: "Уже в таблице до подключения — клиент не создан.",
      });
    }

    await recordFormgridBaselineRows(baselineKeys);

    return {
      ok: true,
      configured: true,
      scanned: dataRows.length,
      created: 0,
      skipped: 0,
      baselined,
      errors: 0,
      baselineEstablished: true,
      items: items.slice(0, 20),
    };
  }

  const knownRowKeys = await loadKnownFormgridRowKeys();

  for (let index = 0; index < dataRows.length; index += 1) {
    const row = dataRows[index];
    const rowNumber = index + 2;

    if (isRowEmpty(row)) {
      continue;
    }

    const rowKey = buildFormgridRowKey(config.spreadsheetId, config.sheetGid, rowNumber);

    if (knownRowKeys.has(rowKey)) {
      skipped += 1;
      continue;
    }

    const mapped = mapSheetRowToClient(headerRow, row);
    if (!mapped) {
      skipped += 1;
      items.push({
        rowNumber,
        email: "",
        status: "skipped",
        message: "Пропущено: нет email или имени.",
      });
      continue;
    }

    const result = await createClientRecord({
      firstName: mapped.firstName,
      lastName: mapped.lastName,
      email: mapped.email,
      passportNumber: mapped.passportNumber,
      formgridRowKey: rowKey,
      storeInitialPassword: true,
      markAsNewFromFormgrid: true,
    });

    if (result.ok) {
      await recordFormgridImportedRow(rowKey, result.userId);
      knownRowKeys.add(rowKey);
      created += 1;
      items.push({
        rowNumber,
        email: mapped.email,
        status: "created",
        message: "Новый клиент создан.",
        clientId: result.userId,
      });
      continue;
    }

    if (result.code === "duplicate_email" || result.code === "duplicate_row") {
      skipped += 1;
      items.push({
        rowNumber,
        email: mapped.email,
        status: "skipped",
        message: result.error,
      });
      continue;
    }

    errors += 1;
    items.push({
      rowNumber,
      email: mapped.email,
      status: "error",
      message: result.error,
    });
  }

  return {
    ok: errors === 0,
    configured: true,
    scanned: dataRows.length,
    created,
    skipped,
    baselined: 0,
    errors,
    items,
  };
}
