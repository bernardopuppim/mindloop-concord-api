import { createApp } from "./app";
import { serveStatic } from "./static";

const PORT = parseInt(process.env.PORT || "3001", 10);

(async () => {
  const { app, httpServer } = await createApp();

  // Setup static files or Vite in development
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  httpServer.listen(
    { port: PORT, host: "0.0.0.0" },
    () => console.log(`🚀 API running on port ${PORT}`)
  );
})();
