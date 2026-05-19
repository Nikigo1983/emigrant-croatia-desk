import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import type { AppRole } from "@/lib/types/profile";

export async function middleware(request: NextRequest) {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.SKIP_AUTH_MIDDLEWARE === "true"
  ) {
    return NextResponse.json(
      { error: "SKIP_AUTH_MIDDLEWARE must not be enabled in production." },
      { status: 500 },
    );
  }

  // Локальная диагностика: при SKIP_AUTH_MIDDLEWARE=true не вызываем updateSession
  // и не применяем редиректы по сессии/роли (см. .env.example).
  if (process.env.SKIP_AUTH_MIDDLEWARE === "true") {
    return NextResponse.next();
  }

  const { response, supabase, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const needsAuth =
    pathname === "/" || pathname.startsWith("/dashboard") || pathname.startsWith("/admin");

  if (!user && needsAuth) {
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  if (!user) {
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
    if (pathname === "/" || pathname.startsWith("/dashboard") || pathname.startsWith("/admin")) {
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
