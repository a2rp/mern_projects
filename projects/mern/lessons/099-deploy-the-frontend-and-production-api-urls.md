# 099 - Deploy the frontend and production API URLs

A React application is built into static browser assets, but those assets still need to know where to send API requests. Production deployment must align the frontend URL, API route, CORS policy, session cookies, CSRF flow, HTTPS, static asset paths, and cache behavior.

This chapter deploys the frontend independently or behind the same edge as the API. It shows how to use a same-origin API path, how to configure a public API URL when origins are separate, and how to avoid publishing server secrets in client files. Chapter 100 adds continuous integration for linting, tests, and builds.

## Learning outcomes

After this chapter, you should be able to:

- Build a production React artifact and identify its source revision.
- Distinguish build-time public values from server secrets.
- Choose a same-origin or separate-origin API deployment.
- Configure a public API base URL safely.
- Align CORS, browser credentials, cookies, and CSRF protection.
- Set static hosting paths, SPA fallback, and cache rules correctly.
- Deploy compatible frontend and API versions with a rollback path.
- Diagnose production requests in the browser and at the edge.

## 1. Identify the frontend and API origins

An origin consists of scheme, hostname, and port. These are different origins:

- <code>https://learn.example.test</code>
- <code>https://api.example.test</code>
- <code>http://learn.example.test</code>
- <code>https://learn.example.test:8443</code>

Choose the request path before configuring the client:

1. **Same origin:** the edge serves the React files and forwards <code>/api</code> to Express.
2. **Separate origins:** a static host serves the frontend and a different host serves the API.

A same-origin path often makes browser configuration simpler. Separate origins can still work well, but require the API URL, CORS, cookie, credential, and CSRF settings to agree exactly.

Do not confuse cross-origin with cross-site. Two subdomains are cross-origin but can be same-site. Cookie behavior depends on the site relationship and browser policy, while CORS compares origins.

## 2. Build a public frontend artifact

A production frontend build contains JavaScript, CSS, fonts, images, and other browser assets. Users can download and inspect these files. Treat every included value as public.

Build from a reviewed revision and the frontend lockfile:

~~~~text
npm ci
npm run build
~~~~

Publish the generated output directory, commonly <code>dist/</code>, to the static host or edge. Do not publish the source <code>.env</code> file, server directory, development database, private upload directory, or server-only configuration.

A Vite variable exposed to client code is public. A value such as <code>VITE_API_BASE_URL</code> may be public because the browser needs it. Never expose <code>MONGODB_URI</code>, <code>SESSION_SECRET</code>, signing keys, cloud credentials, or private service tokens through frontend variables.

## 3. Prefer a same-origin API path when it fits

If the edge serves the frontend at <code>https://learn.example.test</code> and forwards <code>/api</code> to Express, configure the client with a relative path:

~~~~text
VITE_API_BASE_URL=/api
~~~~

Then resolve requests from that configured base:

~~~~js
// client/src/lib/api-url.js
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() || "/api";

export function apiUrl(path) {
  const base = apiBaseUrl.replace(/\/$/, "");
  const suffix = path.replace(/^\//, "");
  return base + "/" + suffix;
}
~~~~

For example, <code>apiUrl("/lessons")</code> returns <code>/api/lessons</code>. A relative path keeps the same frontend artifact usable on different hostnames when each environment uses the same edge route.

The edge must route <code>/api</code> to Express and static paths to the frontend. It must not serve the React HTML document as the response to a failed API route.

## 4. Configure a separate public API origin

If frontend and API hosts are separate, the frontend build needs a public API base URL, for example:

~~~~text
VITE_API_BASE_URL=https://api.example.test/api
~~~~

This value is visible in the bundle by design. It must not contain credentials or private access tokens.

Validate the value before publishing. In production, require HTTPS and an approved hostname. Reject an accidental localhost URL or an unexpected staging API URL in the production artifact. If the API base URL is embedded at build time, build an artifact for each environment or use a deliberate runtime configuration file.

Avoid concatenating arbitrary user-controlled input into the API base URL. Build request paths from known application routes and encode query values with URL APIs.

## 5. Understand build-time and runtime configuration

A build-time variable is substituted during <code>npm run build</code>. Changing a deployment variable after the build does not necessarily change the already-generated JavaScript.

There are two common configurations:

| Approach | How it works | Trade-off |
| --- | --- | --- |
| Build-time public URL | The API base URL is compiled into the frontend bundle | Simple, but different URLs generally require different builds |
| Public runtime configuration | A non-secret config asset is served beside the app and loaded before the client starts | One artifact can move between environments, but the file must be delivered and cached deliberately |

If using runtime configuration, make the file explicitly public and include only values safe for anyone to read:

~~~~js
// public/app-config.js
window.__APP_CONFIG__ = Object.freeze({
  apiBaseUrl: "/api"
});
~~~~

Load it before the application module:

~~~~html
<script src="/app-config.js"></script>
<script type="module" src="/src/main.jsx"></script>
~~~~

The exact production build output may rename the module script. Ensure the runtime configuration is created by the deployment process, not by writing secret values into a public file. Treat its cache behavior and schema as part of the release.

## 6. Send cookies with the intended API requests

For a same-origin session API, browser fetch uses same-origin credentials by default. State it explicitly when the request helper should always send the session cookie:

~~~~js
export async function apiFetch(path, options = {}) {
  return fetch(apiUrl(path), {
    ...options,
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      ...options.headers
    }
  });
}
~~~~

