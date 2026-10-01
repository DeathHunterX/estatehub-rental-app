import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
    if (process.env.MAINTENANCE_MODE !== "true") return NextResponse.next();
    const destination = request.nextUrl.clone();
    destination.pathname = "/maintenance.html";
    destination.search = "";
    return NextResponse.rewrite(destination, {
        status: 503,
        headers: { "Retry-After": "3600", "Cache-Control": "no-store" },
    });
}

export const config = {
    matcher: ["/((?!api(?:/|$)|_next(?:/|$)|.*\\.[^/]+$).*)"],
};
