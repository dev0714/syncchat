"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  MessageSquare, LayoutDashboard, Smartphone, Users, MessageCircle,
  FileText, Zap, Settings, Shield, LogOut, ChevronDown, Building2, CreditCard, CalendarClock,
} from "lucide-react";
import { cn, getInitials, ROLE_LABELS } from "@/lib/utils";
import type { OrgMember } from "@/types";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/instances", icon: Smartphone, label: "WhatsApp Instances" },
  { href: "/dashboard/contacts", icon: Users, label: "Contacts" },
  { href: "/dashboard/conversations", icon: MessageCircle, label: "Conversations" },
  { href: "/dashboard/templates", icon: FileText, label: "Templates" },
  { href: "/dashboard/scheduled-bulk", icon: CalendarClock, label: "Scheduled Bulk" },
  { href: "/dashboard/flows", icon: Zap, label: "Flows" },
  { href: "/dashboard/settings", icon: Settings, label: "Settings" },
  { href: "/dashboard/billing", icon: CreditCard, label: "Billing" },
];

interface SidebarProps {
  member: OrgMember;
}

export default function Sidebar({ member }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [orgOpen, setOrgOpen] = useState(false);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/auth/login");
    router.refresh();
  }

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-slate-200 flex flex-col">
      {/* Logo */}
      <div className="p-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-whatsapp-teal rounded-xl flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-slate-900 text-sm">SyncChat</p>
            <p className="text-xs text-slate-400">WhatsApp Platform</p>
          </div>
        </div>
      </div>

      {/* Org switcher */}
      <div className="p-3 border-b border-slate-100">
        <button
          onClick={() => setOrgOpen(!orgOpen)}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <div className="w-7 h-7 bg-whatsapp-teal/10 rounded-lg flex items-center justify-center">
            <Building2 className="w-4 h-4 text-whatsapp-teal" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-xs font-semibold text-slate-800 truncate">
              {member.organization?.name ?? "My Organization"}
            </p>
            <p className="text-xs text-slate-400">{ROLE_LABELS[member.role]}</p>
          </div>
          <ChevronDown className={cn("w-3.5 h-3.5 text-slate-400 transition-transform", orgOpen && "rotate-180")} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={cn("sidebar-item", isActive(href) ? "sidebar-item-active" : "sidebar-item-inactive")}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span>{label}</span>
          </Link>
        ))}

        {/* Super admin only */}
        {member.role === "super_admin" && (
          <Link
            href="/admin"
            className={cn("sidebar-item mt-2", isActive("/admin") ? "sidebar-item-active" : "sidebar-item-inactive")}
          >
            <Shield className="w-4 h-4 flex-shrink-0" />
            <span>Super Admin</span>
          </Link>
        )}
      </nav>

      {/* User footer */}
      <div className="p-3 border-t border-slate-100">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 bg-whatsapp-teal rounded-full flex items-center justify-center text-white text-xs font-bold">
            {getInitials(member.profile?.full_name ?? member.profile?.email ?? "U")}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-800 truncate">
              {member.profile?.full_name ?? "User"}
            </p>
            <p className="text-xs text-slate-400 truncate">{member.profile?.email}</p>
          </div>
          <button onClick={handleLogout} className="text-slate-400 hover:text-red-500 transition-colors" title="Sign out">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
