# 098 - Deploy the API and configure database secrets: Example

This example turns Chapter 098 into a deployable API release plan. It uses a same-origin public route: an HTTPS edge serves the React build and forwards <code>/api</code> to Express. Express connects to a private MongoDB deployment and to a MongoDB-backed session store. Replace the example host and settings with the values for your environment.

The values shown here are placeholders. Never copy a real credential into this file or commit one.

## 1. Draw the request path

~~~~mermaid
flowchart LR
  Browser -->|HTTPS| Edge[Trusted HTTPS edge]
  Edge -->|static files| React[React production build]
  Edge -->|/api| ExpressA[Express instance A]
  Edge -->|/api| ExpressB[Express instance B]
  ExpressA --> Mongo[(Private MongoDB)]
  ExpressB --> Mongo
  ExpressA --> Sessions[(Shared session collection)]
  ExpressB --> Sessions
~~~~

The browser uses <code>https://learn.example.test</code> for the site and requests <code>/api</code> from the same origin. The edge keeps MongoDB and the API's internal port private. Both API instances use the same production session configuration and database.

## 2. Commit only a safe local environment template

Create <code>server/.env.example</code> with variable names and harmless local placeholders:

~~~~text
NODE_ENV=development
PORT=4000
MONGODB_URI=
SESSION_SECRET=
CLIENT_ORIGINS=http://localhost:5173
TRUST_PROXY_HOPS=0
MONGO_MAX_POOL_SIZE=10
~~~~

An empty URI or session secret intentionally causes startup validation to fail until a developer supplies local values. The real local file is ignored:

~~~~gitignore
# server/.gitignore
.env
.env.*
!.env.example
~~~~

Use different protected values for staging and production. Configure them in the server runtime, not in the React build. The public frontend may use a non-secret value such as <code>VITE_API_BASE_URL=/api</code>.

## 3. Validate runtime configuration once

~~~~js
// server/src/config/index.js
function required(name) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error("Missing required environment variable: " + name);
  }

  return value;
}

function parseInteger(name, value, fallback, minimum, maximum = Number.MAX_SAFE_INTEGER) {
  const parsed = Number(value ?? fallback);

  if (!Number.isSafeInteger(parsed) || parsed < minimum || parsed > maximum) {
    throw new Error(name + " must be a valid integer in the configured range.");
  }

  return parsed;
}

const production = process.env.NODE_ENV === "production";
const clientOrigins = required("CLIENT_ORIGINS")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

if (clientOrigins.length === 0) {
  throw new Error("CLIENT_ORIGINS must contain at least one origin.");
}

export const config = Object.freeze({
  production,
  port: parseInteger("PORT", process.env.PORT, 4000, 1, 65535),
  mongoUri: required("MONGODB_URI"),
  sessionSecret: required("SESSION_SECRET"),
  clientOrigins,
  trustProxyHops: parseInteger(
    "TRUST_PROXY_HOPS",
    process.env.TRUST_PROXY_HOPS,
    0,
    0
  ),
  mongoMaxPoolSize: parseInteger(
    "MONGO_MAX_POOL_SIZE",
    process.env.MONGO_MAX_POOL_SIZE,
    10,
    1
  )
});

if (production && config.sessionSecret.length < 32) {
  throw new Error("SESSION_SECRET must be a high-entropy secret.");
}
~~~~

The parser validates the settings' shapes. Before releasing, separately verify that the allowed origins and trusted proxy count describe the actual topology.

## 4. Connect to the application database

~~~~js
// server/src/config/database.js
import mongoose from "mongoose";

export async function connectDatabase(config) {
  await mongoose.connect(config.mongoUri, {
    maxPoolSize: config.mongoMaxPoolSize,
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000
  });

  mongoose.connection.on("error", (error) => {
    console.error("MongoDB connection error", {
      name: error.name,
      code: error.code
    });
  });
}
~~~~

The application MongoDB user has only the role needed for the application's database. The production network policy allows only the API runtime's private route or known outbound addresses. Staging uses its own database identity and rules.

## 5. Retain and close the session-store client

This course's MongoDB-backed session store creates its own client when given <code>mongoUrl</code>. Keep the returned store so it can be closed during shutdown:

