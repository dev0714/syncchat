import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const BASE = "https://api.ultramsg.com";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: inst } = await supabase.from("whatsapp_instances").select("*").eq("id", params.id).single();
  if (!inst) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const res = await fetch(`${BASE}/${inst.instance_id}/instance/qr?token=${inst.token}`, { cache: "no-store" });
    const contentType = res.headers.get("content-type") ?? "image/png";

    if (contentType.includes("image")) {
      const buffer = await res.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      return NextResponse.json({ qrImage: `data:${contentType};base64,${base64}` });
    }

    return NextResponse.json({ qrImage: null });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
