import { NextRequest, NextResponse } from "next/server"
import { decrypt } from "@/lib/auth"

const userRoutes = ["/customers", "/tickets", "/statistics", "/results", "/dictionary", "/settings"]
const authRoutes = ["/login", "/register"]

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname
  const isAdminRoute = path === "/admin" || path.startsWith("/admin/")
  const isUserRoute = path === "/" || userRoutes.some(route => path === route || path.startsWith(`${route}/`))
  const isAuthRoute = authRoutes.includes(path)
  const cookie = req.cookies.get("session")?.value
  const session = cookie ? await decrypt(cookie).catch(() => null) : null
  const user = session?.user as { role?: string } | undefined
  const hasKnownRole = user?.role === "admin" || user?.role === "user"

  if ((isAdminRoute || isUserRoute) && (!user || !hasKnownRole)) {
    return NextResponse.redirect(new URL("/login", req.nextUrl))
  }

  if (isAdminRoute && user?.role !== "admin") {
    return NextResponse.redirect(new URL("/", req.nextUrl))
  }

  if (isUserRoute && user?.role === "admin") {
    return NextResponse.redirect(new URL("/admin", req.nextUrl))
  }

  if (isAuthRoute && user && hasKnownRole) {
    return NextResponse.redirect(new URL(user.role === "admin" ? "/admin" : "/", req.nextUrl))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"]
}
