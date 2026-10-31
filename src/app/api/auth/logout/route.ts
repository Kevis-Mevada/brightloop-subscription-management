import { NextResponse, NextRequest } from "next/server";
import { clearSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") || "";
  const isForm = contentType.includes("application/x-www-form-urlencoded") || req.headers.get("accept")?.includes("text/html");

  if (isForm) {
    const response = NextResponse.redirect(new URL("/login", req.url), 303);
    clearSessionCookie(response);
    return response;
  }

  const response = NextResponse.json({
    success: true,
    message: "Logged out successfully",
  });
  clearSessionCookie(response);
  return response;
}
