'use server'

import { redirect } from 'next/navigation'
import {
  initializeTransaction,
  verifyTransaction,
  fetchCustomer,
  getSubscriptionManageLink,
  disableSubscription,
} from '@/lib/paystack'
import { getCurrentUser } from '@/lib/auth/server'
import { createAdminClient } from '@/lib/supabase/admin'

const TIERS = [
  { conversations: 5000,  monthly: 2500 },
  { conversations: 10000, monthly: 5000 },
  { conversations: 15000, monthly: 7500 },
  { conversations: 20000, monthly: 10000 },
]
const PLATFORM_PRICE = 1500

export async function startPayment(formData: FormData) {
  const user = await getCurrentUser()
  if (!user || !user.orgId) redirect('/auth/login')

  const tierIdx = Math.min(Number(formData.get('tierIdx') ?? 0), TIERS.length - 1)
  const billing = (formData.get('billing') as string) === 'annual' ? 'annual' : 'monthly'

  const tier = TIERS[tierIdx]
  const disc = billing === 'annual' ? 0.8 : 1
  const platformMonthly = Math.round(PLATFORM_PRICE * disc)
  const aiMonthly = Math.round(tier.monthly * disc)
  const totalMonthly = platformMonthly + aiMonthly
  const amountCents = totalMonthly * 100

  const supabase = createAdminClient()

  // Look up the Paystack plan code set by the admin
  const { data: plan } = await supabase
    .from('paystack_plans')
    .select('plan_code')
    .eq('tier_conversations', tier.conversations)
    .eq('billing_period', billing)
    .maybeSingle()

  if (!plan) {
    throw new Error(
      `No subscription plan configured for ${tier.conversations.toLocaleString('en-ZA')} conversations (${billing}). ` +
      `Ask the admin to set it up in the Plans tab.`
    )
  }

  // Cancel any existing active subscription before switching
  const { data: existingSub } = await supabase
    .from('billing_subscriptions')
    .select('id, subscription_code, email_token, tier_conversations, billing_period')
    .eq('org_id', user.orgId)
    .eq('status', 'success')
    .not('subscription_code', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existingSub?.subscription_code && existingSub?.email_token) {
    const isSamePlan =
      existingSub.tier_conversations === tier.conversations &&
      existingSub.billing_period === billing

    if (isSamePlan) {
      // Client should block this but double-check server-side
      throw new Error('You are already subscribed to this plan.')
    }

    try {
      await disableSubscription(existingSub.subscription_code, existingSub.email_token)
      // Mark old subscription as cancelled
      await supabase
        .from('billing_subscriptions')
        .update({ status: 'cancelled' } as never)
        .eq('id', existingSub.id)
    } catch {
      // Non-fatal — continue with new subscription
    }
  }

  const reference = `syncchat_${user.orgId}_${Date.now()}`

  // Remove stale pending attempts
  await supabase
    .from('billing_subscriptions')
    .delete()
    .eq('org_id', user.orgId)
    .eq('status', 'pending')

  await supabase.from('billing_subscriptions').insert({
    org_id: user.orgId,
    user_id: user.userId,
    paystack_reference: reference,
    amount_cents: amountCents,
    billing_period: billing,
    tier_conversations: tier.conversations,
    plan_code: plan.plan_code,
    status: 'pending',
  })

  const result = await initializeTransaction(user.email, amountCents, {
    reference,
    callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/verify`,
    plan: plan.plan_code,
    metadata: {
      org_id: user.orgId,
      user_id: user.userId,
      tier_conversations: tier.conversations,
      billing_period: billing,
    },
  })

  redirect(result.data.authorization_url)
}

export async function confirmPayment(reference: string) {
  const supabase = createAdminClient()

  const result = await verifyTransaction(reference)

  if (result.data.status !== 'success') {
    throw new Error(`Payment ${result.data.status}`)
  }

  const meta = result.data.metadata as {
    org_id?: string
    tier_conversations?: number
    billing_period?: string
  }

  const orgId = meta.org_id
  if (!orgId) throw new Error('Missing org_id in payment metadata')

  const conv = meta.tier_conversations ?? 5000
  const plan = conv >= 20000 ? 'enterprise' : conv >= 10000 ? 'pro' : 'starter'

  // Fetch customer to get subscription_code + email_token
  let subscriptionCode: string | null = null
  let emailToken: string | null = null
  try {
    const customer = await fetchCustomer(result.data.customer.email)
    const activeSub = customer.data.subscriptions?.find(s => s.status === 'active')
    subscriptionCode = activeSub?.subscription_code ?? null
    emailToken = activeSub?.email_token ?? null
  } catch {
    // Non-fatal — can be updated later
  }

  await supabase.from('organizations').update({ plan }).eq('id', orgId)

  await supabase
    .from('billing_subscriptions')
    .update({
      status: 'success',
      paid_at: new Date().toISOString(),
      paystack_data: result.data,
      subscription_code: subscriptionCode,
      email_token: emailToken,
    })
    .eq('paystack_reference', reference)

  return {
    plan,
    amount: result.data.amount,
    email: result.data.customer.email,
  }
}

export async function getManageLink(subscriptionCode: string): Promise<string> {
  const result = await getSubscriptionManageLink(subscriptionCode)
  return result.data.link
}
