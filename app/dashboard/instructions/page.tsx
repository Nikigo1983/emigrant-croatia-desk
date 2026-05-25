import { Card } from "@/components/ui/card";
import { Logo } from "@/components/logo";
import { DashboardFooter } from "@/components/dashboard-footer";
import { DashboardNav } from "@/components/dashboard-nav";
import { requireClient } from "@/lib/auth/guards";
import { profileGreeting } from "@/lib/profile/greeting";

const INSTRUCTION_ITEMS = [
  {
    title: "Как сдать биометрию",
    text: "После приглашения на биометрию возьмите паспорт, подтверждение записи и приходите в назначенное время без опоздания.",
  },
  {
    title: "Как отправить документы на регистрацию адреса",
    text: "Подготовьте подтверждение проживания, заполненные формы и передайте пакет по инструкции куратора вашего дела.",
  },
  {
    title: "Что делать после одобрения ВНЖ",
    text: "Следуйте шагам куратора: подтвердите получение решения, завершите обязательные регистрационные действия и ожидайте выпуск карты.",
  },
];

export default async function DashboardInstructionsPage() {
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
          <Logo href="/dashboard" />
          <DashboardNav />
        </div>

        <div>
          <h1 className="text-3xl font-semibold">{greeting}</h1>
          <h2 className="mt-3 text-2xl font-semibold">Инструкции</h2>
          <p className="mt-2 text-slate-700">Практические шаги по ключевым этапам</p>
        </div>

        <div className="space-y-4">
          {INSTRUCTION_ITEMS.map((item) => (
            <div key={item.title} className="rounded-xl border border-[var(--input-border)] bg-white p-5">
              <h2 className="text-lg font-semibold">{item.title}</h2>
              <p className="mt-2 text-sm text-slate-700">{item.text}</p>
            </div>
          ))}
        </div>

        <DashboardFooter variant="back" />
      </Card>
    </main>
  );
}
