import crypto from "node:crypto";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import {
  GITHUB_APP_INSTALLATIONS_CACHE_TAG,
  GITHUB_WEBHOOK_EVENT_HEADER,
  GITHUB_WEBHOOK_SIGNATURE_HEADER,
} from "@/lib/constants-backend";

export const dynamic = "force-dynamic";

const verifySignature = (body: string, signature: string, secret: string) => {
  try {
    const hmac = crypto.createHmac("sha256", secret);
    const digest = `sha256=${hmac.update(body).digest("hex")}`;
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
  } catch (error) {
    console.error("[Webhook] Signature verification error", error);
    return false;
  }
};

export const POST = async (request: Request) => {
  try {
    const signature = request.headers.get(GITHUB_WEBHOOK_SIGNATURE_HEADER);
    const event = request.headers.get(GITHUB_WEBHOOK_EVENT_HEADER);
    const secret = process.env.GITHUB_APP_WEBHOOK_SECRET;

    const rawBody = await request.text();

    if (secret) {
      if (!signature) {
        console.warn("[Webhook] Missing webhook signature header");
        return NextResponse.json(
          { error: "Missing signature" },
          { status: 401 },
        );
      }
      const isVerified = verifySignature(rawBody, signature, secret);
      if (!isVerified) {
        console.error("[Webhook] Invalid webhook signature");
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 },
        );
      }
    } else {
      console.warn(
        "[Webhook] GITHUB_APP_WEBHOOK_SECRET is not configured. Skipping signature verification.",
      );
    }

    const payload = JSON.parse(rawBody);
    console.log(
      `[Webhook] Received event '${event}' with action '${payload.action || "none"}'`,
    );

    // Handle installations and repositories modifications
    if (event === "installation" || event === "installation_repositories") {
      console.log(
        `[Webhook] Invalidation triggered for installations cache tag: '${GITHUB_APP_INSTALLATIONS_CACHE_TAG}'`,
      );
      revalidateTag(GITHUB_APP_INSTALLATIONS_CACHE_TAG, { expire: 0 });
    }

    // Handle marketplace events
    if (event === "marketplace_purchase") {
      const action = payload.action;
      const account = payload.marketplace_purchase?.account?.login;
      const plan = payload.marketplace_purchase?.plan?.name;
      console.log(
        `[Webhook] Marketplace Purchase event: Account '${account}', Plan '${plan}', Action '${action}'`,
      );
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Webhook] Handler error", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
};
