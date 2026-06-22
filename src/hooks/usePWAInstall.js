import { useState, useEffect, useCallback } from "react";

/* ============================================================
   PWA INSTALL SYSTEM — progressive enhancement
   ============================================================ */
export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled]           = useState(false);
  const [platform, setPlatform]             = useState("unknown");

  useEffect(() => {
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent)
      || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const standalone = window.matchMedia("(display-mode: standalone)").matches
      || !!navigator.standalone;
    setInstalled(standalone);
    setPlatform(isIOS ? "ios" : "desktop");

    const onPrompt = (e) => { e.preventDefault(); setDeferredPrompt(e); setPlatform("android"); };
    const onInstalled = () => { setInstalled(true); setDeferredPrompt(null); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) return false;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") { setInstalled(true); setDeferredPrompt(null); }
    return outcome === "accepted";
  }, [deferredPrompt]);

  return { installed, platform, canPrompt: !!deferredPrompt, install };
}
