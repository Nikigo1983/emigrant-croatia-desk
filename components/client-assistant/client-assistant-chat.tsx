"use client";

import { useEffect, useRef, useState } from "react";
import { AssistantMessageText } from "@/components/client-assistant/assistant-message-text";
import { Button } from "@/components/ui/button";

type ChatItem = {
  role: "user" | "assistant";
  content: string;
};

type ChatTurn = {
  id: string;
  question: string;
  answer: string;
};

const STARTER_PROMPTS = [
  "Какие документы нужны для ВНЖ Хорватии?",
  "Сколько обычно занимает рассмотрение?",
  "Что означает мой текущий статус?",
];

function itemsToTurns(items: ChatItem[]): ChatTurn[] {
  const turns: ChatTurn[] = [];

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    if (item.role !== "user") {
      continue;
    }

    const answer = items[index + 1]?.role === "assistant" ? items[index + 1].content : "";
    turns.push({
      id: `turn-${index}-${item.content.slice(0, 24)}`,
      question: item.content,
      answer,
    });
  }

  return turns;
}

export function ClientAssistantChat() {
  const [items, setItems] = useState<ChatItem[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isHydrating, setIsHydrating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    });
  };

  const persistChat = async (nextItems: ChatItem[]) => {
    const response = await fetch("/api/client-assistant/chat", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: nextItems }),
    });

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      throw new Error(data.error || "Не удалось сохранить историю.");
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      try {
        const response = await fetch("/api/client-assistant/chat");
        const data = (await response.json()) as {
          messages?: ChatItem[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(data.error || "Не удалось загрузить историю.");
        }

        if (!cancelled) {
          setItems(Array.isArray(data.messages) ? data.messages : []);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : "Не удалось загрузить историю.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsHydrating(false);
        }
      }
    }

    void loadHistory();

    return () => {
      cancelled = true;
    };
  }, []);

  const clearChat = async () => {
    if (!items.length) {
      return;
    }

    const confirmed = window.confirm("Удалить всю историю диалога с ассистентом?");
    if (!confirmed) {
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/client-assistant/chat", { method: "DELETE" });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error || "Не удалось удалить диалог.");
      }
      setItems([]);
      setInput("");
    } catch (clearError) {
      setError(clearError instanceof Error ? clearError.message : "Не удалось удалить диалог.");
    } finally {
      setIsLoading(false);
    }
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
    const nextItems = [...items, userItem, assistantPlaceholder];
    setItems(nextItems);
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
      let finalItems = nextItems;

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
              finalItems = finalItems.map((item, index) => {
                if (index === finalItems.length - 1 && item.role === "assistant") {
                  return { ...item, content: item.content + payload.delta };
                }
                return item;
              });
              setItems(finalItems);
              scrollToBottom();
            }

            if (event === "error") {
              throw new Error(payload.message || "Ошибка AI.");
            }

            if (event === "done") {
              finalItems = finalItems.map((item, index) => {
                if (index === finalItems.length - 1 && item.role === "assistant") {
                  return {
                    ...item,
                    content: payload.reply?.trim() || item.content,
                  };
                }
                return item;
              });
              setItems(finalItems);
            }
          }
        }
      } else {
        const data = (await response.json()) as { reply?: string; error?: string };
        if (!response.ok) {
          throw new Error(data.error || "Не удалось получить ответ.");
        }

        finalItems = finalItems.map((item, index) => {
          if (index === finalItems.length - 1 && item.role === "assistant") {
            return { ...item, content: data.reply ?? "" };
          }
          return item;
        });
        setItems(finalItems);
      }

      await persistChat(finalItems.filter((item) => item.content.trim()));
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

  const turns = itemsToTurns(items);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="rounded-xl border border-[var(--input-border)] bg-slate-50 p-4 text-sm text-slate-700">
          Задайте вопрос по визам, документам и процессу эмиграции. Ответы основаны на нашей базе
          знаний и вашем текущем статусе. Это справочная информация, не юридическая консультация.
        </div>
        {items.length > 0 ? (
          <Button
            type="button"
            variant="outline"
            className="w-full shrink-0 sm:w-auto"
            disabled={isLoading}
            onClick={() => void clearChat()}
          >
            Удалить диалог
          </Button>
        ) : null}
      </div>

      {items.length === 0 && !isHydrating ? (
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
        className="max-h-[32rem] space-y-4 overflow-y-auto rounded-xl border border-[var(--input-border)] bg-white p-4"
      >
        {isHydrating ? (
          <p className="text-sm text-slate-500">Загружаем историю диалога…</p>
        ) : turns.length === 0 ? (
          <p className="text-sm text-slate-500">
            Пока нет сообщений. Выберите подсказку или задайте свой вопрос.
          </p>
        ) : (
          turns.map((turn, index) => (
            <div
              key={turn.id}
              className="space-y-3 rounded-xl border border-[var(--input-border)] bg-slate-50/60 p-4"
            >
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Ваш вопрос
                </p>
                <div className="rounded-xl bg-[var(--accent)] px-4 py-3 text-sm text-white">
                  <p className="whitespace-pre-wrap">{turn.question}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Ответ ассистента
                </p>
                <div className="rounded-xl bg-white px-4 py-3">
                  {turn.answer.trim() ? (
                    <AssistantMessageText content={turn.answer} />
                  ) : index === turns.length - 1 && isLoading ? (
                    <p className="text-sm text-slate-500">Готовим ответ…</p>
                  ) : (
                    <p className="text-sm text-slate-500">Ответ не получен.</p>
                  )}
                </div>
              </div>
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
          className="min-h-[4.5rem] flex-1 resize-y rounded-xl border border-[var(--input-border)] bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-[var(--accent)]"
        />
        <Button type="submit" className="w-full sm:w-auto sm:self-end" disabled={isLoading || !input.trim()}>
          {isLoading ? "Думаем…" : "Спросить"}
        </Button>
      </form>
    </div>
  );
}
