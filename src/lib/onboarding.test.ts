import test from "node:test";
import assert from "node:assert/strict";
import { shouldShowSettingsOnboarding } from "./onboarding";

test("shows onboarding when the user has no membership", () => {
  assert.equal(shouldShowSettingsOnboarding(false), true);
});

test("hides onboarding when the user already has membership", () => {
  assert.equal(shouldShowSettingsOnboarding(true), false);
});
