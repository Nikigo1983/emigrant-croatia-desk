"use server";

// Вход с формы /auth сейчас выполняется в components/auth-form.tsx через
// createSupabaseBrowserClient + signInWithPassword (временный client-side путь).
// signInAction ниже не используется формой; оставлен для возможного возврата к server login.

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type SignInState = { error: string } | null;

export async function signInAction(
  _prevState: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Введите email и пароль." };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!supabaseUrl) {
    return {
      error:
        "В .env.local не задан NEXT_PUBLIC_SUPABASE_URL. Укажите URL проекта из Supabase → Settings → API.",
    };
  }

  let error: { message: string } | null = null;
  try {
    const supabase = await createSupabaseServerClient();
    const result = await supabase.auth.signInWithPassword({ email, password });
    error = result.error;
  } catch (cause) {
    const msg = cause instanceof Error ? cause.message : String(cause);
    if (msg.includes("fetch failed") || msg === "Failed to fetch") {
      return {
        error:
          "Не удалось установить HTTPS-соединение с Supabase (сеть/VPN). Проверьте NEXT_PUBLIC_SUPABASE_URL и доступность интернета до *.supabase.co.",
      };
    }
    return { error: `Не удалось войти: ${msg}` };
  }

  if (error) {
    const raw = error.message ?? "";
    if (raw.includes("fetch failed") || raw === "Failed to fetch") {
      return {
        error:
          "Не удалось установить HTTPS-соединение с Supabase (сеть/VPN/фаервол). Убедитесь, что NEXT_PUBLIC_SUPABASE_URL — облачный https://….supabase.co. Если приложение в Docker и в .env указан http://127.0.0.1:54321 (локальный CLI), с контейнера этот адрес недоступен — замените на облачный URL или host.docker.internal.",
      };
    }
    return {
      error: raw ? `Не удалось войти: ${raw}` : "Неверный email или пароль.",
    };
  }

  redirect("/");
}
