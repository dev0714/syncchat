import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Round-robin assignment of an escalated conversation to an available agent.
 *
 * Agents are active org_members with role 'agent' or 'org_admin' who have
 * toggled themselves available. We pick the one assigned least recently
 * (last_assigned_at asc, nulls first) for a fair rotation, then stamp the
 * conversation and the agent.
 *
 * Best-effort: never throws. If no agent is available the conversation is left
 * unassigned (queued) — holding messages still run and an agent can claim it.
 *
 * Returns the assigned agent's user_id, or null if none was available.
 */
export async function assignNextAvailableAgent(
  orgId: string,
  conversationId: string,
): Promise<string | null> {
  if (!orgId || !conversationId) return null;
  const supabase = createAdminClient();

  try {
    const { data: agent } = await supabase
      .from("org_members")
      .select("id, user_id, last_assigned_at")
      .eq("org_id", orgId)
      .eq("is_active", true)
      .eq("is_available", true)
      .in("role", ["agent", "org_admin"])
      .order("last_assigned_at", { ascending: true, nullsFirst: true })
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!agent?.user_id) return null;

    const nowIso = new Date().toISOString();
    await supabase
      .from("conversations")
      .update({ assigned_to: agent.user_id, assigned_at: nowIso, updated_at: nowIso })
      .eq("id", conversationId);
    await supabase
      .from("org_members")
      .update({ last_assigned_at: nowIso })
      .eq("id", agent.id);

    return agent.user_id;
  } catch {
    return null;
  }
}
