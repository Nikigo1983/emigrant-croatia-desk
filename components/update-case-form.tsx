"use client";

import { useActionState, useMemo, useState } from "react";
import { updateClientCaseAction } from "@/app/admin/clients/actions";
import { getLegacyStatusLabel, normalizeCaseStatus } from "@/lib/constants/case-status-legacy";
import { CASE_STATUSES } from "@/lib/constants/case-statuses";
import { showsSubmissionDetails } from "@/lib/constants/case-status-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type Props = {
  clientId: string;
  currentStatus: string | null;
  submissionDate: string | null;
  submissionCity: string | null;
  caseNumber: string | null;
  consulate: string | null;
  internalComment: string | null;
  curatorCommentForClient: string | null;
};

const initialState: { error?: string; success?: boolean; emailWarning?: string } = {};

export function UpdateCaseForm(props: Props) {
  const action = useMemo(
    () => updateClientCaseAction.bind(null, props.clientId),
    [props.clientId],
  );
  const [state, formAction, isPending] = useActionState(action, initialState);
  const legacyStatusLabel = getLegacyStatusLabel(props.currentStatus);
  const [statusValue, setStatusValue] = useState(() =>
    normalizeCaseStatus(props.currentStatus),
  );
  const showFilingFields = showsSubmissionDetails(statusValue);
  const showSaved = Boolean(state.success) && !isPending;

  return (
    <form action={formAction} className="space-y-4">
      {state.error ? (
        <div
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-900"
          role="alert"
        >
          {state.error}
        </div>
      ) : null}

      {state.emailWarning ? (
        <div
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-950"
          role="status"
        >
          {state.emailWarning}
        </div>
      ) : null}

      {showSaved ? (
        <div
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900 shadow-sm"
          role="status"
          aria-live="polite"
        >
          Сохранено (статус дела).
        </div>
      ) : null}

      <div className="space-y-1">
        <label htmlFor="current_status" className="text-sm font-medium">
          Текущий статус
        </label>
        {legacyStatusLabel ? (
          <p className="text-xs text-amber-800">
            В базе записан устаревший статус «{legacyStatusLabel}» — в списке отображается как «
            {normalizeCaseStatus(legacyStatusLabel)}». После сохранения будет обновлён.
          </p>
        ) : null}
        <Select
          id="current_status"
          name="current_status"
          required
          value={statusValue}
          onChange={(event) => setStatusValue(normalizeCaseStatus(event.target.value))}
        >
          {CASE_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </Select>
      </div>

      {showFilingFields ? (
        <div className="space-y-3 rounded-xl border border-[var(--input-border)] bg-slate-50 p-4">
          <p className="text-sm font-medium text-slate-800">Данные о подаче заявки</p>
          <p className="text-xs text-slate-600">
            Дата, город, номер паспорта и консульство сохраняются только при статусе «Заявка подана».
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="submission_date" className="text-sm font-medium">
                Дата подачи
              </label>
              <Input
                id="submission_date"
                name="submission_date"
                type="date"
                defaultValue={props.submissionDate ?? ""}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="submission_city" className="text-sm font-medium">
                Город / отделение подачи
              </label>
              <Input
                id="submission_city"
                name="submission_city"
                defaultValue={props.submissionCity ?? ""}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label htmlFor="case_number" className="text-sm font-medium">
              Номер паспорта <span className="font-normal text-slate-500">(при наличии)</span>
            </label>
            <Input id="case_number" name="case_number" defaultValue={props.caseNumber ?? ""} />
          </div>
          <div className="space-y-1">
            <label htmlFor="consulate" className="text-sm font-medium">
              Консульство
            </label>
            <Input id="consulate" name="consulate" defaultValue={props.consulate ?? ""} />
          </div>
        </div>
      ) : null}

      <div className="space-y-1">
        <label htmlFor="curator_comment_for_client" className="text-sm font-medium">
          Комментарий для клиента
        </label>
        <p className="text-xs text-slate-600">
          Показывается в личном кабинете как «Комментарий от куратора Emigrant», только если здесь есть
          текст. Можно оставить пустым или очистить — тогда у клиента блок не отображается.
        </p>
        <textarea
          id="curator_comment_for_client"
          name="curator_comment_for_client"
          defaultValue={props.curatorCommentForClient ?? ""}
          className="min-h-24 w-full rounded-xl border border-[var(--input-border)] bg-white px-4 py-3 text-base text-black outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="internal_comment" className="text-sm font-medium">
          Внутренний комментарий
        </label>
        <p className="text-xs text-slate-600">
          Только для вас и команды: заметки по делу, договорённости, напоминания. Клиент это поле
          не видит — оно остаётся внутри админской карточки.
        </p>
        <textarea
          id="internal_comment"
          name="internal_comment"
          defaultValue={props.internalComment ?? ""}
          className="min-h-24 w-full rounded-xl border border-[var(--input-border)] bg-white px-4 py-3 text-base text-black outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
        />
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className={
          showSaved ? "bg-emerald-600 hover:bg-emerald-600 hover:opacity-90" : undefined
        }
      >
        {isPending ? "Сохраняем..." : showSaved ? "Сохранено" : "Сохранить"}
      </Button>
    </form>
  );
}
