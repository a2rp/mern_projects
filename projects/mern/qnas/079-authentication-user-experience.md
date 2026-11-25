# 079 - Authentication user experience: Q&A

These questions review authentication states, accessible sign-in flows, session cookies, safe route handling, authorization, session expiry, and logout behavior.

## Multiple-choice questions

### 1. What does authentication establish?

- **A.** Which identity the request is acting as
- **B.** Which CSS theme the user selected
- **C.** Whether every database record is public
- **D.** Whether an API response is cached

**Answer: A.** Authentication verifies an identity. Authorization separately decides which actions that identity may perform.

### 2. What does authorization decide?

- **A.** Whether the submitted password has a matching account
- **B.** What an authenticated identity is allowed to do
- **C.** Which route was visited first
- **D.** Whether React has rendered

**Answer: B.** Authorization checks permission for a resource or operation. The server must make this decision on protected requests.

### 3. Why should an app have a session-checking state at startup?

- **A.** The browser may have a session, but React has not asked the server about it yet
- **B.** It lets the browser invent a signed-in user
- **C.** It replaces API authorization
- **D.** It proves a password is correct without a request

**Answer: A.** Until the server confirms the session, the app does not know whether the user is authenticated. A separate loading state avoids rendering the wrong screen.

### 4. If the session endpoint cannot be reached because the network is down, what state should the UI use?

- **A.** Authenticated
- **B.** A session-check error with a retry option
- **C.** Permanently anonymous without explanation
- **D.** Administrator

**Answer: B.** A network failure does not prove that the session is invalid. Keep the uncertainty visible and let the user retry.

### 5. Which autocomplete hint belongs on an existing password field?

- **A.** <code>new-password</code>
- **B.** <code>current-password</code>
- **C.** <code>offscreen</code>
- **D.** <code>one-time-code</code>

**Answer: B.** The current-password hint tells browsers and password managers that the field is for an existing credential.

### 6. What is the main reason to show a generic rejected-credentials message?

- **A.** To avoid revealing whether an account exists
- **B.** To make password entry optional
- **C.** To remove server-side rate limits
- **D.** To skip password verification

**Answer: A.** A message such as “Email or password is incorrect” avoids distinguishing a missing account from an incorrect password.

### 7. Where should browser authentication tokens generally not be stored?

- **A.** In a server-side session store
- **B.** In <code>localStorage</code> or <code>sessionStorage</code>
- **C.** In an HTTP-only cookie
- **D.** In a protected server-side database

**Answer: B.** JavaScript executing in the origin can read web storage. A browser-readable credential can be exposed by an XSS flaw.

### 8. What does the <code>HttpOnly</code> cookie attribute do?

- **A.** Prevents JavaScript from reading the cookie through browser APIs
- **B.** Automatically authorizes every API request
- **C.** Encrypts a password before it is sent
- **D.** Guarantees protection from all CSRF attacks

**Answer: A.** HttpOnly limits script access to the cookie. It does not replace server authorization, XSS prevention, or CSRF defenses.

### 9. What does the <code>Secure</code> cookie attribute require?

- **A.** The browser sends the cookie only over secure transport
- **B.** The server accepts every request
- **C.** The cookie is readable by JavaScript
- **D.** The session never expires

**Answer: A.** Secure restricts cookie transmission to HTTPS connections. Production authentication should use HTTPS throughout the session.

### 10. What is the role of <code>SameSite</code> on a cookie?

- **A.** It controls cookie sending behavior for cross-site requests
- **B.** It stores the user role
- **C.** It encrypts the cookie in a database
- **D.** It replaces authorization checks

**Answer: A.** SameSite can reduce some cross-site request risks, but it is defense in depth and is not a universal substitute for CSRF protection.

### 11. What is a client-side route guard for?

- **A.** Improving navigation and avoiding a flash of protected UI
- **B.** Enforcing API permissions against direct requests
- **C.** Hiding all database records from the browser
- **D.** Replacing server authentication

**Answer: A.** Route guards improve the interface. The server must still authenticate and authorize every protected API request.

