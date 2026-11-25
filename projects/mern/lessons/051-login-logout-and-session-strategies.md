# 051 - Login, logout, and session strategies

Registration creates an account. Login verifies the user's credentials and establishes an authenticated session. Logout must invalidate that session so a copied or stolen credential cannot continue to authenticate requests.

A session strategy decides what the browser presents on later requests and where the server keeps the associated identity and state. For a typical first-party React application and Express API, an opaque session identifier backed by a server-side store is often a straightforward starting point. The right choice depends on the architecture, availability needs, and revocation requirements.

## Learning goals

After this chapter, you should be able to:

- Describe a secure password login flow using the hash created during registration.
- Return generic authentication failures and apply abuse controls.
- Explain opaque server-side sessions, signed tokens, and backend-for-frontend patterns.
- Rotate the session identifier after login and other privilege changes.
- Invalidate the server-side session on logout.
- Keep authentication separate from authorization.
- Identify which cookie, CSRF, token expiration, and refresh details belong to adjacent topics.

## Login verifies a credential

The login handler receives an identifier and a password over HTTPS. It validates input types and size, finds the account using the documented identifier policy, and verifies the submitted password against the stored encoded password hash.

With the Argon2 library used in the previous chapter, verification has this shape:

**argon2.verify(storedHash, submittedPassword)**

The stored hash comes first. Do not hash the submitted password with a plain digest and compare strings. A password library reads the salt and parameters from the encoded stored hash and performs the appropriate verification.

A login flow usually does the following:

1. Require the expected request format and reject malformed or oversized fields.
2. Apply rate limits before expensive password verification.
3. Find the account using the same canonical identifier policy used during registration.
4. Verify the password with the password-hashing library.
5. Check account status and any required second factor or verification state.
6. Rotate the pre-authentication session identifier.
7. Store only the minimum identity and session state needed by the server.
8. Save the authenticated session before returning success.
9. Return only public account data; never return the password hash or session secret.

Do not treat a successful password check as authorization. Each protected route must still check what the authenticated account is allowed to do.

## Handle login failures safely

Use the same public response for an unknown account, an incorrect password, or an account that must not sign in. For example, a generic **401 Invalid username or password** does not confirm whether a username is registered.

Avoid obvious timing differences between a missing account and a wrong password. Some systems verify a prepared dummy hash when the account is absent, so both paths perform password-hash work. This can reduce a timing signal, but it is not a substitute for generic responses, rate limits, and monitoring.

Apply throttling to login attempts to reduce password guessing and credential-stuffing attacks. Use multiple signals, such as source network and account identifier, and monitor failures. Avoid permanent account lockouts that let an attacker deny service to a victim. A temporary delay or additional verification may be safer, depending on the threat model.

Record useful authentication events without writing passwords, password hashes, session IDs, cookies, bearer tokens, or request bodies to logs.

## Session strategies

A session is the server's way to recognize a client across multiple HTTP requests. HTTP itself does not remember that a request authenticated earlier.

| Strategy | What the client sends | Where session state lives | Main tradeoff |
| --- | --- | --- | --- |
| Opaque server-side session | A random session identifier, commonly in a cookie | A server-side session store | Easy to revoke centrally; requires a shared, reliable store in a multi-instance deployment. |
| Signed token such as a JWT | A signed token containing claims | Claims travel with the token; key material and optional revocation state live on the server | Services can validate claims locally, but immediate revocation and stale claims require additional design. |
| Backend for frontend (BFF) | A browser session cookie to the BFF | The BFF keeps downstream credentials and session state | Keeps tokens out of browser JavaScript; adds a server component and operational responsibilities. |

A JWT is a token format, not a complete login system. A signed JWT can protect integrity and issuer authenticity, but a signed token is not automatically encrypted. Its encoded claims may be readable by anyone who obtains it. Do not put secrets or unnecessary personal information in claims.

Do not choose JWTs merely because they are popular or appear stateless. If every request must check a server-side revocation list, the system has reintroduced state. For a first-party browser application that needs straightforward logout and revocation, an opaque server-side session is often easier to reason about. A signed access token can fit distributed APIs when independent validation is a real requirement and the application has a deliberate expiration, revocation, and key-rotation design.

