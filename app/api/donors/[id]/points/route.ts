import { NextResponse } from "next/server";
import { getPointSummary } from "@/lib/rewards/points";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const summary = await getPointSummary(id);
  return NextResponse.json(summary);
}
