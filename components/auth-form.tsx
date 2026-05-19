"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { AppRole } from "@/lib/types/profile";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/logo";

export function AuthForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = useCallback(async () => {
    setErrorMessage(null);
    setIsLoading(true);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setErrorMessage("Введите email и пароль.");
      setIsLoading(false);
      return;
    }

    try {
      const supabase = createSupabaseBrowserClient();

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (authError || !authData.user) {
        setErrorMessage(
          authError?.message
            ? `Не удалось войти: ${authError.message}`
            : "Неверный email или пароль.",
        );
        return;
      }

      const { data: profileRow, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", authData.user.id)
        .maybeSingle();

      if (profileError) {
        setErrorMessage(`Не удалось прочитать профиль: ${profileError.message}`);
        return;
      }

      if (!profileRow) {
        setErrorMessage("Профиль пользователя не найден.");
        return;
      }

      const rawRole = profileRow.role;
      const role: AppRole | null =
        rawRole === "admin" || rawRole === "client" ? rawRole : null;

      if (!role) {
        setErrorMessage("Роль пользователя не определена.");
        return;
      }

      const destination = role === "admin" ? "/admin" : "/dashboard";
      window.location.assign(destination);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Произошла ошибка при входе.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [email, password]);

  const inputClass =
    "h-12 w-full rounded-xl border border-[var(--input-border)] bg-white px-4 text-base text-black outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20";

  return (
    <Card className="max-w-md">
      <div className="mb-8">
        <Logo />
        <h1 className="mt-6 text-3xl font-semibold">Вход в кабинет</h1>
        <p className="mt-2 text-sm text-slate-600">
          Доступ выдаётся администратором Emigrant.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="password" className="text-sm font-medium">
            Пароль
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
        </div>

        {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}

        <button
          type="button"
          disabled={isLoading}
          onClick={() => void handleLogin()}
          className="h-12 w-full rounded-xl bg-[var(--accent)] px-5 text-base font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "Входим..." : "Войти"}
        </button>

        <p className="text-center text-xs leading-relaxed text-slate-600">
          Входя в систему, вы соглашаетесь с{" "}
          <Link href="/privacy" className="font-medium text-[var(--accent)] hover:underline">
            Политикой конфиденциальности
          </Link>{" "}
          и{" "}
          <Link href="/consent" className="font-medium text-[var(--accent)] hover:underline">
            обработкой персональных данных
          </Link>
          .
        </p>
      </div>
    </Card>
  );
}
