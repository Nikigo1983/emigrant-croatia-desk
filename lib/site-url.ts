/** Production site URL for absolute OG links (WhatsApp, Telegram, etc.). */
export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, "");
  }
  return "https://emigrant-croatia-desk.vercel.app";
}
