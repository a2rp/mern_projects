# 094 - Unit, integration, and end-to-end testing: Q&A

### 1. What is the main purpose of an automated test?

**Answer:** It checks an important behavior repeatedly so a future change can reveal a regression quickly. A test should assert a useful outcome or contract; executing a line of code without a meaningful assertion does not provide much confidence.

### 2. What is the difference between a unit, integration, and end-to-end test?

**Answer:** A unit test checks a small function or rule in isolation. An integration test checks connected parts such as an Express route and a database. An end-to-end test drives a running application through a real browser and verifies a user journey across the stack.

### 3. When is a unit test a good fit?

**Answer:** Use it for deterministic business rules, normalization, calculations, permissions decisions, and edge cases that do not require a network, database, or browser. Pure functions are usually easy to test and provide fast, focused feedback.

### 4. What does a component test check?

**Answer:** It renders a React component in a DOM-like environment and checks its user-visible behavior, such as labels, loading states, validation, submission, and accessible error messages. It does not prove the real Express API or MongoDB integration.

### 5. What should an API integration test cover?

**Answer:** It should exercise the HTTP method and path, middleware, authentication, validation, status code, response headers and body, and database behavior relevant to that route. Use an isolated test database and a real Express app instance.

### 6. What does an end-to-end test prove?

**Answer:** It gives confidence that a full user journey works through the browser, React application, API, authentication, and persistence together. It is valuable for a few critical flows, but it is slower and needs more infrastructure than a focused unit or integration test.

### 7. What is a contract test?

**Answer:** It checks an agreement between components developed or deployed separately, such as a client request shape and the API response schema. It helps detect mismatched assumptions without requiring every test to run the full UI and backend together.

### 8. How should a developer choose the test boundary?

**Answer:** Use the smallest boundary that can prove the required behavior. Test a pure title rule as a unit, a form's loading state as a component, a persisted HTTP operation as an integration, and one critical cross-stack workflow in a browser.

### 9. Why is Vitest often used in a Vite project?

**Answer:** Vitest can reuse Vite configuration and supports JavaScript and TypeScript test workflows. It can run unit and component tests; choose a DOM environment for browser-oriented component tests and Node for server code.

### 10. Should every test use the same environment?

**Answer:** No. Server logic generally needs Node. React component tests need a DOM-like environment such as jsdom. Browser end-to-end tests use an actual browser. Keeping the correct environment avoids unnecessary setup and misleading behavior.

### 11. Does jsdom behave exactly like a real browser?

**Answer:** No. It provides a simulated DOM for many component interactions, but it does not reproduce every layout, rendering, navigation, network, media, or browser security behavior. Use browser tests for behavior that depends on a real browser.

### 12. Why use React Testing Library queries based on roles and labels?

**Answer:** They locate elements as users and assistive technologies perceive them. They make tests more robust to internal refactors and can reveal missing labels or accessible names. Prefer roles, labels, and visible text over deeply nested selectors.

### 13. Why use user-event for most component interactions?

**Answer:** It models higher-level interactions such as typing and clicking, including multiple browser events and basic interactability checks. A low-level event helper can still be useful when a specific interaction is not supported, but use it intentionally.

### 14. Why create a userEvent instance in each test?

**Answer:** <code>userEvent.setup()</code> creates an interaction session with its own input-device state and environment handling. A fresh session per test reduces state leakage and makes a test's actions explicit.

### 15. What does Supertest add to Express integration tests?

**Answer:** It sends HTTP requests to an Express application and lets the test inspect response status, headers, and body without requiring a fixed public port. The app should be constructed with test configuration and isolated dependencies.

### 16. Why should an Express application expose an app factory?

**Answer:** An app factory lets production and tests build the same middleware and routes with different controlled configuration. Tests can use a separate database, stub only external services, and avoid starting a production listener.

### 17. Why must integration tests use an isolated database?

**Answer:** Test setup often creates, updates, and deletes records. A separate database prevents tests from corrupting developer or production data. Make the test database name explicit and fail safely rather than falling back to a normal database URI.

### 18. How should test records be isolated?

**Answer:** Reset a dedicated test database, use a unique namespace per worker, or create unique IDs and delete only those records. Choose one strategy that remains safe under parallel execution and does not depend on test order.

### 19. Can every MongoDB test use transactions for cleanup?

**Answer:** No. Transactions require a suitable replica set configuration and add their own setup. A standalone local MongoDB process may not support them. Use transactions only where the test environment actually supports the production-relevant semantics.

### 20. Why inject dependencies into application code?

**Answer:** Dependency injection lets tests provide an isolated database, clock, email client, or configuration without changing production behavior. It also makes dependencies visible instead of hidden inside global imports.

### 21. When should a dependency be mocked?

**Answer:** Mock or replace an external boundary when testing an isolated unit or component, such as email delivery or a payment provider. Keep the real validation, route, and database behavior in an integration test that claims to check those parts.

