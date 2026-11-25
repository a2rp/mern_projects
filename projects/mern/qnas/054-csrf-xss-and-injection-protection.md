# 054 - CSRF, XSS, and injection protection: Q&A

This chapter review contains 40 questions: 20 multiple-choice questions, 10 short-answer questions, and 10 application questions. Answers and explanations are included for self-study.

## Multiple-choice questions

### 1. What does a CSRF attack commonly rely on?

- A. The browser automatically sending a user's authentication cookie with a forged request.
- B. The browser refusing to parse JSON.
- C. MongoDB changing a document without a query.
- D. A user choosing a weak CSS selector.

**Answer: A.** Cookie authentication is ambient: the browser attaches a matching cookie automatically. A malicious site may cause a request to be sent even if it cannot read the response.

### 2. Which HTTP method should not change application state?

- A. POST
- B. PATCH
- C. GET
- D. DELETE

**Answer: C.** GET is expected to be safe. Crawlers, previews, and cross-site navigation can trigger it, so state-changing actions belong on protected methods such as POST, PUT, PATCH, or DELETE.

### 3. In the synchronizer-token pattern, where should the server associate the CSRF token?

- A. With the user's server-side session.
- B. With the page title.
- C. With a database sort object.
- D. With a URL fragment.

**Answer: A.** A synchronizer token is generated and stored in server-side state for the session. The legitimate client returns it with a state-changing request so the server can compare it.

### 4. How should a browser application normally send a synchronizer token to an API?

- A. In the URL query string.
- B. In a custom request header or form field.
- C. As the session cookie value.
- D. In the page's external link.

**Answer: B.** Send the token in a header such as `x-csrf-token` or a form field. URLs may leak through history, logs, and referrer information.

### 5. Why does CORS alone not prevent CSRF?

- A. CORS prevents the browser from sending all requests.
- B. A cross-origin request can reach the server even when the attacker cannot read the response.
- C. CORS only applies to MongoDB.
- D. CORS automatically validates a session-bound token.

**Answer: B.** CORS mainly controls browser access to cross-origin responses. It does not replace server-side CSRF validation for cookie-authenticated state changes.

### 6. What is the best way to treat the SameSite cookie attribute?

- A. As a useful layer that should be combined with other controls when needed.
- B. As proof that every request came from the user's own page.
- C. As a replacement for authorization.
- D. As a filter for MongoDB operators.

**Answer: A.** SameSite can reduce some cross-site cookie sending, but deployment details and browser behavior matter. A synchronizer token and careful origin policy may still be needed.

### 7. Which request is a state-changing operation and should be protected by the application's CSRF policy?

- A. GET /api/profile
- B. HEAD /api/articles
- C. POST /api/transfer
- D. OPTIONS /api/articles

**Answer: C.** A transfer changes state. Read-only endpoints and preflight handling should not perform mutations.

### 8. What is stored XSS?

- A. An attack where harmful content is saved and later rendered to another user.
- B. An attack that only modifies a MongoDB index.
- C. A token that expires too soon.
- D. A CORS preflight response.

**Answer: A.** Stored XSS persists in application data, such as a comment or profile, and executes when a vulnerable page interprets it as markup or code.

### 9. How does React normally render an untrusted string inside a paragraph?

- A. It automatically executes strings containing HTML tags.
- B. It treats the string as text and escapes it rather than parsing it as HTML.
- C. It sends the string to MongoDB.
- D. It treats the string as a CSRF token.

**Answer: B.** Ordinary React text interpolation is a safe default for plain text. That protection does not apply when using raw HTML escape hatches.

### 10. When is `dangerouslySetInnerHTML` appropriate?

- A. Whenever a string comes from the database.
- B. Only when the feature requires HTML and the content has been safely sanitized for that use.
- C. For every article body.
- D. To validate a user's role.

**Answer: B.** Raw HTML bypasses normal text escaping. Use a maintained sanitizer with an intentional allowlist when rich HTML is genuinely required.

### 11. What does HTML sanitization do?

- A. Removes or restricts unsafe markup when a feature intentionally accepts HTML.
- B. Confirms a user's account is authenticated.
- C. Converts a user into an administrator.
- D. Adds a CSRF cookie attribute.

**Answer: A.** Sanitization is useful for rich-content features. For ordinary text, render text instead of accepting HTML.

### 12. What is a NoSQL operator-injection risk in a MongoDB API?

