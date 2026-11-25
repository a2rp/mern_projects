# 093 - Production configuration, CORS, and secure cookies: Example

This example updates the Chapter 091 session-backed API for deployment. It validates environment values at startup, allows only configured browser origins, supports credentialed requests and preflight, trusts a deliberately configured proxy hop count, and sets explicit cookie attributes.

The production settings depend on the real network topology. Replace the sample origins and proxy count with the deployment's actual values. The sample keeps the application and API on the same site where possible and continues to use the session and CSRF design from Chapter 091.

## 1. Define local and production environment values

Keep a committed template with placeholders and an ignored local file with development values.

~~~~text
# server/.env.example
NODE_ENV=development
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/mern_course
SESSION_SECRET=replace-with-a-long-random-secret
CLIENT_ORIGINS=http://localhost:5173
COOKIE_SAME_SITE=lax
COOKIE_SECURE=false
SESSION_COOKIE_NAME=mern.sid
TRUST_PROXY_HOPS=0
~~~~

A production deployment should inject equivalent values through a protected environment or secret manager:

~~~~text
NODE_ENV=production
PORT=4000
MONGODB_URI=<secret-manager-value>
SESSION_SECRET=<generated-high-entropy-secret>
CLIENT_ORIGINS=https://app.example.test
COOKIE_SAME_SITE=lax
COOKIE_SECURE=true
SESSION_COOKIE_NAME=__Host-mern.sid
TRUST_PROXY_HOPS=1
~~~~

The angle-bracket values above are placeholders, not literal settings. Do not commit a real secret or production environment file. Add the local file to the server's ignore rules.

~~~~gitignore
# server/.gitignore
.env
.env.*
!.env.example
~~~~

Load development environment values before application modules are imported. For a Node.js release that supports environment files, run from the server directory:

~~~~text
node --env-file=.env.local src/server.js
~~~~

Production process managers should inject their protected values directly.

## 2. Parse and validate configuration

This module converts environment strings into normalized settings. It fails early if a required value or security relationship is invalid.

~~~~js
// server/src/config/index.js
function required(name) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error("Missing required environment variable: " + name);
  }

  return value;
}

function parseInteger(name, value, fallback, minimum) {
  if (value === undefined || value === "") return fallback;

  const number = Number(value);

  if (!Number.isSafeInteger(number) || number < minimum) {
    throw new Error(name + " must be an integer of at least " + minimum + ".");
  }

  return number;
}

function parseOriginList(value) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const url = new URL(item);

      if (
        !["http:", "https:"].includes(url.protocol) ||
        url.username ||
        url.password ||
        url.pathname !== "/" ||
        url.search ||
        url.hash
      ) {
        throw new Error("CLIENT_ORIGINS must contain bare HTTP(S) origins.");
      }

      return url.origin;
    });
}

const nodeEnv = process.env.NODE_ENV ?? "development";
const production = nodeEnv === "production";
const sameSite = process.env.COOKIE_SAME_SITE ?? "lax";
const cookieSecure = production || process.env.COOKIE_SECURE === "true";
const cookieName = process.env.SESSION_COOKIE_NAME ?? "mern.sid";

if (!["strict", "lax", "none"].includes(sameSite)) {
  throw new Error("COOKIE_SAME_SITE must be strict, lax, or none.");
}

if (sameSite === "none" && !cookieSecure) {
  throw new Error("SameSite=None requires Secure and HTTPS.");
}

if (cookieName.startsWith("__Host-") && !production) {
  throw new Error("Use a __Host- cookie name only in secure production.");
}

const config = Object.freeze({
  nodeEnv,
  production,
  port: parseInteger("PORT", process.env.PORT, 4000, 1),
  mongoUri: required("MONGODB_URI"),
  sessionSecret: required("SESSION_SECRET"),
  sessionCookieName: cookieName,
  clientOrigins: parseOriginList(required("CLIENT_ORIGINS")),
  cookieSameSite: sameSite,
  cookieSecure,
  trustProxyHops: parseInteger(
    "TRUST_PROXY_HOPS",
    process.env.TRUST_PROXY_HOPS,
    0,
    0
  )
});

if (production && config.sessionSecret.length < 32) {
  throw new Error("SESSION_SECRET must be a high-entropy secret.");
}

export { config };
~~~~

