import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    const session = request.cookies.get("roadcost_session");
    const { pathname } = request.nextUrl;

    const publicPaths = ["/auth/callback", "/login"];

    if (publicPaths.some((path) => pathname.startsWith(path))) {
        return NextResponse.next();
    }

    if (!session) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - auth/callback (explicitly excluded in matcher to be safe, though handled in code too)
         */
        "/((?!api|_next/static|_next/image|favicon.ico|auth/callback|.*\\.png$).*)",
    ],
};
