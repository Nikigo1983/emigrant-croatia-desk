import type { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
};

export function Card({ children, className = "" }: CardProps) {
  return (
    <section
      className={`w-full rounded-2xl border border-[var(--input-border)] bg-[var(--card)] p-6 shadow-[var(--card-shadow)] md:p-8 ${className}`}
    >
      {children}
    </section>
  );
}