For a cross-origin API that uses cookies, the client must use <code>credentials: "include"</code>, and the API must allow the exact frontend origin with credentials. Do not combine credentialed requests with a wildcard CORS origin.

A successful preflight does not authenticate a user. The server must still verify the session and authorize each operation.

## 7. Keep CORS and browser security settings aligned

When origins are separate, configure the API's allowlist to contain the exact deployed frontend origin, including scheme and port. Allow only the required methods and headers. Credentialed responses must identify the actual origin and include credential permission.

The edge, frontend, and API must agree on:

- Public HTTPS scheme and hostnames.
- Frontend API base URL and path prefix.
- CORS origin allowlist and credential behavior.
- Session cookie <code>Secure</code>, <code>SameSite</code>, and scope.
- CSRF token acquisition and state-changing request headers.
- Any required authorization header and preflight behavior.

Same-origin requests normally do not require CORS. Keep the API's security checks; CORS does not replace authentication, authorization, input validation, or CSRF defenses.

## 8. Configure session cookies and CSRF for the chosen topology

For a same-origin application, a host-only secure cookie with an appropriate <code>SameSite</code> policy is usually a suitable starting point. Do not set a broad cookie domain unless multiple subdomains need it and the security consequences are understood.

For separate subdomains, browser requests are cross-origin even when the hosts are same-site. The client may need to include credentials, and the API must permit the exact frontend origin. Keep the cookie scoped to the API host unless the session genuinely needs a broader scope.

For a frontend and API on different sites, cookie restrictions may require a different <code>SameSite</code> policy. Browser third-party-cookie controls may still block the flow. Prefer an architecture that avoids unnecessary cross-site cookies where possible, and test the actual supported browsers.

Keep the synchronizer CSRF flow from earlier chapters. The frontend obtains a CSRF token through the intended API route and sends it in the expected header for state-changing requests. Do not turn off CSRF protection merely because the frontend and API use different origins.

## 9. Configure static routing and application fallback

A client-side router can render routes such as <code>/courses/mern</code> without a server file at that path. The static host should return the app's entry document for frontend routes, while preserving API routes and real assets.

A routing order should conceptually be:

1. Serve an existing static asset.
2. Forward the API prefix to Express.
3. For remaining frontend navigation requests, return the React entry document.
4. Return a real not-found response for unknown API paths.

A careless catch-all can turn an API 404 into HTML with status 200. The browser then reports a JSON parse error instead of a useful API error.

If the application is deployed under a subpath, configure the build tool's base path, static asset URLs, client router basename, and edge rewrite together. Test a nested route after a hard refresh, not only by navigating from the home page.

## 10. Set cache behavior for HTML and hashed assets

Production build tools commonly give generated asset files content hashes. A changed asset then receives a new URL and can be cached for a long period.

Use a deliberate policy:

- The HTML entry document and runtime configuration should revalidate or use a short cache lifetime.
- Hashed JavaScript, CSS, and immutable media can use a long cache lifetime with immutable semantics.
- Never cache a secret-bearing response publicly.
- Ensure a deployment retains old hashed files long enough for clients with a cached HTML page to load them.
- Purge or revalidate the entry document when publishing a new release.

