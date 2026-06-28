import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isDashboard =
    pathname.startsWith("/dashboard") || pathname.startsWith("/admin");
  const isAuthPage =
    pathname === "/auth/login" || pathname === "/auth/register";

  const sessionCookie = request.cookies.get("session")?.value;
  const isLoggedIn = !!sessionCookie;

  if (!isLoggedIn && isDashboard) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  if (isLoggedIn && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Expose the current path to server components via a REQUEST header so
  // `headers().get('x-pathname')` works on both full loads and RSC/soft
  // navigations. Setting it on the response does not reach `headers()` on
  // soft navigations, which made the trial gate redirect-loop to /billing
  // (blank screen after login until a hard refresh).
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', pathname)
  return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
