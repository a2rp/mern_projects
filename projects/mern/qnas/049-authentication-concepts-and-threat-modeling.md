# 049 - Authentication concepts and threat modeling: Q&A

Use these questions to review identity verification, sessions, authorization, threat modeling, and common authentication risks.

## Multiple-choice questions

### 1. What question does authentication answer?

- A. Which database should handle the query?
- B. Who or what is making the request?
- C. Which HTTP method is fastest?
- D. How should a page be styled?

**Answer: B.** Authentication verifies evidence for a claimed identity. It does not decide every permission that identity has.

### 2. What question does authorization answer?

- A. What may this authenticated identity do to this resource?
- B. Which password did the user last choose?
- C. Is this request cross-origin?
- D. Which server process started first?

**Answer: A.** Authorization checks whether a verified identity may perform a specific action. It should be applied to protected routes and resources on the server.

### 3. Which is the correct order for a protected operation?

- A. Trust the submitted role, then authenticate later
- B. Authenticate the identity, then check permission for the operation
- C. Check CORS, then assume the user is authenticated
- D. Read the requested account ID and treat it as the identity

**Answer: B.** First establish the identity from verified credentials or session state, then authorize the particular operation. Browser-supplied IDs and roles are not proof of identity or permission.

### 4. Which pair represents two different authentication factor categories?

- A. Password and PIN
- B. Password and security key
- C. Two passwords
- D. Password and security question

**Answer: B.** A password is something the user knows, while a security key is something the user has. Two secrets from the knowledge category do not create two-factor authentication.

### 5. What does a server-side session primarily provide?

- A. A way to carry authenticated state across multiple HTTP requests
- B. A replacement for authorization
- C. Encryption for every database document
- D. A guarantee that the user cannot be phished

**Answer: A.** HTTP requests are independent, so applications use session management to associate later requests with authenticated state. The application must still authorize each action.

### 6. Why is a session identifier sensitive?

- A. It is equivalent to a theme preference
- B. Someone who steals it may be able to impersonate the user
- C. It always contains an encrypted password
- D. It can only be used by the browser that created it

**Answer: B.** A session identifier is a credential. Protect it from theft, exposure, prediction, and reuse; expire or revoke it when appropriate.

### 7. What is a bearer token?

- A. A token usable by whoever possesses it
- B. A token that cannot be copied
- C. A password hash that the browser can decrypt
- D. A proof that the user is authorized for every action

**Answer: A.** Possession is the key property of a bearer token. If it is stolen, another party may use it as the holder until it expires or is revoked.

### 8. What does a digital signature on a JWT normally provide?

- A. Confidentiality of all claims
- B. Integrity and issuer-verification support when validated correctly
- C. Automatic authorization for all API routes
- D. Protection from token theft in browser storage

**Answer: B.** A signature can help detect modification and verify a trusted issuer when the API validates it correctly. Signing does not encrypt claims or replace authorization.

### 9. What is a trust boundary in a threat model?

- A. A point where data or control crosses between components with different trust assumptions
- B. A database index
- C. A user's password length
- D. A page layout divider

**Answer: A.** Boundaries help identify where input, credentials, or authority move between actors and components, such as a browser-to-API or API-to-database connection.

### 10. Which is one of the four basic questions a threat-modeling review should answer?

- A. Which frontend color is most popular?
- B. What are we building?
- C. Which file extension should be used?
- D. Can all threat modeling be completed once forever?

**Answer: B.** Threat modeling asks what is being built, what can go wrong, what will be done about it, and whether the review was sufficient.

### 11. Which STRIDE category is most directly related to an attacker using a stolen session to act as a customer?

- A. Spoofing
- B. Repudiation
- C. Denial of service
- D. Information disclosure

**Answer: A.** Spoofing is impersonating another identity. A stolen session ID can allow an attacker to impersonate its legitimate holder.

### 12. An attacker changes a user ID in a request to read another customer's order. What is the primary control that should stop this?

- A. A browser CORS setting
- B. Server-side authorization and ownership checks
- C. A hidden form field
- D. A client-side route guard only

**Answer: B.** The server must derive the authenticated identity from trusted session or token state and check access to the requested record. Client-side checks are not security boundaries.

