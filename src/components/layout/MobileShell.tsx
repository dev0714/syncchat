"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import Sidebar from "./Sidebar";
import SyncChatMark from "@/components/brand/SyncChatMark";
import RegisterSW from "@/components/pwa/RegisterSW";
import { cn } from "@/lib/utils";
import type { OrgMember } from "@/types";

/**
 * Responsive app shell shared by the dashboard and admin layouts.
 *
 * Desktop (md+): the sidebar is a fixed 16rem rail and behaves exactly as
 * before. Mobile: the sidebar becomes an off-canvas drawer toggled by a
 * hamburger in a slim top bar, with a tap-to-dismiss backdrop.
 *
 * The `mainClassName` is supplied by each layout so the desktop offset/height
 * behaviour (e.g. the conversations page's h-screen two-pane) is preserved.
 */
export default function MobileShell({
  member,
  children,
  mainClassName,
}: {
  member: OrgMember;
  children: React.ReactNode;
  mainClassName: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close the drawer whenever the route changes (mobile navigation).
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="relative min-h-screen bg-slate-50">
      <RegisterSW />

      {/* Mobile top bar */}
      <header className="md:hidden fixed top-0 inset-x-0 z-30 flex h-14 items-center gap-3 border-b border-slate-200 bg-white px-4">
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="-ml-1 p-1 text-slate-600 hover:text-slate-900"
        >
          <Menu className="h-6 w-6" />
        </button>
        <SyncChatMark className="h-7 w-7" />
        <span className="text-sm font-bold text-slate-900">
          Sync<span className="text-whatsapp-green">Chat</span>
        </span>
      </header>

      {/* Backdrop (mobile only, when drawer open) */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar — off-canvas drawer on mobile, fixed rail on desktop */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transition-transform duration-300 ease-out md:translate-x-0",
          open ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        )}
      >
        <Sidebar member={member} onNavigate={() => setOpen(false)} />
      </div>

      <main className={mainClassName}>{children}</main>
    </div>
  );
}
