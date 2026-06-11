import type { OverlayState } from "../src/types";
import { loadOverlayState, saveOverlayState } from "../lib/state-storage";
import { mergeOverlayState } from "../lib/overlay-state";

function readJsonBody(body: unknown) {
  if (typeof body === "string") {
    return JSON.parse(body);
  }

  return body;
}

export default async function handler(req: any, res: any) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  try {
    if (req.method === "GET") {
      const state = await loadOverlayState();
      res.status(200).json(state);
      return;
    }

    if (req.method === "POST") {
      const currentState = await loadOverlayState();
      const updates = readJsonBody(req.body) as Partial<OverlayState>;
      const nextState = mergeOverlayState(currentState, updates);
      await saveOverlayState(nextState);
      res.status(200).json({ success: true, state: nextState });
      return;
    }

    res.setHeader("Allow", "GET, POST");
    res.status(405).json({ success: false, error: "Method not allowed" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("[api/overlay] unhandled error:", error);
    res.status(500).json({ success: false, error: message });
  }
}