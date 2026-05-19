import type { ReactNode } from "react";

export function AdminDesktopTable({ children }: { children: ReactNode }) {
  return (
    <div className="hidden overflow-x-auto rounded-xl border border-[var(--input-border)] bg-white md:block">
      {children}
    </div>
  );
}

export function AdminMobileCardList({ children }: { children: ReactNode }) {
  return <ul className="flex flex-col gap-3 md:hidden">{children}</ul>;
}

type AdminMobileCardProps = {
  title: string;
  badge?: number | string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AdminMobileCard({ title, badge, children, footer }: AdminMobileCardProps) {
  return (
    <li className="rounded-xl border border-[var(--input-border)] bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3 border-b border-[var(--input-border)] pb-3">
        <h3 className="min-w-0 flex-1 text-base font-semibold leading-snug text-black">{title}</h3>
        {badge !== undefined ? (
          <span className="shrink-0 rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold tabular-nums text-slate-600">
            № {badge}
          </span>
        ) : null}
      </div>
      <div className="mt-3 space-y-2.5">{children}</div>
      {footer ? (
        <div className="mt-4 border-t border-[var(--input-border)] pt-3">{footer}</div>
      ) : null}
    </li>
  );
}

type AdminMobileFieldProps = {
  label: string;
  children: ReactNode;
  valueClassName?: string;
};

export function AdminMobileField({ label, children, valueClassName = "" }: AdminMobileFieldProps) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-0.5 break-words text-sm text-slate-900 ${valueClassName}`}>{children}</p>
    </div>
  );
}
