import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { OverlayState } from "./src/types";

// Default configuration on initial load
const DEFAULT_WCA_CATEGORIES = [
  { id: "333", name: "3x3x3 Cube", eventName: "WCA 3x3x3 Cube - South American Championship 2026", defaultP1Name: "Luis Competidor", defaultP1Times: ["11.24", "12.50", "9.80", "15.30", "11.10"], defaultP2Name: "Max Park", defaultP2Times: ["3.13", "4.50", "3.80", "3.63", "4.11"] },
  { id: "222", name: "2x2x2 Cube", eventName: "WCA 2x2x2 Cube - Championship 2026", defaultP1Name: "Zayn Khan", defaultP1Times: ["2.52", "3.10", "2.10", "3.85", "1.99"], defaultP2Name: "Antonin Y.", defaultP2Times: ["1.20", "1.45", "1.10", "1.80", "1.30"] },
  { id: "444", name: "4x4x4 Cube", eventName: "WCA 4x4x4 Cube - Championship 2026", defaultP1Name: "Luis Competidor", defaultP1Times: ["42.50", "44.10", "39.80", "45.00", "41.20"], defaultP2Name: "Max Park", defaultP2Times: ["17.50", "18.20", "16.80", "19.10", "17.90"] },
  { id: "555", name: "5x5x5 Cube", eventName: "WCA 5x5x5 Cube - Championship 2026", defaultP1Name: "Luis Competidor", defaultP1Times: ["1:15.20", "1:12.80", "1:18.50", "1:14.30", "1:10.90"], defaultP2Name: "Max Park", defaultP2Times: ["34.50", "36.20", "35.10", "33.90", "34.80"] },
  { id: "333oh", name: "3x3x3 One-Handed", eventName: "WCA 3x3x3 OH - Championship 2026", defaultP1Name: "Luis Competidor", defaultP1Times: ["18.50", "19.20", "17.90", "21.10", "18.20"], defaultP2Name: "Fawaz A.", defaultP2Times: ["9.80", "10.50", "10.10", "11.20", "9.50"] },
  { id: "pyram", name: "Pyraminx", eventName: "WCA Pyraminx - Championship 2026", defaultP1Name: "Luis Competidor", defaultP1Times: ["4.50", "5.10", "4.20", "6.20", "4.80"], defaultP2Name: "Steven W.", defaultP2Times: ["1.20", "1.45", "1.10", "1.80", "1.30"] },
  { id: "skewb", name: "Skewb", eventName: "WCA Skewb - Championship 2026", defaultP1Name: "Luis Competidor", defaultP1Times: ["5.20", "6.10", "4.80", "7.10", "5.50"], defaultP2Name: "Carter K.", defaultP2Times: ["1.80", "2.10", "1.95", "3.20", "1.50"] },
  { id: "clock", name: "Clock", eventName: "WCA Clock - Championship 2026", defaultP1Name: "Luis Competidor", defaultP1Times: ["8.50", "9.10", "7.80", "10.20", "8.90"], defaultP2Name: "Eryk K.", defaultP2Times: ["3.20", "3.90", "3.50", "4.10", "3.40"] }
];

function buildDefaultCategories(existingData?: any, existingCompetitors?: any[], existingActive?: string, existingActive2?: string, existingEventName?: string): Record<string, any> {
  const categories: Record<string, any> = {};
  DEFAULT_WCA_CATEGORIES.forEach(cat => {
    if (cat.id === "333" && existingData) {
      categories[cat.id] = {
        id: cat.id,
        name: cat.name,
        eventName: existingEventName || cat.eventName,
        data: {
          competitorName: existingData.competitorName,
          countryName: existingData.countryName,
          countryFlagUrl: existingData.countryFlagUrl,
          times: existingData.times
        },
        competitors: existingCompetitors || [],
        activeCompetitorId: existingActive,
        activeCompetitorId2: existingActive2
      };
    } else {
      categories[cat.id] = {
        id: cat.id,
        name: cat.name,
        eventName: cat.eventName,
        data: {
          competitorName: cat.defaultP1Name,
          countryName: "Colombia",
          countryFlagUrl: "https://flagcdn.com/w80/co.png",
          times: cat.defaultP1Times
        },
        competitors: [
          {
            id: `comp-${cat.id}-1`,
            competitorName: cat.defaultP1Name,
            countryName: "Colombia",
            countryFlagUrl: "https://flagcdn.com/w80/co.png",
            times: cat.defaultP1Times
          },
          {
            id: `comp-${cat.id}-2`,
            competitorName: cat.defaultP2Name,
            countryName: "Estados Unidos",
            countryFlagUrl: "https://flagcdn.com/w80/us.png",
            times: cat.defaultP2Times
          }
        ],
        activeCompetitorId: `comp-${cat.id}-1`,
        activeCompetitorId2: `comp-${cat.id}-2`
      };
    }
  });
  return categories;
}

