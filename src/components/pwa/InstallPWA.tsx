"use client";
import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * "Install app" button for the sidebar / mobile top bar.
 *
 * On Android + desktop Chrome/Edge it captures the `beforeinstallprompt` event
 * and triggers the native install prompt. On iOS Safari (which has no such
 * event) it shows a short "Add to Home Screen" instruction sheet instead.
 * When the app is already running installed (standalone) it renders nothing.
 */
export default function InstallPWA({ compact = false }: { compact?: boolean }) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [showIOSHelp, setShowIOSHelp] = useState(false);

  useEffect(() => {
    // Detect iOS (no beforeinstallprompt support).
    const ua = window.navigator.userAgent.toLowerCase();
    const iOS = /iphone|ipad|ipod/.test(ua) ||
      // iPadOS 13+ reports as Mac; detect via touch.
      (ua.includes("mac") && "ontouchend" in document);
    setIsIOS(iOS);

    // Already installed?
    const isStandalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setStandalone(!!isStandalone);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setDeferred(null);
      setStandalone(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  // Hide entirely if already installed, or if we have no way to install
  // (non-iOS browser that never fired beforeinstallprompt).
  if (standalone) return null;
  if (!deferred && !isIOS) return null;

  const handleClick = async () => {
    if (deferred) {
      await deferred.prompt();
      await deferred.userChoice.catch(() => undefined);
      setDeferred(null);
      return;
    }
    if (isIOS) setShowIOSHelp(true);
  };

  const btnClass = compact
    ? "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold text-whatsapp-teal hover:bg-whatsapp-teal/10 transition-colors"
    : "w-full flex items-center gap-2 rounded-xl border border-whatsapp-green/30 bg-whatsapp-green/10 px-3 py-2 text-xs font-semibold text-whatsapp-green hover:bg-whatsapp-green/20 transition-colors";

  return (
    <>
      <button onClick={handleClick} className={btnClass} title="Install SyncChat on your phone">
        <Download className="w-4 h-4 flex-shrink-0" />
        <span>Install app</span>
      </button>

      {showIOSHelp && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/50 p-4 sm:items-center"
          onClick={() => setShowIOSHelp(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Add SyncChat to your Home Screen</h3>
              <button onClick={() => setShowIOSHelp(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <ol className="space-y-3 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-whatsapp-teal/10 text-xs font-bold text-whatsapp-teal">1</span>
                <span>Tap the <Share className="inline h-4 w-4 align-text-bottom" /> <b>Share</b> button in Safari&apos;s toolbar.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-whatsapp-teal/10 text-xs font-bold text-whatsapp-teal">2</span>
                <span>Scroll down and tap <b>Add to Home Screen</b>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-whatsapp-teal/10 text-xs font-bold text-whatsapp-teal">3</span>
                <span>Tap <b>Add</b> — SyncChat will appear on your Home Screen like an app.</span>
              </li>
            </ol>
          </div>
        </div>
      )}
    </>
  );
}
