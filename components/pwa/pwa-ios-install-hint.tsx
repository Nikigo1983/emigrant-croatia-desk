"use client";

import { useEffect, useState } from "react";
import { IOS_INSTALL_HINT } from "@/lib/pwa/constants";
import { isIosSafari, isStandaloneDisplayMode } from "@/lib/pwa/runtime";

const DISMISS_KEY = "emigrant-pwa-ios-hint-dismissed";

export function PwaIosInstallHint() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (!isIosSafari() || isStandaloneDisplayMode()) {
      return;
    }
    if (sessionStorage.getItem(DISMISS_KEY) === "1") {
      return;
    }
    setVisible(true);
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div
      className="pwa-ios-hint fixed inset-x-0 bottom-0 z-30 border-t border-[var(--input-border)] bg-[#F8FAFC]/95 px-4 py-2.5 text-center backdrop-blur-sm"
      role="note"
    >
      <p className="mx-auto max-w-md text-xs leading-snug text-slate-600">{IOS_INSTALL_HINT}</p>
      <button
        type="button"
        onClick={() => {
          sessionStorage.setItem(DISMISS_KEY, "1");
          setVisible(false);
        }}
        className="mt-1 text-xs text-slate-400 underline-offset-2 hover:text-slate-600 hover:underline"
      >
        Скрыть
      </button>
    </div>
  );
}
