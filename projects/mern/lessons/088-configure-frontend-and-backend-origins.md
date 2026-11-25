# 088 - Configure frontend and backend origins

A MERN application commonly runs its React development server and Express API on different origins. Before the browser can expose an API response to frontend JavaScript, the server must return Cross-Origin Resource Sharing (CORS) headers that allow the requesting origin. In production, the frontend may use a different domain, a subdomain, or a same-origin reverse proxy.

This chapter explains how to choose and configure frontend and backend origins for local development, staging, and production. It also distinguishes CORS from authentication and authorization, which must protect the API independently.

## Learning outcomes

After this chapter, you should be able to:

- Explain what an origin contains and when two URLs are cross-origin.
- Configure a React app with a public API base URL.
- Configure an Express API with a deliberate CORS origin policy.
- Understand when browsers send preflight OPTIONS requests.
- Handle credentialed cross-origin requests without wildcard origins.
- Choose between a direct API origin and a same-origin reverse proxy.
- Separate development, staging, and production configuration safely.
- Diagnose common browser network and CORS failures.

## 1. Origin means scheme, host, and port

An origin is the tuple of:

1. Scheme, such as <code>http</code> or <code>https</code>.
2. Host, such as <code>localhost</code> or <code>app.example.test</code>.
3. Port, such as <code>5173</code> or <code>4000</code>.

These URLs use different origins:

~~~~text
http://localhost:5173
http://localhost:4000
https://localhost:5173
~~~~

The first two differ by port. The first and third differ by scheme. A URL path does not define an origin: <code>https://app.example.test/courses</code> and <code>https://app.example.test/settings</code> share the same origin.

A development browser may therefore treat a Vite frontend and an Express API as cross-origin even when both run on the same computer.

## 2. Separate the browser API base URL from endpoint paths

The frontend needs to know where its API is reachable. Keep that public URL in client configuration and append endpoint paths in one place.

For a Vite application, variables prefixed with <code>VITE_</code> are exposed to browser code and substituted during the client build. They are public values. Never put a database URI, password, signing key, or private token in a client variable.

~~~~text
# client/.env.development
VITE_API_BASE_URL=http://localhost:4000
~~~~

~~~~text
# client/.env.production
VITE_API_BASE_URL=https://api.example.com
~~~~

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

Call the helper with a path such as <code>/api/courses</code>. Avoid scattering complete server URLs throughout components; centralized configuration makes environment changes easier and reduces mistakes.

Vite loads environment files when it starts. Restart the development server after editing them. A Vite production build incorporates its public values, so changing a deployment environment variable after building does not automatically rewrite a static bundle. Build separately for each environment or deliberately implement a runtime public-config endpoint when one artifact must serve multiple environments.

## 3. Allow known origins in Express

The API should permit only the frontend origins that need to read its responses. Configure an explicit allowlist from server-side environment configuration.

~~~~text
# server/.env.development
PORT=4000
CLIENT_ORIGINS=http://localhost:5173
~~~~

~~~~js
// server/src/config/origins.js
export function parseAllowedOrigins(value = "") {
  return new Set(
    value
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean)
  );
}
~~~~

~~~~js
// server/src/app.js
import express from "express";
import cors from "cors";
import { courseRouter } from "./features/courses/course.routes.js";
import { parseAllowedOrigins } from "./config/origins.js";

export function createApp(config) {
  const app = express();
  const allowedOrigins = parseAllowedOrigins(config.clientOrigins);

  app.use(
    cors({
      origin(origin, callback) {
        // Requests without an Origin header are not browser CORS requests.
        // This callback permits those clients through the CORS middleware;
        // authentication and authorization are still enforced by the API.
        if (!origin || allowedOrigins.has(origin)) {
          return callback(null, true);
        }

        return callback(new Error("Origin is not allowed by CORS."));
      }
    })
  );

  app.use(express.json());
  app.use("/api/courses", courseRouter);

  return app;
}
~~~~

Some APIs intentionally support non-browser clients that omit the Origin header. The absence of that header is not proof of trust: command-line programs and servers can send arbitrary requests. Enforce access control in the API regardless of the CORS result.

The <code>cors</code> middleware sets response headers. Browsers enforce those headers when frontend JavaScript tries to read a cross-origin response. CORS is not a firewall and does not block a request from every client.

## 4. Understand preflight requests

For some cross-origin requests, the browser first sends an OPTIONS request called a preflight. This asks whether the requested method and headers are allowed before it sends the actual request.

A JSON POST commonly triggers preflight because <code>application/json</code> is not one of the CORS safelisted content types. Requests using methods such as PUT, PATCH, or DELETE, or custom headers such as Authorization, also commonly require preflight.

The browser may send headers like:

~~~~http
OPTIONS /api/courses HTTP/1.1
Origin: http://localhost:5173
Access-Control-Request-Method: POST
Access-Control-Request-Headers: content-type
~~~~

A successful response grants the requested browser access:

