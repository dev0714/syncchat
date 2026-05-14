export type UserRole = "super_admin" | "org_admin" | "agent" | "viewer";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  plan: "free" | "starter" | "pro" | "enterprise";
  is_active: boolean;
  created_at: string;
  settings?: Record<string, unknown>;
}

export interface UltraMsgInstanceSettings {
  sendDelay: number;
  sendDelayMax: number;
  webhook_url: string;
  webhook_message_received: boolean;
  webhook_message_create: boolean;
  webhook_message_ack: boolean;
  webhook_message_download_media: boolean;
}

export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
}

export interface OrgMember {
  id: string;
  org_id: string;
  user_id: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  profile?: Profile;
  organization?: Organization;
  user?: {
    name?: string;
    email?: string;
    role?: UserRole | null;
  };
}

export interface WhatsAppInstance {
  id: string;
  org_id: string;
  name: string;
  instance_id: string; // UltraMsg instance ID
  token: string; // UltraMsg token
  phone_number?: string;
  status: "connected" | "disconnected" | "qr_required" | "loading";
  webhook_url?: string;
  ultramsg_settings?: UltraMsgInstanceSettings | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  org_id: string;
  phone: string;
  name?: string;
  email?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  org_id: string;
  instance_id: string;
  contact_id: string;
  assigned_to?: string;
  status: "open" | "closed" | "pending" | "bot";
  last_message?: string;
  last_message_at?: string;
  unread_count: number;
  created_at: string;
  updated_at: string;
  contact?: Contact;
  instance?: WhatsAppInstance;
  assigned_agent?: Profile;
}

export interface Message {
  id: string;
  conversation_id: string;
  org_id: string;
  direction: "inbound" | "outbound";
  source: "direct" | "bulk" | "scheduled_bulk" | "system";
  type: "text" | "image" | "video" | "audio" | "document" | "location" | "vcard" | "contact" | "reaction";
  content: string;
  media_url?: string;
  status: "sending" | "sent" | "delivered" | "read" | "failed";
  sent_by?: string;
  ultramsg_id?: string;
  created_at: string;
}

export interface MessageTemplate {
  id: string;
  org_id: string;
  name: string;
  category: "marketing" | "utility" | "authentication" | "custom";
  msg_type: string;
  content: string;
  variables?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ScheduledBulkRecipientSnapshot {
  id: string;
  phone: string;
  name?: string;
  email?: string;
  tags?: string[];
}

export interface ScheduledBulkTemplateSnapshot {
  name: string;
  content: string;
  variables: string[];
}

export interface ScheduledBulkMessage {
  id: string;
  org_id: string;
  template_id?: string;
  instance_id: string;
  name: string;
  schedule_type: "one_time" | "recurring";
  status: "scheduled" | "paused" | "processing" | "completed" | "failed" | "cancelled";
  timezone: string;
  scheduled_for?: string;
  next_run_at: string;
  recurrence?: Record<string, unknown>;
  template_snapshot: ScheduledBulkTemplateSnapshot;
  recipient_snapshot: ScheduledBulkRecipientSnapshot[];
  variable_defaults: Record<string, string>;
  last_run_at?: string;
  last_result?: Record<string, unknown>;
  created_by?: string;
  created_at: string;
  updated_at: string;
  template?: MessageTemplate;
  instance?: WhatsAppInstance;
}

export interface N8nFlow {
  id: string;
  org_id: string;
  instance_id?: string;
  name: string;
  description?: string;
  trigger_type: "inbound_message" | "keyword" | "new_contact" | "manual" | "schedule";
  trigger_keyword?: string;
  prompt_role?: string;
  prompt_guardrails?: string;
  prompt_tone?: string;
  prompt_context?: string;
  is_active: boolean;
  last_triggered_at?: string;
  created_at: string;
  updated_at: string;
}

export interface SAAddress {
  unit?: string;
  street: string;
  suburb: string;
  city: string;
  postal_code: string;
  province: "Eastern Cape" | "Free State" | "Gauteng" | "KwaZulu-Natal" | "Limpopo" | "Mpumalanga" | "Northern Cape" | "North West" | "Western Cape";
}

export interface CompanyRegistrationData {
  account_type: "company";
  company_name: string;
  industry: "Technology" | "E-commerce" | "Healthcare" | "Finance" | "Real Estate" | "Retail" | "Marketing" | "Other";
  company_size: "1–10" | "11–50" | "51–200" | "201–1000" | "1000+";
  phone: string;
  website?: string;
  vat?: string;
  address: SAAddress;
}

export interface PersonalRegistrationData {
  account_type: "personal";
  phone: string;
  id_number: string;
  hear_about: "Google" | "Social media" | "Friend / referral" | "Other";
  use_case: "Personal projects" | "Freelancing" | "Side business" | "Other";
  address: SAAddress;
}

export type RegistrationData = CompanyRegistrationData | PersonalRegistrationData;

export interface OrgSettings {
  id: string;
  org_id: string;
  auto_reply_enabled: boolean;
  auto_reply_message?: string;
  business_hours_enabled: boolean;
  business_hours?: {
    [day: string]: { open: string; close: string; enabled: boolean };
  };
  away_message?: string;
  n8n_base_url?: string;
  n8n_api_key?: string;
  // Registration profile fields (populated on sign-up)
  account_type?: "company" | "personal";
  phone?: string;
  industry?: string;
  company_size?: string;
  website?: string;
  vat_number?: string;
  id_number?: string;
  hear_about?: string;
  use_case?: string;
  address_unit?: string;
  address_street?: string;
  address_suburb?: string;
  address_city?: string;
  address_postal_code?: string;
  address_province?: string;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  total_messages: number;
  messages_today: number;
  active_conversations: number;
  total_contacts: number;
  connected_instances: number;
  messages_sent: number;
  messages_received: number;
}
