# 091 - Authentication end to end: Q&A

These questions review password storage, login behavior, server-side sessions, cookies, CSRF, authentication middleware, authorization, and production operations.

## Multiple-choice questions

### 1. What does authentication determine?

- **A.** Who is making the request
- **B.** Which CSS file should load
- **C.** Whether a database index exists
- **D.** Which frontend framework is installed

**Answer: A.** Authentication verifies an identity or credential.

### 2. What does authorization determine?

- **A.** Whether an identity may perform a specific action
- **B.** Whether a password is hashed
- **C.** Which port Vite uses
- **D.** Whether JSON can be parsed

**Answer: A.** Authorization evaluates permissions after identity has been established.

### 3. What should an application store for a user's password?

- **A.** A password hash made with an adaptive password-hashing algorithm
- **B.** The original plaintext password
- **C.** A reversible encrypted password in the browser
- **D.** A fast SHA-256 digest

**Answer: A.** Passwords should be hashed with an algorithm designed to make guessing expensive.

### 4. Why is a fast general-purpose hash unsuitable for password storage?

- **A.** Attackers can test guesses very quickly
- **B.** It cannot produce a string
- **C.** It requires React
- **D.** It always stores plaintext

**Answer: A.** Password hashing should be intentionally costly to slow offline guessing.

### 5. What does an adaptive password-hashing library commonly encode with the hash?

- **A.** Salt and algorithm parameters needed for verification
- **B.** The user's session cookie
- **C.** The user's email password in plaintext
- **D.** The full MongoDB connection URI

**Answer: A.** The encoded hash carries the information needed by the verifier.

### 6. Where should a browser session's identity state normally live in this lesson's design?

- **A.** In the server-side session store
- **B.** In a React variable trusted by Express
- **C.** In the URL path
- **D.** In a public Vite environment variable

**Answer: A.** The browser holds an opaque session cookie, while the server stores session data.

### 7. What does the session cookie primarily carry?

- **A.** An opaque session identifier
- **B.** A plaintext password and admin role
- **C.** The entire MongoDB user document
- **D.** A JSX component

**Answer: A.** Avoid placing sensitive application data inside the cookie.

### 8. Why regenerate a session identifier after login?

- **A.** To prevent an attacker-controlled pre-login identifier from becoming the authenticated session
- **B.** To change the user's email
- **C.** To make all API calls cross-origin
- **D.** To clear the database

**Answer: A.** Session rotation at the authentication boundary helps prevent session fixation.

### 9. What should logout do in a server-side session design?

- **A.** Destroy the server-side session and expire the cookie
- **B.** Hide the account page using React only
- **C.** Delete the user's database record
- **D.** Change the session cookie to a public value

**Answer: A.** The server must invalidate the session, not just clear UI state.

### 10. Why is Express MemoryStore inappropriate for production?

- **A.** It is intended for debugging and does not scale safely across production processes
- **B.** It stores passwords in MongoDB
- **C.** It forces all routes to use JWT
- **D.** It cannot set cookies

**Answer: A.** Use a suitable external session store for production.

### 11. What does the HttpOnly cookie attribute do?

- **A.** Prevents client-side scripts from reading the cookie through document.cookie
- **B.** Prevents all CSRF requests automatically
- **C.** Encrypts the whole browser
- **D.** Makes Express trust every origin

**Answer: A.** It protects cookie confidentiality from JavaScript access; it does not stop every attack.

### 12. What does the Secure cookie attribute require?

- **A.** The browser sends the cookie only over a secure connection
- **B.** The browser stores the password in localStorage
- **C.** Every request must be a GET
- **D.** Express can skip session validation

**Answer: A.** Production session cookies should use HTTPS and the Secure attribute.

### 13. What does SameSite control?

- **A.** Whether cookies are sent in cross-site request contexts
- **B.** Whether a password can be changed
- **C.** Which API route runs first
- **D.** Whether MongoDB uses a replica set

**Answer: A.** SameSite is useful defense in depth but does not replace CSRF validation.

### 14. What is a CSRF token used for in a cookie-authenticated API?

- **A.** To require the legitimate client to explicitly include a session-associated value on state-changing requests
- **B.** To store a user's password in React
- **C.** To replace the session cookie
- **D.** To grant every user an admin role

**Answer: A.** The server validates a token that a cross-site attacker cannot normally read and submit.

### 15. Which requests should normally avoid changing application state?

- **A.** GET, HEAD, and OPTIONS
- **B.** POST only
- **C.** DELETE only
- **D.** Every method may change state

**Answer: A.** Safe methods should not perform state-changing operations.

### 16. Does CORS authenticate a user?

- **A.** No. CORS controls browser access to cross-origin responses
- **B.** Yes, if the origin is localhost
- **C.** Yes, if the request is JSON
- **D.** No, because only MongoDB authenticates users

**Answer: A.** Authentication and authorization must be enforced by the API.

### 17. What does <code>credentials: "include"</code> do for a cross-origin Fetch request?

- **A.** Allows browser credentials such as cookies to be included, subject to server and cookie policy
- **B.** Adds a CSRF token automatically
- **C.** Grants an authenticated session without login
- **D.** Changes the HTTP method to POST

**Answer: A.** Client, CORS, and cookie settings all affect whether the cookie is sent.

### 18. When is 401 a useful response?