~~~~http
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Methods: GET,HEAD,PUT,PATCH,POST,DELETE
Access-Control-Allow-Headers: content-type
~~~~

When the CORS middleware is mounted before routes, it can answer preflight requests for the app. If a reverse proxy, gateway, or hosting platform handles OPTIONS before Express, its configuration must also preserve the intended CORS policy.

Do not solve a preflight error by allowing every origin, method, and header without considering the API's intended callers. Allow the methods and headers that the application actually needs.

## 5. Credentials require a specific origin

Most simple public data requests do not need browser credentials. If a cross-origin request must include cookies or other browser credentials, the client opts in and the server must allow credentials.

~~~~js
// Client request when cookie authentication is intentionally used
const response = await fetch(apiBaseUrl + "/api/profile", {
  credentials: "include"
});
~~~~

~~~~js
// Server CORS configuration for credentialed requests
app.use(
  cors({
    origin: "https://app.example.com",
    credentials: true
  })
);
~~~~

A credentialed response cannot use <code>Access-Control-Allow-Origin: *</code>. It must name the allowed origin, and the response must allow credentials. Cookie attributes such as <code>SameSite</code>, <code>Secure</code>, and <code>HttpOnly</code> also affect whether a browser sends or exposes a cookie; this chapter's CORS settings do not replace those cookie controls.

Do not enable credentials globally unless the application needs them. Keep the allowed origin narrow and review authentication, CSRF protection, and cookie policy as separate security decisions.

## 6. Use a development proxy when it simplifies local work

A Vite development proxy can forward a path such as <code>/api</code> to the local Express server. The browser then calls the frontend origin, and the development server forwards the request.

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

With that setup, client code can use a relative API base URL:

~~~~text
# client/.env.development
VITE_API_BASE_URL=
~~~~

A dev proxy is a development-server feature. It does not automatically configure the deployed app. Production needs either a public API base URL or a production reverse proxy that forwards the same path to the API.

A same-origin deployment might expose:

~~~~text
https://app.example.com/        -> frontend
https://app.example.com/api/... -> reverse proxy to the API
~~~~

This architecture can avoid browser cross-origin requests for the API, but the proxy must route correctly and preserve appropriate headers. CORS may still be needed for other allowed clients or origins.

## 7. Keep environments explicit

Use a separate configuration for local development, preview or staging, and production. For example:

| Environment | Frontend origin | API origin |
| --- | --- | --- |
| Local direct origins | <code>http://localhost:5173</code> | <code>http://localhost:4000</code> |
| Staging | <code>https://staging-app.example.com</code> | <code>https://staging-api.example.com</code> |
| Production | <code>https://app.example.com</code> | <code>https://api.example.com</code> |

The server's allowlist should include only the frontend origins for that environment. Avoid using a broad suffix or substring test such as “origin contains example.com”; an untrusted host could contain that text too. Compare complete, expected origins.

Environment template files may be committed with safe sample values. Keep local secret-bearing files ignored. API origins and allowed browser origins are usually not secrets, but deployment-specific settings still need to be correct.

## 8. Diagnose errors from the browser outward

When a request fails:

1. Open the browser developer tools Network panel.
2. Identify whether the failed request is the actual request or an OPTIONS preflight.
3. Inspect the Request URL, Origin, method, and requested headers.
4. Inspect the response status and CORS response headers.
5. Confirm the client base URL has the right scheme, host, and port.
6. Confirm the server allowlist exactly matches the browser Origin.
7. Check server, reverse-proxy, and hosting logs for routing or TLS errors.

A browser CORS message can obscure the original server failure. If the server crashes or the proxy returns an error without the required CORS headers, the browser may report that JavaScript cannot read the response. Check whether the API itself is reachable and inspect its logs.

A successful response from <code>curl</code> or an API client does not prove browser CORS is correct; those clients do not enforce browser CORS rules. Conversely, allowing an origin in CORS does not authenticate a request.

## Common mistakes

- Using the frontend URL as the API URL or omitting the server port.
- Including a path in an origin allowlist instead of the scheme, host, and port.
- Allowing every origin because one local request failed.
- Returning a wildcard origin together with credentialed requests.
- Putting private server credentials in a <code>VITE_</code> variable.
- Changing an environment file without restarting Vite.
- Expecting a dev proxy to exist after production deployment.
- Treating CORS as API authorization or a defense against non-browser callers.
- Forgetting to configure OPTIONS handling in a proxy or gateway.
- Allowing preview deployments with a broad string-match rule.

## Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- | --- |
| [087 - Full-stack application architecture and folder structure](087-full-stack-application-architecture-and-folder-structure.md) | [Lesson](088-configure-frontend-and-backend-origins.md) | [Q&A](../qnas/088-configure-frontend-and-backend-origins.md) | [Example](../examples/088-configure-frontend-and-backend-origins.md) | [089 - Connect React to Express end to end](089-connect-react-to-express-end-to-end.md) |
