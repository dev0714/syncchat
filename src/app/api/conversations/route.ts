import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/server";

async function resolveOrgId(userId: string, userOrgId: string | null) {
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

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = await resolveOrgId(user.userId, user.orgId);
  if (!orgId) return NextResponse.json({ conversations: [] });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const q = searchParams.get("q")?.trim().toLowerCase() ?? "";

  const supabase = createAdminClient();
  let query = supabase
    .from("conversations")
    .select(`
      *,
      contact:contacts(id, name, phone),
      instance:whatsapp_instances(id, name),
      last_msg:messages(content, created_at, direction)
    `)
    .eq("org_id", orgId)
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false, referencedTable: "last_msg" })
    .limit(1, { referencedTable: "last_msg" });

  if (status && status !== "all") query = query.eq("status", status);

  const { data, error } = await query;

  // If search query, also find conversations that have matching messages
  let matchingConvIds = new Set<string>();
  if (q) {
    const { data: msgMatches } = await supabase
      .from("messages")
      .select("conversation_id")
      .eq("org_id", orgId)
      .ilike("content", `%${q}%`);
    (msgMatches ?? []).forEach((m: { conversation_id: string }) => matchingConvIds.add(m.conversation_id));
  }

  // Merge last_msg into last_message if null
  const conversations = (data ?? []).map((c: Record<string, unknown>) => {
    const lastMsg = Array.isArray(c.last_msg) ? c.last_msg[0] : c.last_msg;
    return {
      ...c,
      last_message: c.last_message ?? lastMsg?.content ?? null,
      last_message_at: c.last_message_at ?? lastMsg?.created_at ?? null,
      last_msg: undefined,
    };
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const filtered = q
    ? conversations.filter((c: Record<string, unknown>) => {
        const contact = c.contact as { name?: string; phone?: string } | null;
        return (
          contact?.name?.toLowerCase()?.includes(q) ||
          contact?.phone?.toLowerCase()?.includes(q) ||
          (c.last_message as string | null)?.toLowerCase()?.includes(q) ||
          matchingConvIds.has(c.id as string)
        );
      })
    : conversations;

  return NextResponse.json({ conversations: filtered, orgId });
}
