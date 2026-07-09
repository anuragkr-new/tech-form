import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((request) => {
  const { pathname } = request.nextUrl;
  const isLoggedIn = !!request.auth?.user?.email;

  if (pathname.startsWith("/login") || pathname.startsWith("/api/auth")) {
    if (isLoggedIn && pathname.startsWith("/login")) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (!isLoggedIn) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/", "/admin/:path*", "/login", "/api/questions/:path*", "/api/submissions/:path*", "/api/settings", "/api/admins"],
};
