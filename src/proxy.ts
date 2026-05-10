import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isAuthPage = req.nextUrl.pathname === "/login"
  const isProtectedPage = req.nextUrl.pathname.startsWith("/chat") || req.nextUrl.pathname.startsWith("/agent")

  if (isProtectedPage && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.nextUrl))
  }

  if (isAuthPage && isLoggedIn) {
    // Basic redirect, role-based redirect happens at page level
    return NextResponse.redirect(new URL("/", req.nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/chat/:path*", "/agent/:path*", "/login"],
}
