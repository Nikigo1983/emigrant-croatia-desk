import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { LegalFooter } from "@/components/legal-footer";
import { Logo } from "@/components/logo";

type Props = {
  title: string;
  children: ReactNode;
};

export function LegalPageLayout({ title, children }: Props) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-8 sm:py-12">
      <Card>
        <Logo />
        <h1 className="mt-6 text-2xl font-semibold text-slate-900 sm:text-3xl">{title}</h1>
        <div className="mt-8 space-y-4 text-sm leading-relaxed text-slate-700 sm:text-base">
          {children}
        </div>
      </Card>
      <LegalFooter />
    </main>
  );
}
