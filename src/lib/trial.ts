import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Trial limits & usage.
 *
 * Free-plan (trial) organizations are capped at a fixed number of WhatsApp
 * messages — counting EVERY message, inbound and outbound (customer messages
 * plus AI/agent replies). Usage is derived live from the `messages` table so it
 * naturally includes the n8n AI flow's replies (which the app never sees), not a
 * separate counter that could drift.
 *
 * When the cap is reached we hard-stop: app-side sends are blocked (see the send
 * routes) and the AI is silenced by flipping each instance's kill switch
 * (ultramsg_settings.ai_enabled = false), which the inbound n8n flow already
 * respects. See syncTrialAiForOrg().
 */

export const TRIAL_MESSAGE_LIMIT = 100;

/** Message the API returns / the UI shows when a trial has hit its cap. */
export const TRIAL_LIMIT_MESSAGE =
  "You've reached your free trial limit of 100 messages. Upgrade your plan to keep sending.";

export interface TrialUsage {
  plan: string;
  /** true for free-plan orgs (the only ones that are capped). */
  isTrial: boolean;
  /** Cap for this org (Infinity for paid plans). */
  limit: number;
  /** Total messages counted (in + out). Only computed for trial orgs. */
  used: number;
  remaining: number;
  /** true when a trial org is at/over its cap. */
  reached: boolean;
}

function planLimit(plan: string, settings: Record<string, unknown>): number {
  if (plan !== "free") return Infinity;
  const override = Number(settings.trial_message_limit);
  return Number.isFinite(override) && override > 0 ? override : TRIAL_MESSAGE_LIMIT;
}

/** Compute a trial org's message usage against its cap. Cheap for paid plans. */
export async function getTrialUsage(orgId: string): Promise<TrialUsage> {
  const supabase = createAdminClient();
  const { data: org } = await supabase
    .from("organizations")
    .select("plan, settings")
    .eq("id", orgId)
    .maybeSingle();

  const plan = (org?.plan as string) ?? "free";
  const settings = ((org?.settings as Record<string, unknown> | null) ?? {}) as Record<string, unknown>;

  // A free-plan org is only a *capped trial* if it's a genuine self-serve trial.
  // Managed/comped clients (super admin disabled their billing) and any org
  // explicitly marked exempt are NOT trials and have no message cap.
  const billingDisabled = settings.billing_enabled === false;
  const exempt = settings.trial_exempt === true || billingDisabled;
  const isTrial = plan === "free" && !exempt;
  const limit = isTrial ? planLimit(plan, settings) : Infinity;

  let used = 0;
  if (isTrial) {
    const { count } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId);
    used = count ?? 0;
  }

  const remaining = Number.isFinite(limit) ? Math.max(0, limit - used) : Infinity;
  return { plan, isTrial, limit, used, remaining, reached: isTrial && used >= limit };
}

/**
 * Keep a trial org's AI kill switch in sync with its usage.
 *
 * Over the cap  -> disable AI on every active instance (marking WHY, so we only
 *                  ever re-enable ones WE turned off).
 * Under the cap -> re-enable any instance we previously disabled for the trial
 *                  (e.g. after an upgrade or a plan bump).
 *
 * Called from the once-a-minute holding cron so the n8n AI flow stops within ~1
 * minute of the cap being hit, without any n8n flow changes.
 */
export async function syncTrialAiForOrg(orgId: string, usage?: TrialUsage): Promise<void> {
  const supabase = createAdminClient();
  const u = usage ?? (await getTrialUsage(orgId));

  const { data: instances } = await supabase
    .from("whatsapp_instances")
    .select("id, ultramsg_settings")
    .eq("org_id", orgId);

  for (const inst of instances ?? []) {
    const settings = ((inst.ultramsg_settings as Record<string, unknown> | null) ?? {}) as Record<string, unknown>;
    const aiEnabled = settings.ai_enabled !== false;
    const offForTrial = settings.ai_off_reason === "trial_limit";

    if (u.isTrial && u.reached) {
      // Silence the AI, but only touch instances that aren't already off for
      // this reason (avoid clobbering a manual kill switch the user set).
      if (aiEnabled) {
        await supabase
          .from("whatsapp_instances")
          .update({
            ultramsg_settings: { ...settings, ai_enabled: false, ai_off_reason: "trial_limit" },
            updated_at: new Date().toISOString(),
          })
          .eq("id", inst.id);
      }
    } else if (offForTrial && !aiEnabled) {
      // No longer capped — restore only the instances WE disabled for the trial.
      const next = { ...settings, ai_enabled: true };
      delete (next as Record<string, unknown>).ai_off_reason;
      await supabase
        .from("whatsapp_instances")
        .update({ ultramsg_settings: next, updated_at: new Date().toISOString() })
        .eq("id", inst.id);
    }
  }
}
