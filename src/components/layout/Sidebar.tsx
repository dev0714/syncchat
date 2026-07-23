"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Smartphone, Users, MessageCircle,
  FileText, Zap, Settings, Shield, LogOut, Building2, CreditCard, CalendarClock, Headset,
  GraduationCap,
} from "lucide-react";
import { cn, getInitials, ROLE_LABELS } from "@/lib/utils";
import { START_TUTORIAL_EVENT } from "@/components/onboarding/Tutorial";
import SyncChatMark from "@/components/brand/SyncChatMark";
import InstallPWA from "@/components/pwa/InstallPWA";
import type { OrgMember } from "@/types";
import { useEffect, useRef, useState } from "react";

const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/instances", icon: Smartphone, label: "WhatsApp Instances" },
  { href: "/dashboard/contacts", icon: Users, label: "Contacts" },
  { href: "/dashboard/conversations", icon: MessageCircle, label: "Conversations" },
  { href: "/dashboard/agents", icon: Headset, label: "Agents" },
  { href: "/dashboard/templates", icon: FileText, label: "Message Lab" },
  { href: "/dashboard/scheduled-bulk", icon: CalendarClock, label: "Scheduled Bulk" },
  { href: "/dashboard/flows", icon: Zap, label: "AI Flows" },
  { href: "/dashboard/settings", icon: Settings, label: "Settings" },
  { href: "/dashboard/billing", icon: CreditCard, label: "Billing" },
];

interface SidebarProps {
  member: OrgMember;
  /** Called when a nav item is tapped — used to close the mobile drawer. */
  onNavigate?: () => void;
}

export default function Sidebar({ member, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const asideRef = useRef<HTMLElement | null>(null);
  const navRef = useRef<HTMLElement | null>(null);
  const itemRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const [indicator, setIndicator] = useState<{ top: number; height: number; visible: boolean }>({
    top: 0,
    height: 0,
    visible: false,
  });

  async function handleLogout() {
    onNavigate?.();
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/auth/login");
    router.refresh();
  }

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  // Super admin can hide the Billing section per-org (organizations.settings.billing_enabled === false).
  const billingHidden =
    (member.organization?.settings as { billing_enabled?: boolean } | undefined)?.billing_enabled === false;
  const navItems = billingHidden
    ? NAV_ITEMS.filter((item) => item.href !== "/dashboard/billing")
    : NAV_ITEMS;

  useEffect(() => {
    const updateIndicator = () => {
      const activeEntry = navItems.find(({ href }) => isActive(href));
      const activeEl = activeEntry ? itemRefs.current[activeEntry.href] : null;
      const asideEl = asideRef.current;
      const navEl = navRef.current;

      if (!activeEl || !navEl || !asideEl) {
        setIndicator((current) => current.visible ? { ...current, visible: false } : current);
        return;
      }

      const sidebarRect = asideEl.getBoundingClientRect();
      const activeRect = activeEl.getBoundingClientRect();
      const top = activeRect.top - sidebarRect.top;
      const height = activeEl.offsetHeight;
      setIndicator({ top, height, visible: true });
    };

    updateIndicator();
    window.addEventListener("resize", updateIndicator);
    return () => window.removeEventListener("resize", updateIndicator);
  }, [pathname]);

  return (
    <aside ref={asideRef} className="relative z-20 w-64 shrink-0 min-h-screen bg-white border-r border-slate-200 flex flex-col pointer-events-auto">
      {/* Logo */}
      <div className="p-5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <SyncChatMark className="w-9 h-9 flex-shrink-0" />
          <div>
            <p className="font-bold text-slate-900 text-sm">
              Sync<span className="text-whatsapp-green">Chat</span>
            </p>
            <p className="text-xs text-slate-400">WhatsApp Platform</p>
          </div>
        </div>
      </div>

      {/* Org display */}
      <div className="p-3 border-b border-slate-100">
        <div className="flex items-center gap-2 px-3 py-2">
          <div className="w-7 h-7 bg-whatsapp-teal/10 rounded-lg flex items-center justify-center">
            <Building2 className="w-4 h-4 text-whatsapp-teal" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-800 truncate">
              {member.organization?.name ?? "My Organization"}
            </p>
            <p className="text-xs text-slate-400">{ROLE_LABELS[member.role]}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div
        aria-hidden="true"
        className="absolute left-3 right-3 rounded-xl bg-whatsapp-teal/12 border border-whatsapp-teal/20 shadow-sm transition-all duration-300 ease-out pointer-events-none"
        style={{
          top: indicator.visible ? indicator.top : 0,
          height: indicator.visible ? indicator.height : 0,
          opacity: indicator.visible ? 1 : 0,
        }}
      />

      <nav ref={navRef} className="relative flex-1 p-3 space-y-0.5">
        {navItems.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            ref={(node) => {
              itemRefs.current[href] = node;
            }}
            onClick={() => onNavigate?.()}
            className={cn("sidebar-item relative z-10", isActive(href) ? "sidebar-item-active" : "sidebar-item-inactive")}
          >
            <Icon className="w-4 h-4 flex-shrink-0 transition-transform duration-300 ease-out" />
            <span>{label}</span>
          </Link>
        ))}

        {/* Super admin only */}
        {(member.role === "super_admin" || member.user?.role === "super_admin") && (
          <Link
            href="/admin"
            onClick={() => onNavigate?.()}
            className={cn("sidebar-item relative z-10 mt-2", isActive("/admin") ? "sidebar-item-active" : "sidebar-item-inactive")}
          >
            <Shield className="w-4 h-4 flex-shrink-0" />
            <span>Super Admin</span>
          </Link>
        )}
      </nav>

      {/* Install app + Tutorial launcher */}
      <div className="px-3 pb-1 space-y-1.5">
        <InstallPWA />
        <button
          onClick={() => window.dispatchEvent(new CustomEvent(START_TUTORIAL_EVENT))}
          className="w-full flex items-center gap-2 rounded-xl border border-whatsapp-teal/20 bg-whatsapp-teal/5 px-3 py-2 text-xs font-medium text-whatsapp-teal hover:bg-whatsapp-teal/10 transition-colors"
        >
          <GraduationCap className="w-4 h-4 flex-shrink-0" />
          <span>Tutorial</span>
        </button>
      </div>

      {/* User footer */}
      <div className="p-3 border-t border-slate-100">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 bg-whatsapp-teal rounded-full flex items-center justify-center text-white text-xs font-bold">
            {getInitials(member.user?.name ?? member.user?.email ?? member.profile?.full_name ?? member.profile?.email ?? "U")}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-800 truncate">
              {member.user?.name ?? member.profile?.full_name ?? "User"}
            </p>
            <p className="text-xs text-slate-400 truncate">
              {member.user?.email ?? member.profile?.email}
            </p>
          </div>
          <button onClick={handleLogout} className="text-slate-400 hover:text-red-500 transition-colors" title="Sign out">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
