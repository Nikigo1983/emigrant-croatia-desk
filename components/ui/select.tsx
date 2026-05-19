import type { SelectHTMLAttributes } from "react";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

function SelectChevron() {
  return (
    <svg
      className="pointer-events-none h-5 w-5 text-slate-600"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function Select({ className = "", ...props }: SelectProps) {
  return (
    <div className="relative">
      <select
        className={`h-12 w-full appearance-none rounded-xl border border-[var(--input-border)] bg-white py-0 pl-4 pr-12 text-base text-black outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 ${className}`}
        {...props}
      />
      <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
        <SelectChevron />
      </span>
    </div>
  );
}
