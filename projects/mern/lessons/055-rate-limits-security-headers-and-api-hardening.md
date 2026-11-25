# 055 - Rate limits, security headers, and API hardening

An API can authenticate users correctly and still be overwhelmed by repeated requests, leak information through its response headers, or accept requests that consume too much memory and CPU. Rate limits and secure defaults reduce these risks, but they must match the application's deployment and traffic.

This chapter extends the Express API from earlier chapters with rate limiting, HTTP security headers, bounded input, and safer production behavior.

## Learning goals

After this chapter, you should be able to:

- Explain what rate limiting protects and why one limit does not fit every route.
- Configure an IP-based Express limiter and plan for multiple server instances.
- Set `trust proxy` only for the real reverse-proxy topology.
- Add response security headers with Helmet and roll out CSP carefully.
- Bound request bodies, pagination, and expensive operations.
- Return useful 429 responses without exposing sensitive details or locking out users unfairly.

## Rate limiting

A **rate limit** restricts how often a client can call an endpoint within a time window. It can reduce password guessing, repeated password resets, automated scraping, abusive resource usage, and some forms of request flooding.

A rate limit does not prove a caller is legitimate, block every denial-of-service attack, or replace authentication and authorization. It is one resource and abuse control.

### Choose limits by endpoint

Different actions have different costs and risks:

| Endpoint type | Example control |
| --- | --- |
| Login, password reset, verification-code request | Low per-IP limit plus account-aware failed-attempt monitoring |
| Search, report generation, exports | Limit repeated calls and bound query complexity |
| General authenticated API | Higher per-user or per-IP limit |
| File upload or expensive processing | Small request-size limit, concurrency limit, and queue capacity |
| Health check | Keep it available for the intended monitor, with a deliberate network policy |

Use limits that fit measured traffic, the action's sensitivity, and the harm caused by abuse. A threshold that is too low can deny service to real users behind a shared network. Permanent account lockouts are especially risky because an attacker may lock out someone else.

### Return 429 and help clients recover

When the caller exceeds a limit, return **429 Too Many Requests**. Include rate-limit information and, where available, a `Retry-After` hint so a well-behaved client can wait. Keep the response generic; do not reveal whether a username, email, or account exists.

A client should not retry immediately in a tight loop. Use bounded exponential backoff with jitter for retryable responses, and stop after a reasonable number of attempts. A user-facing application can show a clear wait message.

### Identify clients carefully

A basic limiter often keys requests by IP address. This is useful for anonymous routes, but it has limitations:

- Many people may share one public IP address.
- Attackers can distribute traffic across addresses.
- Authenticated routes may need an additional per-account or per-API-key limit.
- An IP address reported by a reverse proxy is only trustworthy when the app trusts the correct proxy chain.

Do not trust `X-Forwarded-For` from arbitrary clients. Configure Express `trust proxy` to match the actual trusted proxy or load-balancer topology. Trusting every proxy or accepting spoofed forwarding headers can let a caller choose the IP used by the limiter.

For sensitive endpoints, combine independent controls. For example, limit by source IP and track failed sign-in attempts per normalized account identifier. Keep account-aware counters privacy-conscious and avoid permanent lockout behavior.

### Share counters across application instances

A process-local in-memory store is convenient for development or a single instance. In a multi-instance deployment, each server otherwise maintains its own counter, so the combined allowance can multiply and requests routed to different instances can bypass the intended limit.

Use a maintained shared store when the deployment has multiple instances, and decide what happens if the store is unavailable. Failing open keeps the service available but disables the limit; failing closed preserves the limit but may reject legitimate traffic during a store outage. Make this an explicit operational decision and monitor it.

## Security response headers

Browsers use response headers to apply security rules. Helmet is Express middleware that sets several common security headers, including Content Security Policy, HSTS, MIME-sniffing protection, framing controls, and referrer policy.

| Header | Purpose |
| --- | --- |
| `Content-Security-Policy` | Restricts where a page may load scripts, styles, images, and other resources. |
| `Strict-Transport-Security` | Tells browsers that have received the policy to use HTTPS for the host during its lifetime. |
| `X-Content-Type-Options: nosniff` | Prevents browsers from guessing a response's type in ways that can create risk. |
| `X-Frame-Options` or CSP `frame-ancestors` | Restricts whether a page can be framed, which can help prevent clickjacking. |
| `Referrer-Policy` | Controls how much referrer information a browser sends. |
| `Cache-Control: no-store` | Tells compliant caches not to store sensitive responses. |

Security headers have different purposes. They do not make unsafe database queries safe, do not replace authorization, and do not guarantee that XSS is impossible.

### Helmet and Content Security Policy

Helmet sets a useful baseline:

~~~js
const helmet = require("helmet");

