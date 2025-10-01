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

type WithIOServer = HTTPServer & {
  io?: IOServer;
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const server = require("http").createServer();

  if (!server) {
    console.error("Socket server unavailable on response socket");
    res.status(500).end();
    return;
  }

  if (!server.io) {
    const io = new IOServer(server, {
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
      console.log("terkoneksi");
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

    server.io = io;
  }

  res.end();
}
