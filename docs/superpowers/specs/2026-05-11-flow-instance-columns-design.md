# Flow Instance Columns Design

## Goal
Make SyncChat flows use real database columns instead of the `trigger_config` JSON blob for the WhatsApp flow fields that matter now.

## Scope
This phase covers:
- linking each flow to one WhatsApp instance with a real column
- storing flow basics and AI prompt fields as first-class columns
- removing `Webhook URL` and `Workflow ID` from the flow setup UI
- preserving existing flow data during migration

This phase does not cover tools. Tools will be handled later in a separate update.

## Data Model
Update `syncchat.n8n_flows` to add these columns:
- `instance_id uuid not null`
- `trigger_keyword text`
- `prompt_role text`
- `prompt_guardrails text`
- `prompt_tone text`
- `prompt_context text`

Keep the existing columns that are still useful:
- `id`
- `org_id`
- `name`
- `description`
- `trigger_type`
- `is_active`
- `last_triggered_at`
- `created_at`
- `updated_at`

Remove the following from the flow model for this phase:
- `webhook_url`
- `n8n_workflow_id`
- `trigger_config`

The new `instance_id` column should be a foreign key to `syncchat.whatsapp_instances.id`.

## Flow Behavior
The flow should be linked to the WhatsApp instance directly through `n8n_flows.instance_id`.
This link is required.

Runtime matching still works the same way:
- n8n receives an inbound message
- it matches the incoming WhatsApp `to` number to `syncchat.whatsapp_instances.phone_number`
- it uses that instance row to find the linked org
- it loads the flow rows for that org

The database link exists so flows are easy to query and join.
The phone number remains the runtime routing key.

## UI Changes
Update the Flows modal so the setup step only asks for:
- Flow name
- Description
- WhatsApp instance
- Trigger type
- Trigger keyword, when relevant
- AI prompt fields

Remove from the UI:
- `Webhook URL`
- `Workflow ID`
- `Tools` tab for this phase

The instance selector becomes required.

## API Changes
Update the flow create and update routes so they read and write the new flat columns directly.

Expected request payload:
- `name`
- `description`
- `instance_id`
- `trigger_type`
- `trigger_keyword`
- `prompt_role`
- `prompt_guardrails`
- `prompt_tone`
- `prompt_context`

The API should no longer rely on `trigger_config` for these fields.

## Migration Strategy
Create a database migration that:
- adds the new columns
- backfills them from the current `trigger_config` JSON where possible
- keeps existing rows usable after deployment
- drops `webhook_url`, `n8n_workflow_id`, and `trigger_config` only after the app is confirmed to read the new columns

Because the app already has live data, the migration should preserve:
- existing flow names and descriptions
- the selected instance link if it exists in the current JSON
- prompt text already saved in the current JSON

## Validation
After implementation:
- the flow form should save and reload without the old JSON blob
- the instance should display as a real linked field
- the WhatsApp flow should still work with the existing n8n runtime matching
- the page should not require `Webhook URL` or `Workflow ID`

## Out of Scope
- tools storage and editing
- webhook management for n8n
- workflow ID management
