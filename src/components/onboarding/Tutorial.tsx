"use client";
/**
 * First-run product tour for SyncChat. Renders a centered, step-by-step modal
 * that walks a new user through the platform. It auto-opens once (tracked in
 * localStorage) and can be re-opened any time by dispatching the
 * "syncchat:start-tutorial" window event (the sidebar's "Tutorial" button does
 * this). Kept dependency-free and light-theme to match the dashboard.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Rocket, Smartphone, Zap, FileText, MessageCircle, Users, Headset,
  CalendarClock, Settings as SettingsIcon, ShieldCheck, CheckCircle2,
  X, ChevronLeft, ChevronRight, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "syncchat_tutorial_seen_v1";
export const START_TUTORIAL_EVENT = "syncchat:start-tutorial";

interface Step {
  icon: LucideIcon;
  title: string;
  body: string;
  tip?: string;
}

const STEPS: Step[] = [
  {
    icon: Rocket,
    title: "Welcome to SyncChat 👋",
    body: "SyncChat turns your WhatsApp number into an AI-powered assistant that replies to customers automatically — and hands off to your team when needed. This quick tour shows you the main pieces. It takes about a minute.",
    tip: "You can re-open this tour any time from the “Tutorial” button at the bottom of the sidebar.",
  },
  {
    icon: Smartphone,
    title: "1. Connect your WhatsApp",
    body: "Head to WhatsApp Instances to link a number. Scan the QR code (or connect the official Meta Cloud API) and wait for the status to turn Connected. Everything else builds on a connected number.",
  },
  {
    icon: Zap,
    title: "2. Build your AI agent",
    body: "AI Flows is where you create your bot. Give it a role, guardrails, tone, and business context, add Terms & Conditions, and switch on actions like Escalate to Human and Send Template. Toggle a flow off any time to silence the bot.",
    tip: "The flow card’s on/off switch is a full kill switch — off means the AI won’t reply at all.",
  },
  {
    icon: FileText,
    title: "3. Create message templates",
    body: "Message Lab lets you compose reusable messages — text, images (you can add several), documents, and more — with variables like {{name}}. Save them once, then send in bulk or let the AI send them automatically.",
  },
  {
    icon: MessageCircle,
    title: "4. Watch conversations live",
    body: "Conversations shows every chat in real time. See what the AI is handling, jump in to reply yourself, or hand a chat back to the bot. When a customer asks for a human, the AI escalates here.",
  },
  {
    icon: Users,
    title: "5. Manage contacts",
    body: "Contacts is your customer list — names, numbers, and history — built automatically as people message you. Use it to target bulk campaigns.",
  },
  {
    icon: Headset,
    title: "6. Add your team (Agents)",
    body: "Invite teammates and set who’s available. When the bot escalates, SyncChat routes the conversation to an available human agent automatically.",
  },
  {
    icon: CalendarClock,
    title: "7. Schedule campaigns",
    body: "Scheduled Bulk lets you send a template to many contacts at a chosen time — one-off or recurring — so follow-ups and promos go out on their own.",
  },
  {
    icon: ShieldCheck,
    title: "8. Control the AI",
    body: "In Settings → General you’ll find AI Auto-Response — a master switch per number. Turn it off and the AI stops replying on that number (messages are still received and logged so you can answer by hand).",
  },
  {
    icon: SettingsIcon,
    title: "9. Settings & organisation",
    body: "Settings is where you manage your organisation details, team, billing, and integrations. Super admins get extra controls under Super Admin.",
  },
  {
    icon: CheckCircle2,
    title: "You’re all set! 🎉",
    body: "That’s the whirlwind tour. A good first path: connect a number → build a flow → save a template → send a test. Whenever you need a refresher, hit the Tutorial button in the sidebar.",
  },
];

export default function Tutorial() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  const close = useCallback((markSeen: boolean) => {
    setOpen(false);
    if (markSeen) {
      try { localStorage.setItem(STORAGE_KEY, "1"); } catch { /* ignore */ }
    }
  }, []);

  // Auto-open once for first-time users.
  useEffect(() => {
    let seen = false;
    try { seen = localStorage.getItem(STORAGE_KEY) === "1"; } catch { /* ignore */ }
    if (!seen) {
      const t = setTimeout(() => { setStep(0); setOpen(true); }, 600);
      return () => clearTimeout(t);
    }
  }, []);

  // Allow re-opening from anywhere (sidebar button).
  useEffect(() => {
    const handler = () => { setStep(0); setOpen(true); };
    window.addEventListener(START_TUTORIAL_EVENT, handler);
    return () => window.removeEventListener(START_TUTORIAL_EVENT, handler);
  }, []);

  // Keyboard controls.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(true);
      else if (e.key === "ArrowRight") setStep((s) => Math.min(s + 1, STEPS.length - 1));
      else if (e.key === "ArrowLeft") setStep((s) => Math.max(s - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  if (!open) return null;

  const current = STEPS[step];
  const Icon = current.icon;
  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
      onClick={() => close(true)}
      role="dialog"
      aria-modal="true"
      aria-label="SyncChat tutorial"
    >
      <div
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
      >
        {/* Header */}
        <div className="relative bg-gradient-to-br from-whatsapp-teal/10 to-purple-50 px-6 pt-6 pb-5">
          <button
            onClick={() => close(true)}
            className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Close tutorial"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-3">
            <Icon className="w-6 h-6 text-whatsapp-teal" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">{current.title}</h2>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-3">
          <p className="text-sm text-slate-600 leading-relaxed">{current.body}</p>
          {current.tip && (
            <p className="text-xs text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
              💡 {current.tip}
            </p>
          )}
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-1.5 pb-4">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              aria-label={`Go to step ${i + 1}`}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === step ? "w-5 bg-whatsapp-teal" : "w-1.5 bg-slate-200 hover:bg-slate-300",
              )}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-100">
          <button
            onClick={() => close(true)}
            className="text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors"
          >
            Skip tour
          </button>
          <div className="flex items-center gap-2">
            {!isFirst && (
              <button
                onClick={() => setStep((s) => Math.max(s - 1, 0))}
                className="btn-secondary inline-flex items-center gap-1.5 !py-2 !px-3 text-sm"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            )}
            {isLast ? (
              <button
                onClick={() => close(true)}
                className="btn-primary inline-flex items-center gap-1.5 !py-2 !px-4 text-sm"
              >
                <CheckCircle2 className="w-4 h-4" /> Get started
              </button>
            ) : (
              <button
                onClick={() => setStep((s) => Math.min(s + 1, STEPS.length - 1))}
                className="btn-primary inline-flex items-center gap-1.5 !py-2 !px-4 text-sm"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
