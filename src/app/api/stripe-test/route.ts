import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  try {
    const res = await fetch("https://api.stripe.com/v1/balance", {
      headers: {
        Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      },
    });
    const data = await res.json();
    return NextResponse.json({
      status: res.status,
      hasKey: !!process.env.STRIPE_SECRET_KEY,
      keyPrefix: process.env.STRIPE_SECRET_KEY?.substring(0, 12),
      balance: data,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg, hasKey: !!process.env.STRIPE_SECRET_KEY });
  }
}
