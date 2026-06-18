import { inflateRawSync } from "node:zlib";

const GOOGLE_DOC_MIME = "application/vnd.google-apps.document";
const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const PLAIN_TEXT_MIMES = new Set(["text/plain", "text/markdown"]);

function extractEntryFromZip(buffer: Buffer, targetName: string): string | null {
  let offset = 0;

  while (offset + 30 < buffer.length) {
    if (buffer.readUInt32LE(offset) !== 0x04034b50) {
      offset += 1;
      continue;
    }

    const compressionMethod = buffer.readUInt16LE(offset + 8);
    const compressedSize = buffer.readUInt32LE(offset + 18);
    const fileNameLength = buffer.readUInt16LE(offset + 26);
    const extraFieldLength = buffer.readUInt16LE(offset + 28);
    const fileName = buffer.toString(
      "utf8",
      offset + 30,
      offset + 30 + fileNameLength,
    );
    const dataOffset = offset + 30 + fileNameLength + extraFieldLength;

    if (fileName === targetName || fileName.endsWith(`/${targetName}`)) {
      const compressed = buffer.subarray(dataOffset, dataOffset + compressedSize);
      if (compressionMethod === 0) {
        return compressed.toString("utf8");
      }
      if (compressionMethod === 8) {
        try {
          return inflateRawSync(compressed).toString("utf8");
        } catch {
          return null;
        }
      }
      return null;
    }

    offset = dataOffset + compressedSize;
  }

  return null;
}

function extractTextFromWordXml(xml: string): string {
  const parts: string[] = [];
  const regex = /<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/g;
  let match = regex.exec(xml);
  while (match) {
    const piece = match[1]?.trim();
    if (piece) {
      parts.push(piece);
    }
    match = regex.exec(xml);
  }
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

export function extractDocxTextFromBuffer(buffer: Buffer): string {
  const documentXml = extractEntryFromZip(buffer, "word/document.xml");
  if (documentXml) {
    const fromXml = extractTextFromWordXml(documentXml);
    if (fromXml) {
      return fromXml;
    }
  }

  const raw = buffer.toString("utf8");
  return extractTextFromWordXml(raw);
}

function isDocxFile(mimeType: string, fileName?: string): boolean {
  if (mimeType === DOCX_MIME) {
    return true;
  }
  const lower = fileName?.toLowerCase() ?? "";
  return lower.endsWith(".docx") || lower.includes(".docx.");
}

export async function fetchDriveFileText(
  fileId: string,
  mimeType: string,
  accessToken: string,
  fileName?: string,
): Promise<string | null> {
  if (mimeType === GOOGLE_DOC_MIME) {
    const url = new URL(`https://www.googleapis.com/drive/v3/files/${fileId}/export`);
    url.searchParams.set("mimeType", "text/plain");
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      return null;
    }
    return (await response.text()).trim();
  }

  if (PLAIN_TEXT_MIMES.has(mimeType)) {
    const url = new URL(`https://www.googleapis.com/drive/v3/files/${fileId}`);
    url.searchParams.set("alt", "media");
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      return null;
    }
    return (await response.text()).trim();
  }

  if (isDocxFile(mimeType, fileName)) {
    const url = new URL(`https://www.googleapis.com/drive/v3/files/${fileId}`);
    url.searchParams.set("alt", "media");
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      return null;
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    const text = extractDocxTextFromBuffer(buffer);
    return text || null;
  }

  return null;
}

export function isSupportedKbMimeType(mimeType: string, fileName?: string): boolean {
  return (
    mimeType === GOOGLE_DOC_MIME ||
    isDocxFile(mimeType, fileName) ||
    PLAIN_TEXT_MIMES.has(mimeType)
  );
}
