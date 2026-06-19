import { normalizeGooglePrivateKey } from "@/lib/google-sheets/normalize-private-key";

export type GoogleDriveKbConfig = {
  folderIds: string[];
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

function parseFolderIds(...values: Array<string | undefined>): string[] {
  const ids = new Set<string>();

  for (const value of values) {
    if (!value?.trim()) {
      continue;
    }
    for (const part of value.split(",")) {
      const id = part.trim();
      if (id) {
        ids.add(id);
      }
    }
  }

  return [...ids];
}

export function getGoogleDriveKbConfig(): GoogleDriveKbConfig | null {
  const folderIds = parseFolderIds(
    process.env.GOOGLE_DRIVE_KB_FOLDER_ID,
    process.env.GOOGLE_DRIVE_KB_EXTRA_FOLDER_IDS,
  );
  const credentials = readCredentialsFromJson() ?? readCredentialsFromEnv();
  if (!credentials || folderIds.length === 0) {
    return null;
  }

  const excludeFolderIds = new Set(
    parseFolderIds(process.env.GOOGLE_DRIVE_KB_EXCLUDE_FOLDER_IDS),
  );

  return {
    folderIds,
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
