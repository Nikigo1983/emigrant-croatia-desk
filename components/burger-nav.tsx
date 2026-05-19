"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export type BurgerNavItem = {
  href: string;
  label: string;
  active: boolean;
};

export type BurgerNavSection = {
  title?: string;
  items: BurgerNavItem[];
};

type BurgerNavProps = {
  sections: BurgerNavSection[];
  ariaLabel: string;
  menuButtonLabel?: string;
};

const desktopLinkBase =
  "inline-flex shrink-0 items-center justify-center rounded-xl border px-3 py-2 text-sm font-medium transition-colors duration-150 sm:px-4";

function desktopLinkClass(active: boolean) {
  return `${desktopLinkBase} ${
    active
      ? "border-[var(--accent)] bg-[var(--accent)]/5 text-[var(--accent)]"
      : "border-[var(--input-border)] bg-white text-black hover:border-[var(--accent)] hover:text-[var(--accent)]"
  }`;
}

function mobileLinkClass(active: boolean) {
  return `flex w-full items-center rounded-xl border px-4 py-3 text-base font-medium transition-colors ${
    active
      ? "border-[var(--accent)] bg-[var(--accent)]/5 text-[var(--accent)]"
      : "border-[var(--input-border)] bg-white text-black hover:border-[var(--accent)] hover:text-[var(--accent)]"
  }`;
}

function BurgerIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M3 5H17M3 10H17M3 15H17"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function BurgerNav({
  sections,
  ariaLabel,
  menuButtonLabel = "Меню",
}: BurgerNavProps) {
  const [open, setOpen] = useState(false);

  const flatItems = sections.flatMap((section) => section.items);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="min-w-0 w-full">
      <div className="md:hidden">
        <button
          type="button"
          aria-expanded={open}
          aria-controls="mobile-nav-drawer"
          onClick={() => setOpen(true)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--input-border)] bg-white px-4 py-3 text-sm font-semibold text-black transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
        >
          <BurgerIcon />
          {menuButtonLabel}
        </button>

        {open ? (
          <div
            className="fixed inset-0 z-50"
            role="presentation"
            onClick={() => setOpen(false)}
          >
            <div className="absolute inset-0 bg-black/45" aria-hidden />
            <div
              id="mobile-nav-drawer"
              role="dialog"
              aria-modal="true"
              aria-label={ariaLabel}
              className="absolute right-0 top-0 flex h-full w-[min(100%,20rem)] flex-col bg-white shadow-xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-[var(--input-border)] px-4 py-4">
                <p className="text-base font-semibold text-black">{menuButtonLabel}</p>
                <button
                  type="button"
                  aria-label="Закрыть меню"
                  onClick={() => setOpen(false)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--input-border)] text-slate-700 hover:bg-slate-50"
                >
                  <span className="text-xl leading-none" aria-hidden>
                    ×
                  </span>
                </button>
              </div>

              <nav aria-label={ariaLabel} className="flex-1 overflow-y-auto p-4">
                <div className="space-y-6">
                  {sections.map((section) => (
                    <div key={section.title ?? section.items[0]?.href}>
                      {section.title ? (
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          {section.title}
                        </p>
                      ) : null}
                      <div className="space-y-2">
                        {section.items.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            prefetch={false}
                            className={mobileLinkClass(item.active)}
                            onClick={() => setOpen(false)}
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </nav>
            </div>
          </div>
        ) : null}
      </div>

      <nav
        aria-label={ariaLabel}
        className="hidden flex-wrap items-center gap-2 md:flex"
      >
        {flatItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            prefetch={false}
            className={desktopLinkClass(item.active)}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