Never place session IDs or bearer tokens in a URL. Avoid storing browser credentials in web storage, where same-origin JavaScript can read them. A browser-facing design should minimize credential exposure and account for cross-site request forgery when cookies authenticate state-changing requests.

## Server-side session behavior

In an Express application, **express-session** places a session ID in the browser cookie and keeps the session data in a server-side store. The cookie is a reference, not the account record. The server uses the identifier to load session state and identify the authenticated account.

Do not use the default **MemoryStore** in production. It is meant for development, does not support a multi-process deployment, and is not a durable shared session store. Use a maintained store that fits the deployment, such as a shared database or dedicated session service, and define how expired sessions are removed.

Keep session contents small. Store a stable account ID and only the state needed to authenticate the request. Load roles and permissions from trusted server-side data or ensure changes invalidate stale session state. Never trust an account ID, role, or privilege copied from a request body.

## Rotate the session after login

An attacker may try to make a victim use a session identifier chosen or known by the attacker. If the application keeps that same identifier when the victim signs in, the attacker may inherit the authenticated session. This is session fixation.

Regenerate the session identifier after successful authentication, before adding the account ID to the session. Also rotate it after privilege changes, such as completing a second factor or elevating to an administrator role. Save the authenticated session before returning a response that causes the browser to make another request.

A typical sequence is:

1. Verify the credentials.
2. Destroy or replace the old anonymous session identifier.
3. Create a fresh session identifier.
4. Store the authenticated account ID and minimal session metadata.
5. Persist the new session.
6. Return the sign-in response.

Do not rotate before verifying credentials in a way that lets arbitrary unauthenticated requests create unlimited stored sessions. Pair session creation with request limits and a store policy that removes expired records.

## Logout must invalidate server state

Logout is an explicit server action. Destroy or revoke the authenticated session in the session store, then expire the browser's session cookie. Clearing only the browser cookie leaves a stolen copy of the old identifier usable until it expires or is revoked.

Logout should be an authenticated state-changing request and should receive the application's CSRF protection. Avoid implementing logout as a GET link that can be triggered by an image or cross-site navigation.

The server should also invalidate sessions when important security events require it, such as a password reset, account compromise, or administrator-requested revocation. If the product supports multiple devices, track sessions so a user can revoke a specific device or all sessions.

Browser-close events are not a reliable logout mechanism. Enforce server-side idle and absolute lifetimes; the next chapter covers cookie attributes, expiration, and token lifecycle details.

## Authenticate each protected request

Authentication middleware should load the session, verify it is still valid, and attach a trusted account identity to the request. If no valid identity exists, return an unauthenticated response. Then route-level authorization checks decide whether that identity may perform the action.

A protected route must not trust a client-supplied **userId**, **role**, or **isAdmin** flag. Derive identity from the validated session or token, then compare it with the resource owner or required permission on every request.

Be deliberate about stale permissions. If a role is removed, an old long-lived token or session snapshot must not continue granting access longer than the system intends. Keep session lifetimes appropriate, refresh authorization state where needed, and revoke credentials after high-risk changes.

## React and Express responsibilities

The React application can use authentication state to show the correct interface, but hiding a button is not access control. The Express API must protect every private endpoint independently.

For a browser session, the client usually calls the API and lets the browser send the session cookie according to the configured origin and cookie policy. Do not copy the session ID into React state or local storage. Handle expired or revoked sessions by returning the user to the sign-in flow without exposing sensitive server details.

## Summary

Login verifies the submitted password against the stored password hash, applies abuse controls, and creates a fresh authenticated session. A generic failure response limits account enumeration. Session identifier rotation prevents session fixation, and logout must invalidate the server-side session as well as clear the browser cookie. Choose stateful sessions, signed tokens, or a BFF according to actual system needs; authentication still does not replace per-request authorization.

## Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [050 - Password hashing and account registration](050-password-hashing-and-account-registration.md) | [Q&A](../qnas/051-login-logout-and-session-strategies.md) | [Example](../examples/051-login-logout-and-session-strategies.md) | [052 - Cookies, tokens, refresh, and expiration](052-cookies-tokens-refresh-and-expiration.md) |
