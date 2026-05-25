"use client";

import { useEffect, useState } from "react";
import { isAndroid, isStandaloneDisplayMode } from "@/lib/pwa/runtime";

const DISMISS_KEY = "emigrant-pwa-install-dismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [hidden, setHidden] = useState(true);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (!isAndroid() || isStandaloneDisplayMode()) {
      return;
    }
    if (sessionStorage.getItem(DISMISS_KEY) === "1") {
      return;
    }

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setHidden(false);
    };

    const onInstalled = () => {
      setDeferredPrompt(null);
      setHidden(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (hidden || !deferredPrompt) {
    return null;
  }

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setHidden(true);
    setDeferredPrompt(null);
  };

  const install = async () => {
    setInstalling(true);
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setHidden(true);
      }
    } finally {
      setInstalling(false);
      setDeferredPrompt(null);
    }
  };

  return (
    <div
      className="pwa-install-bar fixed inset-x-0 bottom-0 z-40 border-t border-[var(--input-border)] bg-white/95 px-4 py-3 shadow-[0_-4px_24px_rgba(15,23,42,0.08)] backdrop-blur-sm"
      role="region"
      aria-label="Установка приложения"
    >
      <div className="mx-auto flex w-full max-w-lg items-center justify-between gap-3">
        <p className="text-sm text-slate-700">Установите Emigrant на главный экран</p>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={dismiss}
            className="rounded-lg px-2 py-1.5 text-sm text-slate-500 hover:text-slate-800"
          >
            Позже
          </button>
          <button
            type="button"
            onClick={() => void install()}
            disabled={installing}
            className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {installing ? "…" : "Установить приложение"}
          </button>
        </div>
      </div>
    </div>
  );
}
