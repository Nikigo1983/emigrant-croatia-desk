import type { GoogleDriveKbConfig } from "@/lib/google-drive/config";
import { fetchDriveFileText, isSupportedKbMimeType } from "@/lib/google-drive/extract-text";
import {
  getGoogleAccessToken,
  GOOGLE_DRIVE_READONLY_SCOPE,
} from "@/lib/google/get-access-token";

const FOLDER_MIME = "application/vnd.google-apps.folder";
const DEFAULT_MAX_CHARS = 24_000;
const DEFAULT_CACHE_TTL_MS = 15 * 60 * 1000;

type DriveListItem = {
  id: string;
  name: string;
  mimeType: string;
};

type KbCacheEntry = {
  text: string;
  expiresAt: number;
};

let kbCache: KbCacheEntry | null = null;

async function listChildren(
  folderId: string,
  accessToken: string,
): Promise<DriveListItem[]> {
  const items: DriveListItem[] = [];
  let pageToken: string | undefined;

  do {
    const url = new URL("https://www.googleapis.com/drive/v3/files");
    url.searchParams.set("q", `'${folderId}' in parents and trashed=false`);
    url.searchParams.set(
      "fields",
      "nextPageToken,files(id,name,mimeType)",
    );
    url.searchParams.set("pageSize", "100");
    if (pageToken) {
      url.searchParams.set("pageToken", pageToken);
    }

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      throw new Error(`Google Drive list error: ${response.status}`);
    }

    const data = (await response.json()) as {
      files?: DriveListItem[];
      nextPageToken?: string;
    };
    items.push(...(data.files ?? []));
    pageToken = data.nextPageToken;
  } while (pageToken);

  return items;
}

async function collectKbSections(
  config: GoogleDriveKbConfig,
  accessToken: string,
  folderId: string,
  pathPrefix: string,
  isExcludedBranch: boolean,
): Promise<string[]> {
  if (isExcludedBranch || config.excludeFolderIds.has(folderId)) {
    return [];
  }

  const children = await listChildren(folderId, accessToken);
  const sections: string[] = [];

  for (const item of children) {
    const itemPath = pathPrefix ? `${pathPrefix}/${item.name}` : item.name;

    if (item.mimeType === FOLDER_MIME) {
      const nested = await collectKbSections(
        config,
        accessToken,
        item.id,
        itemPath,
        config.excludeFolderIds.has(item.id),
      );
      sections.push(...nested);
      continue;
    }

    if (!isSupportedKbMimeType(item.mimeType)) {
      continue;
    }

    const text = await fetchDriveFileText(item.id, item.mimeType, accessToken);
    if (!text) {
      continue;
    }

    sections.push(`### ${itemPath}\n${text}`);
  }

  return sections;
}

function trimToMaxChars(text: string, maxChars: number): string {
  if (text.length <= maxChars) {
    return text;
  }
  return `${text.slice(0, maxChars)}\n\n[…фрагмент обрезан из‑за лимита контекста]`;
}

export async function getKnowledgeBaseTextForAi(
  config: GoogleDriveKbConfig,
): Promise<string> {
  const now = Date.now();
  const ttlRaw = process.env.GOOGLE_DRIVE_KB_CACHE_TTL_MS?.trim();
  const ttl = ttlRaw ? Number(ttlRaw) : DEFAULT_CACHE_TTL_MS;
  if (kbCache && kbCache.expiresAt > now) {
    return kbCache.text;
  }

  const accessToken = await getGoogleAccessToken(
    config.serviceAccountEmail,
    config.privateKey,
    GOOGLE_DRIVE_READONLY_SCOPE,
  );

  const sections = await collectKbSections(
    config,
    accessToken,
    config.folderId,
    "",
    false,
  );

  const maxCharsRaw = process.env.GOOGLE_DRIVE_KB_MAX_CHARS?.trim();
  const maxChars = maxCharsRaw ? Number(maxCharsRaw) : DEFAULT_MAX_CHARS;

  const text =
    sections.length > 0
      ? trimToMaxChars(sections.join("\n\n"), maxChars)
      : "База знаний пуста или документы не удалось прочитать.";

  kbCache = {
    text,
    expiresAt: now + (Number.isFinite(ttl) ? ttl : DEFAULT_CACHE_TTL_MS),
  };

  return text;
}
