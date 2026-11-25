# 099 - Deploy the frontend and production API URLs: Q&A

### 1. What does a production React build contain?

**Answer:** It contains browser-deliverable assets such as JavaScript, CSS, images, fonts, and an entry document. Users can inspect these files, so every value included in them must be treated as public.

### 2. What is an origin?

**Answer:** An origin is the combination of scheme, hostname, and port. Changing any of those components creates a different origin for browser security checks.

### 3. Are two subdomains the same origin?

**Answer:** No. For example, <code>app.example.test</code> and <code>api.example.test</code> are different origins even though they may be same-site for some cookie behavior.

### 4. What is a same-origin API deployment?

**Answer:** The browser uses one public origin for the frontend and API. An edge can serve static files and forward a path such as <code>/api</code> to Express.

### 5. What is a separate-origin deployment?

**Answer:** The frontend and API have different origins, such as a static frontend host and an API host. The client URL, CORS policy, credentials, cookies, and CSRF flow must be configured to work together.

### 6. Is one deployment shape always preferable?

**Answer:** No. Same-origin routing can simplify browser configuration, while separate origins can support independent hosting or scaling. Choose according to product and operational needs.

### 7. Can a user inspect the production JavaScript bundle?

**Answer:** Yes. Browser assets are public to anyone who can load the application, even if the repository itself is private.

### 8. Is <code>VITE_API_BASE_URL</code> safe to expose?

**Answer:** It can be safe when it contains only a public API URL or relative path. It becomes unsafe if it contains credentials, private tokens, or other secrets.

### 9. Why must <code>MONGODB_URI</code> stay out of frontend variables?

**Answer:** Frontend variables are compiled into browser-deliverable files. Anyone can inspect them and use a database credential if it is exposed there.

### 10. What is a build-time frontend variable?

**Answer:** It is a value substituted while generating the static bundle. Changing a deployment setting later does not necessarily change the already-built JavaScript.

### 11. What is a runtime frontend configuration file?

**Answer:** It is a public file served next to the frontend and loaded before the application starts. It can provide safe environment-specific values, such as an API URL, without rebuilding the rest of the artifact.

### 12. What must never be placed in a public runtime configuration file?

**Answer:** Database URIs, session secrets, signing keys, private tokens, cloud credentials, or any value whose confidentiality is required for security.

### 13. Why can a relative API path help promote one frontend artifact between environments?

**Answer:** A path such as <code>/api</code> uses the current site origin. If each environment configures its edge to forward that path to its own API, the static artifact does not need an environment-specific API hostname.

### 14. What is one risk of using a separate absolute API URL?

**Answer:** A production artifact can accidentally point to localhost, staging, or an incorrect host if the build-time value is missing or wrong.

### 15. How should a frontend build validate its production API URL?

**Answer:** Confirm that it uses HTTPS, points to an approved hostname and path, and is not localhost or an unintended environment. Treat the URL as public configuration, not as a secret.

### 16. What does the browser's default fetch credential mode do for same-origin requests?

**Answer:** It sends same-origin credentials by default. A request helper may set <code>credentials: "same-origin"</code> explicitly to make that behavior clear.

### 17. What credential mode is generally required for a cross-origin cookie API?

**Answer:** The browser client must opt in with <code>credentials: "include"</code>, and the API must allow the exact origin and credentialed response behavior.

### 18. Can a credentialed CORS response use <code>Access-Control-Allow-Origin: *</code>?

**Answer:** No. Credentialed access requires the actual allowed origin rather than a wildcard.

### 19. Is CORS a replacement for API authentication?

**Answer:** No. CORS controls whether browser JavaScript may read a cross-origin response. The API must still authenticate the request and authorize each operation.

### 20. What is a CORS preflight request?

**Answer:** It is a browser-generated permission check, commonly an OPTIONS request, sent before some cross-origin requests. The server must allow the intended origin, method, and request headers.

