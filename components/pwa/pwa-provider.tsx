"use client";

import { useEffect } from "react";
import { PwaInstallPrompt } from "@/components/pwa/pwa-install-prompt";
import { PwaIosInstallHint } from "@/components/pwa/pwa-ios-install-hint";

export function PwaProvider() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      return;
    }
    if (!("serviceWorker" in navigator)) {
      return;
    }

    const register = async () => {
      try {
        await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      } catch {
        // SW optional — app works without offline shell
      }
    };

    if (document.readyState === "complete") {
      void register();
    } else {
      window.addEventListener("load", () => void register(), { once: true });
    }
  }, []);

  return (
    <>
      <PwaInstallPrompt />
      <PwaIosInstallHint />
    </>
  );
}
