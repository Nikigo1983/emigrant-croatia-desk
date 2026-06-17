"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { markClientAsReviewedAction } from "@/app/admin/clients/actions";
import { Button } from "@/components/ui/button";

type Props = {
  clientId: string;
};

export function AdminNewClientBanner({ clientId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleMarkReviewed = () => {
    startTransition(async () => {
      const result = await markClientAsReviewedAction(clientId);
      if (result.success) {
        router.refresh();
      }
    });
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-amber-950">Новый клиент из Formgrid</p>
        <p className="text-sm text-amber-900/90">
          Карточка создана автоматически из анкеты. Проверьте данные, отправьте пароль клиенту и
          снимите метку «Новый», когда обработаете.
        </p>
      </div>
      <Button
        type="button"
        className="w-full shrink-0 sm:w-auto"
        disabled={isPending}
        onClick={handleMarkReviewed}
      >
        {isPending ? "Сохраняем…" : "Снять статус «Новый»"}
      </Button>
    </div>
  );
}
