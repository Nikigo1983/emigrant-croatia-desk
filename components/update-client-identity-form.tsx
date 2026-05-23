"use client";

import { useActionState, useMemo } from "react";
import { updateClientIdentityAction } from "@/app/admin/clients/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  clientId: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  passportNumber: string | null;
};

const initialState: { error?: string; success?: boolean } = {};

export function UpdateClientIdentityForm(props: Props) {
  const action = useMemo(
    () => updateClientIdentityAction.bind(null, props.clientId),
    [props.clientId],
  );
  const [state, formAction, isPending] = useActionState(action, initialState);
  const showSaved = Boolean(state.success) && !isPending;

  return (
    <div className="rounded-xl border border-[var(--input-border)] bg-slate-50/80 p-5">
      <h2 className="text-lg font-semibold text-slate-900">Данные клиента</h2>
      <p className="mt-1 text-sm text-slate-600">
        Имя, фамилия, email и номер паспорта. Изменение email обновляет и вход в кабинет.
      </p>

      <form action={formAction} className="mt-4 space-y-4">
        {state.error ? (
          <div
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-900"
            role="alert"
          >
            {state.error}
          </div>
        ) : null}

        {showSaved ? (
          <div
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900 shadow-sm"
            role="status"
            aria-live="polite"
          >
            Сохранено (данные клиента).
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor="identity_first_name" className="text-sm font-medium">
              Имя
            </label>
            <Input
              id="identity_first_name"
              name="first_name"
              required
              defaultValue={props.firstName ?? ""}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="identity_last_name" className="text-sm font-medium">
              Фамилия
            </label>
            <Input id="identity_last_name" name="last_name" defaultValue={props.lastName ?? ""} />
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="identity_email" className="text-sm font-medium">
            Email
          </label>
          <Input
            id="identity_email"
            name="email"
            type="email"
            required
            autoComplete="off"
            defaultValue={props.email}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="identity_passport" className="text-sm font-medium">
            Номер паспорта
          </label>
          <Input
            id="identity_passport"
            name="passport_number"
            type="text"
            autoComplete="off"
            defaultValue={props.passportNumber ?? ""}
          />
        </div>

        <Button
          type="submit"
          disabled={isPending}
          className={
            showSaved ? "bg-emerald-600 hover:bg-emerald-600 hover:opacity-90" : undefined
          }
        >
          {isPending
            ? "Сохраняем..."
            : showSaved
              ? "Сохранено"
              : "Сохранить данные клиента"}
        </Button>
      </form>
    </div>
  );
}
