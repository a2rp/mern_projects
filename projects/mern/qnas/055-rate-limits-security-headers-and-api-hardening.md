# 055 - Rate limits, security headers, and API hardening: Q&A

This chapter review contains 40 questions: 20 multiple-choice questions, 10 short-answer questions, and 10 application questions. Answers and explanations are included for self-study.

## Multiple-choice questions

### 1. What is the primary purpose of a rate limit?

- A. To identify the user's legal name.
- B. To restrict repeated requests and reduce abuse or excessive resource use.
- C. To replace authentication.
- D. To guarantee that a service cannot be overwhelmed.

**Answer: B.** Rate limits constrain repeated requests to selected routes. They help control abuse and resource consumption but do not replace other security controls or guarantee immunity to denial of service.

### 2. Which HTTP status commonly signals that a caller exceeded a rate limit?

- A. 201 Created
- B. 301 Moved Permanently
- C. 429 Too Many Requests
- D. 511 Network Authentication Required

**Answer: C.** The 429 response indicates that the client is being rate-limited. A retry hint can help a well-behaved client wait before making another attempt.

### 3. What does a `Retry-After` header communicate on a rate-limited response?

- A. The account's password.
- B. When or how long the client should wait before retrying.
- C. The database's connection string.
- D. Which proxy header the client should change.

**Answer: B.** A retry hint helps clients back off instead of immediately repeating a blocked request.

### 4. Why might a very low per-IP limit harm legitimate users?

- A. Many users can share a public address through an office, school, or carrier network.
- B. IP addresses cannot be read by Express.
- C. Rate limits only work on HTTPS.
- D. Shared networks disable all cookies.

**Answer: A.** A strict limit can group many people behind one NAT address and block them together. Tune thresholds to traffic and endpoint risk.

### 5. Why is an in-memory rate-limit store insufficient for a multi-instance production service?

- A. It writes all counters into the browser.
- B. Each server tracks its own counters, so requests can exceed the intended shared allowance.
- C. It does not support IP addresses.
- D. It automatically bans every client.

**Answer: B.** Process-local stores do not coordinate counters across instances. Use a shared store when the quota must apply across the fleet.

### 6. What is a key risk of setting Express `trust proxy` to `true` without understanding the deployment?

- A. A caller may spoof forwarded headers and influence the IP used by the application.
- B. Helmet stops setting headers.
- C. MongoDB will reject all requests.
- D. HTTPS is disabled automatically.

**Answer: A.** Forwarded address values are trustworthy only when they come through the expected proxy chain. Configure trust to match the actual topology.

### 7. Which endpoint usually deserves a stricter rate limit than a normal read-only endpoint?

- A. A static terms-of-service page.
- B. Login or password-reset initiation.
- C. A cached public logo.
- D. A local React component render.

**Answer: B.** Authentication and recovery routes are attractive targets for guessing and abuse, so they need tailored limits and monitoring.

### 8. Which is a common security header middleware for Express?

- A. Helmet
- B. Mongoose
- C. Vite
- D. React Router

**Answer: A.** Helmet sets several security-related HTTP response headers. The application's needs and deployment still require configuration review.

### 9. What is Content Security Policy intended to control?

- A. Which sources a browser may use for scripts, styles, images, and other resources.
- B. Which user may update an article in MongoDB.
- C. How long a session lasts.
- D. Which IP address an API limiter records.

**Answer: A.** CSP tells browsers which resource sources and behaviors a page permits. It can reduce the impact of some attacks but does not replace safe output handling.

### 10. Why can enabling a strict CSP immediately break a working React application?

- A. It may block scripts, styles, fonts, images, or API calls that the application currently uses.
- B. CSP deletes every cookie.
- C. It always disables HTTPS.
- D. It changes a user's database role.

**Answer: A.** A policy must reflect the real set of page resources. Report-only mode can help discover violations before enforcement.

### 11. What does HSTS instruct a browser to do after it receives the policy over HTTPS?

- A. Prefer HTTPS for the host for the configured duration.
- B. Allow any origin to read API responses.
- C. Disable session expiration.
- D. Accept any certificate.

**Answer: A.** HSTS helps browsers avoid insecure HTTP for a host that has already received the policy securely. Enable it only when HTTPS is correctly deployed.

### 12. What is a risk of enabling HSTS `includeSubDomains` before checking all subdomains?

