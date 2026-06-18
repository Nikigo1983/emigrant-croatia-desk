import {
  getAiApiKey,
  getAiApiUrl,
  getAiProvider,
  type AiProvider,
} from "@/lib/ai/config";
import { getWorkspaceInferenceConfig } from "@/lib/ai/workspace-config";
import { getSiteUrl } from "@/lib/site-url";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type StreamDeltaHandler = (delta: string) => void;

function buildHeaders(provider: AiProvider, apiKey: string): HeadersInit {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };

  if (provider === "openrouter") {
    headers["HTTP-Referer"] =
      process.env.OPENROUTER_HTTP_REFERER?.trim() || getSiteUrl();
    headers["X-Title"] =
      process.env.OPENROUTER_APP_TITLE?.trim() || "Emigrant Croatia Desk";
  }

  return headers;
}

export async function completeChat(messages: ChatMessage[]): Promise<string> {
  const apiKey = getAiApiKey();
  if (!apiKey) {
    throw new Error("AI не настроен: задайте OPENROUTER_API_KEY или OPENAI_API_KEY.");
  }

  const provider = getAiProvider();
  const inference = getWorkspaceInferenceConfig();

  const response = await fetch(getAiApiUrl(provider), {
    method: "POST",
    headers: buildHeaders(provider, apiKey),
    body: JSON.stringify({
      model: inference.model,
      messages,
      temperature: inference.temperature,
      max_tokens: inference.maxTokens,
      stream: false,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`AI error ${response.status}: ${text}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return data.choices?.[0]?.message?.content?.trim() || "";
}

export async function streamChat(
  messages: ChatMessage[],
  onDelta: StreamDeltaHandler,
): Promise<string> {
  const apiKey = getAiApiKey();
  if (!apiKey) {
    throw new Error("AI не настроен: задайте OPENROUTER_API_KEY или OPENAI_API_KEY.");
  }

  const provider = getAiProvider();
  const inference = getWorkspaceInferenceConfig();

  const response = await fetch(getAiApiUrl(provider), {
    method: "POST",
    headers: buildHeaders(provider, apiKey),
    body: JSON.stringify({
      model: inference.model,
      messages,
      temperature: inference.temperature,
      max_tokens: inference.maxTokens,
      stream: true,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`AI error ${response.status}: ${text}`);
  }

  if (!response.body) {
    throw new Error("AI stream: пустой ответ.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) {
        continue;
      }
      const payload = trimmed.slice(5).trim();
      if (!payload || payload === "[DONE]") {
        continue;
      }

      try {
        const parsed = JSON.parse(payload) as {
          choices?: Array<{ delta?: { content?: string } }>;
        };
        const delta = parsed.choices?.[0]?.delta?.content;
        if (delta) {
          fullText += delta;
          onDelta(delta);
        }
      } catch {
        // ignore malformed SSE chunks
      }
    }
  }

  return fullText.trim();
}
