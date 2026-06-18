import { normalizeGooglePrivateKey } from "@/lib/google-sheets/normalize-private-key";

export type GoogleDriveKbConfig = {
  folderId: string;
  excludeFolderIds: Set<string>;
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

export function getGoogleDriveKbConfig(): GoogleDriveKbConfig | null {
  const folderId = process.env.GOOGLE_DRIVE_KB_FOLDER_ID?.trim() || "";
  const credentials = readCredentialsFromJson() ?? readCredentialsFromEnv();
  if (!credentials || !folderId) {
    return null;
  }

  const excludeRaw = process.env.GOOGLE_DRIVE_KB_EXCLUDE_FOLDER_IDS?.trim() || "";
  const excludeFolderIds = new Set(
    excludeRaw
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean),
  );

  return {
    folderId,
    excludeFolderIds,
    serviceAccountEmail: credentials.email,
    privateKey: credentials.privateKey,
  };
}

export function isClientAssistantConfigured(): boolean {
  return (
    getGoogleDriveKbConfig() !== null &&
    Boolean(process.env.OPENROUTER_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim())
  );
}
