import { createSign } from "node:crypto";

const TOKEN_URL = "https://oauth2.googleapis.com/token";

const tokenCache = new Map<string, { value: string; expiresAt: number }>();

function base64Url(input: Buffer | string) {
  const buffer = typeof input === "string" ? Buffer.from(input) : input;
  return buffer.toString("base64url");
}

function createServiceAccountJwt(
  serviceAccountEmail: string,
  privateKey: string,
  scope: string,
) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64Url(
    JSON.stringify({
      iss: serviceAccountEmail,
      scope,
      aud: TOKEN_URL,
      exp: now + 3600,
      iat: now,
    }),
  );
  const signInput = `${header}.${payload}`;
  const signer = createSign("RSA-SHA256");
  signer.update(signInput);
  signer.end();
  let signature: string;
  try {
    signature = signer.sign(privateKey, "base64url");
  } catch {
    throw new Error(
      "GOOGLE_PRIVATE_KEY: не удалось прочитать ключ. В Vercel вставьте значение private_key из JSON одной строкой с \\n.",
    );
  }
  return `${signInput}.${signature}`;
}

export async function getGoogleAccessToken(
  serviceAccountEmail: string,
  privateKey: string,
  scope: string,
): Promise<string> {
  const now = Date.now();
  const cached = tokenCache.get(scope);
  if (cached && cached.expiresAt > now + 60_000) {
    return cached.value;
  }

  const assertion = createServiceAccountJwt(serviceAccountEmail, privateKey, scope);
  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion,
  });

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Google OAuth token error: ${response.status} ${text}`);
  }

  const data = (await response.json()) as { access_token?: string; expires_in?: number };
  if (!data.access_token) {
    throw new Error("Google OAuth token response missing access_token.");
  }

  tokenCache.set(scope, {
    value: data.access_token,
    expiresAt: now + (data.expires_in ?? 3600) * 1000,
  });

  return data.access_token;
}

export const GOOGLE_SHEETS_READONLY_SCOPE =
  "https://www.googleapis.com/auth/spreadsheets.readonly";
export const GOOGLE_DRIVE_READONLY_SCOPE =
  "https://www.googleapis.com/auth/drive.readonly";
