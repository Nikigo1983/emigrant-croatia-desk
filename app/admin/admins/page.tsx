import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/logo";
import { AdminNav } from "@/components/admin-nav";
import { AdminDeleteAdminButton } from "@/components/admin-delete-admin-button";
import {
  AdminDesktopTable,
  AdminMobileCard,
  AdminMobileCardList,
  AdminMobileField,
} from "@/components/admin-list-layout";
import { requireAdmin } from "@/lib/auth/guards";

type AdminRow = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  created_at: string;
};

function formatCreatedAt(value: string) {
  return new Date(value).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminAdminsPage() {
  const { user, supabase } = await requireAdmin();
  const { data: admins } = await supabase
    .from("profiles")
    .select("user_id, first_name, last_name, email, created_at")
    .eq("role", "admin")
    .order("created_at", { ascending: false });

  const adminList = (admins ?? []) as AdminRow[];

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 px-4 py-6 sm:py-10">
      <Card className="space-y-6">
        <div className="space-y-4">
          <Logo />
          <AdminNav />
        </div>

        <section>
          <h1 className="text-2xl font-semibold sm:text-3xl">Администраторы</h1>
          <p className="mt-2 text-slate-700">
            Все сотрудники с доступом к админке. Дата создания — момент появления учётной записи
            в системе.
          </p>
        </section>

        <div className="space-y-1.5 rounded-xl border border-[var(--input-border)] bg-slate-50 p-4">
          <p className="text-sm font-medium text-slate-800">Если коллега забыл пароль</p>
          <p className="text-sm leading-relaxed text-slate-700">
            Старый пароль посмотреть нельзя — в системе он хранится только в зашифрованном виде.
            Кликните на email коллеги в списке ниже, нажмите «Выдать новый временный
            пароль» и передайте ему email и новый пароль вручную (мессенджер или почта). Это может
            сделать любой другой администратор.
          </p>
        </div>

        {!adminList.length ? (
          <div className="rounded-xl border border-dashed border-[var(--input-border)] bg-slate-50 px-6 py-10 text-center">
            <p className="text-slate-700">Пока нет ни одного администратора в списке.</p>
            <p className="mt-2 text-sm text-slate-600">
              Создайте первого на странице «Новый администратор».
            </p>
          </div>
        ) : (
          <>
            <AdminMobileCardList>
              {adminList.map((admin, index) => {
                const fullName = [admin.first_name, admin.last_name].filter(Boolean).join(" ");

                return (
                  <AdminMobileCard
                    key={admin.user_id}
                    title={fullName || "Без имени"}
                    badge={index + 1}
                    footer={
                      <AdminDeleteAdminButton
                        adminId={admin.user_id}
                        adminLabel={fullName || admin.email}
                        adminEmail={admin.email}
                        currentUserId={user.id}
                      />
                    }
                  >
                    <AdminMobileField label="Email">
                      <Link
                        href={`/admin/admins/${admin.user_id}`}
                        className="font-medium text-[var(--accent)] hover:underline"
                      >
                        {admin.email}
                      </Link>
                    </AdminMobileField>
                    <AdminMobileField label="Дата создания">
                      {formatCreatedAt(admin.created_at)}
                    </AdminMobileField>
                  </AdminMobileCard>
                );
              })}
            </AdminMobileCardList>

            <AdminDesktopTable>
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-[var(--input-border)] bg-slate-50">
                <tr>
                  <th className="w-12 px-3 py-3 text-center font-semibold">№</th>
                  <th className="px-4 py-3 font-semibold">Имя</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Дата создания</th>
                  <th className="px-4 py-3 font-semibold">Действие</th>
                </tr>
              </thead>
              <tbody>
                {adminList.map((admin, index) => {
                  const fullName = [admin.first_name, admin.last_name].filter(Boolean).join(" ");

                  return (
                    <tr
                      key={admin.user_id}
                      className="border-b border-[var(--input-border)] last:border-0"
                    >
                      <td className="px-3 py-3 text-center tabular-nums text-slate-600">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3 font-medium text-black">{fullName || "Без имени"}</td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/admins/${admin.user_id}`}
                          className="font-medium text-[var(--accent)] hover:underline"
                        >
                          {admin.email}
                        </Link>
                      </td>
                      <td className="px-4 py-3 tabular-nums text-slate-800">
                        {formatCreatedAt(admin.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <AdminDeleteAdminButton
                          adminId={admin.user_id}
                          adminLabel={fullName || admin.email}
                          adminEmail={admin.email}
                          currentUserId={user.id}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </AdminDesktopTable>
          </>
        )}
      </Card>
    </main>
  );
}
