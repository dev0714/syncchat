import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculateNextRunAt, fillTemplate, type ScheduledBulkRecurrence, type ScheduledBulkRecipientSnapshot, type ScheduledBulkTemplateSnapshot } from "@/lib/scheduled-bulk";
import { ultraMsg } from "@/lib/ultramsg";

function getScheduleMessageContent(template: ScheduledBulkTemplateSnapshot, recipient: ScheduledBulkRecipientSnapshot, defaults: Record<string, string>): string {
  return fillTemplate(template.content, recipient, defaults);
}

export async function POST(req: NextRequest) {
  const expectedSecret = process.env.CRON_SECRET;
  const providedSecret = req.headers.get("x-cron-secret");

  if (!expectedSecret || providedSecret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const now = new Date();

  const { data: schedules, error } = await supabase
    .from("scheduled_bulk_messages")
    .select("*")
    .eq("status", "scheduled")
    .lte("next_run_at", now.toISOString())
    .order("next_run_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const processed: Array<{ id: string; sent: number; failed: number }> = [];

  for (const schedule of schedules ?? []) {
    const template = schedule.template_snapshot as ScheduledBulkTemplateSnapshot;
    const recipients = (schedule.recipient_snapshot ?? []) as ScheduledBulkRecipientSnapshot[];
    const defaults = (schedule.variable_defaults ?? {}) as Record<string, string>;
    const recurrence = schedule.recurrence as ScheduledBulkRecurrence | null;

    await supabase
      .from("scheduled_bulk_messages")
      .update({ status: "processing", updated_at: new Date().toISOString() })
      .eq("id", schedule.id)
      .eq("status", "scheduled");

    const { data: instance } = await supabase
      .from("whatsapp_instances")
      .select("*")
      .eq("id", schedule.instance_id)
      .single();

    if (!instance) {
      await supabase.from("scheduled_bulk_messages").update({
        status: "failed",
        last_result: { error: "Instance not found" },
        updated_at: new Date().toISOString(),
      }).eq("id", schedule.id);
      processed.push({ id: schedule.id, sent: 0, failed: recipients.length });
      continue;
    }

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const recipient of recipients) {
      const message = getScheduleMessageContent(template, recipient, defaults);

      try {
        const result = await ultraMsg.sendText(instance.instance_id, {
          token: instance.token,
          to: recipient.phone,
          body: message,
        });

        const status = String(result.sent) === "true" ? "sent" : "failed";
        if (status === "sent") {
          sent += 1;
        } else {
          failed += 1;
          errors.push(`${recipient.phone}: UltraMsg returned ${JSON.stringify(result)}`);
        }

        const { data: conversation } = await supabase
          .from("conversations")
          .select("id")
          .eq("org_id", schedule.org_id)
          .eq("contact_id", recipient.id)
          .maybeSingle();

        if (conversation?.id) {
          await supabase.from("messages").insert({
            conversation_id: conversation.id,
            org_id: schedule.org_id,
            direction: "outbound",
            source: "scheduled_bulk",
            type: "text",
            content: message,
            status,
            sent_by: schedule.created_by ?? null,
            ultramsg_id: result.id ?? null,
          });

          await supabase.from("conversations").update({
            last_message: message,
            last_message_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }).eq("id", conversation.id);
        }
      } catch (err) {
        failed += 1;
        errors.push(`${recipient.phone}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    const baseRun = new Date(schedule.next_run_at);
    const nextRunAt = schedule.schedule_type === "recurring" && recurrence
      ? calculateNextRunAt(baseRun, recurrence)
      : null;

    await supabase.from("scheduled_bulk_messages").update({
      status: schedule.schedule_type === "recurring"
        ? "scheduled"
        : sent > 0
          ? "completed"
          : "failed",
      last_run_at: new Date().toISOString(),
      next_run_at: nextRunAt?.toISOString() ?? schedule.next_run_at,
      last_result: { sent, failed, errors },
      updated_at: new Date().toISOString(),
    }).eq("id", schedule.id);

    processed.push({ id: schedule.id, sent, failed });
  }

  return NextResponse.json({ success: true, processed });
}
