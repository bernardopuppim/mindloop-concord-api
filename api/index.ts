// 🧪 ETAPA 3: Import Dinâmico de Rotas com Instrumentação
// Objetivo: Validar import de registerRoutes e capturar erros detalhados
// Temporário: código de diagnóstico para identificar causa raiz de falhas

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

  // 🔍 IMPORT DINÂMICO INSTRUMENTADO
  try {
    console.log("[BOOTSTRAP] Iniciando import de registerRoutes...");

    const { registerRoutes } = await import("../server/routes.js");

    console.log("[BOOTSTRAP] registerRoutes importado com sucesso");
    console.log("[BOOTSTRAP] Registrando rotas...");

    await registerRoutes(app);

    console.log("[BOOTSTRAP] Rotas registradas com sucesso");
  } catch (err: any) {
    console.error("[BOOTSTRAP ERROR] Falha ao carregar rotas:", {
      message: err?.message,
      stack: err?.stack,
      name: err?.name,
      cause: err?.cause,
    });

    // Endpoint de diagnóstico para expor erro
    app.get("/api/bootstrap-error", (_req, res) => {
      res.status(500).json({
        error: "Bootstrap failed",
        message: err?.message,
        name: err?.name,
        stack: err?.stack?.split("\n").slice(0, 5),
      });
    });

    throw err;
  }

  return app;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!app) {
    app = await createApp();
  }
  return app(req, res);
}
