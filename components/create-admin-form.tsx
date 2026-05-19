"use client";

import { useActionState, useState } from "react";
import { createAdminAction } from "@/app/admin/create-admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: {
  error?: string;
  success?: boolean;
  adminEmail?: string;
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
    "Доступ в админку Emigrant Croatia Desk",
    "",
    `Страница входа: ${loginUrl}`,
    "",
    `Email: ${email}`,
    `Пароль: ${password}`,
  ].join("\n");
}

export function CreateAdminForm() {
  const [passwordValue, setPasswordValue] = useState("");
  const [copied, setCopied] = useState(false);
  const [state, formAction, isPending] = useActionState(createAdminAction, initialState);

  const handleGeneratePassword = () => {
    setPasswordValue(generateTemporaryPassword(12));
    setCopied(false);
  };

  const handleCopyCredentials = async () => {
    if (!state.adminEmail || !state.plainPassword) {
      return;
    }

    await navigator.clipboard.writeText(
      buildCredentialsMessage(state.adminEmail, state.plainPassword),
    );
    setCopied(true);
  };

  const handleCreateAnother = () => {
    window.location.assign("/admin/create-admin");
  };

  if (state.success && state.adminEmail && state.plainPassword) {
    return (
      <div className="space-y-4">
        <div className="space-y-3 rounded-xl border border-[var(--input-border)] bg-white p-5">
          <p className="text-sm font-semibold text-green-700">Администратор создан</p>
          <p className="text-sm text-slate-700">
            Передайте коллеге ссылку на вход и пароль. После входа у него будет полный доступ к
            админке и всем клиентам.
          </p>
          <p className="text-sm text-slate-600">
            Страница входа:{" "}
            <span className="break-all font-medium text-black">{getLoginPageUrl()}</span>
          </p>
          <p className="text-sm text-slate-700">
            Email: <span className="font-medium text-black">{state.adminEmail}</span>
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
          Создать ещё одного администратора
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
        <label htmlFor="password" className="text-sm font-medium">
          Временный пароль
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
        <p className="text-xs text-slate-500">
          Если поле пустое, пароль сгенерируется автоматически при создании.
        </p>
      </div>

      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Создаём..." : "Создать администратора"}
      </Button>
    </form>
  );
}
