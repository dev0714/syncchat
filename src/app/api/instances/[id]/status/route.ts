import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const BASE = "https://api.ultramsg.com";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: inst } = await supabase.from("whatsapp_instances").select("*").eq("id", params.id).single();
  if (!inst) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const res = await fetch(`${BASE}/${inst.instance_id}/instance/status?token=${inst.token}`, { cache: "no-store" });
    const data = await res.json();

    // Response shape: { status: { accountStatus: { status: "qr"|"authenticated"|..., substatus: "..." } } }
    const rawStatus = data?.status?.accountStatus?.status ?? data?.accountStatus ?? data?.status;

    let status: string;
    if (rawStatus === "authenticated") status = "connected";
    else if (rawStatus === "qr") status = "qr_required";
    else if (rawStatus === "loading") status = "loading";
    else status = "disconnected";

    await supabase.from("whatsapp_instances").update({
      status,
      updated_at: new Date().toISOString(),
    }).eq("id", params.id);

    return NextResponse.json({ status });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
