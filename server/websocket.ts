import { WebSocketServer, WebSocket } from "ws";
import type { Server as HttpServer } from "http";

const clients = new Set<WebSocket>();

export function setupWebSocket(server: HttpServer) {
  const port = parseInt(process.env.PORT || '5000', 10);
  const wss = new WebSocketServer({ 
    server,
    path: '/ws'
  });

  wss.on("connection", (ws) => {
    clients.add(ws);
    console.log("Client connected. Total clients:", clients.size);

    // Send welcome message
    ws.send(JSON.stringify({ 
      type: "connection",
      message: "Connected to DapsiGames real-time server" 
    }));

    ws.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString());
        handleClientMessage(ws, message);
      } catch (error) {
        console.error("Error parsing client message:", error);
      }
    });

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

function handleClientMessage(ws: WebSocket, message: any) {
  switch (message.type) {
    case "ping":
      ws.send(JSON.stringify({ type: "pong", timestamp: Date.now() }));
      break;
    case "subscribe":
      // Handle subscription to specific channels
      ws.send(JSON.stringify({ 
        type: "subscribed", 
        channel: message.channel 
      }));
      break;
    default:
      console.log("Unknown message type:", message.type);
  }
}

export function broadcastLeaderboardUpdate() {
  const message = JSON.stringify({ type: "leaderboard_update", timestamp: Date.now() });

  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

export function broadcastLeaderboardData(leaderboardData: any[]) {
  const message = JSON.stringify({ 
    type: "leaderboard_data", 
    data: leaderboardData,
    timestamp: Date.now() 
  });

  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

export function broadcastUserAchievement(userId: string, achievement: any) {
  const message = JSON.stringify({ 
    type: "achievement_unlocked", 
    userId,
    achievement,
    timestamp: Date.now() 
  });

  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

export function broadcastPointsEarned(userId: string, points: number, activity: string) {
  const message = JSON.stringify({ 
    type: "points_earned", 
    userId,
    points,
    activity,
    timestamp: Date.now() 
  });

  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}