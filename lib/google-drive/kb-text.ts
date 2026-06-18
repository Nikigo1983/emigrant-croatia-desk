import type { GoogleDriveKbConfig } from "@/lib/google-drive/config";
import { fetchDriveFileText, isSupportedKbMimeType } from "@/lib/google-drive/extract-text";
import { selectKbSectionsForQuery, type KbSection } from "@/lib/google-drive/kb-select";
import {
  getGoogleAccessToken,
  GOOGLE_DRIVE_READONLY_SCOPE,
} from "@/lib/google/get-access-token";

const FOLDER_MIME = "application/vnd.google-apps.folder";
const DEFAULT_MAX_CHARS = 32_000;
const DEFAULT_CACHE_TTL_MS = 15 * 60 * 1000;

type DriveListItem = {
  id: string;
  name: string;
  mimeType: string;
};

type KbCacheEntry = {
  sections: KbSection[];
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
): Promise<KbSection[]> {
  if (isExcludedBranch || config.excludeFolderIds.has(folderId)) {
    return [];
  }

  const children = await listChildren(folderId, accessToken);
  const sections: KbSection[] = [];

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

    if (!isSupportedKbMimeType(item.mimeType, item.name)) {
      continue;
    }

    const text = await fetchDriveFileText(
      item.id,
      item.mimeType,
      accessToken,
      item.name,
    );
    if (!text) {
      continue;
    }

    sections.push({ path: itemPath, text });
  }

  return sections;
}

async function loadKbSections(config: GoogleDriveKbConfig): Promise<KbSection[]> {
  const now = Date.now();
  const ttlRaw = process.env.GOOGLE_DRIVE_KB_CACHE_TTL_MS?.trim();
  const ttl = ttlRaw ? Number(ttlRaw) : DEFAULT_CACHE_TTL_MS;
  if (kbCache && kbCache.expiresAt > now) {
    return kbCache.sections;
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

  kbCache = {
    sections,
    expiresAt: now + (Number.isFinite(ttl) ? ttl : DEFAULT_CACHE_TTL_MS),
  };

  return sections;
}

export async function getKnowledgeBaseTextForAi(
  config: GoogleDriveKbConfig,
  userQuery: string,
): Promise<string> {
  const sections = await loadKbSections(config);
  const maxCharsRaw = process.env.GOOGLE_DRIVE_KB_MAX_CHARS?.trim();
  const maxChars = maxCharsRaw ? Number(maxCharsRaw) : DEFAULT_MAX_CHARS;

  return selectKbSectionsForQuery(sections, userQuery, maxChars);
}
