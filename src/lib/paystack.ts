// lib/paystack.ts
const BASE     = process.env.PAYSTACK_FN_BASE!
const CRED_ID  = process.env.PAYSTACK_CREDENTIAL_ID!
const CRED_KEY = process.env.PAYSTACK_CREDENTIAL_KEY!

const headers = {
  'x-credential-id':  CRED_ID,
  'x-credential-key': CRED_KEY,
  'Content-Type': 'application/json',
}

async function call<T>(
  fn: string,
  action: string,
  params?: Record<string, string | number>,
  body?: unknown
): Promise<T> {
  const url = new URL(`${BASE}/${fn}`)
  url.searchParams.set('action', action)
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== '' && v != null) url.searchParams.set(k, String(v))
    }
  }
  const res = await fetch(url.toString(), {
    method: body ? 'POST' : 'GET',
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
    cache: 'no-store',
  })
  const data = await res.json() as T
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `Paystack ${res.status}`)
  return data
}

// ── Transactions ──────────────────────────────────────────────────────────────

export function initializeTransaction(
  email: string,
  amountCents: number,
  opts?: { reference?: string; callback_url?: string; currency?: string; metadata?: unknown; plan?: string }
) {
  return call<{ data: { authorization_url: string; access_code: string; reference: string } }>(
    'paystack-transaction', 'initialize', undefined,
    { email, amount: amountCents, currency: 'ZAR', ...opts }
  )
}

export function verifyTransaction(reference: string) {
  return call<{
    data: {
      status: 'success' | 'failed' | 'abandoned' | 'pending'
      amount: number
      currency: string
      reference: string
      customer: { email: string }
      metadata: Record<string, unknown>
      authorization: { authorization_code: string; last4: string; card_type: string }
    }
  }>('paystack-transaction', 'verify', { reference })
}

export function chargeAuthorization(email: string, amountCents: number, authorization_code: string) {
  return call('paystack-transaction', 'charge_authorization', undefined,
    { email, amount: amountCents, authorization_code }
  )
}

export function listTransactions(opts?: { page?: number; perPage?: number; status?: string }) {
  return call('paystack-transaction', 'list', opts as Record<string, string>)
}

// ── Customers ─────────────────────────────────────────────────────────────────

export function createCustomer(email: string, opts?: { first_name?: string; last_name?: string; phone?: string }) {
  return call<{ data: { id: number; customer_code: string; email: string } }>(
    'paystack-customer', 'create', undefined, { email, ...opts }
  )
}

export function fetchCustomer(identifier: string) {
  return call<{
    data: {
      id: number
      customer_code: string
      email: string
      subscriptions: Array<{
        subscription_code: string
        email_token: string
        status: 'active' | 'non-renewing' | 'attention' | 'completed' | 'cancelled'
        next_payment_date: string
        plan: { plan_code: string; name: string; interval: string; amount: number }
      }>
    }
  }>('paystack-customer', 'fetch', { identifier })
}

export function updateCustomer(code: string, fields: { first_name?: string; last_name?: string; phone?: string }) {
  return call('paystack-customer', 'update', { code }, fields)
}

// ── Plans & Subscriptions ─────────────────────────────────────────────────────

export function createPlan(name: string, interval: 'daily' | 'weekly' | 'monthly' | 'annually', amountCents: number) {
  return call<{ data: { plan_code: string } }>(
    'paystack-plan', 'create', undefined, { name, interval, amount: amountCents, currency: 'ZAR' }
  )
}

export function createSubscription(customer: string, plan: string, authorization?: string) {
  return call<{ data: { subscription_code: string; email_token: string } }>(
    'paystack-plan', 'sub_create', undefined,
    { customer, plan, ...(authorization ? { authorization } : {}) }
  )
}

export function fetchSubscription(id: string) {
  return call('paystack-plan', 'sub_fetch', { id })
}

export function disableSubscription(code: string, token: string) {
  return call('paystack-plan', 'sub_disable', undefined, { code, token })
}

export function getSubscriptionManageLink(id: string) {
  return call<{ data: { link: string } }>('paystack-plan', 'sub_manage_link', { id })
}

// ── Transfers ─────────────────────────────────────────────────────────────────

export function createRecipient(name: string, account_number: string, bank_code: string, currency = 'ZAR') {
  return call<{ data: { recipient_code: string } }>(
    'paystack-transfer', 'recipient_create', undefined,
    { type: 'nuban', name, account_number, bank_code, currency }
  )
}

export function initiateTransfer(amountCents: number, recipient: string, reason?: string) {
  return call<{ data: { transfer_code: string; status: string } }>(
    'paystack-transfer', 'initiate', undefined,
    { source: 'balance', amount: amountCents, recipient, ...(reason ? { reason } : {}) }
  )
}

// ── Refunds ───────────────────────────────────────────────────────────────────

export function createRefund(transaction: string, amountCents?: number) {
  return call('paystack-refund', 'create', undefined,
    { transaction, ...(amountCents ? { amount: amountCents } : {}) }
  )
}

// ── Misc ──────────────────────────────────────────────────────────────────────

export function listBanks(country = 'south africa') {
  return call<{ data: { name: string; code: string; slug: string }[] }>(
    'paystack-misc', 'list_banks', { country }
  )
}

export function resolveAccount(account_number: string, bank_code: string) {
  return call<{ data: { account_number: string; account_name: string } }>(
    'paystack-misc', 'resolve_account', { account_number, bank_code }
  )
}
