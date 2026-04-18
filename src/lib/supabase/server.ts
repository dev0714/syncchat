import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: { schema: "syncchat" },
      cookies: {
        get(name: string) {
          const value = cookieStore.get(name)?.value;
          if (!value) return undefined;
          try {
            return decodeURIComponent(value);
          } catch {
            return value;
          }
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2]);
        },
        remove(name: string) {
          cookieStore.delete(name);
        },
      },
    }
  );
}
