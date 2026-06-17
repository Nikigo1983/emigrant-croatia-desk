export type GoogleSheetsConfig = {
  spreadsheetId: string;
  sheetGid: number;
  serviceAccountEmail: string;
  privateKey: string;
};

export function getGoogleSheetsConfig(): GoogleSheetsConfig | null {
  const spreadsheetId =
    process.env.GOOGLE_SHEETS_FORMGRID_SPREADSHEET_ID?.trim() ||
    process.env.GOOGLE_SHEETS_SPREADSHEET_ID?.trim() ||
    "";
  const gidRaw =
    process.env.GOOGLE_SHEETS_FORMGRID_GID?.trim() ||
    process.env.GOOGLE_SHEETS_PUBLIC_CLIENTS_GID?.trim() ||
    "";
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim() || "";
  const privateKey = (process.env.GOOGLE_PRIVATE_KEY ?? "").replace(/\\n/g, "\n").trim();

  if (!spreadsheetId || !gidRaw || !serviceAccountEmail || !privateKey) {
    return null;
  }

  const sheetGid = Number(gidRaw);
  if (!Number.isFinite(sheetGid)) {
    return null;
  }

  return { spreadsheetId, sheetGid, serviceAccountEmail, privateKey };
}

export function isFormgridSyncConfigured(): boolean {
  return getGoogleSheetsConfig() !== null;
}
