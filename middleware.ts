import { auth } from "./auth";
import { NextResponse } from "next/server";

// public route
const PUBLICROUTES = [
  "/login",
  "/signup",
  "/",
  "/.jpg",
  "/.jpeg",
  "/.png",
  "/.gif",
  "/.svg",
  "/.webp",
];

const AUTHENTICATIONROUTES = ["/login", "/signup"];

const isAuthenticationRoute = (path: string) => {
  if (path.startsWith("/password/")) return true;
  if (AUTHENTICATIONROUTES.includes(path)) return true;
  return false;
};

const isPublicRoute = (path: string) => {
  if (PUBLICROUTES.includes(path)) return true;
  if (path.startsWith("/password/")) return true;
  return false;
};

export default auth((req) => {
  const pathname = req.nextUrl.pathname;
  const isAuth = req.auth;

  if (pathname.match(/\.(?:jpg|jpeg|gif|png|svg|webp)$/)) {
    return NextResponse.next(); // Allow the request to proceed
  }

  // Redirect authenticated users trying to access login page to dashboard
  if (isAuth && isAuthenticationRoute(pathname)) {
    const dashboardUrl = new URL("/", req.nextUrl.origin);
    return NextResponse.redirect(dashboardUrl);
  }

  if (!isPublicRoute(pathname) && !isAuth) {
    const newUrl = new URL("/login", req.nextUrl.origin);
    return NextResponse.redirect(newUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
