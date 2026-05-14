import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { Building2, Smartphone, CreditCard, Shield } from "lucide-react";
import PlansClient from "./PlansClient";

export type PaystackPlan = {
  id: string;
  tier_conversations: number;
  billing_period: string;
  plan_code: string;
  amount_cents: number;
  created_at: string;
};

export default async function AdminPlansPage() {
  const supabase = createAdminClient();
  const { data: plans } = await supabase
    .from("paystack_plans")
    .select("*")
    .order("tier_conversations", { ascending: true });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
          <Shield className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Super Admin</h1>
          <p className="text-slate-500 text-sm">Platform-wide overview and management</p>
        </div>
      </div>

      {/* Admin nav */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        <Link href="/admin" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors">
          <Building2 className="w-4 h-4" /> Organizations
        </Link>
        <Link href="/admin/instances" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors">
          <Smartphone className="w-4 h-4" /> Assign Instances
        </Link>
        <Link href="/admin/plans" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-white text-slate-900 shadow-sm">
          <CreditCard className="w-4 h-4" /> Subscription Plans
        </Link>
      </div>

      <PlansClient plans={(plans ?? []) as PaystackPlan[]} />
    </div>
  );
}
