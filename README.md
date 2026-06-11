<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/1906aee2-39b3-4d1c-a496-3dfd64bf10ff

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deploy on Vercel

This project uses a local Express server in development, but Vercel only exposes serverless functions under `/api`. The production deployment now uses [api/overlay.ts](/home/luigi/SACStream/OverlaysSAC/api/overlay.ts) and stores overlay state in Vercel Blob instead of writing to `overlay_state.json`.

Required setup:

1. In Vercel, create or connect a Blob store to this project.
2. Make sure the project has either `BLOB_STORE_ID` plus `VERCEL_OIDC_TOKEN` or `BLOB_READ_WRITE_TOKEN` available in the deployment environment.
3. Redeploy the project.

Production behavior:

- Development keeps using SSE through [server.ts](/home/luigi/SACStream/OverlaysSAC/server.ts).
- Production uses polling from [src/App.tsx](/home/luigi/SACStream/OverlaysSAC/src/App.tsx) so it does not rely on a long-lived SSE connection in Vercel.
- If Blob storage is not configured, `GET /api/overlay` falls back to the default overlay state and `POST /api/overlay` returns an error instead of silently failing.
