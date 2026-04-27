import test from "node:test";
import assert from "node:assert/strict";
import { buildUltraMsgMessageRequest, MESSAGE_FEATURES } from "./message-features.ts";

test("builds a text message request", () => {
  const request = buildUltraMsgMessageRequest("text", {
    to: "+15551234567",
    body: "Hello there",
  });

  assert.equal(request.endpoint, "messages/chat");
  assert.deepEqual(request.body, {
    to: "+15551234567",
    body: "Hello there",
  });
});

test("builds a reaction request", () => {
  const request = buildUltraMsgMessageRequest("reaction", {
    msgId: "MSG-123",
    emoji: "👍",
  });

  assert.equal(request.endpoint, "messages/reaction");
  assert.deepEqual(request.body, {
    msgId: "MSG-123",
    emoji: "👍",
  });
});

test("exposes all message features", () => {
  assert.deepEqual(
    MESSAGE_FEATURES.map((feature) => feature.type),
    ["text", "image", "audio", "voice", "video", "document", "location", "contact", "reaction"]
  );
});
