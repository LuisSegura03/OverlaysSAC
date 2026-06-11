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

  if (req.method === "GET") {
    const state = await loadOverlayState();
    res.status(200).json(state);
    return;
  }

  if (req.method === "POST") {
    try {
      const currentState = await loadOverlayState();
      const updates = readJsonBody(req.body) as Partial<OverlayState>;
      const nextState = mergeOverlayState(currentState, updates);
      await saveOverlayState(nextState);
      res.status(200).json({ success: true, state: nextState });
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error updating overlay";
      res.status(400).json({ success: false, error: message });
      return;
    }
  }

  res.setHeader("Allow", "GET, POST");
  res.status(405).json({ success: false, error: "Method not allowed" });
}