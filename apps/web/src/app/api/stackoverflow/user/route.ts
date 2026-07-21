import { fetchStackOverflowUser } from "@ossintel/stackoverflow";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { decrypt } from "@/lib/crypto-helper";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { query, apiKey } = await request.json();
    const userId = query || "";
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    let key = apiKey || process.env["STACKEXCHANGE_API_KEY"] || undefined;
    if (!key) {
      try {
        const cookieStore = await cookies();
        const soCookie = cookieStore.get("stackoverflow_api_key");
        if (soCookie?.value) {
          key = decrypt(soCookie.value);
        }
      } catch (err) {
        console.error("Failed to read SO key from cookies", err);
      }
    }

    const soUser = await fetchStackOverflowUser(userId, { apiKey: key });
    return NextResponse.json(soUser);
  } catch (error: unknown) {
    console.error("Stack Overflow User API failed", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch Stack Overflow user";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
