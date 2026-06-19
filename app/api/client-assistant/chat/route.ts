import { getUserRole } from "@/lib/auth/get-user-role";
import {
  deleteClientAssistantChat,
  loadClientAssistantChat,
  saveClientAssistantChat,
  type ClientAssistantChatMessage,
} from "@/lib/client-assistant/chat-repo";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

async function requireClientUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const role = await getUserRole(user.id);
  if (role !== "client") {
    return { error: Response.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { supabase, user };
}

export async function GET() {
  const session = await requireClientUser();
  if ("error" in session && session.error) {
    return session.error;
  }

  const { supabase, user } = session;

  try {
    const messages = await loadClientAssistantChat(supabase, user.id);
    return Response.json({ messages });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Не удалось загрузить историю.",
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  const session = await requireClientUser();
  if ("error" in session && session.error) {
    return session.error;
  }

  const { supabase, user } = session;

  let body: { messages?: ClientAssistantChatMessage[] };
  try {
    body = (await request.json()) as { messages?: ClientAssistantChatMessage[] };
  } catch {
    return Response.json({ error: "Некорректный запрос." }, { status: 400 });
  }

  if (!Array.isArray(body.messages)) {
    return Response.json({ error: "Некорректный формат истории." }, { status: 400 });
  }

  try {
    await saveClientAssistantChat(supabase, user.id, body.messages);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Не удалось сохранить историю.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  const session = await requireClientUser();
  if ("error" in session && session.error) {
    return session.error;
  }

  const { supabase, user } = session;

  try {
    await deleteClientAssistantChat(supabase, user.id);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Не удалось удалить диалог.",
      },
      { status: 500 },
    );
  }
}
