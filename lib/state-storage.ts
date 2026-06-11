import fs from "fs/promises";
import path from "path";
import type { OverlayState } from "../src/types";
import { createDefaultState, normalizeOverlayState } from "./overlay-state";

const STATE_FILE_PATH = path.join(process.cwd(), "overlay_state.json");
const STATE_BLOB_PATH = "overlay-state.json";

function isBlobStorageConfigured() {
  return Boolean(
    process.env.BLOB_READ_WRITE_TOKEN ||
      (process.env.BLOB_STORE_ID && process.env.VERCEL_OIDC_TOKEN),
  );
}

function isVercelRuntime() {
  return process.env.VERCEL === "1" || process.env.VERCEL === "true";
}

export async function loadOverlayState(): Promise<OverlayState> {
  try {
    if (isBlobStorageConfigured()) {
      const { get } = await import("@vercel/blob");
      const blob = await get(STATE_BLOB_PATH, { access: "private" });
      if (!blob?.stream) {
        return createDefaultState();
      }

      const raw = await new Response(blob.stream).text();
      return normalizeOverlayState(JSON.parse(raw));
    }

    const fileData = await fs.readFile(STATE_FILE_PATH, "utf8");
    return normalizeOverlayState(JSON.parse(fileData));
  } catch (error) {
    const maybeError = error as { code?: string; name?: string };
    if (maybeError.code === "ENOENT" || maybeError.name === "BlobNotFoundError") {
      return createDefaultState();
    }

    console.error("Failed to read overlay state, using defaults:", error);
    return createDefaultState();
  }
}

export async function saveOverlayState(state: OverlayState): Promise<void> {
  const payload = JSON.stringify(state, null, 2);

  if (isBlobStorageConfigured()) {
    const { put } = await import("@vercel/blob");
    await put(STATE_BLOB_PATH, payload, {
      access: "private",
      allowOverwrite: true,
      cacheControlMaxAge: 60,
      contentType: "application/json",
    });
    return;
  }

  if (isVercelRuntime()) {
    throw new Error(
      "Vercel Blob no esta configurado. Conecta un Blob store al proyecto o define BLOB_READ_WRITE_TOKEN.",
    );
  }

  await fs.writeFile(STATE_FILE_PATH, payload, "utf8");
}