- A. Subdomains that are not ready for HTTPS can become inaccessible to users.
- B. It makes every subdomain a database administrator.
- C. It changes JSON into HTML.
- D. It bypasses CORS.

**Answer: A.** The directive applies the HTTPS requirement to subdomains too. Use it only when the whole covered domain tree is ready.

### 13. What does `X-Content-Type-Options: nosniff` help prevent?

- A. Browsers guessing a response's MIME type in risky ways.
- B. Requests from exceeding a rate limit.
- C. Users submitting invalid passwords.
- D. Another tenant reading an article.

**Answer: A.** The header tells browsers not to perform certain forms of MIME sniffing.

### 14. When is `Cache-Control: no-store` especially appropriate?

- A. For sensitive responses such as session-related or private account data.
- B. For every public image forever.
- C. As a replacement for HTTPS.
- D. To reset a rate-limit counter.

**Answer: A.** It instructs compliant caches not to store or reuse the response. Application-managed caches need their own controls.

### 15. What should a server consider before enforcing HSTS?

- A. Whether the relevant host is reliably served over HTTPS.
- B. Whether the React page uses a CSS framework.
- C. Whether the database has a text index.
- D. Whether the user enabled JavaScript.

**Answer: A.** HSTS can make browsers refuse HTTP for the host, so TLS must be correctly deployed first.

### 16. Why should a login protection strategy avoid permanent account lockouts triggered by unauthenticated requests?

- A. An attacker could intentionally lock out another person's account.
- B. It makes password hashes public.
- C. It disables rate-limit headers.
- D. It makes session cookies readable by JavaScript.

**Answer: A.** Permanent lockout can become a denial-of-service tool. Use layered throttling, monitoring, temporary delays, and recovery controls appropriate to the risk.

### 17. Where should headers protecting the React HTML document be configured if the HTML is hosted on a different service from the Express API?

- A. Only in the API's JSON response.
- B. At the host or CDN that serves the HTML document.
- C. In MongoDB's schema.
- D. In the user's password hash.

**Answer: B.** Headers on API responses do not automatically protect a document served from another host. Apply page-delivery policy where the HTML is delivered.

### 18. What should an API return when an internal exception occurs?

- A. A stack trace and environment variables in the response.
- B. A generic server error response, while logging safe operational metadata.
- C. The whole database document.
- D. An administrator session cookie.

**Answer: B.** Keep internal diagnostics out of public responses and avoid logging credentials, tokens, or sensitive request bodies.

### 19. What should happen to body size and pagination limits?

- A. The client should choose any size it needs.
- B. The server should enforce bounded sizes and ranges.
- C. They should be disabled when HTTPS is enabled.
- D. Only React should validate them.

**Answer: B.** Server-enforced bounds control memory, database, and CPU consumption even when a client bypasses the UI.

### 20. What is CSP report-only mode useful for?

- A. Observing policy violations before enforcing a policy that may block legitimate resources.
- B. Replacing rate limits.
- C. Accepting all scripts without any monitoring.
- D. Encrypting request bodies.

**Answer: A.** Report-only mode lets a team review effects and adjust the policy before browsers begin blocking resources.

## Short-answer questions

### 21. What is rate limiting, and what does it not guarantee?

**Answer:** Rate limiting bounds how frequently a client can call an endpoint over a time window. It can reduce guessing and resource abuse, but it does not prove identity, stop every denial-of-service attack, or replace authorization and input validation.

### 22. Why do login, password reset, and general API routes often need different limits?

**Answer:** Their abuse risks and resource costs differ. Login and recovery routes need protections against guessing and account abuse; general endpoints may use different quotas based on user identity, cost, and normal traffic.

### 23. What should a client do after receiving a 429 response?

**Answer:** Respect any retry timing, wait before retrying, and use bounded backoff rather than immediately looping. A user interface should explain when the user can try again.

### 24. What must be known before configuring `trust proxy`?

**Answer:** The actual number and identity of trusted reverse proxies or load balancers, how they set forwarding headers, and whether a direct client can reach the app. Configure Express to trust only that topology.

### 25. Why use a shared rate-limit store in a multi-instance deployment?

**Answer:** A shared store lets instances coordinate counts. Without it, each process may allow its own full quota and callers routed among instances can exceed the intended limit.

### 26. What does Helmet provide, and what does it not provide?

