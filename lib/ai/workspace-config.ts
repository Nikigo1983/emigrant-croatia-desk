import { getAiProvider, getDefaultModel } from "@/lib/ai/config";

export type WorkspaceInferenceConfig = {
  model: string;
  temperature: number;
  maxTokens: number;
  stream: boolean;
};

export function getWorkspaceInferenceConfig(): WorkspaceInferenceConfig {
  const provider = getAiProvider();
  const temperatureRaw = process.env.AI_WORKSPACE_TEMPERATURE?.trim();
  const maxTokensRaw = process.env.AI_WORKSPACE_MAX_TOKENS?.trim();
  const streamRaw = process.env.AI_WORKSPACE_STREAM?.trim();

  return {
    model: getDefaultModel(provider),
    temperature: temperatureRaw ? Number(temperatureRaw) : 0.4,
    maxTokens: maxTokensRaw ? Number(maxTokensRaw) : 1500,
    stream: streamRaw ? streamRaw === "true" : true,
  };
}