### 13. Which cookie attribute prevents ordinary JavaScript from reading a cookie value?

- A. SameSite
- B. HttpOnly
- C. Domain
- D. Path

**Answer: B.** HttpOnly limits direct JavaScript access to the cookie. It does not prevent injected script from making authenticated requests as the user.

### 14. What does the Secure cookie attribute do?

- A. Restricts the cookie to secure transport
- B. Prevents all CSRF attacks
- C. Encrypts the cookie value in the database
- D. Makes the cookie unreadable to the server

**Answer: A.** Secure tells browsers to send the cookie only over secure connections. It does not replace CSRF or XSS defenses.

### 15. Why should a web application avoid treating localStorage as a secure place for session identifiers?

- A. Local storage is only available to Express
- B. JavaScript running in the origin can read it, including injected script
- C. It automatically expires every minute
- D. It is encrypted using the user's password

**Answer: B.** Scripts executing in the origin can access localStorage. An XSS vulnerability can expose sensitive values stored there.

### 16. What is a key difference between OAuth 2.0 and OpenID Connect?

- A. OAuth 2.0 is primarily delegated authorization; OpenID Connect adds an identity layer
- B. OpenID Connect is only a database protocol
- C. OAuth 2.0 always proves a user identity by itself
- D. There is no difference

**Answer: A.** OAuth 2.0 is an authorization framework. OpenID Connect defines an identity layer and authentication-related flows on top of OAuth 2.0.

### 17. Why should a password reset flow be part of the threat model?

- A. It cannot change account security
- B. Attackers may use recovery to bypass the normal sign-in controls
- C. Reset tokens are public by definition
- D. Only database administrators can trigger it

**Answer: B.** Recovery is an alternate path into an account. If it is weaker than sign-in, an attacker may use it to take over the account.

### 18. What is an appropriate response to an identified threat in a threat model?

- A. Record it without an owner or decision
- B. Choose a mitigation, avoidance, transfer, or explicit risk acceptance and review residual risk
- C. Delete the threat from the document
- D. Assume a library will prevent every attack

**Answer: B.** Each threat should have a reasoned response. Record who owns the mitigation and what risk remains after it is applied.

### 19. Which data should not be included in ordinary application logs?

- A. A request correlation ID
- B. A route name
- C. Passwords, session IDs, or reset tokens
- D. A non-sensitive result category

**Answer: C.** Logs can be widely accessible and retained. Credentials and recovery secrets must be kept out of them.

### 20. What should happen after an authenticated user logs out?

- A. The session should remain valid indefinitely
- B. The session should be invalidated or revoked according to the design
- C. The client should delete only its visible username
- D. The server should trust the next submitted user ID

**Answer: B.** Logout should invalidate the server-side session or otherwise make its credential unusable. Removing a UI label alone does not end authentication.

## Short-answer questions

### 21. Explain the difference among identification, authentication, session management, and authorization.

**Answer:** Identification is the claimed identity. Authentication verifies evidence for it. Session management carries authenticated state across requests. Authorization determines whether that identity may perform a specific action on a resource.

### 22. Why is a valid login not sufficient to read any record in the database?

**Answer:** Authentication confirms an identity, not universal permission. The API still needs to check ownership, role, scope, or another explicit access policy for each protected operation.

### 23. Why is a session ID treated as a credential?

**Answer:** A party who possesses a valid session ID may be able to make requests as the session's user. It should be protected, rotated when appropriate, expired, revoked, and excluded from logs.

### 24. Name the three factor categories and give an example of each.

**Answer:** Something you know, such as a password; something you have, such as a security key; and something you are, such as a biometric used by an authenticator. MFA combines independent categories rather than repeating one category.

### 25. What should a JWT consumer validate before trusting its claims?

**Answer:** It should use a maintained library and verify the signature, trusted issuer, intended audience, expiry, and other claims required by the application's policy. It must still authorize the requested action separately.

### 26. What are the four basic questions in a threat-modeling review?

**Answer:** What are we building? What can go wrong? What will we do about it? Did we do a good enough job? Together these guide system modeling, threat identification and ranking, mitigation, and review.

