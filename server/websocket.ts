import { WebSocketServer, WebSocket } from "ws";
import type { Server as HttpServer } from "http";

const clients = new Set<WebSocket>();

export function setupWebSocket(server: HttpServer) {
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws) => {
    clients.add(ws);
    console.log("Client connected. Total clients:", clients.size);

    ws.on("close", () => {
      clients.delete(ws);
      console.log("Client disconnected. Total clients:", clients.size);
    });

    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
      clients.delete(ws);
    });
  });

  return wss;
}

export function broadcastLeaderboardUpdate() {
  const message = JSON.stringify({ type: "leaderboard_update" });
  
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}
