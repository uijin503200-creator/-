<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/f9e4c8aa-d493-4be3-856c-b762dcdbd65c

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env.local` and set Postgres plus any API keys
3. Start Postgres and create a `drift` database
4. Run the app:
   `npm run dev`

Open http://localhost:3000. With `DEV_AUTH_BYPASS` and `VITE_DEV_AUTH_BYPASS` set, Enter skips Google sign-in so the radar/composer flow can be used locally.

Allow location when the browser asks. The radar follows live GPS (or network/IP location if the device has no GPS chip).
