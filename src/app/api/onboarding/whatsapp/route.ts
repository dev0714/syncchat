import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/server";
import { getPlatformSettings } from "@/lib/platform-settings";
import { waha, WAHA_INBOUND_WEBHOOK } from "@/lib/waha";

/**
 * First-login WhatsApp onboarding for trial (free-plan) orgs.
 *
 * The user provides the number they want to link; we auto-create a WAHA instance
 * for their org (its own session, wired to the inbound AI webhook) so they can
 * immediately scan the QR on the Instances page. Trials always use WAHA — the
 * shared server credentials live in platform_settings (super-admin managed), so
 * no secrets are exposed to the tenant.
 */

/** Turn arbitrary text into a valid WAHA session name (a-z, 0-9, dashes). */
function slugifySession(input: string): string {
  const base = String(input || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return base || "session";
}

async function uniqueWahaSession(
  supabase: ReturnType<typeof createAdminClient>,
  desired: string,
): Promise<string> {
  const base = slugifySession(desired);
  let candidate = base;
  let n = 1;
  while (n < 100) {
    const { data } = await supabase
      .from("whatsapp_instances")
      .select("id")
      .eq("provider", "waha")
      .eq("instance_id", candidate)
      .maybeSingle();
    if (!data) return candidate;
    n += 1;
    candidate = `${base}-${n}`;
  }
  return `${base}-${Date.now()}`;
}

async function resolveOrgId(userId: string, userOrgId: string | null): Promise<string | null> {
  if (userOrgId) return userOrgId;
  const supabase = createAdminClient();
  const { data: member } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return member?.org_id ?? null;
}

/** GET → whether this org still needs to link a number (drives the modal). */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = await resolveOrgId(user.userId, user.orgId);
  if (!orgId) return NextResponse.json({ needsOnboarding: false });

  const supabase = createAdminClient();
  const [{ data: org }, { count }] = await Promise.all([
    supabase.from("organizations").select("plan, settings").eq("id", orgId).maybeSingle(),
    supabase.from("whatsapp_instances").select("id", { count: "exact", head: true }).eq("org_id", orgId),
  ]);

  const plan = (org?.plan as string) ?? "free";
  const settings = ((org?.settings as Record<string, unknown> | null) ?? {}) as Record<string, unknown>;
  const dismissed = settings.whatsapp_onboarding_dismissed === true;
  const hasInstance = (count ?? 0) > 0;

  return NextResponse.json({
    needsOnboarding: plan === "free" && !hasInstance && !dismissed,
    hasInstance,
    plan,
  });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = await resolveOrgId(user.userId, user.orgId);
  if (!orgId) return NextResponse.json({ error: "No organization found" }, { status: 400 });

  const supabase = createAdminClient();
  const body = (await req.json().catch(() => ({}))) as { phone_number?: string; skip?: boolean };

  // Let the user skip for now — remember it so we don't nag every login.
  if (body.skip) {
    const { data: org } = await supabase.from("organizations").select("settings").eq("id", orgId).maybeSingle();
    const settings = ((org?.settings as Record<string, unknown> | null) ?? {}) as Record<string, unknown>;
    await supabase
      .from("organizations")
      .update({ settings: { ...settings, whatsapp_onboarding_dismissed: true } })
      .eq("id", orgId);
    return NextResponse.json({ success: true, skipped: true });
  }

  const phoneNumber = String(body.phone_number ?? "").trim();
  if (!phoneNumber) {
    return NextResponse.json({ error: "Please enter the WhatsApp number you want to link." }, { status: 400 });
  }

  // Idempotent: if a WhatsApp instance already exists for this org, reuse it.
  const { data: existing } = await supabase
    .from("whatsapp_instances")
    .select("id")
    .eq("org_id", orgId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ success: true, instanceId: existing.id, alreadyLinked: true });
  }

  // Trials use WAHA. Pull the shared server creds from platform settings.
  const s = await getPlatformSettings();
  if (!s.waha_base_url || !s.waha_api_key) {
    return NextResponse.json(
      { error: "WhatsApp isn't available yet — the platform administrator still needs to configure the WhatsApp server. Please try again shortly." },
      { status: 503 },
    );
  }

  // Each number is its own WAHA session; derive a unique one from the number.
  const session = await uniqueWahaSession(supabase, `org-${orgId.slice(0, 8)}-${phoneNumber.replace(/[^\d]/g, "")}`);
  // Best-effort: create/start the session on the WAHA server, wired to the AI webhook.
  await waha.startSession(s.waha_base_url, s.waha_api_key, session, WAHA_INBOUND_WEBHOOK);

  const normalizedPhone = phoneNumber.startsWith("+") ? phoneNumber : `+${phoneNumber.replace(/[^\d]/g, "")}`;

  const { data: inserted, error } = await supabase
    .from("whatsapp_instances")
    .insert({
      org_id: orgId,
      name: "My WhatsApp",
      provider: "waha",
      base_url: s.waha_base_url,
      instance_id: session,
      token: s.waha_api_key,
      phone_number: normalizedPhone,
      webhook_url: null,
      ultramsg_settings: {},
      // "loading" so the Instances page's pairing poller immediately begins
      // polling status + pulling the QR (WAHA is STARTING → SCAN_QR_CODE).
      status: "loading",
      is_active: true,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ success: true, instanceId: inserted?.id });
}
