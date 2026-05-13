-- Registration profile columns on org_settings
-- Stores individual fields collected during the 4-step sign-up flow.
-- account_type  : 'company' | 'personal'
-- phone         : used by both company and personal
-- address_*     : SA address fields (used by both)
-- company_*     : company-only fields
-- vat_number    : company optional
-- website       : company optional
-- id_number     : personal only
-- hear_about    : personal only
-- use_case      : personal only

ALTER TABLE syncchat.org_settings
  ADD COLUMN IF NOT EXISTS account_type        TEXT,
  ADD COLUMN IF NOT EXISTS phone               TEXT,
  ADD COLUMN IF NOT EXISTS industry            TEXT,
  ADD COLUMN IF NOT EXISTS company_size        TEXT,
  ADD COLUMN IF NOT EXISTS website             TEXT,
  ADD COLUMN IF NOT EXISTS vat_number          TEXT,
  ADD COLUMN IF NOT EXISTS id_number           TEXT,
  ADD COLUMN IF NOT EXISTS hear_about          TEXT,
  ADD COLUMN IF NOT EXISTS use_case            TEXT,
  ADD COLUMN IF NOT EXISTS address_unit        TEXT,
  ADD COLUMN IF NOT EXISTS address_street      TEXT,
  ADD COLUMN IF NOT EXISTS address_suburb      TEXT,
  ADD COLUMN IF NOT EXISTS address_city        TEXT,
  ADD COLUMN IF NOT EXISTS address_postal_code TEXT,
  ADD COLUMN IF NOT EXISTS address_province    TEXT;
