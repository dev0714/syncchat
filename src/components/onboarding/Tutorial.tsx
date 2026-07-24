"use client";
/**
 * Guided product tour for SyncChat. Instead of a static modal, this walks the
 * user THROUGH the app: each step navigates to the relevant page and describes
 * what it does, while the sidebar highlights the current section. The tour card
 * floats at the bottom and lets clicks pass through, so the real page stays
 * visible (and usable) behind it.
 *
 * Auto-opens once (tracked in localStorage) and can be re-opened any time via
 * the "syncchat:start-tutorial" window event (the sidebar's Tutorial button).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Rocket, Smartphone, Zap, FileText, MessageCircle, Users, Headset,
  CalendarClock, Settings as SettingsIcon, ShieldCheck, CheckCircle2,
  X, ChevronLeft, ChevronRight, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "syncchat_tutorial_seen_v2";
export const START_TUTORIAL_EVENT = "syncchat:start-tutorial";

interface Step {
  icon: LucideIcon;
  title: string;
  body: string;
  tip?: string;
  /** Page this step visits. The tour navigates here as the step opens. */
  href: string;
}

const STEPS: Step[] = [
  {
    icon: Rocket,
    title: "Welcome to SyncChat 👋",
    body: "SyncChat turns your WhatsApp number into an AI assistant that replies to customers automatically — and hands off to your team when needed. I'll walk you through each screen. It takes about a minute.",
    tip: "This card stays out of your way — you can see each page behind it. Re-open the tour any time from the “Tutorial” button in the sidebar.",
    href: "/dashboard",
  },
  {
    icon: Smartphone,
    title: "1. WhatsApp Instances",
    body: "This is where you link a number. Scan the QR code (or connect the official Meta Cloud API) and wait for the status to turn Connected. Everything else builds on a connected number.",
    href: "/dashboard/instances",
  },
  {
    icon: Zap,
    title: "2. AI Flows — build your bot",
    body: "Here you create your AI agent: give it a role, guardrails, tone and business context, add Terms & Conditions, and switch on actions like Escalate to Human and Send Template.",
    tip: "Each flow card’s on/off switch is a full kill switch — off means the AI won’t reply at all.",
    href: "/dashboard/flows",
  },
  {
    icon: FileText,
    title: "3. Message Lab — templates",
    body: "Compose reusable messages — text, images (add several), documents and more — with variables like {{name}}. Save them once, then send in bulk or let the AI send them automatically.",
    href: "/dashboard/templates",
  },
  {
    icon: MessageCircle,
    title: "4. Conversations",
    body: "Every chat in real time. See what the AI is handling, jump in to reply yourself, or hand a chat back to the bot. When a customer asks for a human, the AI escalates it here.",
    href: "/dashboard/conversations",
  },
  {
    icon: Users,
    title: "5. Contacts",
    body: "Your customer list — names, numbers and email — built automatically as people message you. The AI can even save a customer’s email to their contact when they share it. Use this list to target bulk campaigns.",
    href: "/dashboard/contacts",
  },
  {
    icon: Headset,
    title: "6. Agents",
    body: "Invite teammates and set who’s available. When the bot escalates, SyncChat routes the conversation to an available human agent automatically. You can also auto-return a chat to the AI after a wait.",
    href: "/dashboard/agents",
  },
  {
    icon: CalendarClock,
    title: "7. Scheduled Bulk",
    body: "Send a template to many contacts at a chosen time — one-off or recurring — so follow-ups and promos go out on their own.",
    href: "/dashboard/scheduled-bulk",
  },
  {
    icon: ShieldCheck,
    title: "8. Settings — control the AI",
    body: "Under Settings → General you’ll find the AI master switch per number, plus your organisation details, team, and integrations. Turn the AI off and messages are still received and logged so you can reply by hand.",
    href: "/dashboard/settings",
  },
  {
    icon: CheckCircle2,
    title: "You’re all set! 🎉",
    body: "That’s the tour. A good first path: connect a number → build a flow → save a template → send a test. Hit the Tutorial button in the sidebar whenever you need a refresher.",
    href: "/dashboard",
  },
];

export default function Tutorial() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  const close = useCallback((markSeen: boolean) => {
    setOpen(false);
    if (markSeen) {
      try { localStorage.setItem(STORAGE_KEY, "1"); } catch { /* ignore */ }
    }
  }, []);

  const go = useCallback((next: number) => {
    setStep(Math.max(0, Math.min(next, STEPS.length - 1)));
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

  // Navigate to the current step's page as the tour advances.
  useEffect(() => {
    if (!open) return;
    const target = STEPS[step].href;
    if (target && pathname !== target) router.push(target);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, step]);

  // Keyboard controls.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(true);
      else if (e.key === "ArrowRight") go(step + 1);
      else if (e.key === "ArrowLeft") go(step - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close, go, step]);

  if (!open) return null;

  const current = STEPS[step];
  const Icon = current.icon;
  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;

  return (
    // Wrapper lets clicks pass through to the page; only the card is interactive.
    <div className="fixed inset-x-0 bottom-0 z-[100] flex justify-center p-4 pointer-events-none md:justify-end md:pr-6">
      <div
        ref={dialogRef}
        className="pointer-events-auto w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden"
        role="dialog"
        aria-modal="false"
        aria-label="SyncChat tutorial"
      >
        {/* Header */}
        <div className="relative bg-gradient-to-br from-whatsapp-teal/10 to-purple-50 px-5 pt-5 pb-4">
          <button
            onClick={() => close(true)}
            className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Close tutorial"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white shadow-sm flex items-center justify-center flex-shrink-0">
              <Icon className="w-5 h-5 text-whatsapp-teal" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-whatsapp-teal">
                Step {step + 1} of {STEPS.length}
              </p>
              <h2 className="text-base font-bold text-slate-900 leading-tight">{current.title}</h2>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-3">
          <p className="text-sm text-slate-600 leading-relaxed">{current.body}</p>
          {current.tip && (
            <p className="text-xs text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
              💡 {current.tip}
            </p>
          )}
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-1.5 pb-3">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              aria-label={`Go to step ${i + 1}`}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === step ? "w-5 bg-whatsapp-teal" : "w-1.5 bg-slate-200 hover:bg-slate-300",
              )}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-slate-100">
          <button
            onClick={() => close(true)}
            className="text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors"
          >
            Skip tour
          </button>
          <div className="flex items-center gap-2">
            {!isFirst && (
              <button
                onClick={() => go(step - 1)}
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
                onClick={() => go(step + 1)}
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
