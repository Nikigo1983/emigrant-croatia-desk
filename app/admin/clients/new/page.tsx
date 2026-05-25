import { Card } from "@/components/ui/card";
import { Logo } from "@/components/logo";
import { AdminNav } from "@/components/admin-nav";
import { CreateClientForm } from "@/components/create-client-form";
import { requireAdmin } from "@/lib/auth/guards";

export default async function NewClientPage() {
  await requireAdmin();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 px-4 py-10">
      <Card className="max-w-3xl space-y-6">
        <div className="space-y-4">
          <Logo href="/admin" />
          <AdminNav />
        </div>

        <div>
          <h1 className="text-3xl font-semibold">Новый клиент</h1>
          <p className="mt-2 text-slate-700">
            Создание клиента с автоматическим созданием профиля и карточки дела.
          </p>
        </div>

        <CreateClientForm />
      </Card>
    </main>
  );
}
