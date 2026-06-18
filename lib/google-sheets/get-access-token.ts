import {
  getGoogleAccessToken,
  GOOGLE_SHEETS_READONLY_SCOPE,
} from "@/lib/google/get-access-token";

export async function getGoogleSheetsAccessToken(
  serviceAccountEmail: string,
  privateKey: string,
): Promise<string> {
  return getGoogleAccessToken(
    serviceAccountEmail,
    privateKey,
    GOOGLE_SHEETS_READONLY_SCOPE,
  );
}
