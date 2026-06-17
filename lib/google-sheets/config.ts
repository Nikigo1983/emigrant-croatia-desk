import { normalizeGooglePrivateKey } from "@/lib/google-sheets/normalize-private-key";

export type GoogleSheetsConfig = {
  spreadsheetId: string;
  sheetGid: number;
  serviceAccountEmail: string;
  privateKey: string;
};

function readCredentialsFromJson(): { email: string; privateKey: string } | null {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as {
      client_email?: string;
      private_key?: string;
    };
    if (!parsed.client_email || !parsed.private_key) {
      return null;
    }
    return {
      email: parsed.client_email.trim(),
      privateKey: normalizeGooglePrivateKey(parsed.private_key),
    };
  } catch {
    return null;
  }
}

function readCredentialsFromEnv(): { email: string; privateKey: string } | null {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim() || "";
  if (!email) {
    return null;
  }
  try {
    return {
      email,
      privateKey: normalizeGooglePrivateKey(process.env.GOOGLE_PRIVATE_KEY ?? ""),
    };
  } catch {
    return null;
  }
}

export function getGoogleSheetsConfig(): GoogleSheetsConfig | null {
  const spreadsheetId =
    process.env.GOOGLE_SHEETS_FORMGRID_SPREADSHEET_ID?.trim() ||
    process.env.GOOGLE_SHEETS_SPREADSHEET_ID?.trim() ||
    "";
  const gidRaw =
    process.env.GOOGLE_SHEETS_FORMGRID_GID?.trim() ||
    process.env.GOOGLE_SHEETS_PUBLIC_CLIENTS_GID?.trim() ||
    "";

  const credentials = readCredentialsFromJson() ?? readCredentialsFromEnv();
  if (!credentials) {
    return null;
  }

  if (!spreadsheetId || !gidRaw) {
    return null;
  }

  const sheetGid = Number(gidRaw);
  if (!Number.isFinite(sheetGid)) {
    return null;
  }

  return {
    spreadsheetId,
    sheetGid,
    serviceAccountEmail: credentials.email,
    privateKey: credentials.privateKey,
  };
}

export function isFormgridSyncConfigured(): boolean {
  return getGoogleSheetsConfig() !== null;
}
