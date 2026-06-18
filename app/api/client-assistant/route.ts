import { getUserRole } from "@/lib/auth/get-user-role";
import {
  runClientAssistant,
  type ClientAssistantHistoryItem,
} from "@/lib/ai/client-assistant";
import { getWorkspaceInferenceConfig } from "@/lib/ai/workspace-config";
import { fetchClientCaseForDashboard } from "@/lib/cases/fetch-client-case-for-dashboard";
import { isClientAssistantConfigured } from "@/lib/google-drive/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

type RequestBody = {
  message?: string;
  history?: ClientAssistantHistoryItem[];
};

function sseEncode(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function POST(request: Request) {
  if (!isClientAssistantConfigured()) {
    return Response.json(
      { error: "AI-ассистент не настроен. Обратитесь к администратору." },
      { status: 503 },
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = await getUserRole(user.id);
  if (role !== "client") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return Response.json({ error: "Некорректный запрос." }, { status: 400 });
  }

  const message = body.message?.trim() ?? "";
  if (!message) {
    return Response.json({ error: "Введите вопрос." }, { status: 400 });
  }

  const history = Array.isArray(body.history) ? body.history : [];
  const caseItem = await fetchClientCaseForDashboard(supabase, user.id);
  const inference = getWorkspaceInferenceConfig();

  if (!inference.stream) {
    try {
      const reply = await runClientAssistant(message, history, caseItem);
      return Response.json({ reply });
    } catch (error) {
      return Response.json(
        {
          error:
            error instanceof Error ? error.message : "Не удалось получить ответ AI.",
        },
        { status: 500 },
      );
    }
  }

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(sseEncode(event, data)));
      };

      try {
        send("status", { message: "Ищем информацию в базе знаний…" });
        const reply = await runClientAssistant(message, history, caseItem, (delta) => {
          send("delta", { delta });
        });
        send("done", { reply });
      } catch (error) {
        send("error", {
          message:
            error instanceof Error ? error.message : "Не удалось получить ответ AI.",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
