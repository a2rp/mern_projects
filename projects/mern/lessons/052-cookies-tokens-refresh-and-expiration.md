# 052 - Cookies, tokens, refresh, and expiration

A browser needs a credential to prove that a request belongs to an authenticated user. That credential may be an opaque session ID or a token. Cookies provide one way to carry it between browser and server, but cookie attributes, token lifetime, refresh behavior, and revocation all affect the security design.

This chapter builds on server-side sessions from chapter 051 and explains the lifecycle choices. It does not make JWTs a default; choose a credential format to fit the architecture and the logout, revocation, and sharing requirements.

## Learning goals

After this chapter, you should be able to:

- Select appropriate cookie attributes for a browser session.
- Distinguish browser cookie lifetime from server-enforced session expiration.
- Explain access-token and refresh-token roles.
- Describe how refresh-token rotation detects reuse.
- Validate a JWT instead of merely decoding it.
- Plan logout, credential revocation, and key rotation.
- Explain the CSRF and XSS tradeoffs of browser credential storage.

## Cookies carry credentials; attributes constrain them

A cookie is a browser-managed name and value that the browser can attach to later requests matching its scope. If a cookie carries a session identifier or token, treat that value as a credential: anyone who steals it may be able to act as that user until it expires or is revoked.

For an HTTPS browser session, a common starting point is:

| Attribute | Purpose |
| --- | --- |
| **Secure** | Sends the cookie only over HTTPS. |
| **HttpOnly** | Prevents page JavaScript from reading the cookie through **document.cookie**. The browser can still attach it to HTTP requests. |
| **SameSite** | Controls when a browser sends the cookie in cross-site contexts and helps reduce some CSRF requests. |
| **Path** | Limits which request paths receive the cookie; it is not a security boundary between applications on the same host. |
| **Domain** | Controls which hosts receive the cookie. Omitting it creates a host-only cookie and is usually the narrower choice. |
| **Max-Age** or **Expires** | Tells the browser when to stop retaining the cookie. Server-side authorization still needs its own expiration checks. |

