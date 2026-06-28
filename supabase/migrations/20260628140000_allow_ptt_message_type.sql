-- WhatsApp/UltraMsg delivers voice notes as message type "ptt" (push-to-talk).
-- The messages_type_check constraint didn't allow it, so inbound voice notes
-- failed to insert ("Problem in node 'Insert user chat'"). Add 'ptt'.
ALTER TABLE syncchat.messages DROP CONSTRAINT IF EXISTS messages_type_check;
ALTER TABLE syncchat.messages ADD CONSTRAINT messages_type_check
  CHECK (type = ANY (ARRAY[
    'text','image','video','audio','document','location','sticker',
    'vcard','contact','reaction','ai','chat','unknown','ptt'
  ]));
