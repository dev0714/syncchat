import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const isDashboard = pathname.startsWith("/dashboard") || pathname.startsWith("/admin");

  const cookieUpdates: {
    name: string;
    value: string;
    options?: Record<string, unknown>;
    remove?: boolean;
  }[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: { schema: "syncchat" },
      cookies: {
        get(name: string) {
          const value = request.cookies.get(name)?.value;
          if (!value) return undefined;
          try {
            return decodeURIComponent(value);
          } catch {
            return value;
          }
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          cookieUpdates.push({ name, value, options });
        },
        remove(name: string) {
          cookieUpdates.push({ name, value: "", remove: true });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && isDashboard) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    const response = NextResponse.redirect(url);
    cookieUpdates.forEach(({ name, value, options, remove }) =>
      remove ? response.cookies.delete(name) : response.cookies.set(name, value, options)
    );
    return response;
  }

  if (user && (pathname === "/auth/login" || pathname === "/auth/register")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    const response = NextResponse.redirect(url);
    cookieUpdates.forEach(({ name, value, options, remove }) =>
      remove ? response.cookies.delete(name) : response.cookies.set(name, value, options)
    );
    return response;
  }

  const response = NextResponse.next();
  cookieUpdates.forEach(({ name, value, options, remove }) =>
    remove ? response.cookies.delete(name) : response.cookies.set(name, value, options)
  );
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
