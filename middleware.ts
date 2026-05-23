import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import type { AppRole } from "@/lib/types/profile";

/** Только для локальной отладки; в production игнорируется. */
function isSkipAuthEnabled() {
  return (
    process.env.NODE_ENV !== "production" && process.env.SKIP_AUTH_MIDDLEWARE === "true"
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isSkipAuthEnabled()) {
    return NextResponse.next();
  }

  try {
    const session = await updateSession(request);
    const { response, user, configMissing } = session;
    const supabase = session.supabase;

    const needsAuth =
      pathname === "/" || pathname.startsWith("/dashboard") || pathname.startsWith("/admin");

    if (configMissing) {
      if (needsAuth) {
        return NextResponse.redirect(new URL("/auth", request.url));
      }
      return response;
    }

    if (!user && needsAuth) {
      return NextResponse.redirect(new URL("/auth", request.url));
    }

    if (!user || !supabase) {
      return response;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    const rawRole = profile?.role;
    const role: AppRole | null =
      rawRole === "admin" || rawRole === "client" ? rawRole : null;

    if (!role) {
      if (needsAuth) {
        return NextResponse.redirect(new URL("/auth", request.url));
      }
      return response;
    }

    if (pathname === "/" || pathname.startsWith("/auth")) {
      const destination = role === "admin" ? "/admin" : "/dashboard";
      return NextResponse.redirect(new URL(destination, request.url));
    }

    if (pathname.startsWith("/dashboard") && role !== "client") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    if (pathname.startsWith("/admin") && role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return response;
  } catch (error) {
    console.error("[middleware]", error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/",
    "/auth",
    "/dashboard",
    "/dashboard/:path*",
    "/admin",
    "/admin/:path*",
  ],
};
