"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteAdminAction } from "@/app/admin/admins/actions";
import { Button } from "@/components/ui/button";

type Props = {
  adminId: string;
  adminLabel: string;
  adminEmail: string;
  currentUserId: string;
};

export function AdminDeleteAdminButton({
  adminId,
  adminLabel,
  adminEmail,
  currentUserId,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isSelf = adminId === currentUserId;

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
      const result = await deleteAdminAction(adminId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  };

  if (isSelf) {
    return <span className="text-xs text-slate-400">Это вы</span>;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        className="inline-flex rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:border-red-400 hover:bg-red-50"
      >
        Удалить
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
          role="presentation"
          onClick={() => !isPending && setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-admin-dialog-title"
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="delete-admin-dialog-title" className="text-lg font-semibold text-slate-900">
              Удалить администратора?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-700">
              Вы действительно хотите удалить администратора{" "}
              <span className="font-semibold text-black">{adminLabel}</span>
              {adminEmail ? (
                <>
                  {" "}
                  (<span className="break-all">{adminEmail}</span>)
                </>
              ) : null}
              ? Вход в админку для этого email станет невозможен. Действие нельзя отменить.
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
    </>
  );
}