### 21. What must be aligned for a separate-origin session API?

**Answer:** The public API URL, exact CORS origin, credential mode, cookie attributes, HTTPS, session configuration, and CSRF token flow must agree.

### 22. Why does a subdomain frontend still need CORS for its API subdomain?

**Answer:** CORS is origin-based, and different hostnames are different origins even if they are related subdomains.

### 23. What does <code>SameSite</code> control?

**Answer:** It controls when browsers attach a cookie in relation to site context. It is distinct from CORS, which compares origins.

### 24. Why keep a session cookie host-only by default?

**Answer:** It limits which hosts receive the cookie. Widening the cookie domain should happen only when multiple subdomains genuinely need it and the broader exposure is understood.

### 25. Why should CSRF protection remain enabled for cookie-based sessions?

**Answer:** Browsers attach cookies automatically in relevant requests, creating a risk of cross-site request forgery. CORS does not by itself replace the application's CSRF defense.

### 26. What should the client do for a state-changing request when the application uses a synchronizer CSRF token?

**Answer:** Obtain a token through the intended API flow and send it using the configured request header, along with the expected session credentials.

### 27. Why must the static host preserve API routing before the SPA fallback?

**Answer:** If the fallback returns the React entry document for an API path, the client receives HTML instead of an API response, often causing confusing JSON parsing errors.

### 28. What is the purpose of a client-side route fallback?

**Answer:** It returns the frontend entry document for a valid browser route that does not correspond to a physical file, allowing the React router to render the page after direct navigation or refresh.

### 29. What should an unknown API path return?

**Answer:** It should return a real API not-found response, not the frontend HTML entry document with a misleading success status.

### 30. What must be coordinated when deploying under a URL subpath?

**Answer:** The build tool's base path, asset URLs, client router basename, and edge rewrites must use the same deployment path.

### 31. Why give a hashed JavaScript file a longer cache lifetime than the HTML entry document?

**Answer:** A content-hashed filename changes when its contents change, making it suitable for long immutable caching. The HTML document needs to revalidate so it can reference the newest asset names.

### 32. Why treat runtime configuration caching separately from hashed assets?

**Answer:** Runtime configuration can change without its filename changing. A long-lived cached copy may keep calling the wrong API after a deployment.

### 33. Why retain old hashed frontend assets after publishing a new release?

**Answer:** A browser may still have an older cached entry document open and request the asset names it references. Removing those files immediately can break existing users.

### 34. Why should frontend and API changes remain backward-compatible during deployment?

**Answer:** Browsers can keep old clients open or cached while the server has already updated. Compatibility allows both versions to work during rollout and provides a safer rollback path.

### 35. What is a useful deployment order for a compatible frontend and API change?

**Answer:** Deploy the API behavior that supports both old and new clients, verify readiness, then publish the frontend that uses the new behavior. Remove old API behavior only after the compatibility period.

### 36. Why inspect the built frontend artifact before release?

**Answer:** It can reveal accidental secrets, incorrect API URLs, environment values, or source maps that were not intended to be public.

### 37. A production browser sends requests to localhost. What should be checked first?

**Answer:** Inspect the build-time API variable and the actual generated bundle. The value may have been missing or incorrect when the artifact was built.

### 38. The browser reports a CORS error, but the API endpoint works from a terminal. Why?

**Answer:** The browser enforces CORS and credential rules that a terminal client does not. Check the browser's Origin, preflight response, allowed headers, and credential configuration.

### 39. The page loads, but a nested route fails after refresh. What is likely wrong?

**Answer:** The static host is not returning the frontend entry document for client-side routes, or the app's base path and router basename do not match the deployment path.

### 40. After a frontend release, the API returns JSON correctly but the client still uses the previous API host. What should be inspected?

**Answer:** Check whether the API URL is compiled at build time or loaded at runtime, then inspect the current entry document and runtime config cache behavior. Revalidate or publish the correct config as part of the release.
