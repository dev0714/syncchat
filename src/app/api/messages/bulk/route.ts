import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { createAdminClient } from "@/lib/supabase/admin";

const BASE = "https://api.ultramsg.com";

interface BulkPayload {
  instanceId: string;
  contacts: { id: string; phone: string; name?: string; email?: string }[];
  template: string; // raw template content with {{var}} placeholders
  variableDefaults: Record<string, string>;
}

function fillTemplate(template: string, contact: BulkPayload["contacts"][0], defaults: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key) => {
    if (key === "name") return contact.name ?? defaults[key] ?? "";
    if (key === "phone") return contact.phone ?? defaults[key] ?? "";
    if (key === "email") return contact.email ?? defaults[key] ?? "";
    return defaults[key] ?? `{{${key}}}`;
  });
}

export async function POST(req: NextRequest) {
  const supabase = createAdminClient();
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body: BulkPayload = await req.json();
  const { instanceId, contacts, template, variableDefaults } = body;

  const { data: inst } = await supabase
    .from("whatsapp_instances")
    .select("*")
    .eq("id", instanceId)
    .single();
  if (!inst) return NextResponse.json({ error: "Instance not found" }, { status: 404 });

  const { data: member } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", currentUser.userId)
    .single();

  const results = { sent: 0, failed: 0, errors: [] as string[] };

  for (const contact of contacts) {
    const message = fillTemplate(template, contact, variableDefaults);
    try {
      const formData = new URLSearchParams({ token: inst.token, to: contact.phone, body: message });
      const res = await fetch(`${BASE}/${inst.instance_id}/messages/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString(),
      });
      const data = await res.json();
      if (data.sent === "true" || data.sent === true) {
        results.sent++;
        // Log to messages table (no conversation context for bulk)
        await supabase.from("messages").insert({
          org_id: member?.org_id,
          conversation_id: (await supabase.from("conversations")
            .select("id")
            .eq("org_id", member?.org_id)
            .eq("contact_id", contact.id)
            .maybeSingle()).data?.id ?? undefined,
          direction: "outbound",
          source: "bulk",
          type: "text",
          content: message,
          status: "sent",
          sent_by: currentUser.userId,
        }).maybeSingle();
      } else {
        results.failed++;
        results.errors.push(`${contact.phone}: ${data.message ?? "unknown error"}`);
      }
    } catch (e) {
      results.failed++;
      results.errors.push(`${contact.phone}: ${String(e)}`);
    }
  }

  return NextResponse.json(results);
}
