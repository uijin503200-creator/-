import { test } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/server.js";
import { createTaskStore } from "../src/store.js";

function listen(app) {
  return new Promise((resolve) => {
    const server = app.listen(0, () => {
      const { port } = server.address();
      resolve({ server, base: `http://127.0.0.1:${port}` });
    });
  });
}

test("full task lifecycle over HTTP", async () => {
  const app = createApp(createTaskStore(false));
  const { server, base } = await listen(app);
  try {
    let res = await fetch(`${base}/api/health`);
    assert.equal(res.status, 200);
    assert.equal((await res.json()).status, "ok");

    res = await fetch(`${base}/api/tasks`);
    assert.deepEqual(await res.json(), []);

    res = await fetch(`${base}/api/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Integration task" }),
    });
    assert.equal(res.status, 201);
    const created = await res.json();
    assert.equal(created.title, "Integration task");

    res = await fetch(`${base}/api/tasks/${created.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: true }),
    });
    assert.equal((await res.json()).done, true);

    res = await fetch(`${base}/api/tasks/${created.id}`, { method: "DELETE" });
    assert.equal(res.status, 204);

    res = await fetch(`${base}/api/tasks`);
    assert.deepEqual(await res.json(), []);
  } finally {
    server.close();
  }
});

test("rejects empty title with 400", async () => {
  const app = createApp(createTaskStore(false));
  const { server, base } = await listen(app);
  try {
    const res = await fetch(`${base}/api/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "" }),
    });
    assert.equal(res.status, 400);
  } finally {
    server.close();
  }
});