~~~~js
// server/src/config/session.js
import session from "express-session";
import MongoStore from "connect-mongo";

let sessionStore;

export function createSessionMiddleware(config) {
  if (sessionStore) {
    throw new Error("Create the session middleware once per server process.");
  }

  sessionStore = MongoStore.create({
    mongoUrl: config.mongoUri,
    collectionName: "sessions",
    ttl: 8 * 60 * 60
  });

  return session({
    name: "app.sid",
    secret: config.sessionSecret,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: config.production,
      sameSite: "lax",
      path: "/",
      maxAge: 8 * 60 * 60 * 1000
    }
  });
}

export async function closeSessionStore() {
  if (sessionStore) {
    await sessionStore.close();
  }
}
~~~~

Keep the course's CSRF protection, session regeneration, expiration policy, and any already-required cookie options. All API instances that handle the same users must share the production session store and compatible secrets.

## 6. Assemble one API process

~~~~js
// server/src/server.js
import express from "express";
import mongoose from "mongoose";
import { config } from "./config/index.js";
import { connectDatabase } from "./config/database.js";
import { createCorsMiddleware } from "./config/cors.js";
import {
  createSessionMiddleware,
  closeSessionStore
} from "./config/session.js";
import { apiRouter } from "./api.routes.js";

await connectDatabase(config);

const app = express();

if (config.trustProxyHops > 0) {
  app.set("trust proxy", config.trustProxyHops);
}

app.use(createCorsMiddleware(config));
app.use(express.json({ limit: "1mb" }));

const sessionMiddleware = createSessionMiddleware(config);
app.use(sessionMiddleware);

// Keep the existing request ID, CSRF token route, CSRF protection,
// route modules, not-found handler, and central error handler in order.
app.use("/api", apiRouter);

app.get("/health/live", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/health/ready", (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ status: "not-ready" });
  }

  res.status(200).json({ status: "ready" });
});

const server = app.listen(config.port, "0.0.0.0", () => {
  console.log("API is listening", {
    port: config.port,
    environment: config.production ? "production" : "non-production"
  });
});
~~~~

For a same-origin deployment, the edge serves the React build and forwards <code>/api</code> to this process. The edge overwrites the forwarded headers it owns. Set <code>TRUST_PROXY_HOPS</code> to the actual trusted proxy path, and prevent an untrusted direct route to Express.

The health responses intentionally contain no hostname, database name, URI, or raw error. Use readiness for traffic routing and liveness to determine whether the process itself can respond.

## 7. Shut down both MongoDB clients

The Mongoose connection and the session store are separate clients in this configuration. Close both after the HTTP server has stopped accepting requests:

~~~~js
let shuttingDown = false;

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log("API shutdown started", { signal });

  const shutdownDeadline = setTimeout(() => {
    console.error("API shutdown exceeded its deadline");
    process.exitCode = 1;
  }, 25000);

  shutdownDeadline.unref();

  server.close(async (httpError) => {
    const results = await Promise.allSettled([
      closeSessionStore(),
      mongoose.disconnect()
    ]);
    const failure = results.find((result) => result.status === "rejected");

    clearTimeout(shutdownDeadline);

    if (httpError || failure) {
      console.error("API shutdown failed", {
        httpError: httpError?.name,
        resourceError:
          failure?.status === "rejected" ? failure.reason?.name : undefined
      });
      process.exitCode = 1;
      return;
    }

    console.log("API shutdown complete");
  });
}

process.once("SIGTERM", () => shutdown("SIGTERM"));
process.once("SIGINT", () => shutdown("SIGINT"));
~~~~

Set the deadline below the platform's termination grace period. If cleanup exceeds it, the platform supervisor enforces its limit. Do not print raw database errors or call <code>process.exit()</code> before cleanup can finish.

## 8. Set separate environment values

| Setting | Local development | Staging | Production |
| --- | --- | --- | --- |
| <code>NODE_ENV</code> | <code>development</code> | <code>production</code> | <code>production</code> |
| <code>PORT</code> | <code>4000</code> | Runtime supplied | Runtime supplied |
| <code>MONGODB_URI</code> | Local-only database URI | Protected staging URI | Protected production URI |
| <code>SESSION_SECRET</code> | Local random secret | Protected staging secret | Protected production secret |
| <code>CLIENT_ORIGINS</code> | Local Vite origin | Exact staging origin | Exact public application origin |
| <code>TRUST_PROXY_HOPS</code> | <code>0</code> | Verified staging topology | Verified production topology |
| <code>MONGO_MAX_POOL_SIZE</code> | Small local pool | Based on staging capacity | Based on max instances and capacity |

