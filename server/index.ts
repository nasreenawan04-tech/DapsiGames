import express, { type Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { setupSecurityMiddleware } from "./middleware/security";
import { db } from "./db";
import { sql } from "drizzle-orm";
import { initializeDatabase as initDB } from "./init-db";

const app = express();

app.set('trust proxy', 1);

setupSecurityMiddleware(app);

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
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

async function setupApp() {
  // Initialize database tables using the proper initialization function
  await initDB();

  // Register routes - will handle WebSocket setup internally if not on Vercel
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  return server;
}

// For Vercel serverless deployment - initialize once and export the app
let appInitialized = false;
let appReadyPromise: Promise<any> | null = null;

async function ensureAppInitialized() {
  if (!appInitialized) {
    if (!appReadyPromise) {
      // Use the same setupApp function - it now handles Vercel environment
      appReadyPromise = setupApp().then(() => {
        appInitialized = true;
      }).catch((error) => {
        console.error('Failed to initialize app:', error);
        appInitialized = false;
        appReadyPromise = null;
        throw error;
      });
    }
    await appReadyPromise;
  }
}

// Export for Vercel - the app itself with initialization wrapper
export default async (req: any, res: any) => {
  try {
    await ensureAppInitialized();
    app(req, res);
  } catch (error) {
    console.error('Vercel handler error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal Server Error', message: String(error) });
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