"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Props = {
  userId: string;
  email: string;
  profileError: string | null;
  rowRole: string | null;
};

export function AuthMissingProfile({ userId, email, profileError, rowRole }: Props) {
  const handleLogout = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.assign("/auth");
  };

  return (
    <Card className="max-w-md space-y-4">
      <p className="text-sm text-slate-700">
        Вы вошли в аккаунт, но приложение не смогло прочитать вашу строку в{" "}
        <code className="rounded bg-slate-100 px-1">profiles</code> с ролями{" "}
        <code className="rounded bg-slate-100 px-1">admin</code> /{" "}
        <code className="rounded bg-slate-100 px-1">client</code>.
      </p>
      <div className="rounded-lg border border-[var(--input-border)] bg-slate-50 p-3 text-xs text-slate-700">
        <p className="font-semibold">Данные сессии (сверьте с Supabase)</p>
        <p className="mt-1 break-all">user.id: {userId}</p>
        <p className="mt-1 break-all">email: {email || "—"}</p>
        {rowRole ? <p className="mt-1 break-all">role в ответе БД: {rowRole}</p> : null}
        {profileError ? (
          <p className="mt-2 break-all text-red-700">Ошибка запроса: {profileError}</p>
        ) : (
          <p className="mt-2 text-slate-600">
            Ошибки запроса нет: строка не найдена или не проходит RLS. Убедитесь, что в{" "}
            <code className="rounded bg-white px-1">profiles.user_id</code> стоит{" "}
            <strong>тот же</strong> UUID, что в Authentication → Users для этого email.
          </p>
        )}
      </div>
      <p className="text-sm text-slate-600">
        В SQL Editor выполните{" "}
        <code className="rounded bg-slate-100 px-1">select id, email from auth.users;</code> и{" "}
        <code className="rounded bg-slate-100 px-1">select user_id, email, role from profiles;</code>{" "}
        — поле <code className="rounded bg-slate-100 px-1">user_id</code> должно совпадать с{" "}
        <code className="rounded bg-slate-100 px-1">auth.users.id</code>.
      </p>
      <Button type="button" className="w-auto px-4" onClick={handleLogout}>
        Выйти и попробовать снова
      </Button>
    </Card>
  );
}
