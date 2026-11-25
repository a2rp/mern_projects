# 055 - Rate limits, security headers, and API hardening: example

This example adds request limits, Helmet response headers, and bounded parsers to the Express session API from earlier chapters. It demonstrates a general API limit plus a stricter login limit, trusted proxy configuration, safe 429 responses, and a production-oriented middleware order.

The code is a learning example and is not run. Integrate it into the existing server from chapters 051–054; do not add a second Express application or replace the configured session store. The in-memory rate-limit store shown by default is for a single development process. Use a shared store for a multi-instance deployment.

## What the example demonstrates

- Set proxy trust only when the deployment has a known trusted proxy topology.
- Apply API and login limits before parsing request bodies.
- Use modern RateLimit headers and return 429 when the quota is reached.
- Add Helmet headers and handle the local-development HTTPS-upgrade behavior.
- Bound JSON and form bodies.
- Keep private API responses out of shared caches.
- Observe CSP in report-only mode before enforcing a customized policy.

## Install packages

From the existing Node.js project, install the middleware if it is not already present:

~~~powershell
npm install express express-rate-limit helmet
~~~

The API already uses Express and the session store from chapter 051. Package versions are intentionally not pinned in these notes.

## Configure the Express server

Add this setup near the start of the existing **server.js**, before route handlers. Keep the existing MongoDB connection, session setup, CSRF protection, authentication, and authorization middleware.

~~~js
const express = require("express");
const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");

const app = express();
const isProduction = process.env.NODE_ENV === "production";
const enforceCsp = process.env.CSP_ENFORCE === "true";

// Only configure this when the app is reachable through a known proxy chain.
// The hop count must match the actual deployment topology.
const trustedProxyHops = process.env.TRUST_PROXY_HOPS;

if (trustedProxyHops !== undefined) {
  if (!/^(0|[1-9]\d*)$/.test(trustedProxyHops)) {
    throw new Error("TRUST_PROXY_HOPS must be a non-negative integer.");
  }

  const hopCount = Number(trustedProxyHops);
  if (!Number.isSafeInteger(hopCount)) {
    throw new Error("TRUST_PROXY_HOPS is outside the supported range.");
  }

  app.set("trust proxy", hopCount);
}

// Remove this low-value framework fingerprinting header.
app.disable("x-powered-by");

// Helmet sets common response headers. Begin with report-only CSP
// while reviewing the policy needed by the actual application.
app.use(
  helmet({
    contentSecurityPolicy: {
      reportOnly: !enforceCsp,
      directives: {
        // Safari can upgrade localhost to HTTPS during local development.
        "upgrade-insecure-requests": isProduction ? [] : null,
      },
    },

    // Enable HSTS only when production traffic is reliably HTTPS.
    // Do not include subdomains until every covered subdomain is ready.
    strictTransportSecurity: isProduction
      ? {
          maxAge: 15552000,
          includeSubDomains: false,
        }
      : false,
  })
);

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    error: "Too many requests. Please wait before trying again.",
  },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    error: "Too many sign-in attempts. Please wait before trying again.",
  },
});

// Apply counting before potentially expensive body parsing and route work.
// The more specific login limit runs in addition to the general API limit.
app.use("/api", apiLimiter);
app.use("/api/login", loginLimiter);

// Keep bodies small and avoid parsing deeply nested form structures.
app.use(express.json({ limit: "16kb" }));
app.use(
  express.urlencoded({
    extended: false,
    limit: "8kb",
    parameterLimit: 30,
  })
);

// Register the existing MongoDB-backed session middleware after the parsers
// if that matches the session and CSRF setup in the existing server.
app.use(existingSessionMiddleware);
~~~

`existingSessionMiddleware` is a reminder to keep the real session configuration from chapter 051; it is not literal executable code. If the existing application requires session middleware before a parser, preserve that app's requirements while ensuring the limiter still runs before expensive route work. The login limiter is IP-based here. A production sign-in flow should also monitor failed attempts by normalized account identifier and avoid permanent account lockouts.

Set the proxy hop count only when there is a known trusted proxy chain. For a local direct connection, leave `TRUST_PROXY_HOPS` unset or set it to `0`. Never set proxy trust to `true` just to make IP detection work. If the deployment uses multiple proxy paths or a trusted proxy network, configure Express for that exact topology and test the client IP it observes.

