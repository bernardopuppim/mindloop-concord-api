import express from "express";
import { registerRoutes } from "./routes.js";

export async function createApp() {
  const app = express();

  // Trust proxy (Vercel / Cloudflare)
  app.set("trust proxy", 1);

  // Body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  // Healthcheck obrigatório
  app.get("/health", (_req, res) => {
    res.status(200).json({ ok: true });
  });

  // Register routes
  await registerRoutes(app);

  return app;
}
