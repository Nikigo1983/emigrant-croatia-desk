/** Приводит GOOGLE_PRIVATE_KEY из env (Vercel/local) к валидному PEM. */
export function normalizeGooglePrivateKey(raw: string): string {
  let key = raw.trim();

  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1).trim();
  }

  // Vercel/local: литералы \n в одной строке
  key = key.replace(/\\n/g, "\n");

  // Иногда вставляют с лишними кавычками внутри
  key = key.replace(/^"+|"+$/g, "");

  if (!key.includes("\n") && key.includes("-----BEGIN")) {
    key = key
      .replace("-----BEGIN PRIVATE KEY-----", "-----BEGIN PRIVATE KEY-----\n")
      .replace("-----END PRIVATE KEY-----", "\n-----END PRIVATE KEY-----\n");
  }

  if (!key.includes("-----BEGIN PRIVATE KEY-----")) {
    throw new Error(
      "GOOGLE_PRIVATE_KEY: неверный формат. Нужен PEM с -----BEGIN PRIVATE KEY-----.",
    );
  }

  if (!key.endsWith("\n")) {
    key += "\n";
  }

  return key;
}
