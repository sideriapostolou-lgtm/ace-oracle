import { NextResponse } from "next/server";
import { getSeasonRecord } from "@/lib/result-checker";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  const record = await getSeasonRecord();
  return NextResponse.json({ success: true, data: record });
}
