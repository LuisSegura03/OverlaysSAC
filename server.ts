import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import type { OverlayState } from "./src/types";
import { mergeOverlayState } from "./lib/overlay-state";
import { loadOverlayState, saveOverlayState } from "./lib/state-storage";

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);

  // Global Middlewares
  app.use(express.json());

  // Memory cache of the state
  let currentState: OverlayState = await loadOverlayState();

  // Active SSE clients
  let clients: { id: number; res: express.Response }[] = [];
  let clientIdCounter = 0;

  // Broadcast state to all connected SSE clients
  function broadcastState(state: OverlayState) {
    const payload = JSON.stringify(state);
    clients.forEach((client) => {
      client.res.write(`data: ${payload}\n\n`);
    });
  }

  // API Route - Get current state
  app.get("/api/overlay", (req, res) => {
    res.setHeader("Cache-Control", "no-store, max-age=0");
    res.json(currentState);
  });

  // API Route - Update state
  app.post("/api/overlay", async (req, res) => {
    try {
      currentState = mergeOverlayState(currentState, req.body);
      await saveOverlayState(currentState);

      // Broadcast changes to active overlays in real-time
      broadcastState(currentState);

      res.json({ success: true, state: currentState });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || "Error updating overlay" });
    }
  });

  // API Route - SSE Realtime Events channel
  app.get("/api/events", (req, res) => {
    // Write SSE headers
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive"
    });

    // Send initial state immediately
    const payload = JSON.stringify(currentState);
    res.write(`data: ${payload}\n\n`);

    const myId = ++clientIdCounter;
    clients.push({ id: myId, res });
    // Keep alive message every 30 seconds
    const intervalId = setInterval(() => {
      res.write(`: keepalive\n\n`);
    }, 30000);

    // Client connection tear-down
    req.on("close", () => {
      clearInterval(intervalId);
      clients = clients.filter((c) => c.id !== myId);
    });
  });

  // Serve static assets or use Vite dev server
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[OBS SERVER] corriendo en http://localhost:${PORT}`);
  });
}

startServer();
