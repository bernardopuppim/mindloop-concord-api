import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { registerRoutes } from "./routes";

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

export async function createApp() {
  const app = express();
  const httpServer = createServer(app);

  // Trust proxy (Vercel/Cloudflare/etc)
  app.set("trust proxy", 1);

  // Body parsing with raw body for webhooks
  app.use(
    express.json({
      verify: (req, _res, buf) => {
        (req as any).rawBody = buf;
      }
    })
  );

  app.use(express.urlencoded({ extended: false }));

  // Healthcheck (OBRIGATÓRIO)
  app.get("/api/health", (_req, res) => res.status(200).json({ ok: true }));

  // Register all routes
  //await registerRoutes(httpServer, app);

  return { app, httpServer };
}

// Export default app instance for serverless convenience
let appInstance: express.Express | null = null;

export default async function getApp() {
  if (!appInstance) {
    const { app } = await createApp();
    appInstance = app;
  }
  return appInstance;
}
