import { NextResponse } from "next/server";
import { listDonorBadges } from "@/lib/badges";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const badges = await listDonorBadges(id);
  return NextResponse.json({ badges });
}
