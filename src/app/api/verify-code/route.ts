import { NextResponse } from "next/server";

const VIP_CODE = "REALONES";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    let body: { code?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON" },
        { status: 400 },
      );
    }

    const { code } = body;
    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { success: false, error: "Code is required" },
        { status: 400 },
      );
    }

    if (code.toUpperCase() !== VIP_CODE) {
      return NextResponse.json(
        { success: false, error: "Invalid code" },
        { status: 401 },
      );
    }

    // Set access cookie (1 year)
    const response = NextResponse.json({ success: true });
    response.cookies.set("ace_access", "granted", {
      maxAge: 365 * 24 * 60 * 60,
      path: "/",
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  } catch (error) {
    console.error("POST /api/verify-code error:", error);
    return NextResponse.json(
      { success: false, error: "Verification failed" },
      { status: 500 },
    );
  }
}
