import { NextResponse } from "next/server";

const VIP_CODE = "REALONES";
const BUNDLE_VERIFY_URL = "https://the99community.vercel.app/api/verify-bundle";

async function validateBundleCode(code: string): Promise<boolean> {
  try {
    const res = await fetch(BUNDLE_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return data.success === true;
  } catch {
    return false;
  }
}

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

    const upperCode = code.toUpperCase();

    if (upperCode === VIP_CODE) {
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
    }

    if (upperCode.startsWith("BUNDLE-")) {
      const valid = await validateBundleCode(upperCode);
      if (valid) {
        const response = NextResponse.json({ success: true });
        response.cookies.set("ace_access", "granted", {
          maxAge: 365 * 24 * 60 * 60,
          path: "/",
          httpOnly: false,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
        });
        return response;
      }
    }

    return NextResponse.json(
      { success: false, error: "Invalid code" },
      { status: 401 },
    );
  } catch (error) {
    console.error("POST /api/verify-code error:", error);
    return NextResponse.json(
      { success: false, error: "Verification failed" },
      { status: 500 },
    );
  }
}
