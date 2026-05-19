"use client";

import { useActionState, useMemo, useState } from "react";
import { resetClientPasswordAction } from "@/app/admin/clients/actions";
import { Button } from "@/components/ui/button";

type Props = {
  clientId: string;
  clientEmail: string;
};

const initialState: { error?: string; newPassword?: string } = {};

export function AdminClientAccessHelp({ clientId, clientEmail }: Props) {
  const action = useMemo(() => resetClientPasswordAction.bind(null, clientId), [clientId]);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [copiedFor, setCopiedFor] = useState<string | null>(null);
  const copied = Boolean(state.newPassword && copiedFor === state.newPassword);

  const handleCopy = async () => {
    if (!state.newPassword) {
      return;
    }
    await navigator.clipboard.writeText(
      [
        "Доступ в личный кабинет Emigrant Croatia Desk",
        "",
        `Email: ${clientEmail}`,
        `Пароль: ${state.newPassword}`,
      ].join("\n"),
    );
    setCopiedFor(state.newPassword);
  };

  return (
    <div className="space-y-3 rounded-xl border border-[var(--input-border)] bg-slate-50 p-4">
      <div className="space-y-1.5">
        <p className="text-sm font-medium text-slate-800">Вход в кабинет клиента</p>
        <p className="text-sm font-semibold text-slate-900">
          Если клиент забыл пароль или пишет, что не получается войти
        </p>
        <p className="text-sm leading-relaxed text-slate-700">
          Старый пароль посмотреть нельзя — в системе он хранится только в зашифрованном виде.
          Нажмите «Выдать новый временный пароль», затем отправьте клиенту email и новый пароль
          вручную (мессенджер или почта).
        </p>
      </div>
      <p className="text-sm text-slate-600">
        Email для входа: <span className="font-medium text-black">{clientEmail}</span>
      </p>

      <form action={formAction} className="flex flex-wrap items-center gap-2">
        <Button type="submit" disabled={isPending} className="w-auto px-4">
          {isPending ? "Генерируем…" : "Выдать новый временный пароль"}
        </Button>
      </form>

      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}

      {state.newPassword ? (
        <div className="space-y-2 rounded-lg border border-[var(--input-border)] bg-white p-3">
          <p className="text-xs font-medium text-green-800">Новый пароль (сохранён в аккаунте)</p>
          <p className="break-all font-mono text-sm text-black">{state.newPassword}</p>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" className="w-auto px-4" onClick={handleCopy}>
              Скопировать email и пароль
            </Button>
            {copied ? <span className="text-xs text-slate-500">Скопировано</span> : null}
          </div>
          <p className="text-xs text-slate-500">
            Предыдущий пароль перестанет действовать. Передайте клиенту новый пароль и напомните
            страницу входа в кабинет.
          </p>
        </div>
      ) : null}
    </div>
  );
}