### 22. Why is a mocked database insufficient to prove persistence?

**Answer:** A mock can return whatever the test author programs it to return. It cannot verify the real query, schema, index, serialization, connection, or persistence behavior. Use a real isolated test database when those behaviors are part of the claim.

### 23. What authorization cases should an API test include?

**Answer:** Cover no session, the correct owner, a different signed-in owner, and any required role distinction. A successful response for one user does not prove that another user cannot access the same identifier.

### 24. Should CSRF behavior be tested separately from authentication?

**Answer:** Yes. Authentication identifies the session; CSRF validation checks whether a cookie-authenticated state-changing request carries the expected token. Test missing or invalid tokens on POST, PATCH, and DELETE routes as applicable.

### 25. What should an API test assert about errors?

**Answer:** Assert the documented status and safe response envelope, such as a 400 validation error or 404 missing resource. Avoid asserting raw database error text, stack traces, or internal paths that are not part of the public API contract.

### 26. Why test failure paths as well as the happy path?

**Answer:** Real systems fail due to invalid input, missing permissions, unavailable storage, database constraints, and expired sessions. Failure-path tests protect cleanup behavior, error status, and safe messages that happy-path tests never exercise.

### 27. What should a Playwright end-to-end test use?

**Answer:** Use a dedicated test account, test URLs, isolated data, and a real running application. Keep secrets in a protected test environment, not in source code. Ensure cleanup can only affect test records.

### 28. How do browser tests avoid colliding with parallel workers?

**Answer:** Give each test a unique record or each worker its own account and namespace. Avoid a single shared mutable account whose records another test can delete or edit while a browser test is running.

### 29. What makes a Playwright locator resilient?

**Answer:** A semantic locator based on a role, label, or accessible name maps to how a user perceives the interface. It is generally less brittle than a long CSS path tied to component markup.

### 30. Why prefer retrying browser assertions?

**Answer:** Web interfaces update asynchronously. A retrying assertion waits for the expected state until its timeout, avoiding a race between an action and a render. Await those assertions so failures are reported correctly.

### 31. Why are arbitrary timeout sleeps a bad synchronization technique?

**Answer:** A fixed sleep wastes time when the app responds quickly and still flakes when it responds more slowly. Wait for the actual visible state, navigation, or response that indicates the behavior finished.

### 32. When are test IDs appropriate?

**Answer:** Use a test ID when there is no meaningful role, label, or text locator and the element needs a stable testing hook. Do not use test IDs as a substitute for accessible labels on normal interactive controls.

### 33. How can component tests support accessibility?

**Answer:** Query controls by accessible role and name, use keyboard interactions where relevant, and assert that status and error messages are announced appropriately. These checks do not replace a complete accessibility review, but they catch common regressions.

### 34. Does high code coverage prove good tests?

**Answer:** No. Coverage shows which code ran, not whether assertions were meaningful or whether security and integration boundaries work. A small number of relevant assertions can be more useful than many tests that execute code without checking outcomes.

### 35. How should tests avoid relying on execution order?

**Answer:** Each test should construct or reset the state it needs and clean up its resources. Do not depend on another test having created a user, seeded a record, or logged into a shared browser first.

### 36. How should fake timers be handled?

**Answer:** Use fake timers only when the feature depends on time and advance them deliberately. Restore real timers after each test. If an interaction library needs a timer-advancement function, configure it rather than disabling interaction delays blindly.

### 37. What resources should teardown close?

**Answer:** Close database connections, HTTP servers that were explicitly started, browser contexts, timers, event listeners, and external service clients created by the test. Leaking resources can hang CI and create confusing cross-test state.

### 38. What should CI do with tests?

**Answer:** CI should install from the lockfile, use a known test configuration, start isolated dependencies, run required checks, fail the build on a failing check, and preserve useful diagnostics securely. It must not receive production credentials for tests.

### 39. Can test credentials be stored in the test file?

**Answer:** No. Keep E2E credentials in a protected test environment, use disposable accounts, rotate them, and ensure logs or reports do not expose them. Never reuse a real user's password.

### 40. What does a passing test suite tell the team?

**Answer:** It says that the behaviors covered by its assertions passed under that run's environment and data. It does not prove the entire application has no bugs. Combine tests at several layers with review, monitoring, deployment checks, and explicit manual validation where needed.

## Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- | --- |
| [093 - Production configuration, CORS, and secure cookies](../lessons/093-production-configuration-cors-and-secure-cookies.md) | [Lesson](../lessons/094-unit-integration-and-end-to-end-testing.md) | [Q&A](094-unit-integration-and-end-to-end-testing.md) | [Example](../examples/094-unit-integration-and-end-to-end-testing.md) | [095 - Validation across the full stack](../lessons/095-validation-across-the-full-stack.md) |
