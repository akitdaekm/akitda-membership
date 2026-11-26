import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    const host = request.headers.get("host") || "";
    const hostname = host.split(":")[0].toLowerCase();
    const { pathname } = request.nextUrl;

    // Handle subdomain routing for agm.akitdaekm.com (and agm.localhost for local testing)
    if (hostname.startsWith("agm.")) {
        if (pathname.startsWith("/api") || pathname.startsWith("/_next") || pathname.includes(".")) {
            return NextResponse.next();
        }

        const url = request.nextUrl.clone();
        if (pathname === "/" || pathname === "/register" || pathname === "/registration") {
            url.pathname = "/agm";
            return NextResponse.rewrite(url);
        }
        if (pathname === "/scanner" || pathname === "/scan") {
            url.pathname = "/agm/scanner";
            return NextResponse.rewrite(url);
        }
        if (pathname === "/admin" || pathname === "/viewer" || pathname === "/passes") {
            url.pathname = "/agm/admin";
            return NextResponse.rewrite(url);
        }
        if (!pathname.startsWith("/agm")) {
            url.pathname = `/agm${pathname}`;
            return NextResponse.rewrite(url);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
