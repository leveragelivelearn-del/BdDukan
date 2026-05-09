import { auth } from "@/auth"
import { NextResponse } from "next/server"

export const proxy = auth(async (req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const role = (req.auth?.user as any)?.role as string | undefined;
  
  // Host detection
  const host = req.headers.get("host") || "";
  const hostname = host.split(':')[0].replace(/^www\./, '');
  const isHub = hostname === 'bd-dukan.com' || 
                hostname.endsWith('.bd-dukan.com') || 
                hostname === 'localhost';

  const isAdminRoute = nextUrl.pathname.startsWith("/admin");
  const isAuthRoute = nextUrl.pathname.startsWith("/login") || nextUrl.pathname.startsWith("/register");
  
  // If user is logged in on Hub but trying to access a tenant shop, 
  // redirect them to the hub-callback immediately.
  const remoteTenant = nextUrl.searchParams.get("remote_tenant");
  if (isLoggedIn && isHub && remoteTenant) {
    console.log(`Proxy: Redirecting logged-in hub user to tenant: ${remoteTenant}`);
    return NextResponse.redirect(new URL(`/api/auth/hub-callback?target=${encodeURIComponent(remoteTenant)}`, nextUrl));
  }

  // 1. Redirection for logged-in users on Auth routes (Login/Register)
  if (isAuthRoute && isLoggedIn) {
    // If admin on Hub, go to management console
    if (isHub && (role === "admin" || role === "super_admin")) {
      return NextResponse.redirect(new URL("/admin/dashboard", nextUrl));
    }
    // All other cases (Tenant users or Hub normal users), go to storefront dashboard
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  // 2. Protection for Admin routes
  if (isAdminRoute) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", nextUrl));
    }

    // Only allow admin/super_admin on hub admin routes
    if (role !== "admin" && role !== "super_admin") {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }

    // /admin/system-design → strictly super_admin
    const isSystemDesignRoute = nextUrl.pathname.startsWith("/admin/system-design");
    if (isSystemDesignRoute && role !== "super_admin") {
      return NextResponse.redirect(new URL("/admin/dashboard", nextUrl));
    }
  }

  const response = NextResponse.next();
  response.headers.set('x-pathname', nextUrl.pathname);
  return response;
});

export const config = {
  matcher: ["/admin/:path*", "/login", "/register"],
};
