# Plan — Wire AI Flow Tools into the n8n Workflow

**Date:** 2026-06-26
**Branch:** `claude/tool-selection-cmxzbm`
**Goal:** Make the 9 tools a user toggles in the Flow builder actually usable by the
n8n AI Agent at runtime.

---

## Decisions (locked)

1. **Static superset, prompt-gated.** All 9 tools are built as nodes in the single
   workflow (`n8n/SyncChat_Group1.json`) and permanently connected to the AI Agent.
   Which tools the agent may use is controlled by the **system message**, rebuilt per
   message from the flow's `prompt_tools`. (n8n cannot add/remove tool connections per
   execution, so gating must be prompt-driven.)
2. **HTTP-webhook stubs for data-less tools.** `order_lookup`, `inventory_check`,
   `booking_calendar` call a customer-supplied endpoint (like `custom_webhook`). No new
   SyncChat tables.

---

## Current state (the gaps)

- **Inbound runtime path drops the tools.** `src/app/api/webhook/[instanceId]/route.ts`
  forwards only `prompt_role/guardrails/tone/context` to n8n — not `prompt_tools`, and
  not `conversation_id` / `contact_id`. (Only the *manual* trigger endpoints forward
  `prompt_tools`.)
- **The workflow has no tool wiring.** The AI Agent has only `ai_languageModel` +
  `ai_memory` connections. The existing Supabase "Lookup" nodes are orphaned
  platform-support tools, unconnected to the agent.
- **The template reads the wrong payload shape.** The AI Agent text is
  `={{ $('Whatsapp').item.json.body.data.body }}` (raw UltraMsg), and its system message
  is hardcoded. It does not consume SyncChat's forwarded `{ phone, content, flow:{…} }`
  payload, so per-flow prompt config is ignored today.

---

## Tool → implementation map

All tool nodes attach to the AI Agent via `ai_tool`. Per-flow config (URL/secret/enabled)
is read from the forwarded payload by expression.

| Tool | n8n node type | Target / behaviour |
|------|---------------|--------------------|
| 🌐 `website_check` | `toolHttpRequest` | GET `config.url`; agent reads page text |
| 🔗 `custom_webhook` | `toolHttpRequest` | `config.url` + `Authorization: Bearer config.secret` |
| 📦 `order_lookup` | `toolHttpRequest` | GET/POST `config.endpoint` (customer system) |
| 🏷️ `inventory_check` | `toolHttpRequest` | GET/POST `config.endpoint` (customer system) |
| 📅 `booking_calendar` | `toolHttpRequest` | POST `config.endpoint` (customer system) |
| 👤 `contact_crm` | Supabase tool (`supabaseApi`) | read/update `syncchat.contacts` by phone/org |
| 🙋 `escalate_human` | Supabase tool | set `conversations.status = 'pending'` for the conversation |
| 📋 `send_template` | Supabase tool + UltraMsg `toolHttpRequest` | look up `message_templates`, send via UltraMsg |
| 🖼️ `send_media` | UltraMsg `toolHttpRequest` | send image/document via UltraMsg media API |

Data-backed tools (contact_crm, escalate_human, send_template) need
`conversation_id` / `contact_id` / `org_id` in the payload — hence the webhook change below.

---

## Work breakdown

### Phase 1 — Carry the tools through the runtime path (code)
**File:** `src/app/api/webhook/[instanceId]/route.ts`
- Add `prompt_tools` to the `n8n_flows` select.
- Add `conversation_id`, `contact_id` to the forwarded body.
- Add `prompt_tools` to the forwarded `flow` object.

Acceptance: a live inbound message forwards a payload containing `flow.prompt_tools`
(array of `{id, enabled, config}`) plus `conversation_id`/`contact_id`.

### Phase 2 — Add endpoint config to the stub tools (UI)
**File:** `src/components/dashboard/FlowForm.tsx`
- Add a `configFields` entry (`endpoint` URL, optional `secret`) to `order_lookup`,
  `inventory_check`, `booking_calendar` so each flow can point them at a customer system.
- No type changes needed (`FlowTool.config` is already `Record<string,string>`).

Acceptance: toggling those tools reveals an endpoint field; value persists in
`prompt_tools[].config`.

### Phase 3 — Rebuild the n8n workflow (`n8n/SyncChat_Group1.json`)
1. **Input normalisation.** Add a Set/Code node that reads SyncChat's forwarded payload
   (`phone`, `content`, `flow`, `conversation_id`, …) so downstream nodes have one shape.
   Point the AI Agent `text` at the normalised `content`.
2. **Dynamic system message.** Build the agent system message from
   `flow.prompt_role/guardrails/tone/context` + a generated "Tools you may use" section
   listing **only** `prompt_tools` where `enabled === true`. Disabled tools are omitted so
   the agent won't call them (prompt gating).
3. **Add the 9 tool nodes** per the map above, each connected `ai_tool → AI Agent`, with
   URLs/secrets pulled from the matching `prompt_tools[].config` via expression + a
   `$fromAI()` arg for agent-chosen inputs (e.g. order id, search text).
4. Keep existing Save Inbound / Save Outbound / UltraMsg reply path intact.

Acceptance: importing the workflow, the AI Agent shows 9 connected tools; with a flow that
enables only e.g. `website_check` + `escalate_human`, the system message lists just those
two.

### Phase 4 — Verify end-to-end
- Unit-ish: assert the webhook payload now includes `prompt_tools` (extend existing route
  patterns / add a focused test if a harness exists).
- Manual: drive a message through n8n (test webhook) and confirm the agent invokes an
  enabled tool and ignores a disabled one.
- `npm run build` + `npm run lint` clean.

---

## Open considerations
- **Secrets in payload.** `custom_webhook.secret` is forwarded to the org's own n8n —
  acceptable (their instance), but note it in passing.
- **send_media / send_template** depend on UltraMsg token + instance — read from the
  instance record already available to n8n, or pass `instance_id` (already forwarded).
- **Notification on escalate_human.** v1 just flips conversation status to `pending`; a
  team notification (email/webhook) can be a follow-up.
- This workflow doubles as the platform's own support assistant today. Confirm whether we
  fork a customer-facing template vs. repurpose this file before Phase 3 edits land.

---

## Suggested order
Phase 1 → Phase 2 (small, independent code/UI) → Phase 3 (the workflow, the bulk of it) →
Phase 4 (verify). Phases 1–2 are safe to ship on their own; Phase 3 is the heavy lift.
