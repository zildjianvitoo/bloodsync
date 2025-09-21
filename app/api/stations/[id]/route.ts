import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { emitTelemetry } from "@/lib/telemetry";
import { getIO } from "@/lib/realtime/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  if (typeof body?.isActive !== "boolean") {
    return NextResponse.json(
      { error: "`isActive` boolean field required" },
      { status: 400 }
    );
  }

  try {
    const station = await prisma.station.update({
      where: { id },
      data: { isActive: body.isActive },
    });

    emitTelemetry({
      name: "station:updated",
      actorRole: "organizer",
      context: { stationId: station.id, isActive: station.isActive },
    });

    getIO()?.emit("station:updated", {
      stationId: station.id,
      isActive: station.isActive,
      updatedAt: station.updatedAt,
    });

    getIO()?.emit("notify", {
      title: "Station status updated",
      message: `${station.type} station is now ${station.isActive ? "Active" : "Paused"}`,
      level: station.isActive ? "success" : "warning",
    });

    return NextResponse.json({ station });
  } catch (error) {
    console.error("PATCH /stations failed", error);
    return NextResponse.json(
      { error: "Failed to update station" },
      { status: 500 }
    );
  }
}
