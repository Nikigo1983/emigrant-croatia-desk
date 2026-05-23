import { brevoFetch } from "@/lib/email/brevo-fetch";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

type SendCaseStatusEmailParams = {
  to: string;
  clientName?: string;
  oldStatus?: string;
  newStatus: string;
};

export async function sendCaseStatusEmail({
  to,
  clientName,
  oldStatus,
  newStatus,
}: SendCaseStatusEmailParams) {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  const senderEmail = process.env.BREVO_SENDER_EMAIL?.trim();
  const senderName =
    process.env.BREVO_SENDER_NAME?.trim() || "Emigrant Croatia Desk";

  if (!apiKey) {
    return;
  }

  if (!senderEmail) {
    throw new Error(
      "Не задан BREVO_SENDER_EMAIL на сервере (Vercel → Environment Variables).",
    );
  }

  const greetingNameRaw = clientName?.trim() || "клиент";
  const previousStatusRaw = oldStatus?.trim() || "—";
  const greetingName = escapeHtml(greetingNameRaw);
  const previousStatusLabel = escapeHtml(previousStatusRaw);
  const newStatusLabel = escapeHtml(newStatus);
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
  const dashboardUrl = siteUrl ? `${siteUrl}/dashboard` : "";
  const isLocalSite =
    !siteUrl || siteUrl.includes("localhost") || siteUrl.includes("127.0.0.1");
  // На localhost не вставляем base64 — меньше тело запроса, стабильнее Brevo API.
  const logoSrc = isLocalSite ? null : `${siteUrl}/logo.png`;

  const textContent = [
    `Здравствуйте, ${greetingNameRaw}.`,
    "",
    "Статус вашего дела обновлён.",
    "",
    "Предыдущий статус:",
    previousStatusRaw,
    "",
    "Новый статус:",
    newStatus,
    "",
    dashboardUrl
      ? `Проверьте детали в личном кабинете: ${dashboardUrl}`
      : "Проверьте детали в личном кабинете.",
    "",
    "С уважением,",
    "Emigrant Croatia Desk",
  ].join("\n");

  const dashboardButton = dashboardUrl
    ? `<p style="margin:0 0 20px;">
        <a href="${dashboardUrl}" style="display:inline-block;background:#2100ff;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:12px;">Открыть личный кабинет</a>
      </p>`
    : "";

  const logoBlock = logoSrc
    ? `<tr>
            <td style="padding-bottom:20px;">
              <img src="${logoSrc}" alt="Emigrant Croatia Desk" width="176" height="48" style="display:block;height:48px;width:auto;max-width:176px;" />
            </td>
          </tr>`
    : "";

  const htmlContent = `<!DOCTYPE html>
<html lang="ru">
<body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:28px 24px;">
          ${logoBlock}
          <tr>
            <td style="font-size:16px;line-height:1.6;">
              <p style="margin:0 0 16px;">Здравствуйте, ${greetingName}.</p>
              <p style="margin:0 0 16px;">Статус вашего дела обновлён.</p>
              <p style="margin:0 0 8px;color:#64748b;font-size:14px;">Предыдущий статус:</p>
              <p style="margin:0 0 16px;font-weight:600;">${previousStatusLabel}</p>
              <p style="margin:0 0 8px;color:#64748b;font-size:14px;">Новый статус:</p>
              <p style="margin:0 0 20px;font-weight:600;color:#2100ff;">${newStatusLabel}</p>
              ${dashboardButton}
              <p style="margin:0;color:#64748b;font-size:14px;">С уважением,<br />Emigrant Croatia Desk</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const response = await brevoFetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    signal: AbortSignal.timeout(30_000),
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      sender: {
        email: senderEmail,
        name: senderName,
      },
      to: [{ email: to }],
      subject: "Обновление статуса вашего дела",
      textContent,
      htmlContent,
    }),
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(
      `Brevo API error: ${response.status}${details ? ` — ${details}` : ""}`,
    );
  }
}
