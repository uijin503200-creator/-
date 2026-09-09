import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { requireAuth, AuthRequest } from './src/middleware/auth.ts';
import { getOrCreateUser, dropNote, getNearbyNotes, readNote, echoNote } from './src/db/queries.ts';
import axios from 'axios';

async function startServer() {
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
      
      let writtenWeather = "Clear";
      let writtenTime = "Day";
      
      try {
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`;
        const weatherRes = await axios.get(weatherUrl);
        const code = weatherRes.data.current_weather.weathercode;
        const isDay = weatherRes.data.current_weather.is_day;
        
        writtenTime = isDay ? "Day" : "Night";
        
        // WMO Weather interpretation codes
        if ([0, 1, 2, 3].includes(code)) writtenWeather = "Clear";
        else if ([45, 48].includes(code)) writtenWeather = "Fog";
        else if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(code)) writtenWeather = "Rain";
        else if ([71, 73, 75, 77, 85, 86].includes(code)) writtenWeather = "Snow";
      } catch (err) {
        console.error("Failed to fetch weather from open-meteo", err);
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
