import type { Request, Response } from "express";
import { db } from "../db";
import { sql } from "drizzle-orm";

const startTime = Date.now();

export async function healthCheck(_req: Request, res: Response) {
  const checks: any = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startTime) / 1000),
    environment: process.env.NODE_ENV || "development",
    platform: process.env.VERCEL ? "vercel" : "local",
    database: "unknown",
  };

  try {
    if (db) {
      await db.execute(sql`SELECT 1`);
      checks.database = "connected";
    } else {
      checks.database = "not_configured";
      checks.status = "degraded";
    }
  } catch (error) {
    checks.status = "unhealthy";
    checks.database = "disconnected";
    checks.databaseError = error instanceof Error ? error.message : "Unknown error";
  }

  const statusCode = checks.status === "healthy" ? 200 : 
                     checks.status === "degraded" ? 200 : 503;
  
  res.status(statusCode).json(checks);
}

export async function debugInfo(_req: Request, res: Response) {
  try {
    const info = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      platform: process.env.VERCEL ? "vercel" : "local",
      nodeVersion: process.version,
      uptime: Math.floor((Date.now() - startTime) / 1000),
      memory: process.memoryUsage(),
      env: {
        hasDatabase: !!process.env.DATABASE_URL,
        hasSessionSecret: !!process.env.SESSION_SECRET,
        isVercel: !!process.env.VERCEL,
        region: process.env.VERCEL_REGION || "unknown",
      }
    };
    
    res.status(200).json(info);
  } catch (error) {
    res.status(500).json({
      error: "Failed to get debug info",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
