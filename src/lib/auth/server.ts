import { cookies } from "next/headers";
import { getSession } from "@/lib/auth/session";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session")?.value;

  if (!sessionToken) {
    return null;
  }

  const session = getSession(sessionToken);
  if (!session) {
    return null;
  }

  return {
    id: session.userId,
    email: session.email,
  };
}
