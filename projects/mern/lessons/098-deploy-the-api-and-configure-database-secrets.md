# 098 - Deploy the API and configure database secrets

A production Express API needs more than a process listening on a port. It needs a repeatable release artifact, validated runtime configuration, an authenticated network path to MongoDB, bounded connection pools, secure session handling, health signals, and a shutdown path that closes every resource it owns.

This chapter prepares the API for a managed runtime or server without choosing a cloud vendor. It connects the API to a separately secured MongoDB deployment and places the public traffic path behind a trusted HTTPS edge. Chapter 099 deploys the React frontend and configures its production API URL.

## Learning outcomes

After this chapter, you should be able to:

- Prepare a production API artifact from a reviewed source revision.
- Inject secrets and environment-specific settings at runtime.
- Create least-privilege MongoDB access for the application.
- Restrict database network access to approved runtime networks.
- Validate configuration before the API accepts traffic.
- Connect to MongoDB and budget connection pools across instances.
- Configure proxy trust, secure cookies, and safe health endpoints.
- Shut down HTTP, application database, and session-store connections cleanly.
- Diagnose deployment failures without exposing credentials or weakening security.

## 1. Map the production request path

A typical request travels through these components:

~~~~text
Browser
  -> HTTPS edge or reverse proxy
  -> one of the Express API instances
  -> MongoDB application database
  -> MongoDB-backed session store
~~~~

The browser receives a public frontend URL and uses the API URL configured for its build or runtime. It must never receive the MongoDB URI, session secret, or other server credentials.

The edge terminates public TLS and forwards requests to the API over the deployment's private or otherwise protected network path. The API uses MongoDB through an authenticated connection. The session store may use its own MongoDB client and pool, so count it separately.

Before deploying, identify:

- How the application artifact is built and tied to a source revision.
- How the runtime provides its port and environment variables.
- Which edge forwards traffic and which forwarded headers it owns.
- Which networks or private endpoints can reach the database.
- Which database and session-store clients each API instance creates.
- How health checks, termination signals, logs, and rollback work.

## 2. Build a repeatable API artifact

Deploy an artifact that can be identified and reproduced. Depending on the runtime, the artifact may be a container image, a packaged server directory, or a checked-out release revision.

A release should:

1. Start from a reviewed commit.
2. Install the server's production dependencies from its lockfile.
3. Build any server output required by the project.
4. Exclude development secrets, local database files, editor settings, and unrelated files.
5. Record the source revision and artifact identifier.
6. Keep the previously working artifact available for rollback.

Do not build one artifact manually for staging and a different artifact manually for production. Promote the same reviewed artifact and provide environment-specific configuration at runtime.

For a container, use a non-root runtime user, keep the image free of secrets, and send logs to the platform's standard output and error streams. Use the runtime's supported Node.js version and set an intentional memory and CPU budget. Do not add a second process supervisor inside a container when the platform already owns process restarts.

## 3. Create application-specific MongoDB access

Create a database identity for the API. Do not use a human administrator account or reuse credentials from a developer laptop.

Give the application account only the database role it needs. For an API that reads and writes application records, that normally means an application-scoped read/write permission on the application's database. Schema administration, cluster administration, user management, and backups should use separate identities and controlled processes.

Create separate credentials for local development, staging, and production. Use separate databases or clusters according to the project's isolation requirements. A compromised staging credential must not authorize access to production data.

Store the MongoDB URI as a server-side runtime secret such as <code>MONGODB_URI</code>. It is not a frontend setting. Never put it in:

- A committed environment file.
- A source file, container build argument, or public build variable.
- A browser bundle, source map, or client-visible error.
- A log line, chat message, issue, or screenshot.

Credential characters that have special meaning in a URI must be encoded correctly. Prefer the database provider's generated connection string as a starting point, then verify the database name, authentication database, TLS behavior, and application user.

Use encrypted transport and keep certificate verification enabled. Do not turn off TLS checks to work around a DNS, certificate, or network error.

## 4. Restrict the database network path

The database should accept connections only from the API's intended network path. Prefer a private endpoint or private network integration when the deployment supports it. If the provider uses an address allowlist, allow only the API runtime's known outbound addresses and keep that list current.

Do not leave an all-address rule in place as a permanent fix for a connectivity problem. A broad rule makes a stolen credential usable from more locations; it does not replace database authentication.

Validate connectivity from the deployed runtime because a developer machine may have a different DNS route, outbound address, firewall, and certificate store. Staging and production should have separately reviewed network access.

The network policy and database role solve different problems:

- Network restrictions determine which systems can attempt a database connection.
- Database authentication and roles determine what an accepted identity can do.

Use both controls.

## 5. Keep secrets outside the artifact

Configure each environment through the deployment platform's protected configuration mechanism. Restrict who can read and change production secrets. Rotate a secret by creating or installing a replacement, deploying it, confirming the new value works, and revoking the old one.

A typical server-only configuration contains:

