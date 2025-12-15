// 🧪 ETAPA 1: Isolamento Total - Handler Express Mínimo
// Objetivo: Validar que o runtime do Vercel executa Express corretamente
// Temporário: Este código será evoluído em etapas controladas

import type { VercelRequest, VercelResponse } from "@vercel/node";
import express from "express";

let app: any;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!app) {
    const a = express();

    a.get("/api", (_req, res) => {
      res.json({ ok: true, isolated: true });
    });

    app = a;
  }

  return app(req, res);
}
