import { NextRequest } from "next/server";
import { Server as IOServer } from "socket.io";
import type { Server as HTTPServer } from "http";
import { emitTelemetry } from "@/lib/telemetry";
import { registerIO } from "@/lib/realtime/server";
import { registerNoShowSweep } from "@/lib/jobs/no-show";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function ensureSocketServer(request: NextRequest) {
  const req = request as unknown as {
    socket?: {
      server?: HTTPServer & {
        io?: IOServer;
      };
    };
  };

  const socketServer = req.socket?.server;
  if (!socketServer) {
    throw new Error("Socket server unavailable on request");
  }

  if (!socketServer.io) {
    const io = new IOServer(socketServer, {
      path: "/api/socket",
      cors: {
        origin:
          process.env.NEXT_PUBLIC_SOCKET_HOST_URL ??
          process.env.SOCKET_HOST_URL ??
          "*",
        methods: ["GET", "POST"],
      },
    });

    registerIO(io);
    registerNoShowSweep();

    io.on("connection", (socket) => {
      emitTelemetry({
        name: "socket:connected",
        context: { socketId: socket.id },
      });

      socket.on("disconnect", (reason) => {
        emitTelemetry({
          name: "socket:disconnected",
          context: { socketId: socket.id, reason },
        });
      });
    });

    socketServer.io = io;
  }

  return socketServer.io;
}

export async function GET(request: NextRequest) {
  ensureSocketServer(request);
  return new Response(null, { status: 200 });
}

export async function POST(request: NextRequest) {
  ensureSocketServer(request);
  return new Response(null, { status: 200 });
}
