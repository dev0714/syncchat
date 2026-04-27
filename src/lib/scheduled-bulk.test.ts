import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateNextRunAt,
  fillTemplate,
  parseJohannesburgDateTime,
  extractTemplateVariables,
} from "./scheduled-bulk.ts";

test("parses South Africa schedule times as UTC+2", () => {
  const date = parseJohannesburgDateTime("2026-04-27T14:30");
  assert.equal(date.toISOString(), "2026-04-27T12:30:00.000Z");
});

test("fills a template with contact data and defaults", () => {
  const message = fillTemplate(
    "Hello {{name}}, your code is {{code}}",
    { id: "1", phone: "+27123456789", name: "Anele" },
    { code: "ABC123" }
  );

  assert.equal(message, "Hello Anele, your code is ABC123");
});

test("extracts template variables", () => {
  assert.deepEqual(extractTemplateVariables("Hi {{name}} {{code}} {{name}}"), ["name", "code"]);
});

test("calculates the next daily run", () => {
  const next = calculateNextRunAt(new Date("2026-04-27T12:30:00.000Z"), {
    frequency: "daily",
    interval: 2,
  });

  assert.equal(next.toISOString(), "2026-04-29T12:30:00.000Z");
});

test("calculates the next weekly run with selected days", () => {
  const next = calculateNextRunAt(new Date("2026-04-27T12:30:00.000Z"), {
    frequency: "weekly",
    interval: 1,
    daysOfWeek: [4],
  });

  assert.equal(next.toISOString(), "2026-04-30T12:30:00.000Z");
});
