# 088 - Configure frontend and backend origins: Examples

This example wires a Vite React client to an Express API. It demonstrates two local choices:

1. Call the API at its own origin and allow the client origin with CORS.
2. Call a relative /api path through Vite's development proxy.

Choose one local setup. Production still needs its own API URL or reverse-proxy configuration.

## Starting layout

~~~~text
mern-course/
├── client/
│   ├── .env.development
│   ├── vite.config.js
│   └── src/
│       └── lib/
│           └── api.js
└── server/
    ├── .env.example
    └── src/
        ├── app.js
        ├── config/
        │   └── read-config.js
        ├── middleware/
        │   └── error-handler.js
        └── server.js
~~~~

## Option A: Call the API origin directly

### 1. Configure the client URL

~~~~text
# client/.env.development
VITE_API_BASE_URL=http://localhost:4000
~~~~

~~~~text
# client/.env.production
VITE_API_BASE_URL=https://api.example.com
~~~~

The client URL is public configuration. Vite places prefixed values into browser code. Never put private server credentials in these files.

### 2. Centralize requests in the client

~~~~js
// client/src/lib/api.js
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "";

export async function apiRequest(path, options = {}) {
  const response = await fetch(apiBaseUrl + path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers
    }
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error?.message ?? "The request failed.");
  }

  return payload;
}
~~~~

~~~~js
// client/src/features/courses/courseApi.js
import { apiRequest } from "../../lib/api.js";

export function getCourses() {
  return apiRequest("/api/courses");
}

export function createCourse(input) {
  return apiRequest("/api/courses", {
    method: "POST",
    body: JSON.stringify(input)
  });
}
~~~~

Endpoint callers do not need to repeat the origin or response-error handling.

### 3. Parse an explicit server origin allowlist

~~~~text
# server/.env.example
PORT=4000
CLIENT_ORIGINS=http://localhost:5173
~~~~

~~~~js
// server/src/config/read-config.js
export function readConfig(env = process.env) {
  const port = Number(env.PORT ?? 4000);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be a valid TCP port.");
  }

  const clientOrigins = (env.CLIENT_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (clientOrigins.length === 0) {
    throw new Error("CLIENT_ORIGINS must include at least one origin.");
  }

  return { port, clientOrigins };
}
~~~~

Each entry is a complete origin containing scheme, host, and optional port. Do not include a route path such as /api.

### 4. Apply CORS before routes

~~~~js
// server/src/app.js
import express from "express";
import cors from "cors";
import { courseRouter } from "./features/courses/course.routes.js";
import { createErrorHandler } from "./middleware/error-handler.js";

export function createApp(config) {
  const app = express();
  const allowedOrigins = new Set(config.clientOrigins);

  app.use(
    cors({
      origin(origin, callback) {
        // Non-browser tools may omit Origin. This is not authorization.
        if (!origin) {
          return callback(null, true);
        }

        if (allowedOrigins.has(origin)) {
          return callback(null, true);
        }

        return callback(new Error("Origin is not allowed by CORS."));
      }
    })
  );

  app.use(express.json({ limit: "1mb" }));
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });
  app.use("/api/courses", courseRouter);
  app.use(createErrorHandler());

  return app;
}
~~~~

Mounting the CORS middleware before the API routes lets it handle the browser's preflight request as well as add headers to actual responses. For production, set the allowlist to the deployed frontend origin, not the local development address.

A minimal error handler might look like this:

~~~~js
// server/src/middleware/error-handler.js
export function createErrorHandler() {
  return (error, req, res, next) => {
    if (res.headersSent) return next(error);

    const status = Number.isInteger(error.status) ? error.status : 500;
    const message =
      status < 500 ? error.message : "An unexpected server error occurred.";

    if (status >= 500) console.error(error);

    res.status(status).json({ error: { message } });
  };
}
~~~~

The application startup uses the configuration and starts listening:

~~~~js
// server/src/server.js
import { readConfig } from "./config/read-config.js";
import { createApp } from "./app.js";

const config = readConfig();
const app = createApp(config);

app.listen(config.port, () => {
  console.log("API listening on port " + config.port);
});
~~~~

Database initialization can be added to this process entry point. Keep database secrets on the server and load them from protected configuration.

## Option B: Use a Vite proxy for local development

A proxy can make local browser requests appear same-origin by forwarding /api to Express.

~~~~js
// client/vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true
      }
    }
  }
});
~~~~

Configure an empty base URL for local development:

~~~~text
# client/.env.development
VITE_API_BASE_URL=
~~~~

The API helper now calls a relative path such as /api/courses. During development, Vite forwards it to port 4000. This proxy does not automatically exist after deployment.

For production, either set VITE_API_BASE_URL to the public API origin and configure CORS, or configure the production host to forward /api to the server. If the host serves the client and API under the same origin, the client can continue to use relative paths.

## Optional: Credentialed browser requests

Only use this setup if browser cookies must accompany cross-origin requests. Both sides need explicit configuration, and cookie attributes and CSRF protections remain separate requirements.

~~~~js
// Client
const response = await fetch(apiBaseUrl + "/api/profile", {
  credentials: "include"
});
~~~~

~~~~js
// Server CORS configuration
app.use(
  cors({
    origin: "https://app.example.com",
    credentials: true
  })
);
~~~~

Do not combine credentialed requests with a wildcard allowed origin. For a list of credentialed frontend origins, validate each request origin against the list and return the matching allowed origin.

## Environment matrix

| Environment | Client request strategy | Server allowed origins |
| --- | --- | --- |
| Local direct | <code>http://localhost:4000</code> API origin | <code>http://localhost:5173</code> |
| Local with Vite proxy | Relative <code>/api</code> path | Proxy sends requests to the API |
| Staging, separate hosts | Staging API origin | Staging frontend origin |
| Production, separate hosts | Production API origin | Production frontend origin |
| Production, same-origin proxy | Relative <code>/api</code> path | Proxy routes to API; no browser CORS needed for that path |

## Manual browser walkthrough

1. Start the Express API on port 4000.
2. Start Vite on port 5173.
3. Open the frontend and trigger a GET to /api/courses.
4. In the Network panel, inspect the request URL and Origin.
5. Trigger a JSON POST and inspect whether the browser sends an OPTIONS preflight.
6. Confirm a permitted request returns an allowed-origin response header.
7. Change the server allowlist to a different exact origin and observe that browser JavaScript cannot read the response.
8. Restore the intended allowlist and verify the request again.

A failed request may also come from a stopped server, a wrong URL, TLS, or proxy routing. Inspect the request status and server logs alongside the browser's CORS message. A request working in an API client does not prove browser CORS is configured correctly.

## Common configuration mistakes

- Including <code>/api</code> in the origin allowlist.
- Setting the frontend base URL to the client itself instead of the API.
- Forgetting that the server port is part of localhost's origin.
- Using a wildcard for credentialed browser requests.
- Trusting arbitrary origins based on substring matching.
- Putting a database URI or private key into a client variable.
- Forgetting that Vite values are bundled during the build.
- Assuming the development proxy is deployed automatically.
- Assuming CORS protects API routes from non-browser clients.
- Allowing a new staging URL without identifying the expected origin.

## Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Next chapter |
| --- | --- | --- | --- |
| [087 - Full-stack application architecture and folder structure](../lessons/087-full-stack-application-architecture-and-folder-structure.md) | [Lesson](../lessons/088-configure-frontend-and-backend-origins.md) | [Q&A](../qnas/088-configure-frontend-and-backend-origins.md) | [089 - Connect React to Express end to end](../lessons/089-connect-react-to-express-end-to-end.md) |
