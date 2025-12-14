declare namespace Express {
  interface Request {
    user?: {
      id: string;
      email?: string;
      app_metadata?: {
        role?: "admin" | "fiscal" | "operador" | "visualizador";
      };
    };
  }
}
