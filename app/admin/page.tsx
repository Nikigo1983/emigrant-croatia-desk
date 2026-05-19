import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/logo";
import { LogoutButton } from "@/components/logout-button";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/auth/get-user-role";
import { profileGreetingFirstName } from "@/lib/profile/greeting";
import { AdminNav } from "@/components/admin-nav";

export default async function AdminPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const role = await getUserRole(user.id);
  if (role !== "admin") {
    redirect("/dashboard");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name")
    .eq("user_id", user.id)
    .maybeSingle();

  const greeting = profileGreetingFirstName(profile?.first_name ?? null);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-4 py-12">
      <Card className="max-w-2xl space-y-6">
        <Logo />
        <AdminNav />
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold">{greeting}</h1>
          <p className="text-lg font-medium text-slate-800">
            Рабочее место куратора — здесь всё по делам клиентов в одном месте.
          </p>
          <p className="text-base leading-relaxed text-slate-700">
            Заводите новых людей в кабинет, смотрите список дел и обновляйте этапы по любому
            клиенту — несколько администраторов работают с одними и теми же карточками, без
            разделения «мои» и «чужие». Клиент у себя на экране видит то же самое — без путаницы
            и лишних уточнений.
          </p>
          <p className="text-sm text-slate-500">Ваш email: {user.email}</p>
        </div>
        <LogoutButton />
      </Card>
    </main>
  );
}
