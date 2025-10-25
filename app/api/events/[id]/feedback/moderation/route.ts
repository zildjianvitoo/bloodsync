import { NextResponse } from "next/server";
import { listFeedbackForModeration } from "@/lib/db/feedback";
import { getSession } from "@/lib/auth/session";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const pending = await listFeedbackForModeration(id, "PENDING", 20);
  return NextResponse.json({ feedback: pending });
}
