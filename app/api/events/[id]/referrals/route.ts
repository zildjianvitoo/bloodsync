import { NextResponse } from "next/server";
import { getReferralStats, listEventReferrals } from "@/lib/referrals";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const [stats, recent] = await Promise.all([
    getReferralStats(id),
    listEventReferrals(id, 10),
  ]);
  return NextResponse.json({ stats, referrals: recent });
}
