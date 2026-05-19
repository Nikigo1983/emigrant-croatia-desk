"use client";

import { useActionState, useState } from "react";
import { createClientAction } from "@/app/admin/clients/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: {
  error?: string;
  success?: boolean;
  clientEmail?: string;
  plainPassword?: string;
} = {};

function generateTemporaryPassword(length = 12) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  let password = "";

  for (let index = 0; index < length; index += 1) {
    password += chars[bytes[index] % chars.length];
  }

  return password;
}

function getLoginPageUrl() {
  const base =
    (typeof process.env.NEXT_PUBLIC_SITE_URL === "string" &&
      process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")) ||
    "";
  if (base) {
    return `${base}/auth`;
  }
  if (typeof window !== "undefined") {
    return `${window.location.origin}/auth`;
  }
  return "/auth";
}

function buildCredentialsMessage(email: string, password: string) {
  const loginUrl = getLoginPageUrl();
  return [
    "Доступ в личный кабинет Emigrant Croatia Desk",
    "",
    `Страница входа: ${loginUrl}`,
    "",
    `Email: ${email}`,
    `Пароль: ${password}`,
  ].join("\n");
}

export function CreateClientForm() {
  const [passwordValue, setPasswordValue] = useState("");
  const [copied, setCopied] = useState(false);
  const [state, formAction, isPending] = useActionState(createClientAction, initialState);

  const handleGeneratePassword = () => {
    setPasswordValue(generateTemporaryPassword(12));
    setCopied(false);
  };

  const handleCopyCredentials = async () => {
    if (!state.clientEmail || !state.plainPassword) {
      return;
    }

    await navigator.clipboard.writeText(
      buildCredentialsMessage(state.clientEmail, state.plainPassword),
    );
    setCopied(true);
  };

  const handleCreateAnother = () => {
    window.location.assign("/admin/clients/new");
  };

  if (state.success && state.clientEmail && state.plainPassword) {
    return (
      <div className="space-y-4">
        <div className="space-y-3 rounded-xl border border-[var(--input-border)] bg-white p-5">
          <p className="text-sm font-semibold text-green-700">Клиент создан</p>
          <p className="text-sm text-slate-700">
            Передайте клиенту ссылку на вход и пароль — например в WhatsApp, Telegram или
            письмом. Ниже можно одним нажатием скопировать готовый текст.
          </p>
          <p className="text-sm text-slate-600">
            Страница входа:{" "}
            <span className="break-all font-medium text-black">{getLoginPageUrl()}</span>
          </p>
          <p className="text-sm text-slate-700">
            Email: <span className="font-medium text-black">{state.clientEmail}</span>
          </p>
          <p className="text-sm text-slate-700">
            Пароль: <span className="font-medium text-black">{state.plainPassword}</span>
          </p>
        </div>

        <Button type="button" onClick={handleCopyCredentials}>
          Скопировать данные для входа
        </Button>
        {copied ? <p className="text-center text-xs text-slate-500">Скопировано в буфер</p> : null}

        <Button
          type="button"
          variant="outline"
          className="border-2 font-semibold hover:border-[var(--accent)] hover:text-[var(--accent)]"
          onClick={handleCreateAnother}
        >
          Создать ещё одного клиента
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="first_name" className="text-sm font-medium">
            Имя
          </label>
          <Input id="first_name" name="first_name" required />
        </div>
        <div className="space-y-1">
          <label htmlFor="last_name" className="text-sm font-medium">
            Фамилия
          </label>
          <Input id="last_name" name="last_name" />
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <Input id="email" name="email" type="email" required />
      </div>

      <div className="space-y-1">
        <label htmlFor="passport_number" className="text-sm font-medium">
          Номер паспорта
        </label>
        <Input
          id="passport_number"
          name="passport_number"
          type="text"
          autoComplete="off"
        />
        <p className="text-xs text-slate-500">
          Сохраняется в карточке дела и отображается в списке клиентов.
        </p>
      </div>

      <div className="space-y-1">
        <label htmlFor="password" className="text-sm font-medium">
          Пароль
        </label>
        <div className="flex gap-2">
          <Input
            id="password"
            name="password"
            type="text"
            value={passwordValue}
            onChange={(event) => setPasswordValue(event.target.value)}
          />
          <Button type="button" className="w-auto px-4" onClick={handleGeneratePassword}>
            Сгенерировать пароль
          </Button>
        </div>
      </div>

      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Создаём..." : "Создать клиента"}
      </Button>
    </form>
  );
}