| Setting | Purpose |
| --- | --- |
| <code>NODE_ENV</code> | Select production behavior |
| <code>PORT</code> | Port supplied to the API process |
| <code>MONGODB_URI</code> | Private MongoDB connection URI |
| <code>SESSION_SECRET</code> | High-entropy secret for signed session identifiers |
| <code>CLIENT_ORIGINS</code> | Exact browser origins allowed by credentialed CORS |
| <code>TRUST_PROXY_HOPS</code> | Trusted proxy hop count for the actual edge topology |
| <code>MONGO_MAX_POOL_SIZE</code> | Maximum application-driver pool size per API process |

The exact names can vary, but configuration must be parsed once at startup and passed to the parts of the application that need it. Frontend values such as a public API base URL are separate and must not contain secrets.

## 6. Parse and validate runtime configuration

Environment variables are strings and may be missing, malformed, or accidentally copied from another environment. Fail before opening the public listener if required configuration is invalid.

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
    20,
    1
  )
});

if (production && config.sessionSecret.length < 32) {
  throw new Error("SESSION_SECRET must be a high-entropy secret.");
}
~~~~

A length check rejects an obviously short session secret but cannot prove entropy. Generate it with a cryptographically secure source. Validate that each configured origin is an origin with the expected scheme, host, and optional port. The proxy hop count must match the actual trusted path; a syntactically valid count does not make a proxy trustworthy.

Validate every setting the application needs, including cookie policy, upload storage, logging level, and optional service credentials. Do not print the configuration object wholesale because it contains secrets.

## 7. Connect to MongoDB before accepting traffic

The API depends on MongoDB for normal requests, so connect before binding the public listener. If a required database connection fails, startup should fail and the platform should keep the instance out of rotation.

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

  return mongoose.connection;
}
~~~~

Choose timeouts based on the deployment network and operational requirements. Do not retry forever in a tight loop. Let the runtime's restart policy handle a failed startup and use monitoring to identify persistent failures.

Log enough information to identify the failure class without logging the URI, credentials, complete topology description, or raw error fields that may contain connection details. Keep detailed diagnostics in access-controlled monitoring.

## 8. Budget pools across all clients and instances

Each MongoDB client manages its own connection pool. The application Mongoose client and a session store configured with its own MongoDB URI may therefore create separate pools in every API process.

Estimate a conservative maximum:

~~~~text
maximum API instances x application pool size
+ session-store pools across those instances
+ background jobs, migrations, monitoring, and admin clients
<= database connection capacity with operational headroom
~~~~

The maximum pool size is not a target number of active connections. Actual connections grow with load and driver behavior. Start with a measured, modest value, then monitor connection use, checkout wait time, request latency, and database capacity before changing it.

Consider the maximum autoscaling size, not only the number of instances running during a quiet period. Account for overlapping instances during a rolling deployment. Avoid running migrations or administrative scripts with unexpectedly large pools against production.

## 9. Start behind the correct trusted edge

Bind the API to the port provided by the runtime. If a reverse proxy terminates TLS, configure Express to trust only the proxy path that actually reaches the process. An overly broad proxy-trust setting can let an untrusted client forge forwarded protocol or address headers.

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
app.use(createSessionMiddleware(config));
app.use("/api", apiRouter);

const server = app.listen(config.port, "0.0.0.0", () => {
  console.log("API is listening", {
    port: config.port,
    environment: config.production ? "production" : "non-production"
  });
});
~~~~

The proxy should overwrite the forwarded headers it owns and prevent a direct untrusted route to the API. Use HTTPS for browser-to-edge traffic. Protect the edge-to-API path according to the runtime's network model.

Keep middleware from earlier chapters in its established order. In particular, preserve request IDs, CORS, the session middleware, CSRF token handling and protection, routes, not-found handling, and the centralized error handler. Do not create a second Express app merely to add deployment settings.

## 10. Preserve secure production sessions

Use the same shared production session store across API instances that need to read the same sessions. Keep a high-entropy session secret private and use the secure cookie settings established in Chapter 093. Do not fall back to Express's in-memory store in production.

The store shown in Chapter 091 creates its own MongoDB client when configured with <code>mongoUrl</code>. Retain a reference to that store so shutdown can close it. In <code>config/session.js</code>, refactor the store creation from the inline session options:

~~~~js
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

Call <code>createSessionMiddleware</code> once for the server process. This example shows the lifecycle change; keep any additional options already required by your application, such as cookie domain decisions, session expiry, and store-specific settings.

## 11. Add safe liveness and readiness endpoints

Liveness answers whether the process can respond. Readiness answers whether this instance can receive normal traffic that depends on MongoDB.

~~~~js
app.get("/health/live", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/health/ready", (req, res) => {
  const databaseReady = mongoose.connection.readyState === 1;

  if (!databaseReady) {
    return res.status(503).json({ status: "not-ready" });
  }

  res.status(200).json({ status: "ready" });
});
~~~~

Configure the platform's readiness probe to use the readiness route and its liveness probe to use the liveness route. A liveness probe should not restart a healthy process just because MongoDB is temporarily unavailable; readiness can remove the instance from traffic while the dependency recovers.

Do not return a connection URI, database name, internal host, stack trace, secret, or raw database error from a public health response. If another dependency is essential to every request, decide deliberately whether it belongs in readiness. Do not turn an optional service outage into an unnecessary outage for the entire API.

