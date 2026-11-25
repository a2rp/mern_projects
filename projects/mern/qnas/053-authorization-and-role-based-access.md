# 053 - Authorization and role-based access: Q&A

This chapter review contains 40 questions: 20 multiple-choice questions, 10 short-answer questions, and 10 application questions. Answers and explanations are included for self-study.

## Multiple-choice questions

### 1. What does authentication establish?

- A. Which actions every user may perform.
- B. Which identity or account is making the request.
- C. Whether a MongoDB document is published.
- D. Which React component should render.

**Answer: B.** Authentication verifies an identity. Authorization separately decides whether that identity may perform a particular action.

### 2. What must a protected API do after authenticating a user?

- A. Trust every request made during that browser session.
- B. Check whether the identity may perform the requested action on the requested resource.
- C. Hide the route from the React navigation.
- D. Return the full user document to the client.

**Answer: B.** A valid session identifies the caller; it is not blanket permission. Each protected request needs an authorization decision.

### 3. Which response is most appropriate when a request has no valid authentication?

- A. 200 OK
- B. 401 Unauthorized
- C. 403 Forbidden
- D. 500 Internal Server Error

**Answer: B.** Use 401 when valid authentication is missing or invalid. A 403 normally means the identity is known but lacks permission.

### 4. Which response usually represents an authenticated caller who lacks permission?

- A. 201 Created
- B. 301 Moved Permanently
- C. 403 Forbidden
- D. 429 Too Many Requests

**Answer: C.** A 403 communicates that the caller is authenticated but the requested operation is not allowed. An application may deliberately use 404 to conceal a resource's existence.

### 5. What does deny by default mean?

- A. Every signed-in user automatically receives read access.
- B. Unknown roles and unmatched policies receive no permission unless explicitly allowed.
- C. Every request returns 403.
- D. Only administrator routes need a policy.

**Answer: B.** Access must have an explicit allow rule. Missing or unrecognized policy data must not silently grant access.

### 6. What does RBAC use to group permissions?

- A. Roles assigned to users.
- B. CSS classes assigned to buttons.
- C. Database collection names.
- D. URL fragments.

**Answer: A.** Role-based access control maps roles such as member or editor to specific permissions.

### 7. Which rule is resource-specific rather than a broad role permission?

- A. An editor may publish articles.
- B. An administrator may manage members.
- C. A member may edit a draft only when that member owns it.
- D. Every authenticated user may view the home page.

**Answer: C.** Ownership depends on the relationship between the caller and a particular record. This is a resource-level policy, often modeled with attributes.

### 8. Why is checking only a user's role insufficient for a multi-tenant article API?

- A. Role names cannot be strings.
- B. The role check may not verify that the article belongs to the user's organization.
- C. MongoDB does not support role checks.
- D. Express routes cannot use more than one middleware.

**Answer: B.** An editor in one tenant must not automatically access another tenant's records. Combine role permission with organization and resource checks.

### 9. Which source should determine the caller's role?

- A. A `role` field in the current request body.
- B. A query parameter named `admin=true`.
- C. Trusted server-side account data associated with the authenticated session.
- D. A hidden input in the React form.

**Answer: C.** Client-controlled fields can be changed. Load the current role from trusted server data or use a deliberately short-lived and revocable credential policy.

### 10. Which database lookup best prevents a cross-tenant object reference?

- A. `Article.findById(req.params.id)`
- B. `Article.findOne({ _id: req.params.id, organizationId: req.user.organizationId })`
- C. `Article.find({})`
- D. `Article.findOne({ title: req.params.id })`

**Answer: B.** The record ID is combined with the organization ID from trusted authentication context. The server does not fetch an arbitrary record first and hope to filter it later.

### 11. What is an IDOR vulnerability?

- A. A user changes an object identifier and the server fails to verify that the user may access that object.
- B. A database uses an index.
- C. A session expires.
- D. A server returns JSON instead of HTML.

**Answer: A.** A guessable or changed identifier is not itself authorization. The server must enforce object-level access on each read or mutation.

### 12. Why is `Model.findByIdAndUpdate(id, req.body)` dangerous for privileged records?

- A. It always deletes the record.
- B. It may accept fields such as `role`, `ownerId`, or `organizationId` that the caller should not control.
- C. It prevents all validation.
- D. Express does not support request bodies.

