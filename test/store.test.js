import { test } from "node:test";
import assert from "node:assert/strict";
import { createTaskStore } from "../src/store.js";

test("adds and lists tasks", () => {
  const store = createTaskStore(false);
  const task = store.add("Write tests");
  assert.equal(task.title, "Write tests");
  assert.equal(task.done, false);
  assert.equal(store.list().length, 1);
});

test("rejects empty titles", () => {
  const store = createTaskStore(false);
  assert.throws(() => store.add("   "), /title is required/);
});

test("updates and toggles done", () => {
  const store = createTaskStore(false);
  const task = store.add("Ship it");
  const updated = store.update(task.id, { done: true });
  assert.equal(updated.done, true);
});

test("removes tasks", () => {
  const store = createTaskStore(false);
  const task = store.add("Delete me");
  assert.equal(store.remove(task.id), true);
  assert.equal(store.list().length, 0);
});

test("seed populates starter tasks", () => {
  const store = createTaskStore(true);
  assert.ok(store.list().length >= 3);
});
