export type AiProvider = "openrouter" | "openai";

export function getAiProvider(): AiProvider {
  if (process.env.OPENROUTER_API_KEY?.trim()) {
    return "openrouter";
  }
  return "openai";
}

export function getAiApiKey(): string | null {
  const openrouter = process.env.OPENROUTER_API_KEY?.trim();
  if (openrouter) {
    return openrouter;
  }
  const openai = process.env.OPENAI_API_KEY?.trim();
  return openai || null;
}

export function getAiApiUrl(provider: AiProvider): string {
  if (provider === "openrouter") {
    return "https://openrouter.ai/api/v1/chat/completions";
  }
  return "https://api.openai.com/v1/chat/completions";
}

export function getDefaultModel(provider: AiProvider): string {
  const workspaceModel = process.env.AI_WORKSPACE_MODEL?.trim();
  if (workspaceModel) {
    return workspaceModel;
  }
  if (provider === "openrouter") {
    return process.env.OPENROUTER_MODEL?.trim() || "openai/gpt-4o-mini";
  }
  return process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
}
