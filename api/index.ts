// 🧪 ETAPA 2: Express Base com Middlewares
// Objetivo: Validar que middlewares Express não causam problemas no runtime
// Temporário: será evoluído para ETAPA 3 após validação

import type { VercelRequest, VercelResponse } from "@vercel/node";
import express from "express";

let app: any;

async function createApp() {
  const app = express();

  app.set("trust proxy", 1);
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  app.get("/api", (_req, res) => {
    res.json({ ok: true, step: "express-base" });
  });

  return app;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!app) {
    app = await createApp();
  }
  return app(req, res);
}
