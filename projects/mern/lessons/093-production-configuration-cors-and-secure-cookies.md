# 093 - Production configuration, CORS, and secure cookies

A MERN application may run behind a load balancer, serve its React client from a different origin, and use browser cookies for sessions. Production behavior depends on configuration and proxy topology as much as application code. A cookie that is correct on localhost can silently fail behind HTTPS termination; a permissive CORS response can expose credentialed API responses to an untrusted site.

This chapter makes the deployment contract explicit: validate configuration at startup, allow only known browser origins, configure credentials and preflight deliberately, set session cookies for HTTPS, and trust only the reverse proxy that actually sits in front of Express.

## Learning outcomes

After this chapter, you should be able to:

- Separate public frontend configuration from server-only configuration and secrets.
- Validate required environment values before the server accepts traffic.
- Explain the difference between an origin and a site.
- Configure an explicit CORS allowlist for a credentialed browser API.
- Explain why CORS is not authentication, authorization, or CSRF protection.
- Configure secure session cookies for production HTTPS.
- Choose SameSite policy based on the actual app and API deployment.
- Configure Express proxy trust to match the real infrastructure.
- Avoid exposing secrets in frontend bundles, logs, and error responses.
- Plan development, staging, and production configuration as distinct deployments.

## 1. Treat configuration as part of the application

Configuration controls things that differ between environments: database location, client origin, session lifetime, upload storage, logging, and network ports. Keep configuration in one server-side module instead of reading <code>process.env</code> throughout feature code.

A useful configuration contract lists:

- Required server-only values, such as the MongoDB URI and session secret.
- Public but environment-specific values, such as the browser's API base URL.
- Safe defaults, such as a local development port.
- Values that must be rejected, such as an invalid URL or insecure production cookie policy.

Fail at startup when a required value is missing or malformed. A service that starts with an empty session secret or wrong database URL can fail later in confusing ways.

## 2. Separate client configuration from server secrets

A Vite variable prefixed with <code>VITE_</code> is included in the browser bundle. It is public configuration, not a place for credentials.

Appropriate client values may include:

~~~~text
VITE_API_BASE_URL=https://api.example.test
~~~~

Server-only values may include:

~~~~text
MONGODB_URI=mongodb+srv://...
SESSION_SECRET=...
CLIENT_ORIGINS=https://app.example.test
SESSION_COOKIE_NAME=__Host-mern.sid
COOKIE_SAME_SITE=lax
COOKIE_SECURE=true
TRUST_PROXY_HOPS=1
~~~~

Do not commit production environment files. Store secrets in the deployment platform's secret manager, rotate them with an operational plan, and ensure logs and error responses do not reveal them. Never pass a database URI, session secret, private storage key, or signing key to React.

## 3. Validate and normalize configuration once

The following example validates a small production configuration. Add application-specific values, including upload limits and storage paths, to the same boundary.

~~~~js
// server/src/config/index.js
function required(name) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error("Missing required environment variable: " + name);
  }

  return value;
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

function parseInteger(name, value, fallback, minimum) {
  if (value === undefined || value === "") return fallback;

  const number = Number(value);

  if (!Number.isSafeInteger(number) || number < minimum) {
    throw new Error(name + " must be an integer of at least " + minimum + ".");
  }

  return number;
}

const nodeEnv = process.env.NODE_ENV ?? "development";
const sameSite = process.env.COOKIE_SAME_SITE ?? "lax";
const production = nodeEnv === "production";
const cookieSecure = production || process.env.COOKIE_SECURE === "true";
const trustProxyHops = parseInteger(
  "TRUST_PROXY_HOPS",
  process.env.TRUST_PROXY_HOPS,
  0,
  0
);

if (!["strict", "lax", "none"].includes(sameSite)) {
  throw new Error("COOKIE_SAME_SITE must be strict, lax, or none.");
}

if (sameSite === "none" && !cookieSecure) {
  throw new Error("SameSite=None requires a Secure cookie and HTTPS.");
}

const sessionCookieName = process.env.SESSION_COOKIE_NAME ?? "mern.sid";

if (sessionCookieName.startsWith("__Host-") && !production) {
  throw new Error("Use a __Host- session cookie name only in secure production.");
}

const config = Object.freeze({
  nodeEnv,
  production,
  port: parseInteger("PORT", process.env.PORT, 4000, 1),
  mongoUri: required("MONGODB_URI"),
  sessionSecret: required("SESSION_SECRET"),
  sessionCookieName,
  clientOrigins: parseOriginList(required("CLIENT_ORIGINS")),
  cookieSameSite: sameSite,
  cookieSecure,
  trustProxyHops
});

if (production && config.sessionSecret.length < 32) {
  throw new Error("SESSION_SECRET must be a high-entropy secret.");
}

export { config };
~~~~

Length checks only reject obviously weak settings; they do not prove a secret has enough entropy. Generate secrets with a cryptographically secure tool and keep them private. Validate the exact client-origin list and cookie policy during deployment review.

