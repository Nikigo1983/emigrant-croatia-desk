import type { GoogleDriveKbConfig } from "@/lib/google-drive/config";
import { appendSharedDriveParams, sharedDriveHeaders } from "@/lib/google-drive/drive-api";
import { fetchDriveFileText, isSupportedKbMimeType } from "@/lib/google-drive/extract-text";
import { selectKbSectionsForQuery, type KbSection } from "@/lib/google-drive/kb-select";
import {
  getGoogleAccessToken,
  GOOGLE_DRIVE_READONLY_SCOPE,
} from "@/lib/google/get-access-token";

const FOLDER_MIME = "application/vnd.google-apps.folder";
const SHORTCUT_MIME = "application/vnd.google-apps.shortcut";
const DEFAULT_MAX_CHARS = 48_000;
const DEFAULT_CACHE_TTL_MS = 15 * 60 * 1000;

type DriveListItem = {
  id: string;
  name: string;
  mimeType: string;
  shortcutDetails?: {
    targetId?: string;
    targetMimeType?: string;
  };
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
      "nextPageToken,files(id,name,mimeType,shortcutDetails(targetId,targetMimeType))",
    );
    url.searchParams.set("pageSize", "100");
    url.searchParams.set("includeItemsFromAllDrives", "true");
    appendSharedDriveParams(url);
    if (pageToken) {
      url.searchParams.set("pageToken", pageToken);
    }

    const response = await fetch(url, { headers: sharedDriveHeaders(accessToken) });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Google Drive list error: ${response.status} ${text}`);
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
    if (item.mimeType === SHORTCUT_MIME && item.shortcutDetails?.targetId) {
      const targetId = item.shortcutDetails.targetId;
      const targetMime = item.shortcutDetails.targetMimeType ?? "";

      if (targetMime === FOLDER_MIME) {
        const nested = await collectKbSections(
          config,
          accessToken,
          targetId,
          pathPrefix ? `${pathPrefix}/${item.name}` : item.name,
          config.excludeFolderIds.has(targetId),
        );
        sections.push(...nested);
      } else if (isSupportedKbMimeType(targetMime, item.name)) {
        const text = await fetchDriveFileText(targetId, targetMime, accessToken, item.name);
        if (text) {
          sections.push({
            path: pathPrefix ? `${pathPrefix}/${item.name}` : item.name,
            text,
          });
        }
      }
      continue;
    }

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

  const sections: KbSection[] = [];

  for (const folderId of config.folderIds) {
    const nested = await collectKbSections(config, accessToken, folderId, "", false);
    sections.push(...nested);
  }

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
