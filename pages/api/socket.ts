import type { NextApiRequest, NextApiResponse } from "next";
import { Server as IOServer } from "socket.io";
import type { Server as HTTPServer } from "http";
import { emitTelemetry } from "@/lib/telemetry";
import { registerIO } from "@/lib/realtime/server";
import { registerNoShowSweep } from "@/lib/jobs/no-show";

export const config = {
  api: {
    bodyParser: false,
  },
};

type NextApiResponseWithSocket = NextApiResponse & {
  socket: NextApiResponse["socket"] & {
    server: HTTPServer & {
      io?: IOServer;
    };
  };
};

export default function handler(req: NextApiRequest, res: NextApiResponseWithSocket) {
  if (!res.socket.server.io) {
    const io = new IOServer(res.socket.server, {
      path: "/api/socket",
      cors: {
        origin: process.env.NEXT_PUBLIC_SOCKET_HOST_URL ?? process.env.SOCKET_HOST_URL ?? "*",
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

    res.socket.server.io = io;
  }

  res.end();
}
