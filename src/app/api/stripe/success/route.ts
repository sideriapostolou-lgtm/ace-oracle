import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const sessionId = request.nextUrl.searchParams.get("session_id");
    if (!sessionId) {
      return NextResponse.redirect(new URL("/gate", request.url));
    }

    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      return NextResponse.redirect(new URL("/gate", request.url));
    }

    const res = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${sessionId}`,
      {
        headers: { Authorization: `Bearer ${key}` },
      },
    );
    const session = await res.json();

    if (session.payment_status !== "paid") {
      return NextResponse.redirect(new URL("/gate", request.url));
    }

    const response = NextResponse.redirect(new URL("/", request.url));
    response.cookies.set("ace_access", "granted", {
      maxAge: 365 * 24 * 60 * 60,
      path: "/",
      httpOnly: false,
      sameSite: "lax",
      secure: true,
    });

    return response;
  } catch (error) {
    console.error("GET /api/stripe/success error:", error);
    return NextResponse.redirect(new URL("/gate", request.url));
  }
}
