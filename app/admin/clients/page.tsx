import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/logo";
import { AdminNav } from "@/components/admin-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AdminDesktopTable,
  AdminMobileCard,
  AdminMobileCardList,
  AdminMobileField,
} from "@/components/admin-list-layout";
import { requireAdmin } from "@/lib/auth/guards";
import { STATUS_PLASTIC_CARD_PICKUP } from "@/lib/constants/case-statuses";

type ClientRow = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
};

type CaseRow = {
  client_id: string;
  current_status: string | null;
  case_number: string | null;
};

function matchesNameSearch(client: ClientRow, needle: string): boolean {
  const q = needle.toLowerCase().trim();
  if (!q) {
    return true;
  }
  const fn = (client.first_name ?? "").toLowerCase().trim();
  const ln = (client.last_name ?? "").toLowerCase().trim();
  const full = [fn, ln].filter(Boolean).join(" ");
  return fn.includes(q) || ln.includes(q) || full.includes(q);
}

type PageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function AdminClientsPage({ searchParams }: PageProps) {
  const { q } = await searchParams;
  const searchRaw = typeof q === "string" ? q : "";
  const search = searchRaw.trim();

  const { supabase } = await requireAdmin();
  const { data: clients } = await supabase
    .from("profiles")
    .select("user_id, first_name, last_name, email")
    .eq("role", "client")
    .order("created_at", { ascending: false });

  const allClients = (clients ?? []) as ClientRow[];
  const filteredClients = search
    ? allClients.filter((client) => matchesNameSearch(client, search))
    : allClients;

  const clientIds = filteredClients.map((client) => client.user_id);
  const { data: cases } = clientIds.length
    ? await supabase
        .from("cases")
        .select("client_id, current_status, case_number")
        .in("client_id", clientIds)
    : { data: [] as CaseRow[] };

  const caseMap = new Map<string, CaseRow>(
    (cases ?? []).map((caseItem) => [caseItem.client_id, caseItem]),
  );

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 px-4 py-6 sm:py-10">
      <Card className="space-y-6">
        <div className="space-y-4">
          <Logo href="/admin" />
          <AdminNav />
        </div>

        <div>
          <h1 className="text-2xl font-semibold sm:text-3xl">Клиенты</h1>
          <p className="mt-2 text-slate-700">
            Общий список для всех администраторов: клиент не привязан к тому, кто его создал — у
            каждого куратора одинаковые права на просмотр и правки. Откройте строку, чтобы
            изменить статус дела и данные; клиент увидит обновления в кабинете, при включённых
            уведомлениях ему уйдёт письмо.
          </p>
        </div>

        {!allClients.length ? (
          <div className="rounded-xl border border-dashed border-[var(--input-border)] bg-slate-50 px-6 py-10 text-center">
            <p className="text-slate-700">Пока нет ни одного клиента.</p>
            <p className="mt-2 text-sm text-slate-600">
              Создайте клиента на странице «Новый клиент» — после этого он появится в этом списке.
            </p>
            <Link
              href="/admin/clients/new"
              className="mt-4 inline-block rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white hover:opacity-90"
            >
              Создать клиента
            </Link>
          </div>
        ) : (
          <>
            <form
              method="get"
              action="/admin/clients"
              className="flex flex-col gap-3 rounded-xl border border-[var(--input-border)] bg-slate-50 p-4 sm:flex-row sm:flex-wrap sm:items-end"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <label htmlFor="clients-search" className="text-sm font-medium text-slate-800">
                  Поиск по имени или фамилии
                </label>
                <Input
                  id="clients-search"
                  name="q"
                  type="search"
                  defaultValue={search}
                  placeholder="Начните вводить имя или фамилию"
                  autoComplete="off"
                  className="bg-white"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="submit" className="w-full sm:w-auto">
                  Найти
                </Button>
                {search ? (
                  <Link
                    href="/admin/clients"
                    prefetch={false}
                    className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-[var(--input-border)] bg-white px-5 text-base font-semibold text-slate-800 transition hover:bg-slate-50 sm:w-auto"
                  >
                    Сбросить
                  </Link>
                ) : null}
              </div>
            </form>

            {filteredClients.length === 0 ? (
              <div className="rounded-xl border border-[var(--input-border)] bg-white px-6 py-10 text-center text-sm text-slate-700">
                <p>
                  По запросу «<span className="font-semibold text-black">{search}</span>» никого
                  не найдено.
                </p>
                <p className="mt-2 text-slate-600">Измените запрос или сбросьте фильтр.</p>
                <Link
                  href="/admin/clients"
                  className="mt-4 inline-block text-sm font-semibold text-[var(--accent)] hover:underline"
                  prefetch={false}
                >
                  Показать всех клиентов
                </Link>
              </div>
            ) : (
              <>
              <AdminMobileCardList>
                {filteredClients.map((client, index) => {
                  const caseItem = caseMap.get(client.user_id);
                  const currentStatusLabel = caseItem?.current_status ?? "Нет статуса";
                  const isPlasticCardStatus = currentStatusLabel === STATUS_PLASTIC_CARD_PICKUP;
                  const fullName = [client.first_name, client.last_name].filter(Boolean).join(" ");
                  const passportLabel =
                    caseItem?.case_number?.trim() ? caseItem.case_number.trim() : "—";

                  return (
                    <AdminMobileCard
                      key={client.user_id}
                      title={fullName || "Без имени"}
                      badge={index + 1}
                      footer={
                        <Link
                          href={`/admin/clients/${client.user_id}`}
                          prefetch={false}
                          className="flex w-full items-center justify-center rounded-lg border border-[var(--input-border)] bg-white px-3 py-2.5 text-sm font-semibold text-[var(--accent)] hover:border-[var(--accent)]"
                        >
                          Открыть карточку
                        </Link>
                      }
                    >
                      <AdminMobileField label="Номер паспорта">{passportLabel}</AdminMobileField>
                      <AdminMobileField label="Email">{client.email}</AdminMobileField>
                      <AdminMobileField
                        label="Текущий статус"
                        valueClassName={isPlasticCardStatus ? "font-semibold text-emerald-700" : ""}
                      >
                        {currentStatusLabel}
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
                      <th className="px-4 py-3 font-semibold">Номер паспорта</th>
                      <th className="px-4 py-3 font-semibold">Email</th>
                      <th className="px-4 py-3 font-semibold">Текущий статус</th>
                      <th className="px-4 py-3 font-semibold">Действие</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClients.map((client, index) => {
                      const caseItem = caseMap.get(client.user_id);
                      const currentStatusLabel = caseItem?.current_status ?? "Нет статуса";
                      const isPlasticCardStatus = currentStatusLabel === STATUS_PLASTIC_CARD_PICKUP;
                      const fullName = [client.first_name, client.last_name].filter(Boolean).join(" ");
                      const rowNumber = index + 1;
                      const passportLabel =
                        caseItem?.case_number?.trim() ? caseItem.case_number.trim() : "—";

                      return (
                        <tr
                          key={client.user_id}
                          className="border-b border-[var(--input-border)] last:border-0"
                        >
                          <td className="px-3 py-3 text-center tabular-nums text-slate-600">
                            {rowNumber}
                          </td>
                          <td className="px-4 py-3 font-medium text-black">{fullName || "Без имени"}</td>
                          <td className="px-4 py-3 tabular-nums text-slate-800">{passportLabel}</td>
                          <td className="px-4 py-3">{client.email}</td>
                          <td
                            className={`px-4 py-3 ${
                              isPlasticCardStatus ? "font-semibold text-emerald-700" : ""
                            }`}
                          >
                            {currentStatusLabel}
                          </td>
                          <td className="px-4 py-3">
                            <Link
                              href={`/admin/clients/${client.user_id}`}
                              className="inline-flex rounded-lg border border-[var(--input-border)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--accent)] hover:border-[var(--accent)]"
                              prefetch={false}
                            >
                              Открыть карточку
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </AdminDesktopTable>
              </>
            )}
          </>
        )}
      </Card>
    </main>
  );
}
