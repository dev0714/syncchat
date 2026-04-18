/**
 * Session management utilities
 */

import crypto from "crypto";

export type Session = {
  userId: string;
  email: string;
  expiresAt: number;
};

// Simple in-memory session store (replace with Redis in production)
const sessions: Map<string, Session> = new Map();

export function createSession(userId: string, email: string): string {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  sessions.set(token, { userId, email, expiresAt });
  return token;
}

export function getSession(token: string): Session | null {
  const session = sessions.get(token);

  if (!session) {
    return null;
  }

  // Check if session is expired
  if (session.expiresAt < Date.now()) {
    sessions.delete(token);
    return null;
  }

  return session;
}

export function destroySession(token: string): void {
  sessions.delete(token);
}