The secret length check is a guard against obviously short configuration, not a source of entropy. Generate the secret securely and protect it. If a cookie uses the <code>__Host-</code> prefix, its cookie configuration must also use Secure, <code>Path=/</code>, and no Domain attribute.

## 3. Update the Mongo-backed session middleware

The store keeps session data on the server. The browser cookie contains only the session identifier.

~~~~js
// server/src/config/session.js
import session from "express-session";
import MongoStore from "connect-mongo";

export function createSessionMiddleware(config) {
  return session({
    name: config.sessionCookieName,
    secret: config.sessionSecret,
    store: MongoStore.create({
      mongoUrl: config.mongoUri,
      collectionName: "sessions",
      ttl: 8 * 60 * 60
    }),
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: config.cookieSecure,
      sameSite: config.cookieSameSite,
      path: "/",
      maxAge: 8 * 60 * 60 * 1000
    }
  });
}
~~~~

There is no Domain option, so the cookie is host-only. Keep the session store durable and shared by all API instances that need to read a user's session.

## 4. Allow exact frontend origins

The CORS policy checks each browser origin against configuration. Requests without an Origin header do not receive CORS permission, but they still go through normal API security.

~~~~js
// server/src/config/cors.js
import cors from "cors";

export function createCorsMiddleware(config) {
  const allowedOrigins = new Set(config.clientOrigins);

  return cors({
    origin(origin, callback) {
      if (!origin) return callback(null, false);

      if (!allowedOrigins.has(origin)) {
        const error = new Error("Origin is not allowed.");
        error.status = 403;
        return callback(error);
      }

      callback(null, origin);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "X-CSRF-Token"],
    maxAge: 600
  });
}
~~~~

Do not use <code>origin: "*"</code> for this credentialed API and do not reflect an origin before checking the allowlist. CORS only controls browser response access; every route still checks the session, permissions, and record ownership.

## 5. Put middleware in the correct order

Configure proxy trust before session handling, then process CORS before API authentication. The CSRF-token endpoint is a safe GET and comes before the CSRF protection middleware; state-changing routes are below that middleware.

~~~~js
// server/src/app.js
import express from "express";
import { csrfSync } from "csrf-sync";
import { createCorsMiddleware } from "./config/cors.js";
import { createSessionMiddleware } from "./config/session.js";
import { authRouter } from "./features/auth/auth.routes.js";
import { uploadRouter } from "./features/uploads/upload.routes.js";

export function createApp(config) {
  const app = express();

  if (config.trustProxyHops > 0) {
    app.set("trust proxy", config.trustProxyHops);
  }

  app.use(createCorsMiddleware(config));
  app.use(express.json({ limit: "1mb" }));
  app.use(createSessionMiddleware(config));

  const {
    generateToken,
    csrfSynchronisedProtection
  } = csrfSync();

  app.get("/api/auth/csrf-token", (req, res) => {
    res.json({ csrfToken: generateToken(req) });
  });

  app.use(csrfSynchronisedProtection);
  app.use("/api/auth", authRouter);
  app.use("/api/uploads", uploadRouter);

  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);

    const status = Number.isInteger(error.status) ? error.status : 500;
    const message =
      status < 500 ? error.message : "An unexpected server error occurred.";

    if (status >= 500) {
      console.error("API request failed", {
        requestId: req.id,
        status
      });
    }

    res.status(status).json({ error: { message } });
  });

  return app;
}
~~~~

If the application already has its Chapter 091 middleware, merge these changes into that version rather than registering a second session or CSRF middleware. Keep CORS early enough to handle permitted <code>OPTIONS</code> requests without requiring a session. Keep the centralized error handler last.

## 6. Start behind a known reverse proxy

Only set proxy trust when Express is actually behind a proxy. The count must match the known trusted hops, and each trusted proxy must overwrite client-supplied forwarding headers.

~~~~js
// server/src/server.js
import { config } from "./config/index.js";
import { connectDatabase } from "./config/database.js";
import { createApp } from "./app.js";

await connectDatabase(config.mongoUri);

const app = createApp(config);

app.listen(config.port, () => {
  console.log("API server listening on port " + config.port);
});
~~~~

The <code>TRUST_PROXY_HOPS</code> setting is not a universal value. Confirm the exact load balancer, ingress, and proxy chain for the deployment. Leave it at zero if there is no trusted proxy. Never enable trust for forwarded headers from arbitrary clients.

