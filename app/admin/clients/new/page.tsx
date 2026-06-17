import { Card } from "@/components/ui/card";
import { Logo } from "@/components/logo";
import { AdminNav } from "@/components/admin-nav";
import { CreateClientForm } from "@/components/create-client-form";
import { FormgridSyncPanel } from "@/components/formgrid-sync-panel";
import { requireAdmin } from "@/lib/auth/guards";
import { isFormgridSyncConfigured } from "@/lib/google-sheets/config";

export default async function NewClientPage() {
  await requireAdmin();
  const formgridConfigured = isFormgridSyncConfigured();

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
            Создание клиента вручную или автоматический импорт из Google Таблицы Formgrid.
          </p>
        </div>

        <FormgridSyncPanel configured={formgridConfigured} />

        <div className="border-t border-[var(--input-border)] pt-6">
          <h2 className="text-lg font-semibold text-slate-900">Создать вручную</h2>
          <div className="mt-4">
            <CreateClientForm />
          </div>
        </div>
      </Card>
    </main>
  );
}
