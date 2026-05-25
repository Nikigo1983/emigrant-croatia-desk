import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/logo";
import { AdminNav } from "@/components/admin-nav";
import { AdminAdminAccessHelp } from "@/components/admin-admin-access-help";
import { AdminDeleteAdminButton } from "@/components/admin-delete-admin-button";
import { requireAdmin } from "@/lib/auth/guards";

type Params = {
  params: Promise<{ id: string }>;
};

export default async function AdminDetailsPage({ params }: Params) {
  const { id } = await params;
  const { user, supabase } = await requireAdmin();

  const { data: profile } = await supabase
    .from("profiles")
    .select("user_id, first_name, last_name, email, role, created_at")
    .eq("user_id", id)
    .single();

  if (!profile || profile.role !== "admin") {
    notFound();
  }

  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(" ");
  const createdAtLabel = profile.created_at
    ? new Date(profile.created_at).toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 px-4 py-6 sm:py-10">
      <Card className="space-y-6">
        <div className="space-y-4">
          <Logo href="/admin" />
          <AdminNav />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/admins"
            className="text-sm font-medium text-[var(--accent)] hover:underline"
          >
            ← К списку администраторов
          </Link>
        </div>

        <section>
          <h1 className="text-2xl font-semibold sm:text-3xl">{fullName || "Администратор"}</h1>
          <p className="mt-2 text-slate-700">{profile.email}</p>
          <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-slate-600">Дата создания</dt>
              <dd className="font-medium text-slate-800">{createdAtLabel}</dd>
            </div>
          </dl>
        </section>

        <AdminAdminAccessHelp adminId={id} adminEmail={profile.email} />

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--input-border)] pt-6">
          <p className="text-sm text-slate-600">Удаление учётной записи администратора</p>
          <AdminDeleteAdminButton
            adminId={id}
            adminLabel={fullName || profile.email}
            adminEmail={profile.email}
            currentUserId={user.id}
          />
        </div>
      </Card>
    </main>
  );
}
