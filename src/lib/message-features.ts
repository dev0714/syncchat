export type UltraMsgMessageFeature =
  | "text"
  | "image"
  | "audio"
  | "voice"
  | "video"
  | "document"
  | "location"
  | "contact"
  | "reaction";

type FeatureFieldType = "text" | "textarea" | "number";

export interface FeatureField {
  key: string;
  label: string;
  placeholder?: string;
  help?: string;
  type?: FeatureFieldType;
  required?: boolean;
}

export interface FeatureDefinition {
  type: UltraMsgMessageFeature;
  label: string;
  description: string;
  endpoint: string;
  sendLabel: string;
  fields: FeatureField[];
}

export const MESSAGE_FEATURES: FeatureDefinition[] = [
  {
    type: "text",
    label: "Text",
    description: "Send a regular WhatsApp text message.",
    endpoint: "messages/chat",
    sendLabel: "Send Text",
    fields: [
      { key: "to", label: "Recipient", placeholder: "+14155552671", help: "Phone number or chat ID.", required: true },
      { key: "body", label: "Message", placeholder: "Hello, how can I help you?", type: "textarea", required: true },
    ],
  },
  {
    type: "image",
    label: "Image",
    description: "Send an image with an optional caption.",
    endpoint: "messages/image",
    sendLabel: "Send Image",
    fields: [
      { key: "to", label: "Recipient", placeholder: "+14155552671", required: true },
      { key: "image", label: "Image URL / Base64", placeholder: "https://...", type: "textarea", required: true },
      { key: "caption", label: "Caption", placeholder: "Optional caption" },
    ],
  },
  {
    type: "audio",
    label: "Audio",
    description: "Send an audio file.",
    endpoint: "messages/audio",
    sendLabel: "Send Audio",
    fields: [
      { key: "to", label: "Recipient", placeholder: "+14155552671", required: true },
      { key: "audio", label: "Audio URL / Base64", placeholder: "https://...", type: "textarea", required: true },
    ],
  },
  {
    type: "voice",
    label: "Voice",
    description: "Send a voice note in opus format.",
    endpoint: "messages/voice",
    sendLabel: "Send Voice",
    fields: [
      { key: "to", label: "Recipient", placeholder: "+14155552671", required: true },
      { key: "audio", label: "Voice URL / Base64", placeholder: "https://...", type: "textarea", required: true },
    ],
  },
  {
    type: "video",
    label: "Video",
    description: "Send a video with an optional caption.",
    endpoint: "messages/video",
    sendLabel: "Send Video",
    fields: [
      { key: "to", label: "Recipient", placeholder: "+14155552671", required: true },
      { key: "video", label: "Video URL / Base64", placeholder: "https://...", type: "textarea", required: true },
      { key: "caption", label: "Caption", placeholder: "Optional caption" },
    ],
  },
  {
    type: "document",
    label: "Document",
    description: "Send a document file with a caption.",
    endpoint: "messages/document",
    sendLabel: "Send Document",
    fields: [
      { key: "to", label: "Recipient", placeholder: "+14155552671", required: true },
      { key: "filename", label: "Filename", placeholder: "invoice.pdf", required: true },
      { key: "document", label: "Document URL / Base64", placeholder: "https://...", type: "textarea", required: true },
      { key: "caption", label: "Caption", placeholder: "Optional caption" },
    ],
  },
  {
    type: "location",
    label: "Location",
    description: "Share a location pin with address and coordinates.",
    endpoint: "messages/location",
    sendLabel: "Send Location",
    fields: [
      { key: "to", label: "Recipient", placeholder: "+14155552671", required: true },
      { key: "address", label: "Address", placeholder: "1600 Amphitheatre Pkwy", type: "textarea", required: true },
      { key: "lat", label: "Latitude", placeholder: "25.197197", type: "number", required: true },
      { key: "lng", label: "Longitude", placeholder: "55.2721877", type: "number", required: true },
    ],
  },
  {
    type: "contact",
    label: "Contact",
    description: "Send one contact or a contact list.",
    endpoint: "messages/contact",
    sendLabel: "Send Contact",
    fields: [
      { key: "to", label: "Recipient", placeholder: "+14155552671", required: true },
      { key: "contact", label: "Contact ID(s)", placeholder: "[email protected] or [email protected],[email protected]", type: "textarea", required: true },
    ],
  },
  {
    type: "reaction",
    label: "Reaction",
    description: "React to a message with an emoji.",
    endpoint: "messages/reaction",
    sendLabel: "Send Reaction",
    fields: [
      { key: "msgId", label: "Message ID", placeholder: "Incoming message id", required: true },
      { key: "emoji", label: "Emoji", placeholder: "👍", required: true },
    ],
  },
];

const FEATURE_BY_TYPE = new Map(MESSAGE_FEATURES.map((feature) => [feature.type, feature]));

export function getMessageFeature(type: UltraMsgMessageFeature): FeatureDefinition {
  const feature = FEATURE_BY_TYPE.get(type);
  if (!feature) {
    throw new Error(`Unsupported message feature: ${type}`);
  }
  return feature;
}

export function buildUltraMsgMessageRequest(
  type: UltraMsgMessageFeature,
  values: Record<string, string>
): { endpoint: string; body: Record<string, string> } {
  const feature = getMessageFeature(type);
  const body: Record<string, string> = {};

  feature.fields.forEach((field) => {
    const value = values[field.key];
    if (value !== undefined && value !== "") {
      body[field.key] = value;
    }
  });

  return { endpoint: feature.endpoint, body };
}
