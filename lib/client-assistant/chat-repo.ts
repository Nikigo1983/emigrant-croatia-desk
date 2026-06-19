import type { SupabaseClient } from "@supabase/supabase-js";

export type ClientAssistantChatMessage = {
  role: "user" | "assistant";
  content: string;
};

function normalizeMessages(raw: unknown): ClientAssistantChatMessage[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .map((item) => {
      if (
        typeof item === "object" &&
        item !== null &&
        "role" in item &&
        "content" in item &&
        (item.role === "user" || item.role === "assistant") &&
        typeof item.content === "string"
      ) {
        return {
          role: item.role,
          content: item.content.trim(),
        };
      }
      return null;
    })
    .filter((item): item is ClientAssistantChatMessage => Boolean(item?.content));
}

export async function loadClientAssistantChat(
  supabase: SupabaseClient,
  userId: string,
): Promise<ClientAssistantChatMessage[]> {
  const { data, error } = await supabase
    .from("client_assistant_chats")
    .select("messages")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return normalizeMessages(data?.messages);
}

export async function saveClientAssistantChat(
  supabase: SupabaseClient,
  userId: string,
  messages: ClientAssistantChatMessage[],
): Promise<void> {
  const cleaned = messages.filter((item) => item.content.trim());

  const { error } = await supabase.from("client_assistant_chats").upsert(
    {
      user_id: userId,
      messages: cleaned,
    },
    { onConflict: "user_id" },
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteClientAssistantChat(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  const { error } = await supabase
    .from("client_assistant_chats")
    .delete()
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }
}
