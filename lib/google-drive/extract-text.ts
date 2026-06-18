const GOOGLE_DOC_MIME = "application/vnd.google-apps.document";
const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const PLAIN_TEXT_MIMES = new Set(["text/plain", "text/markdown"]);

export function extractDocxTextFromBuffer(buffer: Buffer): string {
  const raw = buffer.toString("utf8");
  const parts: string[] = [];
  const regex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
  let match = regex.exec(raw);
  while (match) {
    const piece = match[1]?.trim();
    if (piece) {
      parts.push(piece);
    }
    match = regex.exec(raw);
  }
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

export async function fetchDriveFileText(
  fileId: string,
  mimeType: string,
  accessToken: string,
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

  if (mimeType === DOCX_MIME) {
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

export function isSupportedKbMimeType(mimeType: string): boolean {
  return (
    mimeType === GOOGLE_DOC_MIME ||
    mimeType === DOCX_MIME ||
    PLAIN_TEXT_MIMES.has(mimeType)
  );
}