const DEFAULT_STATE: OverlayState = {
  data: {
    competitorName: "Luis Competidor",
    countryName: "Colombia",
    countryFlagUrl: "https://flagcdn.com/w80/co.png",
    times: ["11.24", "12.50", "9.80", "15.30", "11.10"]
  },
  styles: {
    fontFamily: "Space Grotesk",
    fontSize: "base",
    backgroundColor: "#0d0e12",
    bgOpacity: 85,
    textColor: "#ffffff",
    accentColor: "#38bdf8",
    borderColor: "#334155",
    borderWidth: 1,
    borderRadius: "lg",
    showStrikeouts: true,
    showFlag: true,
    padding: "normal",
    shadow: "md",
    animation: "pop",
    width: 380,
    layout: "single",
    versusLayoutType: "cards",
    eventName: "WCA 3x3x3 Cube - South American Championship 2026"
  },
  competitors: [
    {
      id: "comp-333-1",
      competitorName: "Luis Competidor",
      countryName: "Colombia",
      countryFlagUrl: "https://flagcdn.com/w80/co.png",
      times: ["11.24", "12.50", "9.80", "15.30", "11.10"]
    },
    {
      id: "comp-333-2",
      competitorName: "Max Park",
      countryName: "Estados Unidos",
      countryFlagUrl: "https://flagcdn.com/w80/us.png",
      times: ["3.13", "4.50", "3.80", "3.63", "4.11"]
    }
  ],
  activeCompetitorId: "comp-333-1",
  activeCompetitorId2: "comp-333-2",
  isVisible: true,
  currentCategoryId: "333",
  categories: {},
  updatedAt: Date.now()
};

DEFAULT_STATE.categories = buildDefaultCategories(
  DEFAULT_STATE.data,
  DEFAULT_STATE.competitors,
  DEFAULT_STATE.activeCompetitorId,
  DEFAULT_STATE.activeCompetitorId2,
  DEFAULT_STATE.styles.eventName
);

const STATE_FILE_PATH = path.join(process.cwd(), "overlay_state.json");

// Read state from disk or return default
function readState(): OverlayState {
  try {
    if (fs.existsSync(STATE_FILE_PATH)) {
      const fileData = fs.readFileSync(STATE_FILE_PATH, "utf8");
      const parsed = JSON.parse(fileData);
      
      // Ensure backward compatibility migration
      if (!parsed.competitors || !Array.isArray(parsed.competitors) || parsed.competitors.length === 0) {
        parsed.competitors = [
          {
            id: "comp-333-1",
            competitorName: parsed.data?.competitorName || "Luis Competidor",
            countryName: parsed.data?.countryName || "Colombia",
            countryFlagUrl: parsed.data?.countryFlagUrl || "https://flagcdn.com/w80/co.png",
            times: parsed.data?.times || ["11.24", "12.50", "9.80", "15.30", "11.10"]
          }
        ];
        parsed.activeCompetitorId = "comp-333-1";
      }
      if (!parsed.activeCompetitorId2) {
        parsed.activeCompetitorId2 = parsed.competitors[1]?.id || parsed.competitors[0]?.id || "comp-333-2";
      }
      if (parsed.isVisible === undefined) {
        parsed.isVisible = true;
      }
      if (!parsed.currentCategoryId) {
        parsed.currentCategoryId = "333";
      }
      if (!parsed.categories) {
        parsed.categories = buildDefaultCategories(
          parsed.data || DEFAULT_STATE.data,
          parsed.competitors || DEFAULT_STATE.competitors,
          parsed.activeCompetitorId || DEFAULT_STATE.activeCompetitorId,
          parsed.activeCompetitorId2 || DEFAULT_STATE.activeCompetitorId2,
          parsed.styles?.eventName || DEFAULT_STATE.styles.eventName
        );
      }
      if (parsed.styles) {
        if (!parsed.styles.layout) {
          parsed.styles.layout = "single";
        }
        if (!parsed.styles.versusLayoutType) {
          parsed.styles.versusLayoutType = "cards";
        }
        if (!parsed.styles.eventName) {
          parsed.styles.eventName = parsed.categories[parsed.currentCategoryId]?.eventName || "WCA South American Championship 2026";
        }
      }
      return parsed;
    }
  } catch (error) {
    console.error("Failed to read overlay state, using defaults:", error);
  }
  return DEFAULT_STATE;
}