- A. A caller supplies an object such as `{ "$ne": null }` where the API expects a scalar string.
- B. A MongoDB server returns a document.
- C. A React component renders a paragraph.
- D. A cookie has the Secure attribute.

**Answer: A.** If the server accepts an untrusted object as a query value, MongoDB may interpret its keys as operators and change the query's meaning.

### 13. Which filter is safest when finding a username supplied by a caller?

- A. `User.findOne(req.body)`
- B. `User.findOne({ username: req.body.username })` without validating its type
- C. Validate that username is a string within limits, then use `User.findOne({ username })`
- D. Execute a query string created by concatenating the request

**Answer: C.** Validate the expected scalar type and construct a filter with server-controlled keys. Do not forward a caller-provided filter or object.

### 14. Why should an API not accept an arbitrary MongoDB sort object from a query string?

- A. Sorting is impossible in MongoDB.
- B. The caller could control query structure and unapproved fields or operators.
- C. Sort order changes the user's password.
- D. Express does not support query strings.

**Answer: B.** Map allowed sort names to fixed server-defined sort objects instead of accepting raw query expressions.

### 15. What is mass assignment?

- A. Updating a document with arbitrary request-body fields that the caller should not control.
- B. Creating a CSS class for every user.
- C. Limiting the size of a JSON payload.
- D. Sending a token in a header.

**Answer: A.** Passing the full body to a database update can let the caller alter fields such as role, owner, organization, or status.

### 16. What should an application do when a user wants to show plain-text comments?

- A. Store arbitrary HTML and render it with `dangerouslySetInnerHTML`.
- B. Render the text using React's ordinary text interpolation.
- C. Put the comment in an inline script.
- D. Disable CSRF protection.

**Answer: B.** Ordinary text rendering keeps the value as text. Sanitization is for cases where the product intentionally accepts limited HTML.

### 17. What is a Content Security Policy in relation to XSS prevention?

- A. A useful additional browser control, not a replacement for safe rendering.
- B. A MongoDB access-control list.
- C. A way to validate input types.
- D. A guaranteed repair for every XSS flaw.

**Answer: A.** CSP can restrict script and resource loading, but unsafe HTML insertion still needs to be fixed.

### 18. Which technique best prevents SQL injection?

- A. Concatenate input into SQL and remove semicolons.
- B. Use parameterized queries or prepared statements.
- C. Store queries in a React component.
- D. Rely on SameSite cookies.

**Answer: B.** Parameterization keeps query syntax separate from values. Blacklists and string concatenation are fragile.

### 19. How should a server start an external process when it truly needs one?

- A. Concatenate user input into a shell command.
- B. Use a fixed executable and allowlisted operations with an argument array, or use a library instead.
- C. Place the command in the URL.
- D. Trust the caller because the route requires login.

**Answer: B.** Avoid invoking a shell with untrusted strings. Authorization does not make command construction safe.

### 20. What should an application do if login regenerates the session?

- A. Keep using the old CSRF token forever.
- B. Fetch or create a valid CSRF token associated with the new session.
- C. Put the new session ID in the URL.
- D. Disable CSRF checks after login.

**Answer: B.** A session-bound token belongs to the session state. After session regeneration, the client should obtain a token for the new authenticated session.

## Short-answer questions

### 21. Explain the difference between CSRF and XSS.

**Answer:** CSRF tricks a browser into sending an authenticated request the user did not intend, commonly because cookies are sent automatically. XSS causes a site's page to execute attacker-controlled content. XSS can undermine CSRF defenses by running same-origin script, so both need separate controls.

### 22. Why should a CSRF token not be placed in a URL?

**Answer:** URLs can be stored in browser history, server and proxy logs, analytics, and referrer data. Send the token in a request header or form field instead.

### 23. Why must GET routes avoid state changes?

**Answer:** Browsers, crawlers, previews, caches, or cross-site links may trigger GET requests without an intentional form submission. Keeping GET safe prevents those requests from accidentally performing actions.

### 24. What does React's default text escaping protect against, and what does it not protect against?

**Answer:** It helps ensure ordinary interpolated strings are displayed as text rather than parsed as HTML. It does not protect raw HTML escape hatches, unsafe URL schemes, or other dangerous DOM contexts automatically.

### 25. When should a team use an HTML sanitizer?

**Answer:** When the product intentionally allows user-authored rich HTML. Use a maintained sanitizer with a narrow allowlist, and avoid modifying the sanitized output afterward. For plain text, render text.

### 26. Why is CORS not an authorization or CSRF mechanism?

