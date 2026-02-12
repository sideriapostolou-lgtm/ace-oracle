import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(): Promise<NextResponse> {
  try {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      return NextResponse.json(
        { success: false, error: "Stripe key not configured" },
        { status: 500 },
      );
    }

    const baseUrl = process.env.NEXTAUTH_URL || "https://ace-oracle.vercel.app";

    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        mode: "payment",
        "payment_method_types[0]": "card",
        "line_items[0][price_data][currency]": "usd",
        "line_items[0][price_data][product_data][name]": "Ace Oracle — Lifetime Access",
        "line_items[0][price_data][product_data][description]":
          "One-time payment. All AI tennis predictions, Lock of the Day, full analysis, forever.",
        "line_items[0][price_data][unit_amount]": "99",
        "line_items[0][quantity]": "1",
        success_url: `${baseUrl}/api/stripe/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/gate`,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Stripe API error:", data);
      return NextResponse.json(
        { success: false, error: data.error?.message || "Stripe error" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data: { url: data.url },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("POST /api/stripe/checkout error:", msg);
    return NextResponse.json(
      { success: false, error: "Failed to create checkout session", detail: msg },
      { status: 500 },
    );
  }
}
