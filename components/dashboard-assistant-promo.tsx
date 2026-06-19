import Link from "next/link";

export function DashboardAssistantPromo() {
  return (
    <section
      aria-labelledby="dashboard-assistant-promo-title"
      className="relative overflow-hidden rounded-xl border border-[var(--accent)]/20 bg-gradient-to-br from-[var(--accent)]/[0.09] via-white to-violet-50/70 p-5 shadow-sm"
    >
      <div
        className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-[var(--accent)]/10 blur-2xl"
        aria-hidden
      />

      <div className="relative space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[var(--accent)] px-2.5 py-0.5 text-xs font-semibold tracking-wide text-white">
            Новое
          </span>
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--accent)]">
            В личном кабинете
          </p>
        </div>

        <div className="space-y-2">
          <h2 id="dashboard-assistant-promo-title" className="text-xl font-semibold text-slate-900">
            AI-ассистент Emigrant
          </h2>
          <p className="max-w-2xl text-sm leading-relaxed text-slate-700">
            Задавайте вопросы по визам, документам и процессу эмиграции — ответы на основе нашей
            базы знаний и вашего текущего статуса. Справочная информация, не юридическая
            консультация.
          </p>
        </div>

        <Link
          href="/dashboard/assistant"
          className="inline-flex items-center justify-center rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Спросить AI-ассистента
        </Link>
      </div>
    </section>
  );
}
