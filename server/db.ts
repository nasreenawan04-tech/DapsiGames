import { drizzle } from "drizzle-orm/neon-serverless";
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

export const db = pool ? drizzle(pool, { schema }) : null as any;
