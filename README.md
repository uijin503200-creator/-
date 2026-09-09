<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Drift

Anonymous proximity messaging. Leave notes at your physical location for others to find.

View the source applet in AI Studio: https://ai.studio/apps/f9e4c8aa-d493-4be3-856c-b762dcdbd65c

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Copy [`.env.example`](.env.example) to `.env.local` and set secrets as needed.
3. The Google Maps JavaScript API key is already configured (`VITE_GOOGLE_MAPS_API_KEY`). Restrict it to your domains in Google Cloud Console.
4. Run the app:
   `npm run dev`

Open `http://localhost:3000`. Add `?demo=1` to skip Google sign-in and load the radar map (nearby notes still need Postgres + Firebase for the full API).

If the browser blocks geolocation, Drift falls back to Seoul so the map still renders.
