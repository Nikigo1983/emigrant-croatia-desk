import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/logo";
import { DashboardEmailNotice } from "@/components/dashboard-email-notice";
import { DashboardFooter } from "@/components/dashboard-footer";
import { DashboardNav } from "@/components/dashboard-nav";
import { CASE_STATUSES, type CaseStatus } from "@/lib/constants/case-statuses";
import { CASE_STATUS_DESCRIPTIONS } from "@/lib/constants/case-status-descriptions";
import { showsSubmissionDetails } from "@/lib/constants/case-status-utils";
import { getUserRole } from "@/lib/auth/get-user-role";
import { fetchClientCaseForDashboard } from "@/lib/cases/fetch-client-case-for-dashboard";
import { formatStageDateRu, parseStatusReachedAt } from "@/lib/cases/status-stage-dates";
import { profileGreeting } from "@/lib/profile/greeting";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const role = await getUserRole(user.id);
  if (role === "admin") {
    redirect("/admin");
  }
  if (role !== "client") {
    redirect("/auth");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name")
    .eq("user_id", user.id)
    .maybeSingle();

  const greeting = profileGreeting(profile?.first_name ?? null, profile?.last_name ?? null);

  const caseItem = await fetchClientCaseForDashboard(supabase, user.id);

  if (!caseItem) {
    return (
      <main className="mx-auto flex w-full max-w-6xl flex-1 px-4 py-10">
        <Card className="space-y-6">
          <div className="space-y-4">
            <Logo />
            <DashboardNav />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold">{greeting}</h1>
            <p className="text-sm text-slate-500">Ваш email: {user.email}</p>
          </div>
          {user.email ? <DashboardEmailNotice email={user.email} /> : null}
          <div className="rounded-xl border border-[var(--input-border)] bg-white p-5">
            <p className="text-slate-700">
              Дело ещё не создано. Пожалуйста, свяжитесь с администратором.
            </p>
          </div>

          <DashboardFooter />
        </Card>
      </main>
    );
  }

  const currentStatus = caseItem.current_status ?? CASE_STATUSES[0];
  const statusIndex = CASE_STATUSES.findIndex((status) => status === currentStatus);
  const nextStatus =
    statusIndex >= 0 && statusIndex < CASE_STATUSES.length - 1
      ? CASE_STATUSES[statusIndex + 1]
      : null;
  const safeStatus = CASE_STATUSES.includes(currentStatus as CaseStatus)
    ? (currentStatus as CaseStatus)
    : CASE_STATUSES[0];
  const description = CASE_STATUS_DESCRIPTIONS[safeStatus];
  const showFiling = showsSubmissionDetails(currentStatus);
  const filingDateLabel = caseItem.submission_date
    ? new Date(`${caseItem.submission_date}T12:00:00`).toLocaleDateString("ru-RU")
    : null;
  const curatorComment =
    typeof caseItem.curator_comment_for_client === "string"
      ? caseItem.curator_comment_for_client.trim()
      : "";
  const showCuratorComment = curatorComment.length > 0;
  const statusReachedMap = parseStatusReachedAt(caseItem.status_reached_at);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 px-4 py-10">
      <Card className="space-y-6">
        <div className="space-y-4">
          <Logo />
          <DashboardNav />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold">{greeting}</h1>
          <p className="text-slate-700">Добро пожаловать в личный кабинет</p>
          <p className="text-sm text-slate-500">Ваш email: {user.email}</p>
        </div>

        {user.email ? <DashboardEmailNotice email={user.email} /> : null}

        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-950 shadow-sm">
          <p className="text-sm font-medium text-emerald-800/90">Статус вашего процесса сейчас</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-950">{currentStatus}</p>
          <p className="mt-1 text-sm font-medium text-emerald-800">Описание</p>
          <p className="mt-1 text-sm leading-relaxed text-emerald-900/90">{description}</p>

          {showCuratorComment ? (
            <div className="mt-4 rounded-lg border border-emerald-300/80 bg-emerald-100/60 p-4">
              <p className="text-sm font-semibold text-emerald-950">Комментарий от куратора Emigrant</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-emerald-950">
                {curatorComment}
              </p>
            </div>
          ) : null}

          <p className="mt-2 text-sm font-medium text-emerald-800">
            Дата обновления:{" "}
            {caseItem.status_updated_at
              ? new Date(caseItem.status_updated_at).toLocaleString("ru-RU")
              : "—"}
          </p>

          {showFiling ? (
            <div className="mt-5 border-t border-emerald-200/80 pt-5">
              <p className="text-sm font-semibold text-emerald-950">Данные о подаче</p>
              <dl className="mt-3 space-y-2 text-sm text-emerald-900">
                <div>
                  <dt className="text-emerald-800/85">Дата подачи</dt>
                  <dd className="font-medium text-emerald-950">{filingDateLabel ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-emerald-800/85">Город / отделение подачи</dt>
                  <dd className="font-medium text-emerald-950">
                    {caseItem.submission_city?.trim() ? caseItem.submission_city : "—"}
                  </dd>
                </div>
                {caseItem.case_number?.trim() ? (
                  <div>
                    <dt className="text-emerald-800/85">Номер паспорта</dt>
                    <dd className="font-medium text-emerald-950">{caseItem.case_number}</dd>
                  </div>
                ) : null}
                {caseItem.consulate?.trim() ? (
                  <div>
                    <dt className="text-emerald-800/85">Консульство</dt>
                    <dd className="font-medium text-emerald-950">{caseItem.consulate}</dd>
                  </div>
                ) : null}
              </dl>
            </div>
          ) : null}
        </div>

        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-950 shadow-sm">
          <h2 className="text-xl font-semibold text-red-950">Следующий этап</h2>
          <p className="mt-2 text-sm font-medium leading-relaxed text-red-900">
            {nextStatus ?? "Финальный этап достигнут"}
          </p>
        </div>

        <div className="rounded-xl border border-[var(--input-border)] bg-white p-5">
          <h2 className="text-xl font-semibold">Прогресс по вашему делу</h2>
          <ol className="mt-4 space-y-2 text-sm">
            {CASE_STATUSES.map((status, index) => {
              const isCurrent = status === currentStatus;
              const isDone = statusIndex >= 0 ? index < statusIndex : index === 0;
              const isFuture = !isDone && !isCurrent;
              const reachedIso = statusReachedMap[status];
              const fallbackCurrent =
                isCurrent && !reachedIso && caseItem.status_updated_at
                  ? caseItem.status_updated_at
                  : null;
              const dateIso = reachedIso ?? fallbackCurrent;
              const dateLine = isFuture
                ? "ожидается"
                : dateIso
                  ? formatStageDateRu(dateIso)
                  : "—";

              return (
                <li
                  key={status}
                  className={`grid grid-cols-1 gap-1.5 rounded-lg border px-3 py-2.5 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-4 ${
                    isCurrent
                      ? "border-emerald-600 bg-emerald-200 text-emerald-950 shadow-sm"
                      : isDone
                        ? "border-[var(--accent)] bg-[var(--accent)]/5 text-slate-900"
                        : "border-[var(--input-border)] bg-white text-slate-800"
                  }`}
                >
                  <span
                    className={`min-w-0 leading-snug ${isCurrent ? "font-semibold" : isDone ? "font-medium" : ""}`}
                  >
                    {isDone ? <span className="mr-1 text-emerald-700">✓</span> : null}
                    {status}
                  </span>
                  <span
                    className={`text-xs tabular-nums sm:text-right ${
                      isCurrent
                        ? "font-medium text-emerald-900/85"
                        : isFuture
                          ? "text-slate-400"
                          : "text-slate-500"
                    }`}
                  >
                    {dateLine}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>

        <DashboardFooter />
      </Card>
    </main>
  );
}
