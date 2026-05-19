"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteClientAction } from "@/app/admin/clients/actions";
import { Button } from "@/components/ui/button";

type Props = {
  clientId: string;
  /** Имя для текста диалога */
  clientLabel: string;
  clientEmail: string;
};

export function AdminDeleteClientSection({ clientId, clientLabel, clientEmail }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const handleConfirm = () => {
    setError(null);
    startTransition(async () => {
      const result = await deleteClientAction(clientId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      router.push("/admin/clients");
      router.refresh();
    });
  };

  return (
    <div className="border-t border-red-200/80 pt-6">
      <p className="text-sm font-medium text-red-900">Опасная зона</p>
      <p className="mt-1 text-sm text-slate-600">
        Удаление навсегда убирает клиента из списка, его кабинет и дело в базе (вход станет
        невозможен).
      </p>
      <Button
        type="button"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        className="mt-4 w-auto px-4"
      >
        Удалить карточку клиента
      </Button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
          role="presentation"
          onClick={() => !isPending && setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-client-dialog-title"
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="delete-client-dialog-title" className="text-lg font-semibold text-slate-900">
              Удалить карточку клиента?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-700">
              Вы действительно хотите удалить карточку клиента{" "}
              <span className="font-semibold text-black">{clientLabel}</span>
              {clientEmail ? (
                <>
                  {" "}
                  (<span className="break-all">{clientEmail}</span>)
                </>
              ) : null}
              ? Это действие нельзя отменить: запись исчезнет из списка клиентов, данные дела будут
              удалены.
            </p>
            {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() => setOpen(false)}
                className="w-auto px-5"
              >
                Отмена
              </Button>
              <Button
                type="button"
                variant="danger"
                disabled={isPending}
                onClick={handleConfirm}
                className="w-auto px-5"
              >
                {isPending ? "Удаляем…" : "Да, удалить"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
