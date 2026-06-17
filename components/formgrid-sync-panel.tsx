"use client";

import { useState, useTransition } from "react";
import { syncFormgridAction, type SyncFormgridState } from "@/app/admin/clients/actions";
import { Button } from "@/components/ui/button";

type Props = {
  configured: boolean;
};

export function FormgridSyncPanel({ configured }: Props) {
  const [result, setResult] = useState<SyncFormgridState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSync = () => {
    setError(null);
    startTransition(async () => {
      try {
        const syncResult = await syncFormgridAction();
        setResult(syncResult);
      } catch (syncError) {
        setError(syncError instanceof Error ? syncError.message : "Ошибка синхронизации.");
      }
    });
  };

  return (
    <div className="space-y-4 rounded-xl border border-[var(--input-border)] bg-slate-50 p-5">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-slate-900">Импорт из Google Таблицы (Formgrid)</h2>
        <p className="text-sm leading-relaxed text-slate-700">
          При первом запуске все текущие строки таблицы помечаются как «уже были» — клиенты из них
          не создаются. Дальше импортируются только новые анкеты. Новые карточки помечаются
          статусом «Новый» в списке клиентов; после обработки снимите метку в карточке.
        </p>
        {!configured ? (
          <p className="text-sm text-amber-800">
            Синхронизация не настроена: добавьте переменные Google Sheets в `.env.local` / Vercel
            (см. `.env.example`).
          </p>
        ) : (
          <p className="text-sm text-slate-600">
            Автосинхронизация каждые 10 минут (Vercel Cron). Можно запустить вручную.
          </p>
        )}
      </div>

      <Button type="button" className="w-auto px-4" disabled={!configured || isPending} onClick={handleSync}>
        {isPending ? "Синхронизируем…" : "Синхронизировать сейчас"}
      </Button>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {result ? (
        <div className="space-y-3 rounded-lg border border-[var(--input-border)] bg-white p-4 text-sm">
          {result.error ? <p className="text-red-600">{result.error}</p> : null}
          {result.baselineEstablished ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-950">
              Базовая линия установлена: {result.baselined} строк в таблице зафиксированы как
              уже существующие. Следующие синхронизации будут создавать только новых клиентов.
            </p>
          ) : null}
          <p className="text-slate-700">
            Проверено строк: <span className="font-medium">{result.scanned}</span> · создано:{" "}
            <span className="font-medium text-green-700">{result.created}</span> · пропущено:{" "}
            <span className="font-medium">{result.skipped}</span>
            {result.baselined > 0 ? (
              <>
                {" "}
                · зафиксировано: <span className="font-medium">{result.baselined}</span>
              </>
            ) : null}{" "}
            · ошибок: <span className="font-medium text-red-700">{result.errors}</span>
          </p>

          {result.items.length > 0 ? (
            <ul className="max-h-56 space-y-1 overflow-y-auto text-xs text-slate-600">
              {result.items
                .filter((item) => item.status !== "skipped" || item.email)
                .slice(0, 30)
                .map((item) => (
                  <li key={`${item.rowNumber}-${item.email}`}>
                    Строка {item.rowNumber}
                    {item.email ? ` · ${item.email}` : ""}: {item.message}
                  </li>
                ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