## 12. Drain requests and close database clients

A managed runtime may send a termination signal during a deploy, restart, or scale-down. Stop accepting new requests, allow active work to finish within a bounded period, then close every client owned by the process.

~~~~js
let shuttingDown = false;

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log("API shutdown started", { signal });

  server.close(async (httpError) => {
    const results = await Promise.allSettled([
      closeSessionStore(),
      mongoose.disconnect()
    ]);
    const failure = results.find((result) => result.status === "rejected");

    if (httpError || failure) {
      console.error("API shutdown failed", {
        httpError: httpError?.name,
        resourceError:
          failure?.status === "rejected" ? failure.reason?.name : undefined
      });
      process.exitCode = 1;
    }
  });
}

process.once("SIGTERM", () => shutdown("SIGTERM"));
process.once("SIGINT", () => shutdown("SIGINT"));
~~~~

Use the session-store library's supported close method because it owns a separate client in this configuration. Close other owned resources such as job workers, queue clients, and telemetry exporters as part of the same lifecycle.

Set a shutdown deadline that is shorter than the runtime's termination grace period. If the deadline expires, log a sanitized message and let the process supervisor enforce its limit. Do not call <code>process.exit()</code> before cleanup promises settle.

## 13. Deploy in a controlled order

A vendor-neutral deployment sequence is:

1. Build the server from a reviewed source revision.
2. Install production dependencies from the lockfile and produce the release artifact.
3. Create or verify the environment's database user and role.
4. Restrict the database network path to the API runtime.
5. Configure server-only secrets and non-secret runtime settings.
6. Confirm the runtime's port, health routes, and trusted edge configuration.
7. Start the new API instance and wait for database connection and readiness.
8. Route traffic to the new instance only after it is ready.
9. Observe logs, errors, latency, pool usage, and database connection counts.
10. Keep the prior release available until the new release is stable.
11. Roll back the artifact and configuration together if the release fails.

Do not combine a risky schema change with an irreversible application rollout. Chapter 102 covers backup, migration, recovery, and release planning.

## 14. Troubleshoot connection failures in order

When the API cannot connect, inspect the path systematically:

1. Confirm that <code>MONGODB_URI</code> is present in the actual deployed API runtime.
2. Confirm its host, database, authentication settings, and percent-encoded credentials.
3. Verify the application database user exists and has the intended database-scoped role.
4. Verify the runtime's outbound route is allowed by the database network policy.
5. Check DNS resolution and outbound TLS from the deployed runtime.
6. Confirm that certificate verification has not been disabled.
7. Check the driver and server-selection timeout messages in protected logs.
8. Compare the current instance count and pool budget with database connection capacity.
9. Check whether the runtime and database regions have a supported network path.
10. Confirm that a recent secret rotation was applied to the API instance that is failing.

Do not respond by exposing the cluster to all addresses, granting administrator access, disabling TLS verification, or printing the URI.

## Common mistakes

- Using a human administrator's database account for the API.
- Reusing one credential for local, staging, and production systems.
- Committing a secret or placing it in a frontend build variable.
- Allowing every network to reach MongoDB as a permanent workaround.
- Testing connectivity only from a developer laptop.
- Starting the listener before the required database connection is ready.
- Trusting forwarded headers from an untrusted network path.
- Setting a pool size without counting the maximum API instances and session store.
- Using an in-memory session store across production instances.
- Returning internal database details from a public health endpoint.
- Closing Mongoose but forgetting a separate session-store client.
- Logging the connection URI or complete raw driver errors.
- Releasing a new artifact without a readiness check or rollback plan.

## Manually inspect the API deployment

1. Confirm the release artifact identifies the reviewed source revision.
2. Confirm local, staging, and production use separate database credentials.
3. Confirm the API user has only the permissions needed for its application database.
4. Confirm MongoDB network rules allow only intended runtime networks.
5. Confirm runtime secrets are absent from the source, artifact, logs, and browser build.
6. Confirm the API connects before it begins listening.
7. Confirm invalid startup configuration fails without exposing secret values.
8. Confirm readiness becomes unavailable when MongoDB cannot serve requests.
9. Confirm the health responses contain no internal connection details.
10. Confirm the edge sends the headers the app expects and Express trusts only that edge path.
11. Confirm the maximum instance count and every MongoDB client fit the pool budget.
12. Confirm session state is shared across API instances and uses the production cookie policy.
13. Send the runtime's termination signal and confirm HTTP, session-store, and Mongoose clients close.
14. Confirm the previous artifact and its matching configuration can be restored.

## Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- | --- |
| [097 - Deployment architecture and environment separation](097-deployment-architecture-and-environment-separation.md) | [Lesson](098-deploy-the-api-and-configure-database-secrets.md) | [Q&A](../qnas/098-deploy-the-api-and-configure-database-secrets.md) | [Example](../examples/098-deploy-the-api-and-configure-database-secrets.md) | [099 - Deploy the frontend and production API URLs](099-deploy-the-frontend-and-production-api-urls.md) |
