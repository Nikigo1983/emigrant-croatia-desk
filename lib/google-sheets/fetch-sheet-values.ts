import type { GoogleSheetsConfig } from "@/lib/google-sheets/config";
import { getGoogleSheetsAccessToken } from "@/lib/google-sheets/get-access-token";

type SheetProperties = {
  sheetId?: number;
  title?: string;
};

async function resolveSheetTitle(
  config: GoogleSheetsConfig,
  accessToken: string,
): Promise<string> {
  const url = new URL(
    `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}`,
  );
  url.searchParams.set("fields", "sheets(properties(sheetId,title))");

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Google Sheets metadata error: ${response.status} ${text}`);
  }

  const data = (await response.json()) as {
    sheets?: { properties?: SheetProperties }[];
  };

  const match = (data.sheets ?? []).find(
    (sheet) => sheet.properties?.sheetId === config.sheetGid,
  );

  if (!match?.properties?.title) {
    throw new Error(
      `Лист с gid=${config.sheetGid} не найден в таблице ${config.spreadsheetId}.`,
    );
  }

  return match.properties.title;
}

export async function fetchSheetRows(config: GoogleSheetsConfig): Promise<string[][]> {
  const accessToken = await getGoogleSheetsAccessToken(
    config.serviceAccountEmail,
    config.privateKey,
  );
  const sheetTitle = await resolveSheetTitle(config, accessToken);
  const range = encodeURIComponent(`${sheetTitle}!A:ZZ`);

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/${range}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Google Sheets values error: ${response.status} ${text}`);
  }

  const data = (await response.json()) as { values?: string[][] };
  return data.values ?? [];
}

export function buildFormgridRowKey(
  spreadsheetId: string,
  sheetGid: number,
  rowNumber: number,
): string {
  return `${spreadsheetId}:${sheetGid}:${rowNumber}`;
}
