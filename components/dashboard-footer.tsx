import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";

type DashboardFooterProps = {
  /** На подстраницах (FAQ, инструкции) — назад в кабинет; на главной кабинета — выход. */
  variant?: "logout" | "back";
};

const backLinkClass =
  "inline-flex h-12 items-center justify-center rounded-xl border border-[var(--input-border)] bg-white px-5 text-base font-semibold text-slate-800 transition hover:border-[var(--accent)] hover:text-[var(--accent)]";

export function DashboardFooter({ variant = "logout" }: DashboardFooterProps) {
  return (
    <div className="border-t border-[var(--input-border)] pt-6">
      {variant === "back" ? (
        <Link href="/dashboard" className={backLinkClass}>
          Вернуться на главную
        </Link>
      ) : (
        <LogoutButton />
      )}
    </div>
  );
}
