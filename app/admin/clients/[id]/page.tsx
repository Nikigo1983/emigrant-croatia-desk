import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/logo";
import { AdminNav } from "@/components/admin-nav";
import { AdminClientAccessHelp } from "@/components/admin-client-access-help";
import { AdminDeleteClientSection } from "@/components/admin-delete-client-section";
import { UpdateCaseForm } from "@/components/update-case-form";
import { UpdateClientIdentityForm } from "@/components/update-client-identity-form";
import { requireAdmin } from "@/lib/auth/guards";

type Params = {
  params: Promise<{ id: string }>;
};

export default async function AdminClientDetailsPage({ params }: Params) {
  const { id } = await params;
  const { supabase } = await requireAdmin();

  const { data: profile } = await supabase
    .from("profiles")
    .select("user_id, first_name, last_name, email, role, created_at")
    .eq("user_id", id)
    .single();

  if (!profile || profile.role !== "client") {
    notFound();
  }

  const { data: caseItem } = await supabase
    .from("cases")
    .select(
      "current_status, status_updated_at, submission_date, submission_city, case_number, consulate, internal_comment, curator_comment_for_client",
    )
    .eq("client_id", id)
    .maybeSingle();

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
  const statusUpdatedLabel = caseItem?.status_updated_at
    ? new Date(caseItem.status_updated_at).toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 px-4 py-10">
      <Card className="max-w-3xl space-y-6">
        <div className="space-y-4">
          <Logo />
          <AdminNav />
        </div>

        <div className="flex flex-col gap-3 pt-1">
          <Link
            href="/admin/clients"
            className="inline-flex w-fit text-sm font-medium text-[var(--accent)] hover:underline"
            prefetch={false}
          >
            ← К списку клиентов
          </Link>
          <p className="inline-flex w-fit rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-3 py-1.5 text-xs font-semibold text-[var(--accent)]">
            Редактирование от имени администратора
          </p>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-semibold">Карточка клиента: {fullName || "Клиент"}</h1>
          <dl className="grid gap-1 text-sm text-slate-600 sm:grid-cols-[auto_1fr] sm:gap-x-4 sm:gap-y-1">
            <dt className="text-slate-500">Дата создания клиента</dt>
            <dd className="font-medium text-slate-800">{createdAtLabel}</dd>
            <dt className="text-slate-500">Дата обновления статуса</dt>
            <dd className="font-medium text-slate-800">{statusUpdatedLabel}</dd>
          </dl>
        </div>

        <UpdateClientIdentityForm
          key={`identity-${id}`}
          clientId={id}
          firstName={profile.first_name}
          lastName={profile.last_name}
          email={profile.email}
          passportNumber={caseItem?.case_number ?? null}
        />

        <UpdateCaseForm
          key={`case-${id}`}
          clientId={id}
          currentStatus={caseItem?.current_status ?? null}
          submissionDate={caseItem?.submission_date ?? null}
          submissionCity={caseItem?.submission_city ?? null}
          caseNumber={caseItem?.case_number ?? null}
          consulate={caseItem?.consulate ?? null}
          internalComment={caseItem?.internal_comment ?? null}
          curatorCommentForClient={caseItem?.curator_comment_for_client ?? null}
        />

        <div className="border-t border-[var(--input-border)] pt-6">
          <AdminClientAccessHelp clientId={id} clientEmail={profile.email} />
        </div>

        <AdminDeleteClientSection
          clientId={id}
          clientLabel={fullName || "Клиент"}
          clientEmail={profile.email}
        />
      </Card>
    </main>
  );
}