### 27. What should a useful authentication data-flow diagram show?

**Answer:** It should show actors, components, data stores, credential and session flows, trust boundaries, and external services. For a MERN system, that may include the browser, API, MongoDB, identity provider, email provider, and logs.

### 28. Give two examples of ways to mitigate account enumeration.

**Answer:** Use generic login and recovery responses that do not disclose whether an account exists, and avoid obvious timing differences where practical. Monitor abuse and rate-limit attempts as additional controls.

### 29. Why does HttpOnly not eliminate XSS risk for cookie-based sessions?

**Answer:** HttpOnly prevents ordinary script from reading the cookie value, but injected script may still issue requests from the page that automatically include the cookie. Preventing XSS and protecting sensitive actions remain important.

### 30. What information should be recorded for each threat and mitigation?

**Answer:** Record the affected asset and flow, attacker capability and preconditions, likely impact and likelihood assumptions, chosen response, owner, validation method, and remaining risk.

## Application questions

### 31. A customer changes an order ID in the URL and receives another customer's order. Authentication is working. Which control failed?

**Answer:** Authorization failed. The API authenticated the customer but did not verify that this identity may access that particular order. Add a server-side ownership or permission check for the requested record.

### 32. A developer stores session IDs in localStorage because it makes requests convenient. What should the threat review identify?

**Answer:** Any JavaScript running in the origin, including injected script from an XSS flaw, can read the session ID. Review a safer session design, reduce XSS risk, and define storage, expiration, rotation, and revocation controls.

### 33. A user logs in, and the same session identifier remains unchanged from before login. What risk should be considered?

**Answer:** Session fixation: an attacker may have caused the victim to use a known session identifier and then benefit when it becomes authenticated. Rotate the session identifier after authentication and privilege changes.

### 34. The login endpoint returns “email not found” for an unknown account and “wrong password” for a known account. What is the concern?

**Answer:** The different responses allow account enumeration. Use a generic public response for authentication failures and review response timing and rate limiting so the endpoint reveals less account information.

### 35. A JWT contains a role claim, and the API decodes it without validating its signature. What can an attacker do?

**Answer:** An attacker may alter the claim and impersonate a privileged role. Validate the token cryptographically and check issuer, audience, expiry, and policy; then apply authorization on the requested resource.

### 36. A team threat-models sign-in but leaves password reset and MFA recovery out of scope. Why is this incomplete?

**Answer:** Recovery and factor-reset flows are alternate ways into an account. Attackers may target the weakest flow to bypass strong sign-in, so model and protect them as part of the authentication system.

### 37. An application sets HttpOnly and Secure on its session cookie and assumes state-changing requests need no CSRF defense. What is missing?

**Answer:** Those attributes help protect cookie handling but do not constitute a full CSRF policy. Evaluate SameSite behavior, CSRF tokens or another suitable defense, and the application's cross-site request design.

### 38. A session token appears in request logs and error reports. Which STRIDE category and action apply?

**Answer:** Information disclosure is the primary category because the token may let another person impersonate the user. Remove secrets from logs, restrict access and retention, and rotate or revoke tokens that may already have been exposed.

### 39. A threat-model entry says “prevent account takeover” but names no affected flow or mitigation owner. How should it be improved?

**Answer:** Identify the specific asset and flow, describe attacker capability and impact, choose concrete mitigations, assign an owner, define how to validate them, and record residual risk. A broad statement alone is not an actionable threat response.

### 40. A valid bearer token is sent over an unencrypted HTTP connection. What is the risk and the correct transport requirement?

**Answer:** An observer on the path may steal and replay the token because possession grants access. Protect bearer-token exchanges with TLS, validate the server certificate, safeguard token storage, and use suitable lifetimes and scope.

## Chapter navigation

| Previous chapter | Lesson | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [048 - CORS and browser cross-origin requests](../lessons/048-cors-and-browser-cross-origin-requests.md) | [Lesson](../lessons/049-authentication-concepts-and-threat-modeling.md) | [Example](../examples/049-authentication-concepts-and-threat-modeling.md) | [050 - Password hashing and account registration](../lessons/050-password-hashing-and-account-registration.md) |