**Answer: B.** Passing arbitrary input to a database update can cause mass assignment. Validate and allowlist fields for the specific operation.

### 13. Where should a list endpoint apply its access policy?

- A. In the browser after returning all records.
- B. In the database query or a carefully enforced server-side filtering layer before data is returned.
- C. Only in the page title.
- D. Nowhere, because list routes are read-only.

**Answer: B.** Filtering only in the browser exposes records. Server-side list results, counts, pagination, search, and exports must share the same scope.

### 14. What is the role of a React permission check?

- A. It is the security boundary for API writes.
- B. It improves the interface by hiding unavailable controls; the API still enforces the policy.
- C. It prevents handcrafted HTTP requests.
- D. It replaces server-side identity checks.

**Answer: B.** Client-side checks are useful for user experience but can be modified or bypassed. The server must independently enforce authorization.

### 15. What should happen when a policy lookup fails or returns an unknown role?

- A. Grant administrator access so the page remains available.
- B. Fall back to the most common role.
- C. Deny the protected action and handle the failure safely.
- D. Trust a role sent by the browser.

**Answer: C.** Fail closed. A missing decision or unavailable policy source must not be interpreted as permission.

### 16. What can happen if an administrator's role is stored only in a long-lived session and never refreshed?

- A. The user's role automatically becomes less powerful.
- B. A demoted user may retain stale administrator privileges until the session expires.
- C. MongoDB removes the session on each request.
- D. The browser stops sending cookies.

**Answer: B.** Define how role changes and account disabling revoke or refresh existing authentication context. Reload current authorization attributes or invalidate stale sessions.

### 17. Which operation most clearly needs a separate administrative authorization rule?

- A. Reading a public landing page.
- B. Changing another user's role.
- C. Setting a local component state value.
- D. Scrolling a page.

**Answer: B.** Role changes alter future access. They should be limited to an explicit administrative workflow and audited where appropriate.

### 18. Why might an API return 404 instead of 403 for an inaccessible record?

- A. To make inaccessible and nonexistent resources indistinguishable under a deliberate concealment policy.
- B. Because 404 means the caller is an administrator.
- C. To make MongoDB queries faster.
- D. Because 403 cannot be returned from Express.

**Answer: A.** Concealment can reduce resource enumeration, but the policy must be deliberate and consistent. It does not replace the access check.

### 19. Which set of tests gives the strongest basic authorization coverage?

- A. Only test an administrator's successful request.
- B. Test anonymous, permitted, denied, cross-tenant, and tampered-field cases for each operation.
- C. Test only the React button visibility.
- D. Test only whether the server starts.

**Answer: B.** Authorization needs both positive and negative cases. Include ownership, tenant scope, object IDs, and attempts to alter protected fields.

### 20. What should an authorization audit event generally record?

- A. Passwords and complete session cookies.
- B. Actor, action, target, timestamp, and outcome, without credentials or unnecessary sensitive content.
- C. The full request body for every request.
- D. Only the user's display name.

**Answer: B.** Audit metadata should explain who attempted what and whether it succeeded, while keeping passwords, tokens, cookies, and sensitive bodies out of logs.

## Short-answer questions

### 21. Explain the difference between authentication and authorization.

**Answer:** Authentication verifies the identity associated with a request. Authorization evaluates whether that identity can perform a particular action on a particular resource under the current policy.

### 22. When should an API return 401, and when should it return 403?

**Answer:** Use 401 when the request lacks valid authentication. Use 403 when the caller is authenticated but the requested action is not permitted. A consistent 404 concealment policy may be used for inaccessible records when hiding their existence is useful.

### 23. What is the principle of least privilege?

**Answer:** Give a user, role, service, or process only the permissions needed for its work. Narrow grants reduce the damage caused by mistakes or compromised accounts.

### 24. How can an application combine RBAC and a resource policy?

**Answer:** RBAC can answer whether an editor role may edit articles generally. A resource policy can then check whether the target article belongs to the user's organization, whether the caller owns it when required, and whether its current state allows editing.

### 25. Why should a server derive `organizationId` from trusted authentication context?

**Answer:** A client can change a submitted organization ID. Using an unverified value could expose or modify another tenant's data. If users can switch organizations, verify their membership first and then use the verified organization context.

### 26. What is mass assignment, and how can an API prevent it?

