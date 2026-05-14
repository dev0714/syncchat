import { getCurrentUser } from "@/lib/auth/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import BillingClient from "./BillingClient";

export type Invoice = {
  id: string;
  paystack_reference: string;
  amount_cents: number;
  billing_period: string;
  tier_conversations: number;
  status: string;
  created_at: string;
  paid_at: string | null;
};

export type ActiveSubscription = {
  subscription_code: string;
  plan_code: string;
  tier_conversations: number;
  billing_period: string;
} | null;

export default async function BillingPage() {
  const user = await getCurrentUser();
  if (!user || !user.orgId) redirect("/auth/login");

  const supabase = createAdminClient();

  const [{ data: org }, { data: invoices }] = await Promise.all([
    supabase.from("organizations").select("plan, trial_ends_at").eq("id", user.orgId).single(),
    supabase
      .from("billing_subscriptions")
      .select("id, paystack_reference, amount_cents, billing_period, tier_conversations, status, created_at, paid_at, subscription_code, plan_code")
      .eq("org_id", user.orgId)
      .in("status", ["success", "failed"])
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  // Find the latest active subscription
  const activeSub = (invoices as (Invoice & { subscription_code?: string; plan_code?: string })[]).find(
    (i) => i.status === "success" && i.subscription_code
  );

  const activeSubscription: ActiveSubscription = activeSub
    ? {
        subscription_code: activeSub.subscription_code,
        plan_code: activeSub.plan_code ?? "",
        tier_conversations: activeSub.tier_conversations,
        billing_period: activeSub.billing_period,
      }
    : null;

  const trialEndsAt = (org as { trial_ends_at?: string | null } | null)?.trial_ends_at ?? null
  const now = new Date()
  const trialEnd = trialEndsAt ? new Date(trialEndsAt) : null
  const trialDaysLeft = trialEnd ? Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : null
  const trialExpired = org?.plan === "free" && trialEnd !== null && trialEnd < now

  return (
    <BillingClient
      currentPlan={org?.plan ?? "free"}
      invoices={(invoices ?? []) as Invoice[]}
      activeSubscription={activeSubscription}
      trialDaysLeft={trialDaysLeft}
      trialExpired={trialExpired}
    />
  );
}
