import test from "node:test";
import assert from "node:assert/strict";
import { loginWithPassword } from "./login";

test("loginWithPassword returns the Supabase error message", async () => {
  const client = {
    auth: {
      async signInWithPassword() {
        return { error: { message: "Invalid login credentials" } };
      },
    },
  };

  const result = await loginWithPassword(client, "andre@example.com", "wrong-password");

  assert.deepEqual(result, { error: "Invalid login credentials" });
});

test("loginWithPassword converts thrown errors into a user-facing message", async () => {
  const client = {
    auth: {
      async signInWithPassword() {
        throw new Error("Network request failed");
      },
    },
  };

  const result = await loginWithPassword(client, "andre@example.com", "password123");

  assert.deepEqual(result, { error: "Network request failed" });
});
