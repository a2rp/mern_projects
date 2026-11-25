# 093 - Production configuration, CORS, and secure cookies: Q&A

### 1. Why should production configuration be centralized?

**Answer:** A single configuration boundary parses environment strings, validates required values, applies safe defaults, and gives the rest of the application a predictable object. Scattered reads of <code>process.env</code> make it easy for features to use inconsistent or unvalidated values.

### 2. Why should the server fail at startup when a required setting is invalid?

**Answer:** It is safer to reject a bad database URI, missing session secret, malformed origin, or impossible cookie policy before accepting traffic. Otherwise the application may start and fail later in a way that is harder to diagnose or may weaken security silently.

### 3. Are variables prefixed with VITE_ secret?

**Answer:** No. Vite exposes prefixed variables to the browser bundle. Use them only for public configuration such as an API base URL. Never put database credentials, session secrets, private storage paths, or signing keys in a <code>VITE_</code> variable.

### 4. Where should production secrets be stored?

**Answer:** Use the deployment platform's protected secret facility or another controlled secret manager. Do not commit them, paste them into frontend code, or print them in logs. Limit access and rotate credentials with a plan that accounts for active sessions and dependent services.

### 5. Does checking a session secret's string length prove it is strong?

**Answer:** No. Length checks reject obviously weak input but do not measure randomness or entropy. Generate the secret with a cryptographically secure process and protect it as a server credential.

### 6. What makes two URLs different origins?

**Answer:** An origin consists of scheme, host, and port. Changing any of those creates a different origin. For example, HTTP and HTTPS on the same hostname are different origins, and changing the port is also a different origin.

### 7. How does a site differ from an origin?

**Answer:** An origin includes scheme, hostname, and port and is used by CORS. A site is a broader browser concept used in cookie SameSite decisions. Two HTTPS subdomains can be different origins but same-site, so cross-origin does not automatically mean cross-site.

### 8. What does CORS control?

**Answer:** CORS response headers tell a browser whether frontend JavaScript from an origin may read a cross-origin response. CORS does not authenticate callers, authorize records, or prevent every request from reaching the server.

### 9. Does a CORS rejection protect an API from command-line clients?

**Answer:** No. Browsers enforce CORS for browser JavaScript. Command-line tools, backend services, and custom clients do not use browser CORS enforcement. The API still needs authentication, authorization, input validation, and rate controls.

### 10. Why is a wildcard origin invalid for credentialed browser requests?

**Answer:** Browsers do not permit credentialed CORS responses with a wildcard allowed origin. More fundamentally, a credentialed API should allow the exact origins that need access instead of making every site a trusted frontend.

### 11. Why should an API not blindly reflect the Origin request header?

**Answer:** The caller controls that header. Reflecting every value turns arbitrary sites into allowed browser origins. Compare the origin with an explicit allowlist and return only an approved origin.

### 12. What should the API do when a request has no Origin header?

**Answer:** It is not a browser CORS request, so CORS headers are generally unnecessary. The request must still pass the same authentication, authorization, validation, and rate checks. Absence of an Origin does not make it trusted.

### 13. Why does a dynamically selected origin need a correct Vary response?

**Answer:** If a cache stores a response for one origin and serves it to another, the response can expose content or carry incorrect CORS headers. A response whose CORS headers depend on Origin must be varied by Origin; CORS middleware can manage this behavior.

### 14. What is a CORS preflight?

**Answer:** It is an <code>OPTIONS</code> request a browser sends before some cross-origin requests. It asks whether the origin, method, and request headers are allowed. The browser sends the actual request only after a successful preflight.

### 15. Why might JSON or X-CSRF-Token trigger a preflight?

**Answer:** Some content types and custom headers are not in the browser's simple-request set. The browser asks the server's CORS policy whether it may send the real request with those headers.

### 16. Which CORS settings should be explicit?

**Answer:** Explicitly set the allowed origin policy, whether credentials are allowed, required methods, allowed request headers, and optionally a preflight cache duration. Keep this list as small as the application needs.

### 17. Should authentication reject OPTIONS before CORS middleware can answer?

**Answer:** Usually not for a CORS preflight. Run CORS handling before route authentication so allowed preflight requests can receive the required response. The actual application request must still authenticate and authorize normally.

### 18. What does credentials: "include" do in Fetch?

**Answer:** It asks Fetch to include credentials such as cookies on cross-origin requests, subject to the browser's cookie and CORS rules. Configure the API's exact CORS origin and credentials response. For same-origin requests, the default credential mode already includes same-origin cookies.

### 19. What does the Secure cookie attribute do?

**Answer:** It tells browsers to send the cookie only over secure transport such as HTTPS, subject to browser-specific localhost behavior. Production session cookies should use Secure so session identifiers are not transmitted over ordinary HTTP.

### 20. What does HttpOnly do, and what does it not do?

**Answer:** HttpOnly prevents client-side JavaScript from reading the cookie through browser APIs such as <code>document.cookie</code>. It does not stop injected script from making requests in the user's browser, and it is not CSRF protection.

### 21. What does SameSite control?

**Answer:** SameSite controls whether a browser includes a cookie on requests associated with a different site. It is a defense-in-depth setting for cross-site request behavior, but it does not replace a CSRF token for cookie-authenticated state-changing requests.

### 22. What is the difference between Lax and Strict?

**Answer:** Strict is more restrictive and may omit cookies from more cross-site navigation flows. Lax permits cookies for common top-level safe navigations while restricting many cross-site subrequests and unsafe requests. Choose intentionally and test the product's sign-in and navigation flows.

