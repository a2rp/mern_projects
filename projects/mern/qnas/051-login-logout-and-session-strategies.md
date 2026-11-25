# 051 - Login, logout, and session strategies: Q&A

This chapter review contains 40 questions: 20 multiple-choice questions, 10 short-answer questions, and 10 application questions. Answers and explanations are included for self-study.

## Multiple-choice questions

### 1. What does authentication establish?

- A. Which database collection a request should use.
- B. Who or what is making the request.
- C. What every user is allowed to do.
- D. Whether a request contains valid JSON.

**Answer: B.** Authentication verifies an identity. Authorization separately decides what that identity may do.

### 2. How should a login handler check a password created by the previous chapter's Argon2 example?

- A. Compare the submitted password to the stored encoded string directly.
- B. Hash the submitted password with SHA-256 and compare it.
- C. Call the password library's verify function with the stored hash and submitted password.
- D. Decrypt the stored password hash.

**Answer: C.** The password library reads the algorithm, salt, and parameters from the stored encoding and performs verification. With node-argon2, the stored hash is the first argument.

### 3. Which public response best limits account enumeration on login?

- A. "Account not found" for an unknown account and "Wrong password" for an existing one.
- B. A generic "Invalid username or password" response for either case.
- C. Return the account's internal ID when the password is wrong.
- D. Use a different HTTP status for each failure cause.

**Answer: B.** Different messages or statuses can disclose which identifiers are registered. Keep public authentication failures generic.

### 4. What is a dummy password hash sometimes used for during login?

- A. To bypass password verification for new accounts.
- B. To make the missing-account path perform password-hash work, reducing an obvious timing difference.
- C. To create a shared password for all users.
- D. To encrypt the session cookie.

**Answer: B.** Dummy verification can reduce a timing signal for unknown users. It does not replace generic errors, rate limits, or monitoring.

### 5. Why should a login endpoint be rate-limited?

- A. To stop every user from signing in twice.
- B. To reduce automated password guessing and credential stuffing.
- C. To make passwords expire on every request.
- D. To replace password hashing.

**Answer: B.** Login throttling helps constrain repeated attempts. Use a threat-aware approach and avoid permanent lockout behavior that enables denial of service.

### 6. What should a server-side session identifier contain?

- A. The user's password and email address.
- B. The full set of user permissions in readable form.
- C. A random, meaningless reference that lets the server look up session state.
- D. A database connection string.

**Answer: C.** Keep identity and session meaning on the server. The identifier should not disclose personal information or internal state.

### 7. With **express-session**, where is session data normally stored?

- A. In the browser cookie as plaintext JSON.
- B. On the server; the browser cookie carries the session ID.
- C. In React component state only.
- D. In a URL query parameter.

**Answer: B.** The middleware stores session data server-side and uses a cookie to carry the session identifier.

### 8. Why should Express's default **MemoryStore** not be used in production?

- A. It cannot store strings.
- B. It is intended for development, does not scale across processes, and can leak memory.
- C. It requires passwords to be stored in the browser.
- D. It automatically revokes all sessions on each request.

**Answer: B.** Production deployments need a suitable shared session store with deliberate expiration and operational behavior.

### 9. When should the server rotate a session identifier?

- A. After successful login and other privilege-level changes.
- B. Only when an account is deleted.
- C. Before parsing the request body on every endpoint.
- D. Never; the identifier must remain permanent.

**Answer: A.** Regeneration after authentication helps prevent session fixation. Rotate after other privilege changes as well.

### 10. What is session fixation?

- A. A database index that prevents duplicate sessions.
- B. An attack where a victim is induced to authenticate using an identifier known or chosen by an attacker.
- C. A user forgetting their password.
- D. A cookie that expires too quickly.

**Answer: B.** If a pre-authentication identifier remains after login, an attacker who knows it may reuse the authenticated session. Rotate it.

### 11. What should logout do for a server-side session?

- A. Only hide the sign-out button in React.
- B. Delete or revoke the server-side session and expire the browser cookie.
- C. Change the user's display name.
- D. Clear React state but leave the server session active.

**Answer: B.** A copied old identifier must stop authenticating after logout, so server-side invalidation matters.

### 12. Why should a cookie-authenticated logout endpoint be a protected state-changing request?