### 12. What must a protected API endpoint do even if React already has a route guard?

- **A.** Authenticate the request and check permission on the server
- **B.** Trust a role value in the request body
- **C.** Accept all requests from the app’s own page
- **D.** Return success when the UI is hidden

**Answer: A.** A visitor can call an API without using the React interface. The server must enforce the access decision.

### 13. What is a safe post-login redirect target?

- **A.** A validated in-app path chosen by the application
- **B.** Any URL supplied in a query parameter
- **C.** Any string beginning with <code>http</code>
- **D.** A destination built from untrusted form input

**Answer: A.** Restricting the target to a known in-app path prevents open redirects to attacker-controlled sites.

### 14. After logout, what must happen to the session?

- **A.** The server must invalidate or destroy it
- **B.** Only React state must be cleared
- **C.** The cookie must be hidden with CSS
- **D.** The user must close the browser

**Answer: A.** Client state and the browser cookie should be updated too, but the server must stop accepting the old session identifier.

### 15. How should a forbidden response differ from an unauthenticated response in the UI?

- **A.** A forbidden response can show access denied without asking the signed-in user to sign in again
- **B.** Both must always clear the session
- **C.** A forbidden response means the network is unavailable
- **D.** An unauthenticated response means the user is an administrator

**Answer: A.** The user may be authenticated but lack permission. Keep that separate from an expired or missing session.

### 16. Which response is most appropriate for a network failure during sign-in?

- **A.** “Email or password is incorrect.”
- **B.** “We couldn’t reach the server. Check your connection and try again.”
- **C.** “This email does not have an account.”
- **D.** “Your account has been deleted.”

**Answer: B.** No response arrived, so the app should explain the connectivity problem rather than mislabel it as a credential rejection.

### 17. What should happen to the email value after a rejected login?

- **A.** Keep it available so the user does not need to re-enter it
- **B.** Put it in a URL query string
- **C.** Clear it and every other field
- **D.** Save it with the password in local storage

**Answer: A.** Preserve non-secret input to reduce repeated work. Do not persist passwords or expose them in logs.

### 18. What should a password reveal toggle be inside a form?

- **A.** A button with <code>type="button"</code>
- **B.** A submit button that sends the form
- **C.** A link that navigates to a new domain
- **D.** A hidden input

**Answer: A.** A non-submit button avoids accidental form submission when the user toggles password visibility.

### 19. Why is an in-memory session store unsuitable for production deployment?

- **A.** It does not provide durable shared sessions across production processes and restarts
- **B.** It prevents React from rendering
- **C.** It automatically stores passwords in plaintext
- **D.** It blocks all HTTPS requests

**Answer: A.** Production needs a shared, managed session store with appropriate expiry and operational protections.

### 20. Should an application automatically replay a sensitive mutation after a user signs in again?

- **A.** No; normally ask the user to review and submit it again
- **B.** Yes, for every operation without checking its effects
- **C.** Only if the URL contains the password
- **D.** Yes, by replaying the old cookie

**Answer: A.** A stale mutation may have changed meaning or context. Let the user review it again unless a carefully designed safe retry mechanism exists.

## Short-answer questions

### 21. How are authentication and authorization different?

**Answer:** Authentication establishes the identity associated with a request. Authorization checks whether that identity may access a resource or perform an operation.

### 22. Name four useful browser authentication states.

**Answer:** Loading while the current session is checked, authenticated when the server confirms a user, anonymous when no valid session exists, and error when the app cannot determine the session state because of a failure.

### 23. Why should an application not map every failed session request to anonymous?

**Answer:** A timeout or network outage does not prove that the session is invalid. Treating it as anonymous can unexpectedly sign users out and hide a service problem.

### 24. Why should rejected login messages be generic?

**Answer:** Distinct responses for missing accounts, incorrect passwords, or locked accounts can help an attacker enumerate account identities. A generic message gives the same user-facing result.

### 25. What is the purpose of <code>autoComplete="username"</code> on an email login field?

**Answer:** It identifies the field as the account identifier to browsers and password managers, even though its visible label says email address.

