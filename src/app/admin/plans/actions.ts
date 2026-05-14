"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export async function savePlan(formData: FormData) {
  const tier_conversations = Number(formData.get("tier_conversations"));
  const billing_period = formData.get("billing_period") as string;
  const plan_code = (formData.get("plan_code") as string).trim();
  const amount_cents = Number(formData.get("amount_cents"));

  const supabase = createAdminClient();

  await supabase
    .from("paystack_plans")
    .upsert(
      { tier_conversations, billing_period, plan_code, amount_cents },
      { onConflict: "tier_conversations,billing_period" }
    );

  revalidatePath("/admin/plans");
}

export async function deletePlan(formData: FormData) {
  const id = formData.get("id") as string;
  const supabase = createAdminClient();
  await supabase.from("paystack_plans").delete().eq("id", id);
  revalidatePath("/admin/plans");
}
