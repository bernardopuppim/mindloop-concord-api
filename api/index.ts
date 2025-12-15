import type { VercelRequest, VercelResponse } from "@vercel/node";
import express from "express";

let app: any;

async function createApp() {
  const app = express();

  // Trust proxy (Vercel / Cloudflare)
  app.set("trust proxy", 1);

  // Body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  // Healthcheck obrigatório
  app.get("/api/health", (_req, res) => {
    res.status(200).json({ ok: true });
  });

  // IMPORT DINÂMICO (CRÍTICO) - resolve módulos ESM em runtime
  const { registerRoutes } = await import("../server/routes.js");
  await registerRoutes(app);

  return app;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (!app) {
    app = await createApp();
  }

  return app(req, res);
}
