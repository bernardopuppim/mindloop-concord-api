import type { Request, Response, NextFunction } from "express";

export type Role = "admin" | "fiscal" | "operador" | "visualizador";

export function requireRole(allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = req.user?.app_metadata?.role;

    if (!role || !allowedRoles.includes(role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    next();
  };
}