**Answer:** CORS primarily controls whether browser code may read a cross-origin response. A cross-origin request may still reach the API, and CORS does not decide whether the authenticated user may perform the action.

### 27. How can a MongoDB API avoid operator injection?

**Answer:** Validate types and allowed values, reject unexpected fields or nested objects where scalars are expected, and build filters with fixed keys and server-selected operators. Never accept a raw client-supplied filter.

### 28. How is allowlisting a sort parameter safer than accepting a sort object?

**Answer:** The server maps a small set of public sort names to fixed database fields and directions. The caller cannot invent field names, operators, or query structure.

### 29. What is the difference between validation and output encoding?

**Answer:** Validation decides whether input matches allowed shape and product rules. Output encoding makes a value safe for a particular output context, such as displaying it as text in a web page. One does not replace the other.

### 30. Name three sensitive values that should not be included in logs.

**Answer:** Examples include passwords, session IDs or cookies, CSRF tokens, bearer tokens, authorization headers, and sensitive request bodies. Logs should contain safe operational metadata instead.

## Application questions

### 31. A banking route changes an account balance when called with GET. What should be changed?

**Answer:** Move the mutation to a state-changing method such as POST and require the application's CSRF defense for cookie-authenticated browser requests. Keep GET read-only and test that a GET cannot change the balance.

### 32. A React app sends a cookie-authenticated POST request but omits a CSRF token. What should the server do?

**Answer:** Reject the state-changing request under the CSRF policy, usually with a forbidden response. The client should first obtain a valid session-bound token and send it in the configured header or form field.

### 33. A developer says, "We use SameSite=Lax, so all CSRF tokens can be removed." What should the reviewer ask?

**Answer:** Review the full deployment and every state-changing route, including subdomains, cross-site integrations, safe-method mutations, and origin checks. SameSite is a useful layer, but a token or another well-designed defense may still be needed.

### 34. A comment containing `<img src=x onerror=alert(1)>` is stored and displayed by a React component as `<p>{comment.body}</p>`. Is this automatically raw HTML?

**Answer:** No. Ordinary React text interpolation renders the string as text. Keep it that way for plain-text comments and avoid switching to `dangerouslySetInnerHTML` without a rich-text requirement and sanitizer.

### 35. A rich-text editor stores HTML and the page renders it with `dangerouslySetInnerHTML` without sanitization. What should change?

**Answer:** Either render the value as plain text or sanitize the HTML with a maintained sanitizer and narrow allowlist before using the raw HTML sink. Define allowed elements and attributes, validate URLs, and do not modify sanitized output afterward.

### 36. A search endpoint uses `User.findOne({ username: req.query.username })`. The query parameter may parse as an object. What is a safer implementation?

**Answer:** Require `username` to be a string, enforce its length and format, then build `{ username }` with a server-controlled key. Reject nested objects and unexpected fields.

### 37. An API sets `const filter = req.query` and calls `Article.find(filter)`. What is wrong?

**Answer:** The caller controls the query object, including its keys, value types, and potentially operators. Validate the public parameters and construct a new filter from fixed fields and verified identity context.

### 38. A patch endpoint validates that `title` is a string but still passes the entire `req.body` to `findByIdAndUpdate`. What risk remains?

**Answer:** Other fields in the body may still alter privileged properties such as `ownerId`, `organizationId`, `status`, or account roles. Build an update object containing only validated editable fields and scope the database filter to the authorized record.

### 39. A developer blocks the characters `$` and `.` to prevent MongoDB injection. Why is that not a complete solution?

**Answer:** A blacklist may reject valid text and can miss unexpected structures or other query paths. Validate types and fields, reject unneeded nested objects, and construct query structure from server-controlled keys.

### 40. A CSP blocks an injected script in one browser, so the team leaves an unsafe HTML sink in place. Is that sufficient?

**Answer:** No. CSP is an additional layer and can be misconfigured or bypassed by future changes. Remove the unsafe sink or sanitize content for its intended use; keep CSP as defense in depth.

## Chapter navigation

| Previous chapter | Lesson | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [053 - Authorization and role-based access](../lessons/053-authorization-and-role-based-access.md) | [Lesson](../lessons/054-csrf-xss-and-injection-protection.md) | [Example](../examples/054-csrf-xss-and-injection-protection.md) | [055 - Rate limits, security headers, and API hardening](../lessons/055-rate-limits-security-headers-and-api-hardening.md) |
