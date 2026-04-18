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
  type: "text" | "image" | "video" | "audio" | "document" | "location";
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
  content: string;
  variables?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface N8nFlow {
  id: string;
  org_id: string;
  name: string;
  description?: string;
  n8n_workflow_id: string;
  webhook_url?: string;
  trigger_type: "inbound_message" | "keyword" | "new_contact" | "manual" | "schedule";
  trigger_config?: Record<string, unknown>;
  is_active: boolean;
  last_triggered_at?: string;
  created_at: string;
  updated_at: string;
}

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