These labels describe where values come from; they are not literal production secrets. Generate separate session secrets and database credentials. A public frontend configuration may contain its API URL, but never a database URI or session secret.

## 9. Budget the MongoDB connections

Suppose production allows up to four API instances during a rolling deployment, the application pool is configured for 12, and each process has a session-store pool budget of 5. The rough upper bound before other clients is:

~~~~text
4 x (12 application connections + 5 session-store connections)
= 68 possible connections
~~~~

Add background workers, migrations, administration, monitoring, and overlap during rollout. Compare the total with the database's supported capacity and keep headroom. Adjust the assumptions to match the provider and driver's behavior instead of treating this illustration as a universal pool recommendation.

## 10. Release and rollback runbook

1. Build the server artifact from a reviewed commit and record its revision.
2. Confirm the staging database user and network route work from the staging runtime.
3. Inject staging secrets using the platform's protected configuration.
4. Deploy to staging and wait for readiness.
5. Confirm authenticated browser flows, session persistence, API requests, and sanitized logs.
6. Verify the production database role, runtime network rule, and secret values without printing them.
7. Deploy the same artifact to production with the new instance initially out of user traffic.
8. Wait for database connection and readiness, then route traffic gradually if supported.
9. Watch error rate, latency, connection use, readiness, and application logs.
10. If the release is unhealthy, route traffic to the prior artifact and restore its compatible configuration.
11. Record the release revision and any follow-up operational work.

Do not combine a destructive schema change with an application release unless rollback compatibility has been planned. Chapter 102 covers migrations and recovery.

## 11. Troubleshoot representative failures

| Symptom | First checks | Keep intact |
| --- | --- | --- |
| API exits with missing configuration | Confirm protected settings are attached to the API service and have the expected names | Do not add secrets to source control |
| Server selection timeout | Check URI encoding, database role, DNS, runtime egress, and network policy from the deployed service | Do not allow every address as a permanent fix |
| TLS connection failure | Check system time, DNS, certificate chain, and runtime trust configuration | Keep certificate verification enabled |
| Users appear logged out across instances | Confirm every instance uses the shared session store and compatible session secret | Do not switch production to in-memory sessions |
| API returns 502 during rollout | Check readiness, startup logs, port binding, and edge-to-API route | Keep unready instances out of user traffic |
| Database connection count spikes | Recalculate max instances, rolling overlap, per-client pools, workers, and session clients | Do not raise pool limits without capacity evidence |
| Secure cookie is missing | Confirm HTTPS at the edge, proxy trust, cookie settings, and browser origin | Do not weaken cookie security to hide a proxy error |

## 12. Deployment review checklist

- [ ] The artifact identifies a reviewed source revision.
- [ ] Production settings are injected at runtime and are not in the artifact.
- [ ] The database user has only the required application database role.
- [ ] The database accepts traffic only from the intended runtime path.
- [ ] TLS verification is enabled.
- [ ] API startup validates configuration and connects before listening.
- [ ] The trusted proxy setting matches the edge topology.
- [ ] Production sessions use shared durable storage and secure cookies.
- [ ] Readiness reflects the required MongoDB dependency.
- [ ] Public health responses contain no sensitive infrastructure detail.
- [ ] Pool planning includes maximum instances and all MongoDB clients.
- [ ] Shutdown closes HTTP, session-store, and Mongoose resources.
- [ ] A known prior artifact and compatible configuration can be restored.

## Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- | --- |
| [097 - Deployment architecture and environment separation](097-deployment-architecture-and-environment-separation.md) | [Lesson](../lessons/098-deploy-the-api-and-configure-database-secrets.md) | [Q&A](../qnas/098-deploy-the-api-and-configure-database-secrets.md) | [Example](098-deploy-the-api-and-configure-database-secrets.md) | [099 - Deploy the frontend and production API URLs](099-deploy-the-frontend-and-production-api-urls.md) |
