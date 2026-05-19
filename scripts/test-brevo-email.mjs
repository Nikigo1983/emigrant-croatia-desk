import { readFileSync } from "node:fs";

function loadEnvLocal() {
  try {
    const raw = readFileSync(".env.local", "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  } catch {
    console.error("Could not read .env.local");
    process.exit(1);
  }
}

loadEnvLocal();

const apiKey = process.env.BREVO_API_KEY?.trim();
const senderEmail = process.env.BREVO_SENDER_EMAIL?.trim();
const senderName = process.env.BREVO_SENDER_NAME?.trim() || "Emigrant Croatia Desk";
const testTo = process.argv[2]?.trim() || senderEmail;

if (!apiKey) {
  console.error("BREVO_API_KEY is empty or missing in .env.local");
  process.exit(1);
}
if (!senderEmail) {
  console.error("BREVO_SENDER_EMAIL is empty or missing in .env.local");
  process.exit(1);
}
if (!testTo) {
  console.error("Usage: node scripts/test-brevo-email.mjs [recipient@email.com]");
  process.exit(1);
}

const payload = {
  sender: { email: senderEmail, name: senderName },
  to: [{ email: testTo }],
  subject: "Тест: Emigrant Croatia Desk",
  textContent:
    "Это тестовое письмо из scripts/test-brevo-email.mjs.\n\nЕсли вы его видите — Brevo настроен верно.",
};

console.log("Sending test email to:", testTo);

try {
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    signal: AbortSignal.timeout(30_000),
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify(payload),
  });

  const body = await response.text();
  if (!response.ok) {
    console.error("Brevo error:", response.status, body);
    process.exit(1);
  }

  console.log("OK:", response.status, body || "(empty body)");
  console.log("Check inbox and Brevo → Transactional → Logs");
} catch (error) {
  const code = error?.cause?.code ?? error?.code;
  if (code === "UNABLE_TO_VERIFY_LEAF_SIGNATURE") {
    console.error(
      "SSL error talking to Brevo. Run: npm run test:brevo -- your@email.com",
    );
    console.error("(uses NODE_TLS_REJECT_UNAUTHORIZED=0 like npm run dev)");
  }
  console.error("Request failed:", error);
  process.exit(1);
}
