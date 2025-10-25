import { NextResponse } from "next/server";
import { cancelReminder } from "@/lib/reminders";
import { getSession } from "@/lib/auth/session";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const reminder = await cancelReminder(id);
  return NextResponse.json({ reminder });
}