- A. To prevent another site from silently triggering logout or other session actions.
- B. So the browser sends the user's password in the URL.
- C. To make logout use HTTP GET.
- D. Because POST requests cannot be rate-limited.

**Answer: A.** Cookie credentials are sent automatically by browsers in applicable contexts. State-changing actions need CSRF protection, including logout.

### 13. What does a signed JWT normally provide?

- A. Confidentiality of every claim by default.
- B. Integrity protection for the claims, when properly validated, but not automatic confidentiality.
- C. Server-side session deletion automatically.
- D. Protection from all stolen-token replay.

**Answer: B.** A signed JWT's claims can be readable. Signing is not the same as encryption.

### 14. What is a common advantage of opaque server-side sessions?

- A. Immediate central revocation is straightforward because the server controls the session record.
- B. They require no server-side state.
- C. They make authorization unnecessary.
- D. They cannot use browser cookies.

**Answer: A.** The server can revoke a session centrally, at the cost of maintaining a shared session store.

### 15. What is a common operational tradeoff of self-contained signed tokens?

- A. Every token is automatically revocable without any state or expiration design.
- B. Immediate revocation and stale claims require deliberate additional design.
- C. The payload cannot contain claims.
- D. The API must store the user's password in each token.

**Answer: B.** Local verification can help distributed APIs, but revocation, expiration, and key rotation still need a plan.

### 16. What is a backend-for-frontend (BFF) pattern?

- A. A browser component that stores the user's password in React state.
- B. A server component that holds downstream credentials and gives the browser a session-oriented interface.
- C. A MongoDB index for session IDs.
- D. A replacement for HTTPS.

**Answer: B.** A BFF can keep access tokens out of browser JavaScript while adding another server component to operate.

### 17. Where should a browser application avoid putting session IDs and bearer tokens?

- A. In URL query strings.
- B. In server-side session storage.
- C. In protected request handling.
- D. In a secret manager.

**Answer: A.** URLs can appear in browser history, logs, referrers, screenshots, and analytics. Do not put credentials in them.

### 18. Why is storing authentication tokens in **localStorage** risky?

- A. It makes a token expire immediately.
- B. Same-origin JavaScript, including injected script from an XSS flaw, can read it.
- C. The API cannot parse JSON.
- D. It prevents the browser from sending HTTP requests.

**Answer: B.** Any credential accessible to page JavaScript can be exposed by script execution. Minimize browser credential exposure.

### 19. What must a protected API route do after authentication middleware identifies a user?

- A. Trust any user ID sent in the request body.
- B. Perform authorization checks for the requested action and resource.
- C. Assume every authenticated user is an administrator.
- D. Skip ownership checks.

**Answer: B.** Authentication does not grant every permission. Check authorization on every protected action.

### 20. If a user's role is removed, what should happen to credentials that still carry an old role claim?

- A. Keep allowing the old permission indefinitely.
- B. Have a deliberate strategy to refresh authorization state or revoke credentials so stale privilege does not persist too long.
- C. Copy the role into localStorage again.
- D. Trust the client to update the claim.

**Answer: B.** Long-lived sessions or tokens can contain stale permissions. Define how role changes invalidate or refresh them.

## Short-answer questions

### 21. Explain the difference between authentication and authorization.

**Answer:** Authentication establishes which identity is making a request. Authorization determines whether that identity may access a resource or perform an action.

### 22. Why should the login handler call a password library's verify function instead of comparing hashes itself?

**Answer:** The encoded hash contains the algorithm, salt, and work parameters. The library performs the matching derivation and comparison safely; the application should not invent its own comparison scheme.

### 23. What is an account-enumeration signal in a login response?

**Answer:** A message, status code, response size, or noticeably different processing time that helps an attacker distinguish unknown accounts from known accounts with incorrect passwords.

### 24. What is the purpose and limitation of verifying a dummy hash for an unknown username?

**Answer:** It can make the unknown-user path perform password-hash work like the wrong-password path, reducing a simple timing signal. It does not guarantee constant time and must be combined with generic responses, throttling, and monitoring.

### 25. Describe the difference between an opaque session ID and the session data it references.

**Answer:** The ID is a random, meaningless client-held reference. The server-side store holds the associated identity and minimal session state.

### 26. What is session fixation, and what does session regeneration accomplish?