// Write state to disk
function saveState(state: OverlayState) {
  try {
    fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(state, null, 2), "utf8");
  } catch (error) {
    console.error("Failed to persist overlay state:", error);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Global Middlewares
  app.use(express.json());

  // Memory cache of the state
  let currentState: OverlayState = readState();

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
    res.json(currentState);
  });

  // API Route - Update state
  app.post("/api/overlay", (req, res) => {
    try {
      let { data, styles, competitors, activeCompetitorId, activeCompetitorId2, isVisible, currentCategoryId, categories } = req.body;
      
      // 1. If we are changing currentCategoryId, first save the current root properties to the old category state
      const targetCategoryId = currentCategoryId || currentState.currentCategoryId || "333";
      const oldCategoryId = currentState.currentCategoryId || "333";

      if (currentState.categories && currentState.categories[oldCategoryId]) {
        currentState.categories[oldCategoryId] = {
          ...currentState.categories[oldCategoryId],
          data: data !== undefined ? data : currentState.data,
          competitors: competitors !== undefined ? competitors : currentState.competitors,
          activeCompetitorId: activeCompetitorId !== undefined ? activeCompetitorId : currentState.activeCompetitorId,
          activeCompetitorId2: activeCompetitorId2 !== undefined ? activeCompetitorId2 : currentState.activeCompetitorId2,
          eventName: (styles && styles.eventName !== undefined) ? styles.eventName : (currentState.styles?.eventName || "")
        };
      }

      // 2. If a switch actually happened, load the saved category states into root variables!
      if (currentCategoryId !== undefined && currentCategoryId !== currentState.currentCategoryId) {
        const nextCat = (categories || currentState.categories || {})[currentCategoryId];
        if (nextCat) {
          data = nextCat.data;
          competitors = nextCat.competitors;
          activeCompetitorId = nextCat.activeCompetitorId;
          activeCompetitorId2 = nextCat.activeCompetitorId2;
          if (!styles) styles = {};
          styles.eventName = nextCat.eventName || styles.eventName || currentState.styles.eventName;
        }
      }

      // Update global state
      currentState = {
        data: data !== undefined ? data : currentState.data,
        styles: styles ? { ...currentState.styles, ...styles } : currentState.styles,
        competitors: competitors !== undefined ? competitors : currentState.competitors,
        activeCompetitorId: activeCompetitorId !== undefined ? activeCompetitorId : currentState.activeCompetitorId,
        activeCompetitorId2: activeCompetitorId2 !== undefined ? activeCompetitorId2 : currentState.activeCompetitorId2,
        isVisible: isVisible !== undefined ? isVisible : currentState.isVisible,
        currentCategoryId: targetCategoryId,
        categories: categories !== undefined ? categories : (currentState.categories || {}),
        updatedAt: Date.now()
      };

      // 3. Keep the target/current category state perfectly synchronized with newest merged root properties
      if (currentState.currentCategoryId && currentState.categories && currentState.categories[currentState.currentCategoryId]) {
        currentState.categories[currentState.currentCategoryId] = {
          ...currentState.categories[currentState.currentCategoryId],
          data: currentState.data,
          competitors: currentState.competitors,
          activeCompetitorId: currentState.activeCompetitorId,
          activeCompetitorId2: currentState.activeCompetitorId2,
          eventName: currentState.styles.eventName || ""
        };
      }

      // Persist to file
      saveState(currentState);

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
