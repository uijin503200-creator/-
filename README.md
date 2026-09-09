# Task Board

A minimal full-stack starter app: an [Express](https://expressjs.com/) JSON API
with an in-memory task store and a modern vanilla-JS frontend. It demonstrates a
complete end-to-end flow — create, list, toggle, and delete tasks.

## Requirements

- Node.js >= 20 (developed against Node 22)

## Getting started

```bash
npm install
npm start
```

Then open http://localhost:3000. Set `PORT` to change the port.

## Scripts

| Command       | Description                                   |
| ------------- | --------------------------------------------- |
| `npm start`   | Start the server on `PORT` (default `3000`).  |
| `npm run dev` | Start with file watching (`node --watch`).    |
| `npm test`    | Run the unit and HTTP integration tests.      |

## API

| Method   | Path              | Description            |
| -------- | ----------------- | ---------------------- |
| `GET`    | `/api/health`     | Health check.          |
| `GET`    | `/api/tasks`      | List all tasks.        |
| `POST`   | `/api/tasks`      | Create a task.         |
| `PATCH`  | `/api/tasks/:id`  | Update title / `done`. |
| `DELETE` | `/api/tasks/:id`  | Delete a task.         |

## Project layout

```
src/server.js   Express app + routes
src/store.js    In-memory task store
public/         Static frontend (HTML/CSS/JS)
test/           Node test-runner unit + integration tests
```

## Cloud Agent environment

`.cursor/environment.json` configures the Cursor Cloud Agent environment: it runs
`npm install` on setup and launches the server (`npm start`) in a `server`
terminal, exposing port `3000`.
