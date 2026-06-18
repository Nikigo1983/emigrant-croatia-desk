import { Card } from "@/components/ui/card";
import { Logo } from "@/components/logo";
import { ClientAssistantChat } from "@/components/client-assistant/client-assistant-chat";
import { DashboardFooter } from "@/components/dashboard-footer";
import { DashboardNav } from "@/components/dashboard-nav";
import { requireClient } from "@/lib/auth/guards";
import { isClientAssistantConfigured } from "@/lib/google-drive/config";
import { profileGreeting } from "@/lib/profile/greeting";

export default async function DashboardAssistantPage() {
  const { user, supabase } = await requireClient();
  const configured = isClientAssistantConfigured();

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
          <h2 className="mt-3 text-2xl font-semibold">AI-ассистент</h2>
          <p className="mt-2 text-slate-700">
            Справочник по визам, документам и процессу — на основе материалов Emigrant Croatia Desk.
          </p>
        </div>

        {configured ? (
          <ClientAssistantChat />
        ) : (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
            Ассистент временно недоступен. Администратору нужно настроить OpenRouter и Google Drive
            в переменных окружения.
          </div>
        )}

        <DashboardFooter variant="back" />
      </Card>
    </main>
  );
}
