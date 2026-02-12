import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const sessionId = request.nextUrl.searchParams.get("session_id");
    if (!sessionId) {
      return NextResponse.redirect(new URL("/gate", request.url));
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-04-10" });
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return NextResponse.redirect(new URL("/gate", request.url));
    }

    const response = NextResponse.redirect(new URL("/", request.url));
    response.cookies.set("ace_access", "granted", {
      maxAge: 365 * 24 * 60 * 60,
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: true,
    });

    return response;
  } catch (error) {
    console.error("GET /api/stripe/success error:", error);
    return NextResponse.redirect(new URL("/gate", request.url));
  }
}