## 7. Keep the browser API client aligned

The React app uses its public API base URL and includes credentials for browser requests. It sends the session-bound CSRF token on state-changing requests.

~~~~js
// client/src/features/api/apiClient.js
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "";
let csrfToken = "";

async function apiRequest(path, options = {}) {
  const response = await fetch(apiBaseUrl + path, {
    ...options,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...options.headers
    }
  });

  if (response.status === 204) return null;

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(
      payload?.error?.message ?? "The request failed."
    );
    error.status = response.status;
    throw error;
  }

  return payload;
}

export async function refreshCsrfToken() {
  const payload = await apiRequest("/api/auth/csrf-token");
  csrfToken = payload.csrfToken;
}

export async function createRecord(input) {
  return apiRequest("/api/records", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": csrfToken
    },
    body: JSON.stringify(input)
  });
}

export { apiRequest };
~~~~

Refresh the token after the authentication flow changes the session, following the Chapter 091 client. Keep session cookies out of JavaScript. Never copy the cookie into local storage or manually attach a session identifier as a bearer token.

## 8. Match development and deployment origins

| Environment | Browser origin | API origin | Cookie and proxy notes |
| --- | --- | --- | --- |
| Local direct API | <code>http://localhost:5173</code> | <code>http://localhost:4000</code> | Allow the exact Vite origin; use a development cookie compatible with local HTTP. |
| Local same-origin proxy | <code>http://localhost:5173</code> | Browser calls <code>/api</code> | Vite forwards API requests; the browser sees one origin. |
| Production same-site subdomains | <code>https://app.example.test</code> | <code>https://api.example.test</code> | Different origins can still be same-site; allow the exact app origin and verify SameSite behavior. |
| Production cross-site API | <code>https://app.example.test</code> | <code>https://api.other.test</code> | Requires a reviewed cross-site cookie policy, HTTPS, exact credentialed CORS, and CSRF checks. |

Prefer a same-origin reverse proxy or a same-site deployment when practical. This keeps cookie policy simpler, but the API still performs authentication and authorization.

## 9. Verify the browser and proxy behavior

Inspect the browser Network panel and server configuration:

1. Confirm the browser URL and API URL use the intended schemes, hosts, and ports.
2. Request the CSRF-token endpoint and confirm the session cookie is set as expected.
3. Make a credentialed API request from an allowed origin and inspect the CORS response.
4. Send a request from an unlisted origin and confirm it receives no permissive CORS response.
5. Trigger a preflight with <code>Content-Type</code> and <code>X-CSRF-Token</code>; confirm <code>OPTIONS</code> is handled before authentication.
6. Confirm the actual POST still requires both the signed-in session and CSRF token.
7. On production HTTPS, inspect <code>Set-Cookie</code> for Secure, HttpOnly, explicit SameSite, intended path, and absent Domain when using <code>__Host-</code>.
8. Confirm Express recognizes HTTPS only when the request came through the trusted proxy.
9. Try spoofing forwarded headers from outside the trusted proxy and confirm they do not change request security decisions.
10. Inspect the frontend bundle and server logs for database URIs, session secrets, cookies, and CSRF tokens.

## Common mistakes

- Committing a real environment file or relying on a default production secret.
- Putting server credentials into frontend variables.
- Using a wildcard origin for a credentialed API.
- Reflecting arbitrary Origin headers.
- Treating CORS as route authorization or CSRF protection.
- Mounting authentication before CORS preflight handling.
- Setting <code>SameSite=None</code> without Secure and HTTPS.
- Adding broad Domain sharing without a product need.
- Configuring the secure cookie but forgetting the trusted TLS-terminating proxy.
- Setting trust proxy globally without matching it to the real network path.
- Registering two session or CSRF middleware stacks while merging the chapter into an existing app.
- Returning stack traces or configuration details to a browser.
- Logging a cookie, password, CSRF token, or secret.

## Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- | --- |
| [092 - File uploads end to end](../lessons/092-file-uploads-end-to-end.md) | [Lesson](../lessons/093-production-configuration-cors-and-secure-cookies.md) | [Q&A](../qnas/093-production-configuration-cors-and-secure-cookies.md) | [Example](093-production-configuration-cors-and-secure-cookies.md) | [094 - Unit, integration, and end-to-end testing](../lessons/094-unit-integration-and-end-to-end-testing.md) |
