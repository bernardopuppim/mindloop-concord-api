import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createApp } from "../server/app";

let app: any;

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (!app) {
    app = await createApp();
  }

  return app(req, res);
}

