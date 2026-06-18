import { buildClientCaseContextForAi } from "@/lib/ai/client-case-context";
import { buildClientAssistantSystemMessage } from "@/lib/ai/client-assistant-prompt";
import type { ChatMessage } from "@/lib/ai/openrouter";
import { completeChat, streamChat } from "@/lib/ai/openrouter";
import { getWorkspaceInferenceConfig } from "@/lib/ai/workspace-config";
import type { ClientDashboardCaseRow } from "@/lib/cases/fetch-client-case-for-dashboard";
import { getGoogleDriveKbConfig } from "@/lib/google-drive/config";
import { getKnowledgeBaseTextForAi } from "@/lib/google-drive/kb-text";

export type ClientAssistantHistoryItem = {
  role: "user" | "assistant";
  content: string;
};

const MAX_HISTORY_TURNS = 4;

function trimHistory(history: ClientAssistantHistoryItem[]): ClientAssistantHistoryItem[] {
  return history
    .filter((item) => item.content.trim())
    .slice(-MAX_HISTORY_TURNS * 2);
}

export async function buildClientAssistantMessages(
  message: string,
  history: ClientAssistantHistoryItem[],
  caseItem: ClientDashboardCaseRow | null,
): Promise<ChatMessage[]> {
  const kbConfig = getGoogleDriveKbConfig();
  const knowledgeBase = kbConfig
    ? await getKnowledgeBaseTextForAi(kbConfig, message)
    : "База знаний не настроена.";

  const system = buildClientAssistantSystemMessage(
    knowledgeBase,
    buildClientCaseContextForAi(caseItem),
  );

  const messages: ChatMessage[] = [{ role: "system", content: system }];

  for (const item of trimHistory(history)) {
    messages.push({ role: item.role, content: item.content });
  }

  messages.push({ role: "user", content: message.trim() });
  return messages;
}

export async function runClientAssistant(
  message: string,
  history: ClientAssistantHistoryItem[],
  caseItem: ClientDashboardCaseRow | null,
  onDelta?: (delta: string) => void,
): Promise<string> {
  const messages = await buildClientAssistantMessages(message, history, caseItem);
  const inference = getWorkspaceInferenceConfig();

  if (inference.stream && onDelta) {
    return streamChat(messages, onDelta);
  }

  return completeChat(messages);
}
