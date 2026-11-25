# 052 - Cookies, tokens, refresh, and expiration: Q&A

This chapter review contains 40 questions: 20 multiple-choice questions, 10 short-answer questions, and 10 application questions. Answers and explanations are included for self-study.

## Multiple-choice questions

### 1. What does the **Secure** cookie attribute do?

- A. Prevents the server from expiring a session.
- B. Restricts the browser to sending the cookie over HTTPS.
- C. Encrypts the cookie value in the database.
- D. Stops all cross-site requests.

**Answer: B.** Secure limits cookie transmission to HTTPS. It does not encrypt data stored on a server or replace other protections.

### 2. What does **HttpOnly** primarily prevent?

- A. The browser from sending a cookie on requests.
- B. Page JavaScript from reading the cookie through **document.cookie**.
- C. The server from revoking a session.
- D. The cookie from expiring.

**Answer: B.** HttpOnly reduces direct script access to a cookie value. The browser still attaches it to matching requests.

### 3. Which statement about **SameSite** is correct?

- A. It is a complete replacement for CSRF tokens.
- B. It controls when browsers attach cookies in cross-site contexts and can reduce some CSRF risk.
- C. It encrypts cookie contents.
- D. It prevents XSS.

**Answer: B.** SameSite is a useful browser control, but state-changing cookie-authenticated requests still need an appropriate CSRF design.

### 4. Which cookie configuration is required when using **SameSite=None**?

- A. **Secure** must also be set.
- B. **HttpOnly** must be disabled.
- C. **Domain** must be set to a public suffix.
- D. **Path** must be omitted.

**Answer: A.** Cross-site cookies require Secure in current browser behavior. Use this configuration only when the architecture needs cross-site credentials.

### 5. What is a host-only cookie?

- A. A cookie that is sent to every subdomain.
- B. A cookie with no **Domain** attribute, scoped to the host that set it.
- C. A cookie that is readable only by a server hostname.
- D. A cookie with no expiration.

**Answer: B.** Omitting Domain is generally the narrower scope for a host-bound session cookie.

### 6. What does the **__Host-** cookie name prefix require in supporting browsers?