### 23. When is SameSite=None needed?

**Answer:** It is needed when the browser must send a cookie on cross-site requests. Modern browsers require it to be paired with Secure. Use it only when the deployment needs cross-site cookies and runs over HTTPS.

### 24. Does a React app on one subdomain and an API on another always need SameSite=None?

**Answer:** No. Different subdomains are cross-origin, but may still be same-site. CORS handles the origin boundary; cookie SameSite is based on the site's relationship. Determine the deployed scheme and registrable domains instead of inferring from different hostnames alone.

### 25. What requirements apply to a cookie with the __Host- prefix?

**Answer:** The browser requires it to be set securely, with <code>Path=/</code>, and without a <code>Domain</code> attribute. These constraints help prevent subdomains from setting a competing cookie. Do not use the prefix where the deployment cannot satisfy its requirements.

### 26. Should session cookies set Domain broadly?

**Answer:** Only when intentional subdomain sharing is required. Omitting Domain produces a host-only cookie, which is more narrowly scoped. A broad parent-domain cookie exposes the cookie to more subdomains and increases the impact of a subdomain compromise.

### 27. Why set Path explicitly?

**Answer:** Path controls which request paths receive a cookie. For a host-prefixed cookie it must be <code>/</code>. Session applications commonly use root path so the session reaches all required app routes; use the narrowest path compatible with the app.

### 28. Why does Secure cookie configuration sometimes fail behind a reverse proxy?

**Answer:** TLS may terminate at the proxy, while the connection from proxy to Express is plain HTTP. Express can then believe the request is insecure and refuse to set a secure session cookie. Configure trust only for the known proxy path so Express can safely interpret forwarded protocol information.

### 29. Is trust proxy set to true always safe?

**Answer:** No. It trusts forwarded information based on the configured proxy model. If arbitrary callers can reach Express or the proxy does not overwrite forwarded headers, a caller may forge protocol, IP, or host information. Configure it to match the actual infrastructure.

### 30. How should TRUST_PROXY_HOPS be chosen?

**Answer:** Count the known trusted proxy hops between the client and Express, and verify that each proxy overwrites the forwarded headers it owns. If no proxy is used, leave proxy trust disabled. Do not choose a hop count by guesswork.

### 31. Why does the API need HTTPS if the load balancer already uses HTTPS?

**Answer:** The public browser-to-edge connection needs HTTPS, and the edge-to-service network also needs the protection appropriate for the infrastructure and threat model. At minimum, ensure the edge enforces HTTPS, Express understands the trusted edge, secure cookies are enabled, and internal network assumptions are documented.

### 32. What is HSTS?

**Answer:** HTTP Strict Transport Security is a browser policy delivered over HTTPS that tells browsers to use HTTPS for future requests to a host for a configured period. Enable it only after confirming HTTPS is ready across the affected host scope; an incorrect long-lived policy can make a broken deployment difficult to access.

### 33. Why keep a CSRF token if SameSite is Lax or Strict?

**Answer:** SameSite behavior is defense in depth and can vary with deployment and browser flows. A CSRF token gives the server an explicit check for state-changing cookie-authenticated requests. Keep authentication, CSRF validation, and authorization as distinct controls.

### 34. What does credentials: true in CORS mean?

**Answer:** It allows browsers to expose credentialed cross-origin responses when the exact allowed origin is also returned. It does not make an unauthenticated endpoint private or grant permission to read a record. Route-level checks remain necessary.

### 35. Should a preflight request require a logged-in session?

**Answer:** Usually the browser's preflight does not carry the actual credentials. The CORS layer should answer an allowed preflight before authentication checks. The subsequent request carries credentials as configured and must pass the normal session and CSRF middleware.

### 36. What should be returned when an origin is not allowed?

**Answer:** Do not return permissive CORS headers for it. The browser will block JavaScript from reading the response. Keep the application's error response generic and avoid leaking environment details. Authentication and validation still apply independently.

### 37. What belongs in production logs?

**Answer:** Record useful operational context such as request IDs, route names, status codes, and safe error categories. Exclude passwords, session cookies, CSRF tokens, authorization headers, secrets, and unneeded request bodies. Restrict log access and retention.

### 38. Why should error responses hide stack traces and configuration values?

**Answer:** They can reveal implementation details, filesystem locations, dependency versions, secret names, and internal topology. Send stable user-safe errors to clients and keep carefully controlled diagnostics on the server.

### 39. Why should staging resemble production?

**Answer:** Cookie attributes, HTTPS termination, proxy headers, origin rules, and database access often behave differently from localhost. A staging environment with the same relevant topology catches deployment errors before real users depend on the session flow.

### 40. What should be checked before deploying CORS and cookies?

**Answer:** Validate all configuration at startup; confirm exact allowed origins, methods, and headers; inspect preflight and credentialed requests; require HTTPS and secure cookies in production; choose explicit SameSite and domain/path settings; configure proxy trust narrowly; retain CSRF and authorization checks; and verify that secrets never appear in browser bundles, logs, or error responses.

## Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- | --- |
| [092 - File uploads end to end](../lessons/092-file-uploads-end-to-end.md) | [Lesson](../lessons/093-production-configuration-cors-and-secure-cookies.md) | [Q&A](093-production-configuration-cors-and-secure-cookies.md) | [Example](../examples/093-production-configuration-cors-and-secure-cookies.md) | [094 - Unit, integration, and end-to-end testing](../lessons/094-unit-integration-and-end-to-end-testing.md) |