A team can use a schema-validation library instead of handwritten checks. The important property is that one startup boundary parses untrusted environment strings into a typed, validated configuration object.

## 4. Understand browser origins and sites

An origin is the combination of scheme, host, and port. These are different origins:

- <code>https://app.example.test</code>
- <code>http://app.example.test</code>
- <code>https://api.example.test</code>
- <code>https://app.example.test:8443</code>

A site is a broader cookie and browser security concept based on the scheme and registrable domain. Two subdomains can be cross-origin while still being same-site. This distinction matters: CORS compares origins, while cookie <code>SameSite</code> behavior is based on sites.

Prefer serving the API and browser app under one site, for example <code>app.example.test</code> and <code>api.example.test</code>, when the architecture allows it. This often permits a more restrictive cookie policy than a truly cross-site API.

## 5. Configure CORS with an explicit allowlist

CORS tells a browser whether frontend JavaScript may read a cross-origin response. It is not a firewall: a request can reach the API even if the browser refuses to expose the response. Non-browser clients do not enforce CORS.

For a credentialed API, return the exact allowed origin, not <code>*</code>. Decide which methods and request headers the browser needs. Keep CORS middleware before API routes so it can answer preflight requests.

~~~~js
// server/src/config/cors.js
import cors from "cors";

export function createCorsMiddleware(config) {
  const allowedOrigins = new Set(config.clientOrigins);

  return cors({
    origin(origin, callback) {
      // Requests without an Origin header are not browser CORS requests.
      // They still reach normal authentication and authorization checks.
      if (!origin) return callback(null, false);

      if (!allowedOrigins.has(origin)) {
        return callback(new Error("Origin is not allowed."));
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

Do not reflect every requested origin just because it has an <code>Origin</code> header. When the application selects an origin dynamically, its response must vary correctly by origin; the CORS middleware handles the relevant header behavior. Do not combine credentialed requests with a wildcard allowed origin.

A failed CORS check is not a substitute for route authorization. Every protected route must still authenticate the session, validate permissions, and scope database queries to the user.

## 6. Understand and support preflight

Before some cross-origin requests, the browser sends an <code>OPTIONS</code> preflight that asks whether a method and headers are allowed. JSON requests and custom headers such as <code>X-CSRF-Token</code> commonly trigger preflight.

The CORS middleware should run before authentication middleware that would reject the preflight. Let the middleware answer permitted preflights without requiring a session cookie. The subsequent actual request still must authenticate and pass CSRF validation.

A common diagnosis sequence is:

1. Inspect the browser console and Network panel for the <code>OPTIONS</code> request.
2. Check its <code>Origin</code>, requested method, and requested headers.
3. Confirm the response allows exactly that origin, method, header, and credentials.
4. Inspect the subsequent request separately; preflight success does not mean API authorization succeeded.

## 7. Choose cookie attributes for the deployment

The session cookie contains an opaque session identifier. In production HTTPS, configure it to be inaccessible to JavaScript and transmitted only over secure transport.

~~~~js
// server/src/config/session.js
export function createSessionOptions(config, mongoStore) {
  return {
    name: config.sessionCookieName,
    secret: config.sessionSecret,
    store: mongoStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: config.cookieSecure,
      sameSite: config.cookieSameSite,
      path: "/",
      maxAge: 1000 * 60 * 60 * 8
    }
  };
}
~~~~

Do not set a broad <code>Domain</code> unless sharing a cookie across subdomains is an intentional requirement. A cookie name with the <code>__Host-</code> prefix gives the browser additional constraints: it must be secure, use <code>Path=/</code>, and omit <code>Domain</code>. Use that prefix only when the deployment meets those requirements.

## 8. Match SameSite to the actual request topology

Use an explicit <code>SameSite</code> policy instead of relying on browser defaults:

- <code>Strict</code> is restrictive and can affect some navigation and identity flows.
- <code>Lax</code> allows common top-level safe navigations and is often a practical session default.
- <code>None</code> permits cross-site cookie use and requires <code>Secure</code> in modern browsers.

A React app and API on different origins are not automatically cross-site. For example, two HTTPS subdomains can be cross-origin but same-site. If the browser and API are truly cross-site and need a cookie, configure <code>SameSite=None; Secure</code>, use HTTPS end to end, allow the exact frontend origin with credentials, and retain CSRF protection.

SameSite is defense in depth, not a replacement for a CSRF token on state-changing cookie-authenticated operations. <code>HttpOnly</code> prevents JavaScript from reading the cookie; it does not stop malicious script from making requests in the signed-in page.

## 9. Configure Express trust proxy narrowly

When TLS terminates at a reverse proxy, Express may see an internal HTTP connection even though the browser used HTTPS. The proxy can provide forwarded protocol and client information. Express must trust only the proxy topology that the deployment actually uses.

~~~~js
// server/src/app.js
export function createApp(config) {
  const app = express();

  if (config.trustProxyHops > 0) {
    app.set("trust proxy", config.trustProxyHops);
  }

  app.use(createCorsMiddleware(config));
  app.use(express.json({ limit: "1mb" }));
  app.use(createSessionMiddleware(config));

  // Register CSRF token endpoint, CSRF protection, and API routers next.
  // Keep the centralized error handler last.

  return app;
}
~~~~

The number of trusted hops must match the real path from the application to the internet-facing client, and the proxy must overwrite forwarded headers it owns. Do not set trust proxy to <code>true</code> without understanding every route to the server. Otherwise, a caller may forge forwarded host, protocol, or IP values and affect security-sensitive decisions.

## 10. Configure HTTPS at the edge and in the application

Production browser traffic should use HTTPS. Redirect HTTP to HTTPS at a trusted edge, set secure cookies, and consider an HSTS policy after confirming all relevant hosts are ready for HTTPS. If Express is behind a proxy, configure its trust relationship rather than treating an untrusted forwarded header as proof of TLS.

Avoid mixed content: an HTTPS page should not load application assets or API requests over HTTP. Verify the browser's final URL and the actual request scheme, not only the proxy's public URL.

## 11. Make errors and logs safe

A production API should return stable, user-safe messages. It should not return stack traces, configuration values, filesystem paths, or database connection strings.

Log enough context to investigate:

- A request or correlation ID.
- Route name and status code.
- A safe error category.
- A deployment environment or service name.

Do not log passwords, session cookies, CSRF tokens, authorization headers, database URIs, or full request bodies by default. Restrict production log access and retention.

## 12. Separate environment behavior intentionally

Keep local, staging, and production settings explicit. A typical policy looks like this:

| Setting | Local development | Production |
| --- | --- | --- |
| Browser URL | Local development origin | Exact HTTPS application origin |
| API URL | Local API or development proxy | HTTPS API or same-origin proxy |
| Cookie <code>Secure</code> | False only when local HTTP requires it | True |
| Cookie <code>HttpOnly</code> | True | True |
| Cookie <code>SameSite</code> | Explicit value matching local testing | Explicit reviewed policy |
| Session store | Local MongoDB service | Durable shared session store |
| CORS origin | Exact local frontend origin | Exact deployed frontend origin |
| Trust proxy | 0 unless a local proxy exists | Exact deployed proxy topology |
| Secrets | Local untracked environment file | Secret manager or protected variables |

Do not let a production environment silently fall back to development origins, a default secret, memory sessions, or a non-secure cookie.

## Common mistakes

- Treating every environment variable as private even after a <code>VITE_</code> variable is bundled.
- Committing production secrets.
- Allowing <code>Access-Control-Allow-Origin: *</code> with credentials.
- Reflecting any Origin header without checking an allowlist.
- Assuming CORS blocks requests or replaces authorization.
- Forgetting that custom headers and JSON may trigger preflight.
- Rejecting <code>OPTIONS</code> with authentication before CORS middleware answers it.
- Relying on default SameSite behavior.
- Setting <code>SameSite=None</code> without <code>Secure</code>.
- Setting a cookie <code>Domain</code> broader than required.
- Trusting all proxy headers with <code>trust proxy: true</code>.
- Enabling a secure cookie behind TLS termination without configuring the known proxy path.
- Treating <code>HttpOnly</code> as CSRF protection.
- Exposing session secrets, connection strings, or stack traces in logs or responses.

## Manually inspect the deployment contract

1. Start with missing required variables and confirm the server fails before listening.
2. Set a malformed MongoDB URI, origin, port, or cookie setting and confirm startup rejects it.
3. Load the app from an unlisted origin and confirm browser JavaScript cannot read the API response.
4. Send a credentialed request from the allowed origin and confirm the exact origin and credentials headers appear.
5. Inspect an <code>OPTIONS</code> preflight for the required method and <code>X-CSRF-Token</code> header.
6. Confirm that an actual protected request still requires authentication and CSRF validation.
7. In production HTTPS, inspect <code>Set-Cookie</code> for <code>Secure</code>, <code>HttpOnly</code>, explicit <code>SameSite</code>, and the intended path/domain.
8. Confirm an untrusted client cannot forge forwarded host, protocol, or IP values through the proxy.
9. Inspect logs and API errors for secret, cookie, token, and stack-trace leakage.
10. Test the actual deployed scheme, origins, proxy path, and browser cookie behavior.

## Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- | --- |
| [092 - File uploads end to end](092-file-uploads-end-to-end.md) | [Lesson](093-production-configuration-cors-and-secure-cookies.md) | [Q&A](../qnas/093-production-configuration-cors-and-secure-cookies.md) | [Example](../examples/093-production-configuration-cors-and-secure-cookies.md) | [094 - Unit, integration, and end-to-end testing](094-unit-integration-and-end-to-end-testing.md) |
