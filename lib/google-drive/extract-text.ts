import { inflateRawSync } from "node:zlib";
import { appendSharedDriveParams, sharedDriveHeaders } from "@/lib/google-drive/drive-api";

const GOOGLE_DOC_MIME = "application/vnd.google-apps.document";
const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const PLAIN_TEXT_MIMES = new Set(["text/plain", "text/markdown"]);
const OCTET_STREAM_MIME = "application/octet-stream";

function readZipEntryData(
  buffer: Buffer,
  localHeaderOffset: number,
): string | null {
  if (buffer.readUInt32LE(localHeaderOffset) !== 0x04034b50) {
    return null;
  }

  const compressionMethod = buffer.readUInt16LE(localHeaderOffset + 8);
  const compressedSize = buffer.readUInt32LE(localHeaderOffset + 18);
  const fileNameLength = buffer.readUInt16LE(localHeaderOffset + 26);
  const extraFieldLength = buffer.readUInt16LE(localHeaderOffset + 28);
  const dataOffset = localHeaderOffset + 30 + fileNameLength + extraFieldLength;
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

function extractEntryFromZipLocalScan(buffer: Buffer, targetName: string): string | null {
  let offset = 0;

  while (offset + 30 < buffer.length) {
    if (buffer.readUInt32LE(offset) !== 0x04034b50) {
      offset += 1;
      continue;
    }

    const fileNameLength = buffer.readUInt16LE(offset + 26);
    const extraFieldLength = buffer.readUInt16LE(offset + 28);
    const fileName = buffer.toString("utf8", offset + 30, offset + 30 + fileNameLength);
    const compressedSize = buffer.readUInt32LE(offset + 18);
    const dataOffset = offset + 30 + fileNameLength + extraFieldLength;

    if (fileName === targetName || fileName.endsWith(`/${targetName}`)) {
      return readZipEntryData(buffer, offset);
    }

    offset = dataOffset + compressedSize;
  }

  return null;
}

function extractEntryFromZipCentralDirectory(
  buffer: Buffer,
  targetName: string,
): string | null {
  const eocdSignature = 0x06054b50;
  const minOffset = Math.max(0, buffer.length - 65_536);

  for (let offset = buffer.length - 22; offset >= minOffset; offset -= 1) {
    if (buffer.readUInt32LE(offset) !== eocdSignature) {
      continue;
    }

    const centralDirectoryOffset = buffer.readUInt32LE(offset + 16);
    let entryOffset = centralDirectoryOffset;

    while (entryOffset + 46 < buffer.length) {
      if (buffer.readUInt32LE(entryOffset) !== 0x02014b50) {
        break;
      }

      const compressionMethod = buffer.readUInt16LE(entryOffset + 10);
      const compressedSize = buffer.readUInt32LE(entryOffset + 20);
      const fileNameLength = buffer.readUInt16LE(entryOffset + 28);
      const extraFieldLength = buffer.readUInt16LE(entryOffset + 30);
      const commentLength = buffer.readUInt16LE(entryOffset + 32);
      const localHeaderOffset = buffer.readUInt32LE(entryOffset + 42);
      const fileName = buffer.toString(
        "utf8",
        entryOffset + 46,
        entryOffset + 46 + fileNameLength,
      );

      if (fileName === targetName || fileName.endsWith(`/${targetName}`)) {
        const fromLocal = readZipEntryData(buffer, localHeaderOffset);
        if (fromLocal) {
          return fromLocal;
        }

        const dataOffset =
          localHeaderOffset +
          30 +
          buffer.readUInt16LE(localHeaderOffset + 26) +
          buffer.readUInt16LE(localHeaderOffset + 28);

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
      }

      entryOffset += 46 + fileNameLength + extraFieldLength + commentLength;
    }

    break;
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
  const target = "word/document.xml";
  const documentXml =
    extractEntryFromZipLocalScan(buffer, target) ??
    extractEntryFromZipCentralDirectory(buffer, target);

  if (documentXml) {
    const fromXml = extractTextFromWordXml(documentXml);
    if (fromXml) {
      return fromXml;
    }
  }

  return extractTextFromWordXml(buffer.toString("utf8"));
}

function isDocxFile(mimeType: string, fileName?: string): boolean {
  if (mimeType === DOCX_MIME) {
    return true;
  }
  const lower = fileName?.toLowerCase() ?? "";
  return lower.endsWith(".docx") || lower.includes(".docx");
}

async function downloadDriveFile(
  fileId: string,
  accessToken: string,
): Promise<Buffer | null> {
  const url = new URL(`https://www.googleapis.com/drive/v3/files/${fileId}`);
  url.searchParams.set("alt", "media");
  appendSharedDriveParams(url);

  const response = await fetch(url, { headers: sharedDriveHeaders(accessToken) });
  if (!response.ok) {
    return null;
  }

  return Buffer.from(await response.arrayBuffer());
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
    appendSharedDriveParams(url);
    const response = await fetch(url, { headers: sharedDriveHeaders(accessToken) });
    if (!response.ok) {
      return null;
    }
    return (await response.text()).trim();
  }

  if (PLAIN_TEXT_MIMES.has(mimeType)) {
    const buffer = await downloadDriveFile(fileId, accessToken);
    return buffer ? buffer.toString("utf8").trim() : null;
  }

  if (isDocxFile(mimeType, fileName) || (mimeType === OCTET_STREAM_MIME && isDocxFile("", fileName))) {
    const buffer = await downloadDriveFile(fileId, accessToken);
    if (!buffer) {
      return null;
    }
    const text = extractDocxTextFromBuffer(buffer);
    return text || null;
  }

  return null;
}

export function isSupportedKbMimeType(mimeType: string, fileName?: string): boolean {
  return (
    mimeType === GOOGLE_DOC_MIME ||
    isDocxFile(mimeType, fileName) ||
    PLAIN_TEXT_MIMES.has(mimeType) ||
    (mimeType === OCTET_STREAM_MIME && isDocxFile("", fileName))
  );
}
