import express, { type Request, type Response, type NextFunction } from "express";
import * as expressSession from "express-session";
import * as memorystore from "memorystore";
import { storage } from "./storage";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";
import { log } from "./utils";
import { setupSecurityMiddleware } from "./middleware/security";
import { db } from "./db";
import { sql } from "drizzle-orm";
import { initializeDatabase as initDB } from "./init-db";

const app = express();

app.set('trust proxy', 1);

setupSecurityMiddleware(app);

const MemoryStore = memorystore.default;
const session = expressSession.default;
const MemoryStoreSession = MemoryStore(session);

// Require SESSION_SECRET in production, use a generated one in development
const sessionSecret = process.env.SESSION_SECRET || (() => {
  if (process.env.NODE_ENV === 'production') {
    console.warn('WARNING: SESSION_SECRET not set in production. Using a generated secret. This will cause session issues on serverless platforms.');
    return `prod-fallback-${Date.now()}-${Math.random().toString(36).substring(2)}`;
  }
  return `dev-secret-${Math.random().toString(36).substring(2)}`;
})();

app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  store: new MemoryStoreSession({
    checkPeriod: 86400000
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: 'lax'
  }
}));

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}

declare module 'express-session' {
  interface SessionData {
    userId?: string;
  }
}
app.use(express.json({
  verify: (req: Request, _res: Response, buf: Buffer) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson: any, ...args: any[]) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

async function initializeDatabase() {
  try {
    if (!db) {
      console.log("Database connection not available - using in-memory storage");
      return;
    }
    
    // Enable UUID extension
    await db.execute(sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Check if tables exist, create basic ones if not
    console.log("Checking database tables...");

    // This will help identify missing tables
    const result = await db.execute(sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `);

    console.log("Existing tables:", result.rows.map((r: any) => r.table_name));
  } catch (error: any) {
    console.error("Database initialization error (non-fatal):", error.message);
    // Don't throw - allow app to continue with in-memory storage
  }
}

async function setupApp() {
  try {
    console.log('[setupApp] Starting application setup...');
    console.log('[setupApp] Environment:', process.env.NODE_ENV);
    console.log('[setupApp] Running on Vercel:', process.env.VERCEL ? 'YES' : 'NO');
    
    // Initialize database tables
    try {
      await initializeDatabase();
      console.log('[setupApp] Database initialization completed');
    } catch (dbError: any) {
      console.error('[setupApp] Database initialization failed (continuing):', dbError.message);
      // Continue - app can work with in-memory storage
    }

    // Register routes - will handle WebSocket setup internally if not on Vercel
    let server;
    try {
      server = await registerRoutes(app);
      console.log('[setupApp] Routes registered successfully');
    } catch (routeError: any) {
      console.error('[setupApp] FATAL: Failed to register routes:', routeError);
      throw new Error(`Route registration failed: ${routeError.message}`);
    }

    // Error handler middleware - must be registered after routes
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      console.error('[Error Handler] Status:', status);
      console.error('[Error Handler] Message:', message);
      console.error('[Error Handler] Stack:', err.stack);
      
      if (!res.headersSent) {
        res.status(status).json({ 
          message,
          error: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
      }
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      console.log('[setupApp] Setting up Vite for development');
      await setupVite(app, server);
    } else {
      console.log('[setupApp] Serving static files for production');
      serveStatic(app);
    }

    console.log('[setupApp] Application setup completed successfully');
    return server;
  } catch (error: any) {
    console.error('[setupApp] FATAL ERROR:', error);
    console.error('[setupApp] Error stack:', error.stack);
    throw error;
  }
}

// For Vercel serverless deployment - initialize once and export the app
let appInitialized = false;
let appReadyPromise: Promise<any> | null = null;
let initializationError: Error | null = null;

async function ensureAppInitialized() {
  console.log('[ensureAppInitialized] Called. Initialized:', appInitialized);
  
  if (!appInitialized) {
    if (!appReadyPromise) {
      console.log('[ensureAppInitialized] Starting new initialization...');
      // Use the same setupApp function - it now handles Vercel environment
      appReadyPromise = setupApp().then(() => {
        console.log('[ensureAppInitialized] Initialization successful');
        appInitialized = true;
        initializationError = null;
      }).catch((error) => {
        console.error('[ensureAppInitialized] FATAL: Initialization failed:', error);
        console.error('[ensureAppInitialized] Error stack:', error.stack);
        appInitialized = false;
        appReadyPromise = null;
        initializationError = error;
        throw error;
      });
    }
    await appReadyPromise;
  }
  
  if (initializationError) {
    throw initializationError;
  }
}

// Export for Vercel - the app itself with initialization wrapper
export default async (req: any, res: any) => {
  const startTime = Date.now();
  console.log('[Vercel Handler] Request:', req.method, req.url);
  
  try {
    await ensureAppInitialized();
    console.log('[Vercel Handler] App initialized, processing request...');
    app(req, res);
    const duration = Date.now() - startTime;
    console.log('[Vercel Handler] Request completed in', duration, 'ms');
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error('[Vercel Handler] ERROR after', duration, 'ms');
    console.error('[Vercel Handler] Error type:', error.constructor.name);
    console.error('[Vercel Handler] Error message:', error.message);
    console.error('[Vercel Handler] Error stack:', error.stack);
    
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Internal Server Error',
        message: error.message,
        type: error.constructor.name,
        timestamp: new Date().toISOString(),
        // Include stack trace in development or when debugging
        stack: process.env.DEBUG ? error.stack : undefined
      });
    }
  }
};

// For local development and traditional hosting
if (!process.env.VERCEL) {
  setupApp().then((server) => {
    // ALWAYS serve the app on the port specified in the environment variable PORT
    // Other ports are firewalled. Default to 5000 if not specified.
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = parseInt(process.env.PORT || '5000', 10);
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`serving on port ${port}`);
    });
  });
}