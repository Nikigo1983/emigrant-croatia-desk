const RETRYABLE_CODES = new Set([
  "ECONNRESET",
  "ETIMEDOUT",
  "ECONNREFUSED",
  "EAI_AGAIN",
  "ENOTFOUND",
]);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getErrorCode(error: unknown): string | undefined {
  if (!(error instanceof Error)) {
    return undefined;
  }
  const cause = error.cause as NodeJS.ErrnoException | undefined;
  return cause?.code ?? (error as NodeJS.ErrnoException).code;
}

function isRetryable(error: unknown): boolean {
  const code = getErrorCode(error);
  if (code && RETRYABLE_CODES.has(code)) {
    return true;
  }
  if (error instanceof Error && error.message === "fetch failed") {
    return true;
  }
  return false;
}

/** Запрос к Brevo API с повторами при обрыве соединения (типично на Windows / VPN). */
export async function brevoFetch(
  url: string,
  init: RequestInit,
): Promise<Response> {
  const maxAttempts = 3;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fetch(url, init);
    } catch (error) {
      lastError = error;
      if (!isRetryable(error) || attempt === maxAttempts) {
        throw error;
      }
      await sleep(400 * attempt);
    }
  }

  throw lastError;
}

export function formatBrevoRequestError(error: unknown): string {
  if (!(error instanceof Error)) {
    return "неизвестная ошибка";
  }

  const code = getErrorCode(error);

  if (code === "UNABLE_TO_VERIFY_LEAF_SIGNATURE") {
    return (
      "ошибка SSL при связи с Brevo. Перезапустите сервер: npm run dev " +
      "(в .env.local можно добавить BREVO_SKIP_TLS_VERIFY=true)"
    );
  }

  if (code === "ECONNRESET") {
    return (
      "соединение с Brevo оборвалось (ECONNRESET). Проверьте интернет/VPN/антивирус, " +
      "перезапустите npm run dev и попробуйте снова. Тест: npm run test:brevo -- email@example.com"
    );
  }

  if (error.message === "fetch failed") {
    const cause = error.cause as Error | undefined;
    return cause?.message ? `fetch failed (${cause.message})` : error.message;
  }

  return error.message;
}