**Answer:** Mass assignment occurs when a server copies arbitrary submitted fields into a database object. Prevent it by validating the request and explicitly selecting the fields allowed for each operation; keep roles, ownership, tenant IDs, and workflow state under server control.

### 27. Why must a list endpoint be authorized as carefully as a single-record endpoint?

**Answer:** Lists can disclose protected data through returned rows, total counts, pagination, search, sorting, and exports. The server must apply the caller's scope before producing each of these results.

### 28. How should an application make a role demotion take effect promptly?

**Answer:** Reload the user's current role from trusted server data on requests, invalidate affected sessions, use credential versioning, or use a deliberately short expiration with revocation. Choose a method whose maximum staleness is understood.

### 29. Why is hiding an Edit button not sufficient authorization?

**Answer:** A user can modify browser code or send a direct HTTP request. The API must repeat the identity, permission, resource, and workflow checks before returning or changing protected data.

### 30. What should an authorization test assert besides the HTTP status?

**Answer:** It should verify that protected data was not returned and that denied operations made no database change. It should also check list counts, pagination, and other indirect ways the data could leak.

## Application questions

### 31. A member changes `/api/articles/abc` to `/api/articles/def` and receives another person's draft. What failed, and what should change?

**Answer:** The route has an IDOR or broken object-level authorization flaw. Fetch the article using an authorization-scoped query that includes its organization and permitted visibility or ownership rules. Test another member's draft and another tenant's record.

### 32. An admin-only React page hides its navigation link from members, but the API route has no role guard. What should the team do?

**Answer:** Add server-side authentication and the required admin permission to every protected API operation. Keep the UI hiding as a usability improvement, then test the API directly as a member and an anonymous caller.

### 33. A profile update accepts `{ "displayName": "Sam", "role": "admin" }`. How should the endpoint be fixed?

**Answer:** Validate the profile request and allowlist ordinary profile fields such as `displayName`. Reject or ignore privileged fields according to the API's input policy. Role changes must use a separate authorized administrative route.

### 34. An editor can update any article by ID, including one from another organization. Which part of the policy is missing?

**Answer:** The route checked the editor role but omitted tenant scope. Query and update by both the article ID and the organization ID from trusted context; add a cross-tenant denial test.

### 35. A member may read published articles and their own drafts. Another member's draft must remain hidden. Describe a safe query strategy.

**Answer:** Restrict by the caller's organization and require the article to be published or owned by the caller. Do not fetch all organization records and depend on a later UI filter. Confirm that counts and pagination use the same visibility condition.

### 36. An organization ID appears in both the route and the session. Which value should scope the database query?

**Answer:** Use a verified organization context derived from the authenticated identity. If the route requests a different organization, first check the user's membership and permission to switch into it; never trust the raw route value alone.

### 37. A role-check service times out and the route continues as if the check succeeded. What is wrong?

**Answer:** This fails open. If authorization cannot produce a valid allow decision, deny the protected action and return a safe error. Monitor the policy-service failure without exposing internal details to the client.

### 38. A user's admin role is removed, but an old session still contains `role: "admin"`. How can the system avoid stale privilege?

**Answer:** Do not blindly trust a long-lived role snapshot. Reload the account's current role, invalidate or version sessions on privilege changes, or use a documented short staleness window with revocation. Test a session created before demotion.

### 39. An article delete endpoint hides its button from members, but the member can still send DELETE directly. What should the API enforce?

**Answer:** Authenticate the request, require the appropriate delete permission, load the article inside the caller's organization, and apply ownership/state rules if members may delete only their own drafts. The API must reject the direct request without modifying the record.

### 40. A report returns 12 visible records but says `total: 43`. What authorization issue could this reveal?

**Answer:** The rows may be filtered while the count query is not. Apply the same authorization scope to rows, totals, pagination, search, exports, and caches so hidden records do not leak through metadata.

## Chapter navigation

| Previous chapter | Lesson | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [052 - Cookies, tokens, refresh, and expiration](../lessons/052-cookies-tokens-refresh-and-expiration.md) | [Lesson](../lessons/053-authorization-and-role-based-access.md) | [Example](../examples/053-authorization-and-role-based-access.md) | [054 - CSRF, XSS, and injection protection](../lessons/054-csrf-xss-and-injection-protection.md) |