If runtime config changes but the browser keeps an old config file, it may call the wrong API. Keep its cache policy separate from immutable assets.

## 11. Deploy compatible frontend and API versions

The frontend and API may deploy independently. Plan for a period when some browsers use an older cached client while the server has a newer release.

Use backward-compatible API changes:

1. Add a new response field or endpoint while retaining the old behavior.
2. Deploy the API so both old and new clients work.
3. Publish the frontend that uses the new behavior.
4. Observe adoption and errors.
5. Remove old API behavior only after the compatibility window and release policy allow it.

For incompatible changes, version the API or coordinate an explicit migration. Do not assume every open browser tab refreshes at deployment time.

A safe frontend release keeps the previous static artifact and API-compatible configuration available. Roll back the entry document and public config together when they were published as a release unit.

## 12. Deployment sequence

1. Build the frontend from a reviewed source revision using the lockfile.
2. Inspect the generated bundle and source maps for accidental secrets.
3. Configure its public API base URL or runtime config.
4. Configure the API CORS allowlist, cookie policy, CSRF flow, and trusted edge.
5. Publish the assets and verify the static host serves the correct entry document.
6. Confirm the API deployment is ready before exposing the new frontend.
7. Verify the public frontend URL, API URL, TLS, and route rewrites.
8. Test direct navigation and refresh on a nested client route.
9. Confirm a failed API request remains an API error and does not return the HTML entry document.
10. Observe browser errors, edge logs, API logs, and latency.
11. Retain the prior compatible frontend and API release for rollback.

## 13. Diagnose common browser symptoms

| Symptom | Likely area to inspect |
| --- | --- |
| Requests go to localhost in production | Build-time variable was missing or wrong when the artifact was built |
| Browser reports a CORS error | Exact origin, credential setting, allowed headers, or preflight response |
| Session cookie is absent | HTTPS, cookie attributes, proxy trust, browser credential mode, or site relationship |
| API responds with HTML | Static SPA fallback captured the API route or the API path is wrong |
| Nested route returns 404 after refresh | Static host does not provide the frontend entry document for client routes |
| New deployment still calls old API | Cached entry document or runtime configuration |
| Assets return 404 after refresh | Build base path, router basename, edge rewrite, or asset publication |
| Old page fails after deployment | New release removed hashed assets still referenced by cached HTML |

Inspect the browser Network panel for the request URL, method, status, response content type, request credentials, and preflight. Do not paste cookies, authorization headers, or private response data into a public issue.

## Common mistakes

- Assuming a frontend environment variable remains private.
- Expecting a runtime setting to change a URL already compiled into a bundle.
- Shipping a production bundle that points to localhost or staging.
- Using a wildcard CORS origin with credentials.
- Fixing a cookie problem by disabling secure-cookie or CSRF protections.
- Forgetting that subdomains are separate origins.
- Rewriting unknown API requests to the frontend HTML document.
- Configuring the build base path but not the client router or edge.
- Caching runtime configuration as if it were an immutable hashed asset.
- Deleting old hashed files while cached pages still reference them.
- Deploying a breaking API change while old clients remain open.

## Manually inspect the frontend deployment

1. Confirm the production frontend artifact was built from the reviewed revision.
2. Search the built files for private credentials and internal-only values.
3. Confirm the API base URL uses the intended public API route.
4. Confirm the edge serves static assets and forwards API paths separately.
5. Confirm production URLs use HTTPS and valid certificates.
6. Confirm the API allows only the intended frontend origin when CORS is required.
7. Confirm credential mode, session cookie attributes, and CSRF token flow agree.
8. Open the home page and hard-refresh at least one nested client route.
9. Trigger an unknown API path and confirm it returns an API 404 rather than HTML.
10. Check cache headers for the entry document, runtime config, and hashed assets.
11. Confirm a previous compatible frontend/API release can be restored.
12. Inspect browser and server diagnostics without exposing cookies or secrets.

## Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- | --- |
| [098 - Deploy the API and configure database secrets](098-deploy-the-api-and-configure-database-secrets.md) | [Lesson](099-deploy-the-frontend-and-production-api-urls.md) | [Q&A](../qnas/099-deploy-the-frontend-and-production-api-urls.md) | [Example](../examples/099-deploy-the-frontend-and-production-api-urls.md) | [100 - Continuous integration: lint, test, and build](100-continuous-integration-lint-test-and-build.md) |
