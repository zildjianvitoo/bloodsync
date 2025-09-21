import type { Server as IOServer } from "socket.io";

const globalForIO = globalThis as unknown as {
  io?: IOServer;
};

export function registerIO(server: IOServer) {
  globalForIO.io = server;
  return server;
}

export function getIO() {
  return globalForIO.io;
}
