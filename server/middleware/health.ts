import type { Request, Response } from "express";
import { db } from "../db";
import { sql } from "drizzle-orm";

const startTime = Date.now();

export async function healthCheck(_req: Request, res: Response) {
  try {
    await db.execute(sql`SELECT 1`);
    
    const uptime = Math.floor((Date.now() - startTime) / 1000);
    
    res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime,
      database: "connected",
    });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      database: "disconnected",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
