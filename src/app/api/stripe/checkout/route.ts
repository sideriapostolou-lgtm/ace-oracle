import { NextResponse } from "next/server";
import Stripe from "stripe";

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

    const stripe = new Stripe(key, { apiVersion: "2024-04-10" });
    const baseUrl = process.env.NEXTAUTH_URL || "https://ace-oracle.vercel.app";

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Ace Oracle — Lifetime Access",
              description:
                "One-time payment. All AI tennis predictions, Lock of the Day, full analysis, forever.",
            },
            unit_amount: 99,
          },
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/api/stripe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/gate`,
    });

    return NextResponse.json({
      success: true,
      data: { url: checkoutSession.url },
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
