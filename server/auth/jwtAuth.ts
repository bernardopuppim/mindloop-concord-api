import type { Request, Response, NextFunction } from "express";
import { supabaseAdmin } from "../supabaseClient.js";

export async function authenticateJWT(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "Missing Authorization header" });
  }

  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Invalid Authorization format" });
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    (req as any).user = data.user;
    return next();
  } catch (err) {
    console.error("Authentication error:", err);
    return res.status(401).json({ message: "Authentication failed" });
  }
}