The **__Host-** cookie name prefix provides stronger scoping in supporting browsers when the cookie is set with **Secure**, **Path=/**, and no **Domain** attribute. It is useful for a host-wide session cookie, but it is not a replacement for server-side session checks.

### Choose SameSite deliberately

- **Strict** is restrictive and can interrupt legitimate inbound navigation flows.
- **Lax** allows common top-level navigation while blocking many cross-site subrequests; it is a reasonable starting point for many first-party sites.
- **None** permits cross-site cookie use and must be paired with **Secure**. Use it only when the architecture requires cross-site credentials, and add explicit CSRF defenses.

SameSite is a browser control, not a complete CSRF design. Cookies are attached automatically, so protect state-changing routes with appropriate CSRF tokens and request-origin checks. CORS alone does not prevent CSRF.

### Cookie lifetime is not the session lifetime

A browser expiration only controls how long that browser keeps sending the cookie. A stolen copy can still be presented manually. The server must also check whether the referenced session or token is still valid.

For server-side sessions, define and enforce:

- **Idle timeout:** expire after a period without activity.
- **Absolute timeout:** expire after a fixed maximum time even if the user remains active.
- **Renewal timeout:** optionally replace a long-lived session identifier after a chosen interval.

The store must expire records as well as reject expired sessions during authentication. Browser-close behavior is not reliable; do not depend on it to log out a user.

## Access tokens and refresh tokens

An **access token** is presented to an API to authorize a request. Keep its scope and audience as narrow as the system requires, and give it a limited lifetime. A leaked access token may be replayed until it expires or the resource server learns that it has been revoked.

A **refresh token** is used to obtain a new access token without asking the user to repeat the full authentication flow. It is more powerful and usually longer-lived, so it needs stronger storage and replay controls. Do not send a refresh token to ordinary resource endpoints.

| Credential | Typical use | Lifetime approach | Exposure impact |
| --- | --- | --- | --- |
| Session ID | Reference server-side session state | Server-enforced idle and absolute deadlines | A stolen ID can impersonate the session until revocation or expiry. |
| Access token | Call an API with a limited authorization grant | Short-lived; scope and audience constrained | A stolen token can be replayed until expiry or revocation. |
| Refresh token | Obtain replacement access credentials | Longer-lived, rotated or sender-constrained, and revocable | A stolen refresh credential may prolong access unless reuse is detected and the grant is revoked. |

Do not put credentials in URLs. For browser apps, avoid **localStorage** and **sessionStorage** for authentication tokens because same-origin JavaScript can read them. A same-site server session or a backend-for-frontend can keep credentials out of application JavaScript. Cookie-based designs still need CSRF protection.

## Signed tokens are not automatically encrypted

A signed JWT carries claims in a compact format. A valid signature can provide integrity and help verify who issued the token, if the application validates it correctly. A signed token's payload is commonly readable; signing does not hide its claims.

A resource server should validate the token according to a fixed policy. At a minimum, the design should constrain accepted algorithms and keys, verify the signature, validate the issuer and intended audience, check expiration and not-before time where used, and reject malformed or unexpected token types. Do not make trust decisions from a token that has only been decoded.

Include only claims needed by the receiving service. Do not put passwords, refresh credentials, secret values, or unnecessary personal data in a readable token. A JWT expiration is a claim interpreted by the server; it does not cause a browser to delete the token automatically.

## Rotate refresh tokens and detect reuse

For an OAuth public client, current OAuth security guidance requires refresh tokens to be sender-constrained or rotated. With rotation, each successful refresh consumes the presented refresh token and issues a new one. The server retains enough family or grant information to detect a later presentation of an already-used token.

A typical rotation flow is:

1. Receive a refresh credential over a protected channel.
2. Find its server-side record and verify that it is active, unexpired, and belongs to the correct client and grant.
3. Atomically mark it as used and create its replacement.
4. Return a new access token and refresh credential.
5. If a used refresh token appears again, treat it as possible replay and revoke the active credential family or grant according to policy.

The consume-and-replace operation must be atomic. If two simultaneous refresh requests race, only one should succeed. The client should coordinate refreshes across tabs or requests; blindly retrying an old refresh token can look like theft and revoke the family.

Store opaque refresh tokens in a way that avoids keeping the bearer value in plaintext when possible, such as storing a cryptographic hash for lookup. Keep metadata such as user, client, grant or family ID, issue time, expiry, use time, and revocation state. Never log the raw token.

Rotation is not the only option for OAuth public clients; sender-constraining is another specified approach. Whichever design is chosen must address replay, storage, expiry, and revocation. For a first-party app that does not need OAuth tokens, a server-side session may be simpler.

## Expiration and revocation are different controls

Expiration bounds how long a credential can be accepted. Revocation stops a credential before its planned expiry. Sensitive systems usually need both.

Revoke or invalidate relevant sessions and refresh grants after events such as:

- User logout, especially when the user asks to sign out of every device.
- Password reset or account recovery.
- Account compromise or suspicious activity.
- Removal of a permission or organization membership.
- Administrator action or account disablement.

For an opaque server-side session, delete its store record. For a refresh token, revoke its record or family. For a self-contained access token, immediate revocation requires a server-side check, a revocation mechanism, or a short remaining lifetime that the application accepts. Deleting a cookie from one browser does not revoke a copied credential elsewhere.

## Browser risks: CSRF and XSS

Cookies can be HttpOnly, which blocks ordinary page scripts from reading their value, but cookies are still attached automatically to qualifying requests. Protect state-changing endpoints against CSRF even when SameSite is enabled.

Tokens in browser storage are not automatically sent by the browser, which changes the CSRF risk, but JavaScript can read them. An XSS vulnerability can steal a token from storage. A BFF or HttpOnly cookie session can reduce direct token exposure to JavaScript, but neither design removes the need to prevent XSS and authorize every API request.

Do not assume that CORS protects a cookie-authenticated state-changing endpoint. CORS controls whether browser scripts can read cross-origin responses; it is not a substitute for CSRF checks.

## Key rotation and operational handling

Signing and session secrets must be generated with a cryptographically secure random generator and kept outside source control. Plan how to rotate them:

- Support a brief overlap period for verification with previous keys when the format and library allow it.
- Stop issuing credentials with retired keys.
- Track which key signed a credential when the token format supports a key identifier.
- Remove old keys after the maximum lifetime of credentials they signed, or revoke those credentials explicitly.
- Do not reuse signing keys for unrelated purposes.

Monitor authentication and refresh outcomes with safe metadata. Never log session IDs, access tokens, refresh tokens, authorization headers, cookies, or full request bodies.

## Summary

Cookies carry credentials under browser rules; **Secure**, **HttpOnly**, and **SameSite** reduce exposure but do not replace server validation or CSRF defenses. Access tokens should be short-lived and limited to their intended audience and scope. Refresh credentials need safe storage, expiry, revocation, and replay controls such as rotation or sender-constraining where required. A signed JWT is not automatically confidential, and deleting a browser cookie does not revoke a credential that has already been copied.

## Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [051 - Login, logout, and session strategies](051-login-logout-and-session-strategies.md) | [Q&A](../qnas/052-cookies-tokens-refresh-and-expiration.md) | [Example](../examples/052-cookies-tokens-refresh-and-expiration.md) | [053 - Authorization and role-based access](053-authorization-and-role-based-access.md) |
