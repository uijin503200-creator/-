import express from "express";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createTaskStore } from "./store.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

export function createApp(store = createTaskStore()) {
  const app = express();
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", uptime: process.uptime() });
  });

  app.get("/api/tasks", (_req, res) => {
    res.json(store.list());
  });

  app.post("/api/tasks", (req, res) => {
    try {
      const task = store.add(req.body?.title);
      res.status(201).json(task);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.patch("/api/tasks/:id", (req, res) => {
    const task = store.update(req.params.id, req.body ?? {});
    if (!task) {
      res.status(404).json({ error: "task not found" });
      return;
    }
    res.json(task);
  });

  app.delete("/api/tasks/:id", (req, res) => {
    const removed = store.remove(req.params.id);
    if (!removed) {
      res.status(404).json({ error: "task not found" });
      return;
    }
    res.status(204).end();
  });

  app.use(express.static(join(__dirname, "..", "public")));

  return app;
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  const port = Number(process.env.PORT) || 3000;
  const app = createApp();
  app.listen(port, () => {
    console.log(`Task board listening on http://localhost:${port}`);
  });
}
