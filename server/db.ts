import { drizzle, type NeonDatabase } from "drizzle-orm/neon-serverless";
import { neonConfig, Pool } from "@neondatabase/serverless";
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Database connection is optional - using in-memory storage by default
let pool: Pool | null = null;

if (process.env.DATABASE_URL) {
  pool = new Pool({ 
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === "development" ? {
      rejectUnauthorized: false
    } : true
  });
}

export const db: NeonDatabase<typeof schema> | null = pool ? drizzle(pool, { schema }) : null;

export class DatabaseUnavailableError extends Error {
  constructor() {
    super("Database connection is not configured. Please set DATABASE_URL environment variable.");
    this.name = "DatabaseUnavailableError";
  }
}

export function requireDb(): NeonDatabase<typeof schema> {
  if (!db) {
    throw new DatabaseUnavailableError();
  }
  return db;
}

export function tryGetDb(): NeonDatabase<typeof schema> | null {
  return db;
}

export function isDbAvailable(): boolean {
  return db !== null;
}
