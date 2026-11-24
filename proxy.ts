import { NextResponse, type NextRequest } from "next/server";
export function proxy(request:NextRequest){const response=NextResponse.next();if(request.nextUrl.pathname.startsWith("/approvals")){response.headers.set("Content-Security-Policy","frame-ancestors 'none'; base-uri 'self'; object-src 'none'");response.headers.set("X-Frame-Options","DENY");response.headers.set("Cache-Control","no-store");}return response;}
export const config={matcher:["/approvals/:path*"]};
