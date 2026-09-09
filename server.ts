import './src/load-env.ts';
import express from "express";
import fs from "node:fs";
import path from "path";
import { createServer as createViteServer } from "vite";
import { requireAuth, AuthRequest } from './src/middleware/auth.ts';
import { getOrCreateUser, dropNote, getNearbyNotes, readNote, echoNote } from './src/db/queries.ts';
import { ensureSchema } from './src/db/migrate.ts';
import { fetchWeatherGhost } from './src/lib/open-meteo.ts';
import { clientIpFromRequest, ipinfoUrl } from './src/lib/client-ip.ts';

async function startServer() {
  await ensureSchema();

  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API ROUTES ---
  
  // Sync User
  app.post("/api/auth/sync", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "No user" });
      const user = await getOrCreateUser(req.user.uid, req.user.email || 'anonymous');
      res.json(user);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get nearby notes
  app.get("/api/notes/nearby", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "No user" });
      const lat = parseFloat(req.query.lat as string);
      const lng = parseFloat(req.query.lng as string);
      if (isNaN(lat) || isNaN(lng)) return res.status(400).json({ error: "Invalid coordinates" });
      
      const notes = await getNearbyNotes(lat, lng, req.user.uid);
      res.json(notes);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });

  // Drop a note
  app.post("/api/notes", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "No user" });
      const { lat, lng, content } = req.body;
      if (!lat || !lng || !content) return res.status(400).json({ error: "Missing fields" });

      let writtenWeather: string | null = null;
      let writtenTime: string | null = null;
      try {
        const ghost = await fetchWeatherGhost(lat, lng);
        writtenWeather = ghost.writtenWeather;
        writtenTime = ghost.writtenTime;
      } catch (weatherError) {
        console.error('Weather ghost capture failed:', weatherError);
      }
      
      const note = await dropNote(req.user.uid, lat, lng, content, writtenWeather, writtenTime);
      res.json(note);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });

  // Read a note (trigger decay)
  app.post("/api/notes/:id/read", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "No user" });
      const note = await readNote(req.params.id, req.user.uid);
      res.json(note);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });

  // Echo a note (add survival time)
  app.post("/api/notes/:id/echo", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "No user" });
      const note = await echoNote(req.params.id);
      res.json(note);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/geo/live", async (req, res) => {
    try {
      const response = await fetch(ipinfoUrl(clientIpFromRequest(req)), {
        headers: { Accept: "application/json" },
      });
      if (!response.ok) {
        res.status(502).json({ error: "Live location unavailable" });
        return;
      }
      const data = await response.json();
      const [lat, lng] = String(data.loc || "").split(",").map(Number);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        res.status(502).json({ error: "Live location unavailable" });
        return;
      }
      res.json({
        lat,
        lng,
        city: data.city,
        region: data.region,
        country: data.country,
        source: "ip",
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });

  const filmFiles = [
    path.resolve(process.cwd(), "public/promo/drift-film.mp4"),
    "/opt/cursor/artifacts/drift_notes_spread_presence_detected.mp4",
  ];
  const sendFilmDownload = (_req: express.Request, res: express.Response) => {
    const file = filmFiles.find((candidate) => fs.existsSync(candidate));
    if (!file) {
      res.status(404).send("Film file is not available.");
      return;
    }
    res.download(file, "drift-film.mp4");
  };
  app.get("/film/download", sendFilmDownload);
  app.get("/film.mp4", sendFilmDownload);

  // --- VITE MIDDLEWARE ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
