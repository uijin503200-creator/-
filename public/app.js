const listEl = document.getElementById("task-list");
const emptyEl = document.getElementById("empty-state");
const formEl = document.getElementById("new-task-form");
const inputEl = document.getElementById("new-task-input");
const statusEl = document.getElementById("status");

function setStatus(message) {
  statusEl.textContent = message;
  if (message) {
    setTimeout(() => {
      if (statusEl.textContent === message) statusEl.textContent = "";
    }, 2500);
  }
}

async function api(path, options) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok && res.status !== 204) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.status === 204 ? null : res.json();
}

function render(tasks) {
  listEl.innerHTML = "";
  emptyEl.hidden = tasks.length > 0;

  for (const task of tasks) {
    const li = document.createElement("li");
    li.className = `task${task.done ? " task--done" : ""}`;
    li.dataset.id = task.id;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "task__checkbox";
    checkbox.checked = task.done;
    checkbox.addEventListener("change", () => toggle(task, checkbox.checked));

    const title = document.createElement("span");
    title.className = "task__title";
    title.textContent = task.title;

    const del = document.createElement("button");
    del.className = "task__delete";
    del.type = "button";
    del.setAttribute("aria-label", "Delete task");
    del.textContent = "\u00d7";
    del.addEventListener("click", () => remove(task));

    li.append(checkbox, title, del);
    listEl.append(li);
  }
}

async function refresh() {
  try {
    const tasks = await api("/api/tasks");
    render(tasks);
  } catch (err) {
    setStatus(err.message);
  }
}

async function toggle(task, done) {
  try {
    await api(`/api/tasks/${task.id}`, {
      method: "PATCH",
      body: JSON.stringify({ done }),
    });
    setStatus(done ? "Task completed" : "Task reopened");
    refresh();
  } catch (err) {
    setStatus(err.message);
  }
}

async function remove(task) {
  try {
    await api(`/api/tasks/${task.id}`, { method: "DELETE" });
    setStatus("Task deleted");
    refresh();
  } catch (err) {
    setStatus(err.message);
  }
}

formEl.addEventListener("submit", async (event) => {
  event.preventDefault();
  const title = inputEl.value.trim();
  if (!title) return;
  try {
    await api("/api/tasks", {
      method: "POST",
      body: JSON.stringify({ title }),
    });
    inputEl.value = "";
    setStatus("Task added");
    refresh();
  } catch (err) {
    setStatus(err.message);
  }
});

refresh();
