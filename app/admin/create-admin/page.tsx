import { Card } from "@/components/ui/card";
import { Logo } from "@/components/logo";
import { AdminNav } from "@/components/admin-nav";
import { CreateAdminForm } from "@/components/create-admin-form";
import { requireAdmin } from "@/lib/auth/guards";

export default async function CreateAdminPage() {
  await requireAdmin();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 px-4 py-10">
      <Card className="max-w-3xl space-y-6">
        <div className="space-y-4">
          <Logo />
          <AdminNav />
        </div>

        <section>
          <h1 className="text-3xl font-semibold">Новый администратор</h1>
          <p className="mt-2 text-slate-700">
            Создание учётной записи сотрудника с ролью admin. Доступ ко всем клиентам и делам
            появится сразу после первого входа.
          </p>
        </section>

        <CreateAdminForm />
      </Card>
    </main>
  );
}