- A. The cookie must have **Secure**, **Path=/**, and no **Domain** attribute.
- B. The cookie must be available to every subdomain.
- C. The cookie must contain a JWT.
- D. The cookie must be readable by JavaScript.

**Answer: A.** These constraints help prevent broader cookie scoping. The prefix does not replace server-side validation.

### 7. Does a browser cookie's expiration time prove that a copied cookie is invalid on the server?

- A. Yes, the browser controls all cookie validation.
- B. No; the server must enforce session or token expiration itself.
- C. Yes, but only for JWTs.
- D. No; credentials never expire.

**Answer: B.** A copied credential can be presented outside the browser. Server-side expiration and revocation checks are necessary.

### 8. What is an idle timeout?

- A. The maximum time a session can exist regardless of activity.
- B. The maximum time a session remains valid without activity.
- C. The maximum time to create a password.
- D. The duration a browser stores a bookmark.

**Answer: B.** Idle time measures inactivity. It complements an absolute timeout.

### 9. What is an absolute timeout?

- A. A maximum lifetime measured from session creation, even if the user remains active.
- B. A timeout that ends only when a browser closes.
- C. A delay before the first login attempt.
- D. A lifetime controlled only by JavaScript.

**Answer: A.** Absolute expiry bounds how long a session can remain valid regardless of ongoing activity.

### 10. Which credential is normally presented to an API to authorize a request?

- A. Refresh token
- B. Access token
- C. Password-reset email
- D. Cookie **Domain** attribute

**Answer: B.** Access tokens are meant for API access and should be limited in scope, audience, and lifetime.

### 11. What is the usual purpose of a refresh token?

- A. To call every resource endpoint directly.
- B. To obtain a replacement access credential without repeating the full authentication flow.
- C. To encrypt a JWT payload.
- D. To make cookies unnecessary.

**Answer: B.** Refresh tokens are more powerful, so they need stronger storage, expiry, rotation or sender constraints, and revocation.

### 12. What does a signature on a JWT normally provide?

- A. Confidentiality of its claims by default.
- B. Integrity protection and a basis for validating the issuer when the token is checked correctly.
- C. Immediate server-side revocation.
- D. Protection from all token theft.

**Answer: B.** A signed JWT is commonly readable. Signing is not encryption and does not prevent replay of a stolen token.

### 13. Which values should a JWT-consuming API validate according to its fixed policy?

- A. Only whether the string contains three dot-separated parts.
- B. Signature, accepted algorithm and key, issuer, audience, and relevant time claims.
- C. Only the **sub** claim.
- D. Only whether a React component decoded the payload.

**Answer: B.** A token must be validated, not merely decoded. The exact required claims depend on the token profile and application.

### 14. What does a JWT **exp** claim represent?

- A. A browser command to delete the token.
- B. A token expiration time that the receiving server must enforce.
- C. The token's encryption key.
- D. A refresh token's rotation family.

**Answer: B.** The claim does not delete a token from client storage; resource servers must reject tokens after expiration.

### 15. For OAuth public clients, what does current OAuth security guidance require for refresh tokens?

- A. Store them in a URL.
- B. Make them sender-constrained or use refresh-token rotation.
- C. Never expire them.
- D. Reuse one refresh token forever.

**Answer: B.** The guidance specifies sender-constraining or rotation to detect refresh-token replay for public clients.

### 16. What is refresh-token rotation?

- A. Reusing the same refresh token on every request.
- B. Consuming a refresh token and issuing a replacement while retaining enough history to detect reuse.
- C. Changing the user's password every hour.
- D. Replacing access tokens with cookies in the browser only.

**Answer: B.** Rotation makes a previously used token detectable if it is presented again.

### 17. What should happen if an already-used refresh token is presented again?

- A. Accept it silently and issue another token.
- B. Treat it as possible replay and revoke the active family or grant according to policy.
- C. Log the raw token and continue.
- D. Extend its expiration.

**Answer: B.** A used-token replay can indicate theft. Revoke the affected grant or token family and require a fresh authorization flow as appropriate.

### 18. Why should refresh-token consumption and replacement be atomic?

- A. To prevent two simultaneous refresh requests from both accepting the same old token.
- B. To make token claims readable.
- C. To avoid setting cookie attributes.
- D. To remove the need for expiration.

**Answer: A.** An atomic operation ensures only one refresh wins; otherwise concurrent requests can create inconsistent active tokens.

### 19. Why is **localStorage** a risky place for browser authentication tokens?

- A. It automatically sends the token on every request.
- B. Same-origin JavaScript can read it, so XSS can expose it.
- C. It encrypts the token with a per-user key.
- D. It makes refresh-token replay impossible.

**Answer: B.** Web storage is available to page scripts. An XSS vulnerability can read stored credentials.

### 20. What should happen to credentials after events such as a password reset or account compromise?

- A. Keep all sessions active indefinitely.
- B. Revoke or invalidate relevant sessions and refresh grants according to the security policy.
- C. Store the old credentials in localStorage.
- D. Extend every token's expiry.

**Answer: B.** Sensitive account events should trigger credential invalidation appropriate to the architecture.

## Short-answer questions

### 21. Explain what **Secure**, **HttpOnly**, and **SameSite** each do for a cookie.

**Answer:** Secure restricts transmission to HTTPS. HttpOnly prevents ordinary page JavaScript from reading the cookie. SameSite controls when the browser attaches it in cross-site contexts. None of them replaces server validation or every CSRF defense.

### 22. Why is a cookie's **Max-Age** not enough to enforce session expiration?

**Answer:** Max-Age tells the browser how long to retain and send the cookie. A copied value can still be replayed, so the server must enforce session or token validity and expiry.

### 23. Define idle timeout and absolute timeout.

**Answer:** An idle timeout expires a session after inactivity. An absolute timeout expires it after a fixed maximum lifetime from creation, even if the session is active.

### 24. Distinguish an access token from a refresh token.

**Answer:** An access token is sent to a resource API for a limited authorization decision. A refresh token is used to obtain new access credentials and therefore needs stronger protection, replay controls, and revocation.

### 25. What is the difference between signing and encrypting a JWT?

**Answer:** Signing can protect integrity and help validate the issuer when checked properly. Encryption protects confidentiality. A signed JWT is commonly readable and should not contain secrets.

### 26. Why must an API validate a JWT's audience?

**Answer:** The audience identifies the intended recipient. Without validating it, a token meant for one service could be accepted by another service that trusts the same issuer or key.

### 27. Describe refresh-token replay detection in a rotation design.

**Answer:** Each refresh consumes the current token and stores a replacement while retaining family history. If a token marked as used is later presented, the server treats that as possible replay and revokes the active family or grant according to policy.

### 28. Why should refresh-token rotation be coordinated across browser tabs?

**Answer:** Simultaneous refreshes can race, and a delayed retry may present an already-consumed token. Coordinate refresh calls and make server-side consume-and-replace atomic.

### 29. Why should raw access and refresh tokens never be written to logs?

**Answer:** Logs may be widely accessible or retained for a long time. A raw bearer credential can be replayed by anyone who obtains it.

### 30. What is the browser-security tradeoff between web storage and HttpOnly cookies?

**Answer:** JavaScript can read tokens in web storage, so XSS can steal them. HttpOnly cookies hide their value from page scripts, but browsers attach cookies automatically, so cookie-authenticated state-changing requests need CSRF protection.

## Application questions

### 31. A production session cookie has **HttpOnly** and **SameSite=Lax**, but lacks **Secure**. What should be corrected?

**Answer:** Serve the application over HTTPS and set Secure so the cookie is sent only over HTTPS. Check proxy configuration if TLS terminates before Express. Retain HttpOnly and the chosen SameSite policy and enforce server-side expiration.

### 32. A developer sets a cookie's Max-Age to one hour and assumes every copied cookie stops working after one hour. What server behavior is missing?

**Answer:** The server must enforce the session or token expiry independently of browser retention. Store an expiry and reject expired credentials, with idle and absolute limits where appropriate.

### 33. A session expires after 30 minutes without requests but can otherwise remain active forever. Which timeout is missing?

**Answer:** An absolute timeout. Add a fixed maximum session lifetime measured from creation, regardless of activity.

### 34. An API decodes a JWT and trusts its **role** claim without verifying the signature, issuer, audience, or expiry. What must change?

**Answer:** Apply a fixed validation policy: verify the signature using a trusted key and accepted algorithm, validate issuer and audience, check expiry and other required claims, then use only validated claims. Do not make trust decisions from a decoded payload.

### 35. A public OAuth client keeps reusing one long-lived refresh token. What should the system do?

**Answer:** Use sender-constrained refresh tokens or rotate them as required by current OAuth security guidance. For rotation, consume each token once, issue a replacement, retain family history, detect reuse, and revoke the active grant when replay is detected.

### 36. Two tabs send the same refresh token at once. One response is delayed, and the client retries the old value. How should the design handle this?

**Answer:** The server must atomically consume and replace a refresh token so only one request succeeds. The client should coordinate refreshes across tabs and avoid blind retries. If an already-used token is replayed, apply the documented reuse response, often revoking the token family.

### 37. A logout endpoint deletes the browser cookie but leaves the refresh token active in the database. Why is logout incomplete?

**Answer:** A copied refresh credential can still obtain new access tokens. Revoke the associated refresh token or grant on the server, and clear the browser's credential cookie using the matching cookie scope.

### 38. A signed JWT contains a private address and account recovery secret because the team thinks signing encrypts the payload. What should they do?

**Answer:** Remove secrets and unnecessary personal data from claims. A signature does not conceal the payload. Keep sensitive data server-side or use a specifically designed encrypted token only when the architecture requires it.

### 39. A React app stores a long-lived refresh token in **localStorage** to avoid repeated login. What risks and alternatives should be considered?

**Answer:** XSS can read and exfiltrate the token, and long-lived refresh credentials can prolong account compromise. Consider a BFF or server-side session that keeps the credential away from browser JavaScript; if refresh tokens are issued to a public OAuth client, use sender-constraining or rotation and add replay detection, expiry, and revocation.

### 40. A service rotates a signing key but continues accepting old keys forever. What is the problem, and how should the rotation finish?

**Answer:** Retired keys remain able to validate old credentials indefinitely. Stop issuing with old keys, support a limited verification overlap if needed, then remove old keys after the maximum accepted token lifetime or explicitly revoke affected credentials.

## Chapter navigation

| Previous chapter | Lesson | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [051 - Login, logout, and session strategies](../lessons/051-login-logout-and-session-strategies.md) | [Lesson](../lessons/052-cookies-tokens-refresh-and-expiration.md) | [Example](../examples/052-cookies-tokens-refresh-and-expiration.md) | [053 - Authorization and role-based access](../lessons/053-authorization-and-role-based-access.md) |
