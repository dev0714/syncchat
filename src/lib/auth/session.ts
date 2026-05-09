import crypto from "crypto";

export type Session = {
  userId: string;
  email: string;
};

const SECRET =
  process.env.SESSION_SECRET ?? "syncchat-session-secret-change-in-production";
const EXPIRES_IN = 24 * 60 * 60 * 1000; // 24h

export function createSession(userId: string, email: string): string {
  const payload = JSON.stringify({ userId, email, exp: Date.now() + EXPIRES_IN });
  const data = Buffer.from(payload).toString("base64url");
  const sig = crypto.createHmac("sha256", SECRET).update(data).digest("base64url");
  return `${data}.${sig}`;
}

export function getSession(token: string): Session | null {
  try {
    const dot = token.lastIndexOf(".");
    if (dot === -1) return null;
    const data = token.slice(0, dot);
    const sig = token.slice(dot + 1);
    const expected = crypto
      .createHmac("sha256", SECRET)
      .update(data)
      .digest("base64url");
    if (sig !== expected) return null;
    const { userId, email, exp } = JSON.parse(
      Buffer.from(data, "base64url").toString()
    );
    if (!userId || !email || exp < Date.now()) return null;
    return { userId, email };
  } catch {
    return null;
  }
}

export function destroySession(_token: string): void {
  // Stateless — clearing the cookie is sufficient
}