## Keep sensitive responses from being cached

For private or session-related responses, set an explicit cache policy in the route:

~~~js
app.get("/api/me", requireAuthentication, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .select("_id username displayName")
      .lean();

    if (!user) {
      return res.status(401).json({ error: "Authentication required." });
    }

    res.set("Cache-Control", "no-store");
    res.json({ user });
  } catch (error) {
    next(error);
  }
});
~~~

Apply the same idea to password-reset responses, session details, CSRF token responses, and other private data. A response header does not control application-managed caches such as a service worker cache; configure those separately.

## CSP rollout

The middleware above runs Helmet's Content Security Policy in report-only mode when `CSP_REPORT_ONLY=true`. Browsers report policy violations rather than blocking resources. Use that stage to identify the scripts, styles, images, fonts, and API connections the application actually requires.

After reviewing the reports:

1. Remove unneeded third-party resources.
2. Add only the required sources to a deliberate CSP.
3. Test sign-in, main workflows, and error pages.
4. Enforce the reviewed policy by setting `CSP_ENFORCE=true`.
5. Keep monitoring violations after rollout.

Helmet's default CSP is a starting point, not a guarantee that it suits every app. If the React HTML is hosted separately, configure its CSP at that HTML host. An API's response headers do not automatically govern a document from another origin.

## Expected responses

### Normal API request

A request below the configured quota continues to the route. A browser-facing response includes Helmet's configured security headers. In production, expect HSTS only when `NODE_ENV=production`; in local development, the example disables HSTS and the HTTPS-upgrade CSP directive.

### Request above the limit

After the applicable quota is exceeded, the limiter returns **429 Too Many Requests** without running the route handler. The response includes standard rate-limit headers and a retry hint when supplied by the limiter/store.

Example response body:

~~~json
{
  "error": "Too many requests. Please wait before trying again."
}
~~~

The same IP reaches the stricter login limit sooner. This sample's in-memory counter resets when the process restarts and is not shared with another server process.

## Check the response headers

With the existing server running, inspect response headers using a command-line client:

~~~powershell
curl.exe -i http://localhost:3000/api/csrf-token
~~~

The exact set depends on the Helmet configuration and environment. Look for headers such as:

- `Content-Security-Policy-Report-Only` while report-only mode is enabled, or `Content-Security-Policy` when enforced.
- `X-Content-Type-Options: nosniff`.
- `X-Frame-Options` and/or CSP `frame-ancestors`.
- `Referrer-Policy`.
- `Strict-Transport-Security` in the configured production HTTPS environment.
- No `X-Powered-By` header.

The CSP report-only response does not block page behavior. Test the actual HTML response too when the React app is served by a different host.

## Production considerations

- Replace the in-memory limiter store with a maintained shared store when running multiple app instances.
- Decide and document whether a limiter-store outage should fail open or fail closed.
- Tune the global and route-specific limits using observed traffic and the action's cost.
- Add account-aware sign-in monitoring and recovery controls without exposing account existence.
- Verify `req.ip` through the production proxy path and prevent direct access around trusted proxies.
- Keep rate-limit state and session state in their intended shared stores.
- Set body size, page size, upload size, request timeout, and concurrency bounds on the server.
- Roll out CSP in report-only mode and enforce it only after the policy matches required app resources.
- Enable HSTS only after HTTPS is reliable; include subdomains only when all covered hosts are ready.
- Configure headers at the service that serves each browser document and resource.
- Use generic errors and avoid logging passwords, cookies, session IDs, CSRF tokens, bearer tokens, or full private bodies.
- Keep authentication, authorization, CSRF checks, validation, and safe output handling in place.

## Chapter navigation

| Previous chapter | Chapter Q&A | Next chapter |
| --- | --- | --- |
| [054 - CSRF, XSS, and injection protection](../lessons/054-csrf-xss-and-injection-protection.md) | [Q&A](../qnas/055-rate-limits-security-headers-and-api-hardening.md) | [056 - File uploads and validation](../lessons/056-file-uploads-and-validation.md) |
