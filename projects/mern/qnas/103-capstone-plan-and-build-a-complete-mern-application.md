# 103 - Capstone: plan and build a complete MERN application: Q&A

### 1. What is the main goal of the MERN capstone?

**Answer:** To deliver a small, coherent full-stack product whose important user journeys work from React through Express to MongoDB and whose security, tests, and operations are planned.

### 2. Does a capstone need to contain the largest possible feature set?

**Answer:** No. A bounded product with complete, reliable user journeys is more useful than many unfinished features.

### 3. Why define the target user before choosing features?

**Answer:** A target user and problem help determine which workflows belong in the MVP and which can be postponed.

### 4. What is an MVP?

**Answer:** A minimum viable product is the smallest release that solves the chosen problem for its users while still meeting necessary quality and safety requirements.

### 5. Why record features that are explicitly postponed?

**Answer:** It prevents accidental scope growth and makes clear what the first release does not promise to support.

### 6. What makes an acceptance criterion useful?

**Answer:** It describes observable behavior that can be reviewed or tested, such as which courses a visitor can see or how another user's note access is rejected.

### 7. Why sketch the system boundaries before implementation?

**Answer:** A diagram shows which component serves the browser, API, data, sessions, edge, CI, and release artifacts, making trust and responsibility boundaries clearer.

### 8. Which component should enforce authorization?

**Answer:** The Express API must enforce authorization on every protected operation. Hiding a button in React is only a user-interface choice.

### 9. Why should the browser never connect directly to the production MongoDB database?

**Answer:** Browser code is public and cannot safely hold a database credential. The API must mediate access, validate input, and enforce authorization.

### 10. What user data might belong in a User document?

**Answer:** Normalized unique email, password hash or identity reference, server-controlled role, timestamps, and account state needed by the product.

### 11. Why normalize an email address used as a unique login identifier?

**Answer:** It gives the application a consistent comparison key and reduces accidental duplicate accounts caused by casing or surrounding whitespace.

### 12. What integrity constraint is useful for a saved-course relationship?

**Answer:** A unique compound index on learner ID and course ID prevents the same learner from saving the same course more than once.

### 13. Why decide what happens to notes when a course is archived?

**Answer:** Data lifecycle decisions affect whether user records remain readable, editable, or removable when their related course is no longer published.

### 14. What does a unique MongoDB index provide?

**Answer:** It enforces a data integrity constraint and can support lookups. It must be planned against existing data before creation.

### 15. Why define an API contract before building screens?

**Answer:** It establishes request validation, access requirements, success and error responses, pagination behavior, and ownership rules so client and server can be integrated consistently.

### 16. Why should private queries include the authenticated user ID?

**Answer:** A caller-supplied note or record ID alone does not establish ownership. Filtering by both record ID and authenticated user ID prevents access to another user's data.

### 17. Why should the server ignore a user ID submitted as the caller's identity?

**Answer:** A client can change request values. The server should derive the current identity from the authenticated session or token and enforce ownership from that identity.

### 18. Why is a submitted role not authoritative?

**Answer:** A malicious client can alter the request body. Privileged role assignment and checks must be controlled and verified by the server.

### 19. What is a vertical slice?

**Answer:** It is an end-to-end feature that includes the user interface, API behavior, data handling, and tests needed for one workflow.

### 20. Why build vertical slices instead of all UI first?

**Answer:** A slice exposes integration, data, and authorization problems early and produces working user behavior incrementally.

### 21. What is a useful first vertical slice for the learning-library capstone?

**Answer:** A public catalog list and detail view with API pagination provides a complete public read journey before account-specific behavior is added.

### 22. What should a React page define besides its successful loaded state?

**Answer:** It should define loading, empty, validation, authentication, authorization, network-failure, and recovery or retry states as appropriate.

### 23. Why separate server data from transient form state?

**Answer:** They have different owners and lifetimes. Keeping them distinct reduces inconsistent updates and confusing component state.

### 24. How do authentication and authorization differ?

**Answer:** Authentication establishes who the requester is. Authorization determines whether that identity may perform a particular action on a resource.

### 25. Why regenerate a session at authentication boundaries?

**Answer:** Regeneration prevents an attacker-controlled or pre-authentication session identifier from carrying into the authenticated session.

### 26. Why does a multi-instance API need shared session storage?

**Answer:** Requests can reach different instances. A shared store lets each instance resolve the same session and avoids process-local state divergence.

### 27. Why does a cookie-authenticated API need CSRF protection?

**Answer:** Browsers may attach cookies automatically. CSRF defenses ensure state-changing requests include the intended application token or verification.

### 28. What automated test should accompany a note-owner success test?

**Answer:** A test should confirm that another authenticated user cannot read, update, or delete that note, even if they know or change its ID.

### 29. Why use synthetic accounts and an isolated database in tests?

**Answer:** It prevents tests from exposing or modifying real user data and allows test setup and cleanup to remain controlled.

### 30. What does a component test verify?

**Answer:** It checks a user-interface component's behavior for selected states, such as loading, form validation, or empty results.

### 31. What does an end-to-end test add?

**Answer:** It exercises a complete user journey across the running browser application, API, and required test dependencies.

### 32. Why include error and denied behavior in API tests?

**Answer:** Correct behavior includes rejecting malformed, unauthenticated, unauthorized, conflicting, and missing-resource requests safely.

### 33. What is a release artifact?

**Answer:** It is a built or packaged version of the application tied to a reviewed source revision and intended for a deployment environment.

### 34. Why promote a known artifact instead of rebuilding production manually?

**Answer:** Promoting the same reviewed artifact reduces differences between staging verification and production execution and makes rollback traceable.

### 35. Why do data migrations need to be compatible with overlapping app versions?

**Answer:** Old and new API instances may run simultaneously during a rolling release. Compatible data changes prevent one version from failing while the other is active.

### 36. What should a README enable a new developer to do?

**Answer:** Understand the product and structure, configure safe local settings, run the app and checks, learn the API and data model, and follow deployment and recovery procedures.

### 37. Why should an error message not expose database details?

**Answer:** Database names, hostnames, queries, and stack traces can reveal infrastructure or private information and may help an attacker.

### 38. A learner can edit another user's note by changing the URL ID. Which layer should be fixed?

**Answer:** The API's authorization or data-access query must enforce ownership using the authenticated user. A client-side check alone cannot prevent the request.

### 39. The capstone passes tests but fails after deployment because the API URL is wrong. What did the release process miss?

**Answer:** It missed production configuration and smoke checks. A build or test pass alone does not verify the deployed URL, edge routing, cookies, or browser/API integration.

### 40. What makes the capstone complete enough to hand off?

**Answer:** Its MVP and acceptance criteria are documented, core journeys work end to end, access rules and errors are verified, relevant tests pass, release and recovery steps exist, and the README lets another developer operate it.
