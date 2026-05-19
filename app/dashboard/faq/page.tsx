import { Card } from "@/components/ui/card";
import { Logo } from "@/components/logo";
import { DashboardFooter } from "@/components/dashboard-footer";
import { DashboardNav } from "@/components/dashboard-nav";
import { requireClient } from "@/lib/auth/guards";
import { profileGreeting } from "@/lib/profile/greeting";

const FAQ_ITEMS = [
  {
    question: "Нужен ли апостиль?",
    answer:
      "Это зависит от типа документа и страны выдачи. По вашему делу мы отдельно отмечаем, на какие документы апостиль обязателен.",
  },
  {
    question: "Есть ли сроки?",
    answer:
      "Да, сроки есть на каждом этапе, но они зависят от загрузки ведомств и консульств. Точные ориентиры сообщает ваш куратор.",
  },
  {
    question: "Почему долго проверка адреса?",
    answer:
      "Проверка адреса выполняется внешними службами и может занимать больше времени из-за очередей и региональной нагрузки.",
  },
  {
    question: "Почему долго проверка безопасности?",
    answer:
      "Проверка безопасности проходит по внутреннему регламенту ведомств. На длительность влияют межведомственные согласования.",
  },
];

export default async function DashboardFaqPage() {
  const { user, supabase } = await requireClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name")
    .eq("user_id", user.id)
    .maybeSingle();
  const greeting = profileGreeting(profile?.first_name ?? null, profile?.last_name ?? null);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 px-4 py-10">
      <Card className="space-y-6">
        <div className="space-y-4">
          <Logo />
          <DashboardNav />
        </div>

        <div>
          <h1 className="text-3xl font-semibold">{greeting}</h1>
          <h2 className="mt-3 text-2xl font-semibold">FAQ</h2>
          <p className="mt-2 text-slate-700">Частые вопросы по процессу ВНЖ</p>
        </div>

        <div className="space-y-4">
          {FAQ_ITEMS.map((item) => (
            <div key={item.question} className="rounded-xl border border-[var(--input-border)] bg-white p-5">
              <h2 className="text-lg font-semibold">{item.question}</h2>
              <p className="mt-2 text-sm text-slate-700">{item.answer}</p>
            </div>
          ))}
        </div>

        <DashboardFooter />
      </Card>
    </main>
  );
}
