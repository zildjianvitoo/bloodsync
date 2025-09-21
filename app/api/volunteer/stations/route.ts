import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    const stations = await prisma.station.findMany({
      include: {
        event: {
          select: {
            id: true,
            name: true,
            startAt: true,
          },
        },
      },
      orderBy: [{ event: { startAt: "asc" } }, { type: "asc" }],
    });

    return NextResponse.json({ stations });
  } catch (error) {
    console.error("GET /api/volunteer/stations failed", error);
    return NextResponse.json({ error: "Failed to load stations" }, { status: 500 });
  }
}