- **A.** When valid authentication is missing or no longer available
- **B.** When an authenticated user lacks a particular permission
- **C.** When a resource was created successfully
- **D.** When the API has a syntax error in JavaScript

**Answer: A.** An unauthenticated request should not receive protected data.

### 19. When is 403 a useful response?

- **A.** When an authenticated user lacks permission for the requested operation
- **B.** When no session exists
- **C.** When a resource is newly created
- **D.** When a password is first entered

**Answer: A.** The request is understood, but the authenticated principal is not allowed to perform it.

### 20. Why rate-limit credential endpoints?

- **A.** To reduce automated password guessing and credential stuffing
- **B.** To replace password hashing
- **C.** To let React make database queries
- **D.** To disable session expiration

**Answer: A.** Rate limits reduce the scale of automated attacks; they do not replace strong credential handling.

## Short-answer and scenario questions

### 21. A database dump reveals password hashes. Are the user's original passwords directly visible?

**Answer:** A proper one-way adaptive password hash does not reveal the plaintext directly, though attackers may still guess weak passwords offline. Use strong password hashing and encourage strong unique passwords.

### 22. Why should the API select the password hash only when verifying login?

**Answer:** It reduces the chance that normal user queries or API mapping accidentally expose the hash.

### 23. A password is correct for an existing account, but the user is not found in the database. What should the login response say?

**Answer:** Return the same generic “email or password is incorrect” message used for a wrong password so the endpoint does not disclose account existence.

### 24. Why can a generic login error still be insufficient by itself?

**Answer:** Response timing or repeated automated attempts may still reveal or exploit account behavior. Use consistent processing where practical, rate limits, monitoring, and recovery controls.

### 25. The developer hashes passwords with SHA-256. What should change?

**Answer:** Use a maintained adaptive password-hashing implementation such as Argon2id, with appropriate settings for the runtime and server capacity.

### 26. A React component stores <code>isAdmin: true</code> and hides non-admin buttons. Does that protect an admin API route?

**Answer:** No. The server must derive the principal from the session and check the user's role or permissions for every protected operation.

### 27. Why should the session contain a user ID rather than a complete user record?

**Answer:** Store only the needed identity reference. Load current public user data and permissions on the server instead of keeping stale or unnecessary sensitive data in session state.

### 28. What can happen if the session identifier is not regenerated after login?

**Answer:** An attacker who can fix or know the pre-login session ID may be able to reuse that identifier after the victim authenticates.

### 29. The UI switches to “signed out,” but a copied cookie still reaches protected endpoints. What is missing?

**Answer:** Server-side session destruction or revocation. Changing client state alone does not invalidate the server session.

### 30. What is the difference between expiring a cookie and invalidating a session?

**Answer:** Expiring the cookie tells that browser to stop sending it; invalidating the session removes or revokes the server-side record so a copied identifier cannot continue working.

### 31. A multi-instance API uses the default Express in-memory store. What problem can users see?

**Answer:** A later request may reach another process that does not have the session, and memory use or session state can diverge. Use a shared production session store.

### 32. Why should the session secret not be committed to the repository?

**Answer:** Anyone with the value may be able to forge or tamper with signed session identifiers. Load a high-entropy secret from protected server configuration.

### 33. A cookie-authenticated POST works without an X-CSRF-Token header. What should you inspect?

**Answer:** Confirm the CSRF middleware is initialized after session middleware and registered before every state-changing route, and that it rejects missing or invalid tokens.

### 34. Does an HttpOnly session cookie stop CSRF?

**Answer:** No. It prevents JavaScript from reading the cookie, but the browser may still attach it to a forged request. Validate a CSRF token and use appropriate cookie policy.

### 35. Does SameSite alone replace a synchronizer token for every application?

**Answer:** No. Treat SameSite as defense in depth; choose a CSRF strategy based on the deployment and authenticated request flow.

### 36. The API uses a different host from the React app and the session cookie is not sent. What should be checked?

**Answer:** Check Fetch credentials, exact CORS origin and credential settings, cookie domain and SameSite/Secure attributes, HTTPS, and whether the browser permits that cross-site cookie context.

### 37. Why should the CSRF token be refreshed after login in this design?

**Answer:** Login regenerates the session identifier, so the token associated with the old pre-login session is no longer the token for the authenticated session.

### 38. A user has a valid session but attempts to read another user's private record. Is authentication enough?

**Answer:** No. The server must also authorize access to that specific resource using ownership or permission rules.

### 39. Why should authentication logs exclude passwords and session cookies?

**Answer:** Logs can be accessed or retained separately from the application. Recording credentials or bearer-like session values could let someone replay accounts or sessions.

### 40. Summarize a secure login and protected request flow.

**Answer:** The browser sends credentials with a valid CSRF token. The server validates input, verifies the stored password hash, returns a generic failure when it does not match, regenerates the session on success, stores the user ID server-side, and returns a safe public user object. Later requests send the session cookie; Express loads the session, verifies the user, and checks route authorization before returning protected data.

## Chapter navigation

| Previous chapter | Chapter lesson | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [090 - Build a CRUD feature across UI, API, and database](../lessons/090-build-a-crud-feature-across-ui-api-and-database.md) | [Lesson](../lessons/091-authentication-end-to-end.md) | [Example](../examples/091-authentication-end-to-end.md) | [092 - File uploads end to end](../lessons/092-file-uploads-end-to-end.md) |