**Answer:** Helmet sets common security-related response headers. It does not repair unsafe application logic, guarantee a correct CSP for a particular app, or replace authentication, authorization, validation, TLS, or safe rendering.

### 27. Why should CSP often be rolled out in report-only mode first?

**Answer:** A policy can block legitimate app resources. Report-only deployment reveals likely violations so the team can tune the policy before switching to enforcement.

### 28. What is the purpose of HSTS, and when should subdomains be included?

**Answer:** HSTS tells browsers that have received the policy to use HTTPS for the host. Include subdomains only after confirming every covered subdomain is ready for HTTPS.

### 29. What is the difference between an HTTP cache and an application-managed cache for `no-store` purposes?

**Answer:** `Cache-Control: no-store` directs compliant HTTP caches not to store the response. It does not automatically control application code such as service workers or the browser Cache API.

### 30. Name four ways to bound API resource consumption besides a request-count limit.

**Answer:** Examples include request body size caps, maximum page sizes, bounded string and array lengths, request timeouts, upload size limits, concurrency controls, queues for expensive work, and validation that excludes costly query patterns.

## Application questions

### 31. A production app runs four Node instances, each with an in-memory limiter set to 100 requests per minute. Why can a client exceed 100 requests?

**Answer:** Each instance maintains an independent counter, so traffic distributed across all four can receive a separate allowance on each process. Use a shared store for a fleet-wide quota or deliberately account for per-instance limits.

### 32. All users behind a load balancer appear to have the same IP and one user hits the limit for everyone. What should the team inspect?

**Answer:** Check Express's proxy trust configuration and how the trusted load balancer sets forwarding headers. Trust only the known proxy chain. Do not blindly trust client-supplied forwarded headers.

### 33. A developer sets `app.set("trust proxy", true)` because the deployment uses one load balancer. What is the safer approach?

**Answer:** Configure the exact trusted hop or proxy network according to the real routing topology, and make sure untrusted clients cannot connect around it or spoof the values Express trusts. Verify the resulting `req.ip` from the deployed path.

### 34. A user receives 429 after one request because thousands of customers share the same office IP. How can the limit be improved?

**Answer:** Reassess the threshold and key. For authenticated routes, add a per-account or per-API-key dimension while retaining appropriate IP abuse controls. Avoid relying on one strict IP limit for all users.

### 35. A team enables HSTS with `includeSubDomains`, but an old subdomain still serves only HTTP. What should they do?

**Answer:** Do not apply the broad directive until the subdomain is migrated or the policy is deliberately scoped. HSTS can cause browsers to require HTTPS on covered subdomains.

### 36. The React application loads a chart script from a CDN, and Helmet's default CSP blocks it. What is a responsible response?

**Answer:** Review whether the CDN resource is necessary and trusted, then configure a narrow source or another suitable integrity strategy for the actual app. Use report-only mode to understand violations. Do not add broad wildcards or unsafe directives just to silence the browser.

### 37. The Express API sets Helmet headers, but the React HTML is served from a separate static host. Where should the page's CSP be configured?

**Answer:** Configure it on the static host or CDN response that serves the HTML document. API headers only govern those API responses and do not automatically protect the other host's page.

### 38. A public report endpoint accepts a page size of 500000. What controls should be added?

**Answer:** Validate the value as a bounded integer, enforce a server-side maximum, add a suitable request rate limit, and consider query cost, timeouts, and export queuing. Client-side validation alone is insufficient.

### 39. A login route returns 429 but includes "username not found" in the response body. What should change?

**Answer:** Keep public responses generic so they do not reveal whether an account exists. Retain the rate limit and record safe server-side monitoring information without logging passwords or tokens.

### 40. The rate-limit store becomes unavailable. The team has not decided whether requests should pass or fail. What needs to be decided?

**Answer:** Choose fail-open or fail-closed behavior based on the endpoint's security and availability needs. Document and monitor the choice: fail-open permits traffic without the limit, while fail-closed may reject legitimate requests during an outage.

## Chapter navigation

| Previous chapter | Lesson | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [054 - CSRF, XSS, and injection protection](../lessons/054-csrf-xss-and-injection-protection.md) | [Lesson](../lessons/055-rate-limits-security-headers-and-api-hardening.md) | [Example](../examples/055-rate-limits-security-headers-and-api-hardening.md) | [056 - File uploads and validation](../lessons/056-file-uploads-and-validation.md) |
