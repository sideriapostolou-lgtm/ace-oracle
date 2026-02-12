import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  const key = process.env.STRIPE_SECRET_KEY;
  const baseUrl = process.env.NEXTAUTH_URL || "https://ace-oracle.vercel.app";

  try {
    const body = new URLSearchParams({
      mode: "payment",
      "payment_method_types[0]": "card",
      "line_items[0][price_data][currency]": "usd",
      "line_items[0][price_data][product_data][name]": "Ace Oracle Test",
      "line_items[0][price_data][unit_amount]": "99",
      "line_items[0][quantity]": "1",
      success_url: `${baseUrl}/api/stripe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/gate`,
    });

    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });
    const data = await res.json();
    return NextResponse.json({
      status: res.status,
      baseUrl,
      url: data.url || null,
      error: data.error || null,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg, baseUrl });
  }
}