app.use(helmet());
~~~

A Content Security Policy (CSP) can break scripts, styles, fonts, images, or API calls that the page legitimately uses. Review the actual deployed application before enforcing a customized policy. A safer rollout is to start with a **report-only** policy, review the violations, update the allowlist intentionally, and then enforce it.

Do not add `'unsafe-inline'`, broad wildcards, or arbitrary third-party origins just to silence a report without understanding the effect. Nonces or hashes can support tightly controlled inline scripts where needed. If the React application is hosted separately from the Express API, configure page-delivery headers at the host that serves the HTML; headers on JSON API responses do not automatically protect a different host's document.

HSTS should only be enabled for a host that is correctly served over HTTPS. Include subdomains only when every covered subdomain is ready for HTTPS. Preloading has broader and harder-to-reverse effects, so do not enable it casually. Local development may need HSTS and HTTPS-upgrade directives disabled.

Older browsers had an `X-XSS-Protection` filter that is obsolete and can create problems. Do not treat that header as an XSS defense; modern frameworks, safe output handling, and a carefully configured CSP are the relevant controls.

### Sensitive response caching

Authenticated data, session details, password-reset responses, and CSRF token responses should not be stored by shared caches. Use an appropriate `Cache-Control` policy, often `no-store`, for sensitive responses. This header does not control application-managed caches such as a service worker's Cache API; secure those separately.

## Bound resource consumption

Rate limits work best alongside limits on the size and cost of each request:

- Set a reasonable JSON body size limit.
- Validate string lengths, array lengths, pagination size, and numeric ranges.
- Bound database query results and avoid unbounded exports.
- Avoid user-controlled regular expressions or expensive query operators.
- Limit upload sizes and concurrent expensive work; enqueue long-running tasks.
- Configure request, header, and idle timeouts at the proxy and application layers.
- Avoid CPU-heavy synchronous work on the Node.js event loop.
- Apply per-user and per-tenant quotas where business needs require them.

Do not accept a caller-provided database limit or sort object without validation. A page size such as 50 should be enforced by the server even if the client asks for 100000.

## Other API hardening practices

- Disable Express fingerprinting headers where appropriate, such as `X-Powered-By`; this only reduces trivial identification.
- Restrict allowed HTTP methods and return 405 for unsupported methods.
- Use explicit CORS origins only when cross-origin browser access is required. Credentialed CORS must use a specific origin, not a wildcard.
- Use TLS for connections carrying credentials or private data.
- Keep generic client errors and safe server-side logs; do not return stack traces, tokens, session IDs, or request bodies.
- Keep Express, Node.js, and dependencies on supported releases; review security advisories and remove unused packages.
- Use separate least-privilege credentials for application access to MongoDB and other services.
- Keep health and administration endpoints separate in purpose and access policy. Do not expose database consoles or internal diagnostics publicly.
- Monitor rate-limit denials, authentication abuse, error rates, and shared-store failures without logging secrets.

## Middleware order

Middleware order affects behavior. Configure proxy trust before code uses `req.ip`. Apply coarse rate limits before expensive body parsing and handlers. Keep parsers bounded, then install session and route middleware in the order their dependencies require. Helmet should run early enough to add headers to normal and error responses.

Error middleware and custom 404 handlers should be last. Confirm that early returns and error paths still include the intended headers and that proxy-generated errors have appropriate controls at the edge.

## Common mistakes

- Using a per-process memory counter as if it were shared across all production instances.
- Setting `trust proxy` to `true` without knowing which proxies are trusted.
- Applying one low IP limit to every route and blocking users behind shared networks.
- Returning 200 for blocked requests or omitting a usable retry signal.
- Permanently locking an account after repeated failures.
- Enforcing a CSP without checking the scripts and resources the application needs.
- Enabling HSTS before HTTPS is reliable or enabling subdomains when some still use HTTP.
- Assuming headers on the API protect an HTML page served from another host.
- Treating headers or rate limits as replacements for authentication, authorization, validation, or safe output handling.
- Returning internal errors or secrets while diagnosing a limit or security failure.

## Summary

Use endpoint-specific limits, trustworthy client identification, and a shared store when multiple application instances must enforce one quota. Return 429 responses with appropriate retry guidance. Add Helmet headers and roll CSP out carefully against the real application. Bound body sizes and expensive work, configure proxies deliberately, and keep authentication, authorization, validation, and safe output handling in place.

## Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [054 - CSRF, XSS, and injection protection](054-csrf-xss-and-injection-protection.md) | [Q&A](../qnas/055-rate-limits-security-headers-and-api-hardening.md) | [Example](../examples/055-rate-limits-security-headers-and-api-hardening.md) | [056 - File uploads and validation](056-file-uploads-and-validation.md) |
