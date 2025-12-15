import type { VercelRequest, VercelResponse } from "@vercel/node";
import express from "express";

let app: any;

async function createApp() {
  const app = express();

  app.set("trust proxy", 1);
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  // Healthcheck obrigatório
  app.get("/api/health", (_req, res) => {
    res.status(200).json({ ok: true });
  });

  // Import dinâmico de rotas
  const { registerRoutes } = await import("../server/routes.js");
  await registerRoutes(app);

  return app;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!app) {
    app = await createApp();
  }
  return app(req, res);
}