**Answer:** Session fixation occurs when an attacker gets a victim to authenticate under an identifier the attacker knows or controls. Regenerating the ID after login makes the old pre-authentication identifier unusable for the authenticated session.

### 27. Why does logout need to revoke server-side state?

**Answer:** Clearing a browser cookie does not invalidate a copied identifier. Destroying or revoking the session record ensures that old identifier can no longer authenticate.

### 28. What does signing a JWT mean, and what does it not mean?

**Answer:** A valid signature can protect integrity and help establish the issuer when validation is correct. It does not automatically encrypt the claims or stop a stolen token from being replayed.

### 29. Why is a shared production session store important in a multi-instance Express deployment?

**Answer:** Requests from one browser may reach different application instances. A shared store lets each instance find and revoke the same session state and avoids relying on one process's memory.

### 30. Why must authorization still run on every protected API request?

**Answer:** A valid identity does not imply permission for every action or resource. The API must check the current user's rights and resource ownership for each protected operation.

## Application questions

### 31. A login endpoint responds “unknown username” for missing accounts and “incorrect password” for existing accounts. What should change?

**Answer:** Return a generic public authentication failure for both cases, such as “Invalid username or password.” Also review status, body size, and processing differences; use rate limiting and safe monitoring.

### 32. The code immediately returns 401 when the username lookup misses, but runs Argon2 verification for existing users. How can this create a signal, and what can the team do?

**Answer:** The unknown-account path may be noticeably faster. A prepared dummy Argon2 hash can be verified for missing accounts to reduce that discrepancy. Keep generic errors and rate limits, and do not claim that this makes timing perfectly constant.

### 33. After successful login, the code stores the account ID in the existing anonymous session without changing its ID. What is the risk and fix?

**Answer:** This can enable session fixation if an attacker knows the old ID. Regenerate the session identifier after credentials are verified, then attach the account ID and save the new session before responding.

### 34. A logout button calls **GET /logout** and only clears React state. What should the implementation do instead?

**Answer:** Use a protected state-changing request with CSRF protection. Destroy or revoke the server-side session, expire the browser cookie, and update the React interface after the server confirms logout.

### 35. A deployment has three Express instances, each using the default in-memory session store. Users randomly appear logged out. Why?

**Answer:** Each process has separate memory, so one instance may not know another instance's session. Use a suitable shared production session store and ensure each instance uses compatible configuration.

### 36. A team proposes a JWT because it is “stateless,” but also requires immediate logout and instant revocation on every device. What tradeoff should they discuss?

**Answer:** Immediate revocation usually needs server-side state such as a revocation/session store, short lifetimes with bounded delay, or another revocation protocol. Compare that added complexity with opaque server-side sessions, which already support centralized revocation.

### 37. A JWT contains an email, role, and private profile data. The team assumes the signature hides it. What should they change?

**Answer:** A signature does not make claims confidential. Remove unnecessary or sensitive data from the token; keep private state server-side or use a deliberately encrypted format where justified. Validate issuer, audience, expiry, and algorithm as required by the design.

### 38. React stores a bearer token in **localStorage** so API requests can attach it. What browser threat should be considered?

**Answer:** Same-origin scripts can read web storage. An XSS flaw could steal the token. Prefer a design that minimizes JavaScript access to credentials, such as an HttpOnly session cookie or BFF, and continue to prevent XSS and handle CSRF where cookies are used.

### 39. A protected route checks only that a session exists. A user changes a request's **orderId** to another customer's order. What is missing?

**Answer:** Authorization and ownership validation for that specific order. The API must scope the query to the authenticated account or otherwise verify permission for every requested resource.

### 40. A user resets their password but their old sessions remain valid. What account-security behavior should be added?

**Answer:** Revoke the user's existing sessions or rotate an account-level credential/version that invalidates them, according to the threat model. Tell the user what happened through a safe channel and require a fresh login.

## Chapter navigation

| Previous chapter | Lesson | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [050 - Password hashing and account registration](../lessons/050-password-hashing-and-account-registration.md) | [Lesson](../lessons/051-login-logout-and-session-strategies.md) | [Example](../examples/051-login-logout-and-session-strategies.md) | [052 - Cookies, tokens, refresh, and expiration](../lessons/052-cookies-tokens-refresh-and-expiration.md) |
