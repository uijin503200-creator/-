import { randomUUID } from "node:crypto";

/**
 * A tiny in-memory task store. Kept separate from the HTTP layer so it can be
 * unit tested directly and swapped for a real database later.
 */
export function createTaskStore(seed = true) {
  const tasks = new Map();

  function add(title) {
    const trimmed = String(title ?? "").trim();
    if (!trimmed) {
      throw new Error("title is required");
    }
    const task = {
      id: randomUUID(),
      title: trimmed,
      done: false,
      createdAt: new Date().toISOString(),
    };
    tasks.set(task.id, task);
    return task;
  }

  function list() {
    return [...tasks.values()].sort((a, b) =>
      a.createdAt < b.createdAt ? -1 : 1
    );
  }

  function get(id) {
    return tasks.get(id) ?? null;
  }

  function update(id, patch) {
    const task = tasks.get(id);
    if (!task) return null;
    if (typeof patch.title === "string" && patch.title.trim()) {
      task.title = patch.title.trim();
    }
    if (typeof patch.done === "boolean") {
      task.done = patch.done;
    }
    return task;
  }

  function remove(id) {
    return tasks.delete(id);
  }

  if (seed) {
    add("Read the project README");
    add("Run the app locally");
    const seeded = add("Ship something great");
    update(seeded.id, { done: false });
  }

  return { add, list, get, update, remove };
}
