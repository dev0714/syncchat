"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Settings, Users, Building2, Save, Plus, Trash2,
  Mail, Shield, X, Check,
} from "lucide-react";
import type { OrgMember, OrgSettings } from "@/types";
import { shouldShowSettingsOnboarding } from "@/lib/onboarding";
import { ROLE_LABELS, ROLE_COLORS, cn } from "@/lib/utils";
import PacmanLoader from "@/components/ui/PacmanLoader";

type Tab = "general" | "team" | "integrations" | "notifications";

export default function SettingsPage() {
  const supabase = createClient();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("general");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [onboardingSaving, setOnboardingSaving] = useState(false);
  const [orgId, setOrgId] = useState("");
  const [myRole, setMyRole] = useState("");
  const [orgName, setOrgName] = useState("");
  const [member, setMember] = useState<OrgMember | null>(null);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [settings, setSettings] = useState<Partial<OrgSettings>>({
    auto_reply_enabled: false,
    auto_reply_message: "",
    n8n_base_url: "",
    n8n_api_key: "",
  });
  const [error, setError] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<OrgMember["role"]>("agent");
  const [inviting, setInviting] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const authRes = await fetch("/api/auth/me");
    if (!authRes.ok) {
      setLoading(false);
      return;
    }
    const { user } = await authRes.json();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data: memberData } = await supabase
      .from("org_members")
      .select("*, organization:organizations(*)")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    setMember((memberData as OrgMember | null) ?? null);

    if (!memberData) {
      setOrgId("");
      setMyRole("");
      setOrgName("");
      setMembers([]);
      setLoading(false);
      return;
    }

    const member = memberData as OrgMember;
    setOrgId(member.org_id);
    setMyRole(member.role);
    setOrgName(member.organization?.name ?? "");

    const { data: org_settings } = await supabase.from("org_settings").select("*").eq("org_id", member.org_id).single();
    if (org_settings) setSettings(org_settings);

    const { data: team } = await supabase.from("org_members")
      .select("*, profile:profiles(*)")
      .eq("org_id", member.org_id)
      .order("created_at");
    setMembers((team as OrgMember[]) ?? []);
    setLoading(false);
  }

  async function createOrganization() {
    const trimmedName = orgName.trim();
    if (!trimmedName) {
      return;
    }

    setError("");
    setOnboardingSaving(true);

    const response = await fetch("/api/onboarding/organization", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmedName }),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      setError(data.error || "Failed to create organization");
      setOnboardingSaving(false);
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  }

  async function saveGeneral() {
    setSaving(true);
    await supabase.from("organizations").update({ name: orgName }).eq("id", orgId);
    const { data: existing } = await supabase.from("org_settings").select("id").eq("org_id", orgId).single();
    if (existing) {
      await supabase.from("org_settings").update({
        auto_reply_enabled: settings.auto_reply_enabled,
        auto_reply_message: settings.auto_reply_message,
        updated_at: new Date().toISOString(),
      }).eq("org_id", orgId);
    } else {
      await supabase.from("org_settings").insert({ org_id: orgId, ...settings });
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  async function saveIntegrations() {
    setSaving(true);
    const { data: existing } = await supabase.from("org_settings").select("id").eq("org_id", orgId).single();
    if (existing) {
      await supabase.from("org_settings").update({
        n8n_base_url: settings.n8n_base_url,
        n8n_api_key: settings.n8n_api_key,
        updated_at: new Date().toISOString(),
      }).eq("org_id", orgId);
    } else {
      await supabase.from("org_settings").insert({ org_id: orgId, ...settings });
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  async function updateMemberRole(memberId: string, role: OrgMember["role"]) {
    await supabase.from("org_members").update({ role }).eq("id", memberId);
    setMembers((prev) => prev.map((m) => m.id === memberId ? { ...m, role } : m));
  }

  async function removeMember(memberId: string) {
    if (!confirm("Remove this team member?")) return;
    await supabase.from("org_members").delete().eq("id", memberId);
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
  }

  async function inviteMember() {
    if (!inviteEmail) return;
    setInviting(true);
    // Look up user by email in profiles
    const { data: profile } = await supabase.from("profiles").select("id").eq("email", inviteEmail).single();
    if (!profile) {
      alert("No user found with that email. Ask them to create an account first.");
      setInviting(false);
      return;
    }
    const { error } = await supabase.from("org_members").insert({
      org_id: orgId,
      user_id: profile.id,
      role: inviteRole,
      is_active: true,
    });
    if (error) { alert(error.message); }
    else { setInviteEmail(""); loadData(); }
    setInviting(false);
  }

  const isOnboarding = shouldShowSettingsOnboarding(!!member);
  const isAdmin = myRole === "super_admin" || myRole === "org_admin";
  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "general", label: "General", icon: Building2 },
    { key: "team", label: "Team", icon: Users },
    { key: "integrations", label: "Integrations", icon: Settings },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <PacmanLoader size={40} label="Loading settings" />
      </div>
    );
  }

  if (isOnboarding) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-500 text-sm mt-1">Create your organization to get started</p>
        </div>

        <div className="card p-6 space-y-5 max-w-2xl">
          <div>
            <h2 className="font-semibold text-slate-900">Create your organization</h2>
            <p className="text-sm text-slate-500 mt-1">
              This account does not belong to an organization yet. Create one now to unlock the dashboard.
            </p>
          </div>
          <div>
            <label className="label">Organization / Company name</label>
            <input
              className="input"
              placeholder="Acme Corp"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
            />
            <p className="text-xs text-slate-400 mt-1">
              Your workspace slug will be generated automatically.
            </p>
          </div>
          {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">{error}</div>}
          <button
            onClick={createOrganization}
            disabled={onboardingSaving || !orgName.trim()}
            className="btn-primary flex items-center gap-2 ml-auto"
          >
            {onboardingSaving ? <PacmanLoader size={14} className="mr-1.5" label="Creating organization" /> : <Building2 className="w-4 h-4" />}
            {onboardingSaving ? "Creating..." : "Create organization"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your organization settings</p>
      </div>

      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              tab === key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === "general" && (
        <div className="card p-6 space-y-5">
          <h2 className="font-semibold text-slate-900">Organization Details</h2>
          <div>
            <label className="label">Organization Name</label>
            <input
              className="input"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              disabled={!isAdmin}
            />
          </div>

          <div className="border-t border-slate-100 pt-5">
            <h3 className="font-medium text-slate-800 mb-4">Auto Reply</h3>
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => isAdmin && setSettings({ ...settings, auto_reply_enabled: !settings.auto_reply_enabled })}
                className={cn(
                  "w-11 h-6 rounded-full transition-colors relative cursor-pointer",
                  settings.auto_reply_enabled ? "bg-whatsapp-teal" : "bg-slate-200"
                )}
              >
                <div
                  className={cn(
                    "w-4 h-4 bg-white rounded-full absolute top-1 transition-transform",
                    settings.auto_reply_enabled ? "translate-x-6" : "translate-x-1"
                  )}
                />
              </div>
              <span className="text-sm text-slate-700">Enable auto reply for incoming messages</span>
            </label>
            {settings.auto_reply_enabled && (
              <div className="mt-3">
                <label className="label">Auto Reply Message</label>
                <textarea
                  className="input min-h-[80px]"
                  placeholder="Hi! We received your message and will reply shortly."
                  value={settings.auto_reply_message ?? ""}
                  onChange={(e) => setSettings({ ...settings, auto_reply_message: e.target.value })}
                  disabled={!isAdmin}
                />
              </div>
            )}
          </div>

          {isAdmin && (
            <button
              onClick={saveGeneral}
              disabled={saving}
              className="btn-primary flex items-center gap-2 ml-auto"
            >
              {saving ? <PacmanLoader size={14} className="mr-1.5" label="Saving settings" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saved ? "Saved!" : saving ? "Saving..." : "Save Changes"}
            </button>
          )}
        </div>
      )}

      {tab === "team" && (
        <div className="space-y-4">
          {isAdmin && (
            <div className="card p-5">
              <h2 className="font-semibold text-slate-900 mb-4">Invite Team Member</h2>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    className="input pl-9"
                    placeholder="Email address"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                <select
                  className="input w-36"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as OrgMember["role"])}
                >
                  <option value="agent">Agent</option>
                  <option value="org_admin">Admin</option>
                  <option value="viewer">Viewer</option>
                </select>
                <button
                  onClick={inviteMember}
                  disabled={inviting || !inviteEmail}
                  className="btn-primary flex items-center gap-2 whitespace-nowrap"
                >
                  {inviting ? <PacmanLoader size={14} className="mr-1.5" label="Inviting member" /> : <Plus className="w-4 h-4" />}
                  Invite
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-2">The user must already have a SyncChat account.</p>
            </div>
          )}

          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">Team Members ({members.length})</h2>
            </div>
            <div className="divide-y divide-slate-50">
              {members.map((m) => (
                <div key={m.id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="w-9 h-9 bg-whatsapp-teal/10 rounded-full flex items-center justify-center text-whatsapp-teal font-semibold text-sm flex-shrink-0">
                    {(m.profile?.full_name ?? m.profile?.email ?? "?")[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{m.profile?.full_name ?? "—"}</p>
                    <p className="text-xs text-slate-400 truncate">{m.profile?.email}</p>
                  </div>
                  {isAdmin ? (
                    <select
                      className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 text-slate-600 focus:outline-none"
                      value={m.role}
                      onChange={(e) => updateMemberRole(m.id, e.target.value as OrgMember["role"])}
                    >
                      <option value="viewer">Viewer</option>
                      <option value="agent">Agent</option>
                      <option value="org_admin">Admin</option>
                    </select>
                  ) : (
                    <span className={cn("badge", ROLE_COLORS[m.role])}>{ROLE_LABELS[m.role]}</span>
                  )}
                  {isAdmin && (
                    <button onClick={() => removeMember(m.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  {!isAdmin && <Shield className="w-4 h-4 text-slate-300" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "integrations" && (
        <div className="card p-6 space-y-5">
          <div>
            <h2 className="font-semibold text-slate-900">N8n Integration</h2>
            <p className="text-sm text-slate-500 mt-1">Connect your N8n instance to manage flows directly from SyncChat</p>
          </div>
          <div>
            <label className="label">N8n Base URL</label>
            <input
              className="input"
              placeholder="http://localhost:5678"
              value={settings.n8n_base_url ?? ""}
              onChange={(e) => setSettings({ ...settings, n8n_base_url: e.target.value })}
              disabled={!isAdmin}
            />
          </div>
          <div>
            <label className="label">N8n API Key</label>
            <input
              type="password"
              className="input"
              placeholder="Your N8n API key"
              value={settings.n8n_api_key ?? ""}
              onChange={(e) => setSettings({ ...settings, n8n_api_key: e.target.value })}
              disabled={!isAdmin}
            />
            <p className="text-xs text-slate-400 mt-1">Generate in N8n Settings → API → Create an API key</p>
          </div>
          <div className="border-t border-slate-100 pt-5">
            <h2 className="font-semibold text-slate-900">Webhook URLs</h2>
            <p className="text-sm text-slate-500 mt-1 mb-3">
              Use these webhook URLs in your SyncChat instance settings to receive incoming messages.
            </p>
            <div className="bg-slate-50 rounded-xl p-4 space-y-2">
              <div>
                <p className="text-xs font-medium text-slate-600 mb-1">Instance Webhook Base URL</p>
                <code className="text-xs text-slate-700 font-mono bg-white border border-slate-200 rounded px-3 py-2 block">
                  {typeof window !== "undefined" ? window.location.origin : "https://your-domain.com"}/api/webhook/[INSTANCE_ID]
                </code>
              </div>
            </div>
          </div>
          {isAdmin && (
            <button onClick={saveIntegrations} disabled={saving} className="btn-primary flex items-center gap-2 ml-auto">
              {saving ? <PacmanLoader size={14} className="mr-1.5" label="Saving settings" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saved ? "Saved!" : saving ? "Saving..." : "Save Changes"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
