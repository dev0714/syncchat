# Registration Form Expansion — Design Spec
**Date:** 2026-05-13
**Project:** SyncChat

---

## Overview

Expand the current 2-step registration (Account → Org name) into a 4-step flow that collects account type, detailed company or personal information including South African address fields, and requires explicit Terms & Conditions acceptance before account creation.

---

## Step Structure

**4 steps total: Account → Type → Details → Confirm**

| Step | Name | Content |
|------|------|---------|
| 1 | Account | Full name, email, password |
| 2 | Type | Company or Individual selector (large cards) |
| 3 | Details | Conditional form based on type selection |
| 4 | Confirm | Summary review + T&C checkbox + Create account |

Step indicator (numbered bubbles + dividers) updates as user progresses. Back navigation is available on all steps after step 1.

---

## Step 3 — Company Fields

All fields collected when account type = Company:

| Field | Type | Required |
|-------|------|----------|
| Company name | Text input | Yes (also becomes org name) |
| Industry | Dropdown | Yes |
| Company size | Dropdown | Yes |
| Business phone | Text input | Yes |
| Company website | Text input | No |
| VAT / Registration number | Text input | No |
| Business address — Unit / Building | Text input | No |
| Business address — Street number & name | Text input | Yes |
| Business address — Suburb | Text input | Yes |
| Business address — City / Town | Text input | Yes |
| Business address — Postal code | Text input | Yes |
| Business address — Province | Dropdown (9 SA provinces) | Yes |

**Industry options:** Technology, E-commerce, Healthcare, Finance, Real Estate, Retail, Marketing, Other

**Company size options:** 1–10, 11–50, 51–200, 201–1000, 1000+

**Province options:** Eastern Cape, Free State, Gauteng, KwaZulu-Natal, Limpopo, Mpumalanga, Northern Cape, North West, Western Cape

---

## Step 3 — Personal (Individual) Fields

All fields collected when account type = Individual:

| Field | Type | Required |
|-------|------|----------|
| Phone number | Text input | Yes |
| ID number | Text input | Yes |
| How did you hear about us? | Dropdown | Yes |
| What will you use SyncChat for? | Dropdown | Yes |
| Home address — Unit / Flat number | Text input | No |
| Home address — Street number & name | Text input | Yes |
| Home address — Suburb | Text input | Yes |
| Home address — City / Town | Text input | Yes |
| Home address — Postal code | Text input | Yes |
| Home address — Province | Dropdown (9 SA provinces) | Yes |

**Hear about us options:** Google, Social media, Friend / referral, Other

**Use case options:** Personal projects, Freelancing, Side business, Other

---

## Step 4 — Confirm

- Summary table showing all details entered across steps 1–3
- Scrollable Terms & Conditions box (inline, not a modal)
- Checkbox: "I have read and agree to the Terms & Conditions and Privacy Policy"
- Create account button is **disabled** until checkbox is ticked
- Edit button navigates back to step 3

---

## Terms & Conditions

Stored as a static page at `/legal/terms` and also rendered inline in the confirm step. Content covers:

1. **Service** — SyncChat is a WhatsApp messaging platform powered by UltraMsg
2. **Acceptable use** — No spam, bulk unsolicited messages, illegal content, or WhatsApp ToS violations; violations result in immediate account suspension
3. **Trial period** — 14-day free trial; paid subscription required after trial ends
4. **Subscriptions & billing** — Billed in ZAR via Paystack; cancellations take effect at end of billing period; no partial refunds
5. **Data & privacy** — Message metadata and account information stored to operate service; data not sold; message content stored temporarily for delivery
6. **WhatsApp compliance** — User is responsible for compliance with WhatsApp Business Policy and applicable laws including POPIA (South Africa)
7. **Limitation of liability** — SyncChat not liable for message delivery failures, WhatsApp interruptions, or losses from policy-driven suspension
8. **Governing law** — Laws of the Republic of South Africa

---

## Data Storage

Extra fields are stored in the `org_settings` JSONB column (`registration_data`) on the organization's settings row. This avoids schema migrations for the extended fields.

```json
{
  "account_type": "company",
  "industry": "Technology",
  "company_size": "11–50",
  "phone": "+27110000000",
  "website": "https://acme.com",
  "vat": "4110203456",
  "address": {
    "unit": "Unit 2",
    "street": "123 Main Street",
    "suburb": "Sandton",
    "city": "Johannesburg",
    "postal_code": "2196",
    "province": "Gauteng"
  }
}
```

For Individual accounts the same structure applies with `account_type: "personal"` and personal-specific fields (id_number, hear_about, use_case) in place of company fields.

---

## API Changes

`POST /api/auth/register` — extended payload:

```ts
{
  name: string;
  email: string;
  password: string;
  orgName: string;
  accountType: "company" | "personal";
  registrationData: Record<string, unknown>; // all extra fields
  agreedToTerms: boolean; // must be true
}
```

The route validates `agreedToTerms === true` and rejects if false. `registrationData` is written to `org_settings.registration_data` after the org is created.

---

## Frontend Architecture

**File:** `src/app/auth/register/page.tsx` — rewrite as 4-step client component

- State: `step: 1 | 2 | 3 | 4`, `accountType: "company" | "personal" | null`, `form: FormState`, `agreedToTerms: boolean`, `loading`, `error`
- Step indicator: 4 bubbles, updates as step advances
- Step 3 renders `<CompanyFields>` or `<PersonalFields>` sub-components based on `accountType`
- Step 4 renders `<ConfirmStep>` with summary, T&C box, and checkbox
- Single `handleSubmit` called only on step 4 form submit
- On success: `router.replace("/dashboard")`

**Sub-components (same file or colocated):**
- `StepIndicator` — renders numbered bubbles
- `CompanyFields` — all company form fields
- `PersonalFields` — all personal form fields
- `AddressFields` — reused by both, takes a label prop ("Business address" / "Home address")
- `ConfirmStep` — summary table + T&C box + checkbox

---

## Terms & Conditions Page

**File:** `src/app/legal/terms/page.tsx` — static server component rendering the full T&C text. Linked from the checkbox in step 4 (opens in new tab). Also accessible from the marketing site footer.

---

## Existing Code Impact

- `src/app/auth/register/page.tsx` — full rewrite (currently 2-step)
- `src/app/api/auth/register/route.ts` — extend to accept and store new fields; add `agreedToTerms` validation
- `src/app/legal/terms/page.tsx` — new file
- No database migrations required — extra fields go into existing `org_settings.registration_data` JSONB

---

## Out of Scope

- No changes to login flow
- No changes to org settings UI to display registration data (can be added later)
- No email verification added in this iteration