### 26. Why does a React route guard not secure API data?

**Answer:** Client code can be modified or bypassed, and a visitor can call the API directly. The server must authenticate and authorize each protected request.

### 27. What makes an intended login destination safe?

**Answer:** It is restricted to a valid route within the application. Arbitrary absolute or protocol-relative URLs from untrusted input must be rejected.

### 28. Why is clearing only the session cookie during logout incomplete?

**Answer:** A copied identifier might still be accepted by the server. Logout must invalidate the server-side session and then clear the browser cookie.

### 29. What should happen when an authenticated session expires while the user is on a protected page?

**Answer:** Stop showing protected data, update the shared auth state, explain that the session ended, and offer sign-in. Do not silently replay a sensitive mutation after reauthentication.

### 30. Why can SameSite cookies not be treated as the only CSRF defense?

**Answer:** SameSite behavior depends on request and deployment context and is defense in depth. Cookie-authenticated state-changing requests still need a CSRF strategy appropriate to the app.

## Applied scenarios

### 31. The app initially renders a protected account page before the request to <code>/api/auth/me</code> finishes. A signed-out visitor briefly sees private data. What should change?

**Answer:** Keep the auth status at <code>loading</code> during session restoration. Render a neutral loading state and do not reveal protected content until the server confirms the session.

### 32. The session check times out, and the app redirects to the login page as if the session had expired. What should change?

**Answer:** Represent the failed check as an error state, show a retry option, and distinguish it from a confirmed anonymous response. A temporary network problem is not proof that the session is invalid.

### 33. The API returns “account not found” for one email and “wrong password” for another. What risk does this create and how should it be fixed?

**Answer:** The response can reveal registered accounts. Use a generic rejected-credentials response for both cases, apply rate limits, and avoid exposing detailed account state.

### 34. A user signs in and the app redirects to a URL supplied as <code>?next=https://outside.example</code>. What should change?

**Answer:** Do not trust an arbitrary redirect parameter. Parse the destination and allow only a safe in-app route, otherwise use a fixed default page.

### 35. A protected route redirects anonymous users correctly, but <code>GET /api/admin/users</code> returns data when called directly. What is missing?

**Answer:** Server-side authentication and authorization on the API route. The endpoint must verify the current user and the required permission for that operation.

### 36. A signed-in user receives a 403 response when editing a course. The app clears the auth state and sends them to sign in. What should change?

**Answer:** Treat forbidden access separately from an expired or absent session. Keep the authenticated state and show an access-denied explanation or a safe way back.

### 37. The login request is rejected. The form clears email and password and shows “Something went wrong.” What should improve?

**Answer:** Keep the email, avoid retaining the password if that is the chosen policy, and show a generic but specific credential message such as “Email or password is incorrect.” Distinguish that from network failure.

### 38. React clears the user after logout, but the server accepts the old cookie from another copied browser profile. What is wrong?

**Answer:** Logout changed only client state. The server must revoke or destroy the session, and the response should clear the cookie using matching scope and cookie settings.

### 39. The application stores a long-lived bearer token in <code>localStorage</code> for convenience. What should be reconsidered?

**Answer:** Browser JavaScript can read web storage, so an XSS vulnerability could expose the token. Prefer a server-managed session with a suitably protected HTTP-only cookie or an architecture that keeps credentials off the browser, and still implement XSS and CSRF defenses.

### 40. A user’s session expires while a payment form is open. After reauthentication, the application automatically resends the payment request. What should change?

**Answer:** Do not replay a sensitive mutation automatically. Explain that the session ended, preserve non-secret form context when safe, and ask the user to review and submit again. If retries are required, design idempotency and duplicate handling on the server.

## Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [078 - Client-side form validation and user experience](../lessons/078-client-side-form-validation-and-user-experience.md) | [Lesson](../lessons/079-authentication-user-experience.md) | [Example](../examples/079-authentication-user-experience.md) | [080 - Accessible forms, navigation, and components](../lessons/080-accessible-forms-navigation-and-components.md) |