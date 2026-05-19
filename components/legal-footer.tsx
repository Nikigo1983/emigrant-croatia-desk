import Link from "next/link";

export function LegalFooter() {
  return (
    <footer className="mt-8 border-t border-[var(--input-border)] pt-6">
      <nav
        aria-label="Юридические документы"
        className="flex flex-col items-center justify-center gap-3 text-sm sm:flex-row sm:gap-6"
      >
        <Link
          href="/privacy"
          className="font-medium text-slate-600 transition hover:text-[var(--accent)]"
        >
          Privacy Policy
        </Link>
        <Link
          href="/consent"
          className="font-medium text-slate-600 transition hover:text-[var(--accent)]"
        >
          Data Processing Consent
        </Link>
      </nav>
    </footer>
  );
}
