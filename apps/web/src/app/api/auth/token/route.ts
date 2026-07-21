import { NextResponse } from "next/server";
import { encrypt } from "@/lib/crypto-helper";

export async function POST(request: Request) {
  try {
    const { token, type = "github" } = await request.json();
    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }

    const encrypted = encrypt(token);
    const cookieName =
      type === "stackoverflow" ? "stackoverflow_api_key" : "github_pat";

    const response = NextResponse.json({ success: true });
    response.cookies.set(cookieName, encrypted, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Auth token POST failed", error);
    return NextResponse.json(
      { error: "Failed to store token" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get("type") || "github";
    const cookieName =
      type === "stackoverflow" ? "stackoverflow_api_key" : "github_pat";

    const response = NextResponse.json({ success: true });
    response.cookies.delete(cookieName);
    return response;
  } catch (error) {
    console.error("Auth token DELETE failed", error);
    return NextResponse.json(
      { error: "Failed to clear token" },
      { status: 500 },
    );
  }
}
