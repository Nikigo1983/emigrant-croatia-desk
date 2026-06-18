"use client";

import { useRef, useState } from "react";
import { AssistantMessageText } from "@/components/client-assistant/assistant-message-text";
import { Button } from "@/components/ui/button";

type ChatItem = {
  role: "user" | "assistant";
  content: string;
};

const STARTER_PROMPTS = [
  "Какие документы нужны для ВНЖ Хорватии?",
  "Сколько обычно занимает рассмотрение?",
  "Что означает мой текущий статус?",
];

export function ClientAssistantChat() {
  const [items, setItems] = useState<ChatItem[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    });
  };

  const sendMessage = async (text: string) => {
    const message = text.trim();
    if (!message || isLoading) {
      return;
    }

    setError(null);
    setIsLoading(true);
    setInput("");

    const userItem: ChatItem = { role: "user", content: message };
    const assistantPlaceholder: ChatItem = { role: "assistant", content: "" };
    setItems((prev) => [...prev, userItem, assistantPlaceholder]);
    scrollToBottom();

    const history = items.map((item) => ({
      role: item.role,
      content: item.content,
    }));

    try {
      const response = await fetch("/api/client-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history }),
      });

      const contentType = response.headers.get("content-type") ?? "";

      if (contentType.includes("text/event-stream") && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const chunks = buffer.split("\n\n");
          buffer = chunks.pop() ?? "";

          for (const chunk of chunks) {
            const lines = chunk.split("\n");
            let event = "message";
            let dataLine = "";

            for (const line of lines) {
              if (line.startsWith("event:")) {
                event = line.slice(6).trim();
              } else if (line.startsWith("data:")) {
                dataLine = line.slice(5).trim();
              }
            }

            if (!dataLine) {
              continue;
            }

            const payload = JSON.parse(dataLine) as {
              delta?: string;
              reply?: string;
              message?: string;
            };

            if (event === "delta" && payload.delta) {
              setItems((prev) => {
                const next = [...prev];
                const last = next[next.length - 1];
                if (last?.role === "assistant") {
                  next[next.length - 1] = {
                    ...last,
                    content: last.content + payload.delta,
                  };
                }
                return next;
              });
              scrollToBottom();
            }

            if (event === "error") {
              throw new Error(payload.message || "Ошибка AI.");
            }

            if (event === "done" && payload.reply) {
              setItems((prev) => {
                const next = [...prev];
                const last = next[next.length - 1];
                if (last?.role === "assistant") {
                  next[next.length - 1] = { ...last, content: payload.reply ?? last.content };
                }
                return next;
              });
            }
          }
        }
      } else {
        const data = (await response.json()) as { reply?: string; error?: string };
        if (!response.ok) {
          throw new Error(data.error || "Не удалось получить ответ.");
        }
        setItems((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last?.role === "assistant") {
            next[next.length - 1] = { ...last, content: data.reply ?? "" };
          }
          return next;
        });
      }
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Ошибка отправки.");
      setItems((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last?.role === "assistant" && !last.content.trim()) {
          next.pop();
        }
        return next;
      });
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[var(--input-border)] bg-slate-50 p-4 text-sm text-slate-700">
        Задайте вопрос по визам, документам и процессу эмиграции. Ответы основаны на нашей базе
        знаний и вашем текущем статусе. Это справочная информация, не юридическая консультация.
      </div>

      {items.length === 0 ? (
        <div className="flex flex-wrap gap-2">
          {STARTER_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              className="rounded-full border border-[var(--input-border)] bg-white px-3 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-50"
              onClick={() => sendMessage(prompt)}
              disabled={isLoading}
            >
              {prompt}
            </button>
          ))}
        </div>
      ) : null}

      <div
        ref={listRef}
        className="max-h-[28rem] space-y-3 overflow-y-auto rounded-xl border border-[var(--input-border)] bg-white p-4"
      >
        {items.length === 0 ? (
          <p className="text-sm text-slate-500">Пока нет сообщений. Выберите подсказку или задайте свой вопрос.</p>
        ) : (
          items.map((item, index) => (
            <div
              key={`${item.role}-${index}`}
              className={
                item.role === "user"
                  ? "ml-8 rounded-xl bg-[var(--brand)] px-4 py-3 text-sm text-white"
                  : "mr-8 rounded-xl bg-slate-50 px-4 py-3"
              }
            >
              {item.role === "user" ? (
                <p className="whitespace-pre-wrap text-sm">{item.content}</p>
              ) : (
                <AssistantMessageText content={item.content || (isLoading ? "…" : "")} />
              )}
            </div>
          ))
        )}
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <form
        className="flex flex-col gap-3 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          void sendMessage(input);
        }}
      >
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Например: какие документы нужны для продления визы?"
          rows={3}
          disabled={isLoading}
          className="min-h-[4.5rem] flex-1 resize-y rounded-xl border border-[var(--input-border)] bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-[var(--brand)]"
        />
        <Button type="submit" className="w-full sm:w-auto sm:self-end" disabled={isLoading || !input.trim()}>
          {isLoading ? "Думаем…" : "Спросить"}
        </Button>
      </form>
    </div>
  );
}
