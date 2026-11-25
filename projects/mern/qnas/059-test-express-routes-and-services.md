# 059 - Test Express routes and services: Q&A

This chapter review contains 40 questions: 20 multiple-choice questions, 10 short-answer questions, and 10 application questions. Answers and explanations are included for self-study.

## Multiple-choice questions

### 1. What is the main purpose of a backend test?

- A. To prove the implementation can never contain a bug.
- B. To protect important behavior and contracts from regressions.
- C. To make every private function public.
- D. To ensure the code has the most lines of coverage possible.

**Answer: B.** Tests provide evidence that selected behavior works and help detect regressions. They cannot prove that software is completely bug-free.

### 2. Which test is best suited to checking a service rule without Express or MongoDB?

- A. Unit test with a fake repository.
- B. Browser end-to-end test.
- C. Production smoke test.
- D. Manual database migration.

**Answer: A.** A service unit test can isolate business behavior by providing a small fake for its repository dependency.

### 3. What should a route test normally assert?

- A. Only the name of the route's private helper.
- B. The HTTP status and relevant public response contract.
- C. The exact number of lines in the route file.
- D. The internal call stack of Express.

**Answer: B.** Clients depend on observable behavior such as status codes, response fields, and relevant headers.

### 4. Why export an Express app factory separately from the server entry point?

- A. To make every route synchronous.
- B. To let tests construct the app without starting a listener.
- C. To prevent middleware from running.
- D. To disable JSON parsing.

**Answer: B.** A factory lets tests import and configure the app without binding a port or starting unrelated resources.

### 5. What does dependency injection allow a route test to do?

- A. Replace an application-owned dependency with a controlled fake.
- B. Skip the route and test the browser instead.
- C. Change the HTTP specification at runtime.
- D. Make a database query automatically deterministic.

**Answer: A.** Injecting the service lets a test exercise the real Express route while controlling service outcomes.

### 6. Which approach is appropriate for testing that a route returns 404 for a missing product?

- A. Return `null` from a fake service and assert the HTTP response.
- B. Require a production database record to be deleted.
- C. Inspect Express's private router implementation.
- D. Catch and ignore the request error.

**Answer: A.** A fake service can deterministically return the not-found result, allowing the route's public behavior to be tested.

### 7. What should happen when a request identifier has an invalid format?

- A. The server should query MongoDB anyway.
- B. The request should be rejected at the boundary with a client error.
- C. The server should return 200 with an empty object.
- D. The route should reveal a database stack trace.

**Answer: B.** Validate request syntax before calling downstream business logic, and return the API's documented client-error response.

### 8. Why should an invalid-input route test verify that the service was not called?

- A. To assert an implementation detail with no value.
- B. To confirm invalid data is rejected before business logic runs.
- C. To make the test depend on call ordering everywhere.
- D. To avoid checking the HTTP status.

**Answer: B.** At this boundary, the assertion protects a meaningful property: malformed input does not reach the service.

### 9. What is the purpose of a database integration test?

- A. To prove every client interface works.
- B. To verify behavior involving the real repository and database service.
- C. To replace all unit tests.
- D. To test only CSS rendering.

**Answer: B.** Integration tests can catch query, schema, index, and persistence behavior that a fake cannot validate.

### 10. Where should database integration tests point?

- A. The production database, after taking a backup.
- B. An explicitly isolated test database or namespace.
- C. Any database URL in the developer's shell.
- D. A shared database whose records are never cleaned.

**Answer: B.** An isolated test target prevents test data and cleanup from affecting production or unrelated development data.

### 11. What does the Node.js built-in test runner use from the command line?

- A. `node --test`
- B. `node --serve-tests`
- C. `npm --express-test`
- D. `node --mongo-only`

**Answer: A.** Node's test runner can be invoked with the `--test` flag. A project's npm script may wrap the same command.

### 12. What does Supertest help test?

- A. HTTP behavior of a Node.js app, including an Express app.
- B. MongoDB server upgrades only.
- C. CSS media queries.
- D. React component snapshots only.

**Answer: A.** Supertest provides an HTTP-oriented API for sending requests and asserting responses in tests.

### 13. What should a public API response generally avoid exposing when an unexpected error occurs?

- A. A stable error code.
- B. A safe, client-appropriate message.
- C. Stack traces and raw database or driver messages.
- D. A request identifier when the API supports one.

**Answer: C.** Detailed exceptions can expose implementation details or sensitive values. Log them safely on the server and return a stable public error shape.

### 14. Where should Express error-handling middleware be registered?

- A. Before every route and parser.
- B. After routes and other middleware that may pass errors to it.
- C. In the MongoDB connection string.
- D. In a browser script.

**Answer: B.** Express error middleware is registered after the routes and middleware whose errors it handles.

### 15. What is a useful fake repository?

- A. A large replacement that reimplements all of Mongoose.
- B. A small object that returns controlled values for the interface the service needs.
- C. A connection to the production cluster.
- D. A test that has no assertions.

**Answer: B.** A small fake isolates the unit while keeping the test setup understandable and focused.

### 16. Why should tests avoid depending on execution order?

- A. Order-dependent tests often share state and become unreliable.
- B. The Node test runner forbids multiple test files.
- C. Every test must start a different operating system.
- D. Execution order changes HTTP status codes.

**Answer: A.** Tests that rely on earlier tests can fail when run alone, concurrently, or in a different order.

### 17. What does code coverage tell you?

- A. Whether each assertion is meaningful.
- B. Which code was exercised during a measured run.
- C. That no production bug exists.
- D. Whether a user understands the interface.

**Answer: B.** Coverage can reveal unexecuted code but cannot show by itself whether tests check useful behavior.

### 18. Why inject a clock when testing time-dependent rules?

- A. To make expected time behavior controllable and repeatable.
- B. To speed up MongoDB queries.
- C. To disable authentication.
- D. To change response JSON automatically.

**Answer: A.** A clock dependency can make time-based business rules deterministic without waiting for real time to pass.

### 19. What should CI do when a test fails?

- A. Report success if the build has enough coverage.
- B. Exit with a failing status so the change is not silently treated as passing.
- C. Delete the test file.
- D. Print secrets to help debugging.

**Answer: B.** CI must surface test failure as a failed job; otherwise regressions can pass unnoticed.

### 20. Which statement about end-to-end tests is most accurate?

- A. They replace all route and service tests.
- B. They exercise a larger deployed-like path and are usually fewer and slower.
- C. They cannot detect integration problems.
- D. They should always use production user accounts.

**Answer: B.** End-to-end tests cover broad critical journeys, but focused lower-level tests are faster and easier to diagnose.

## Short-answer questions

### 21. Explain the difference between a unit test and a route test.

**Answer:** A unit test exercises a small unit such as a service, usually with collaborators replaced by fakes. A route test sends an HTTP request through Express and checks the resulting public response and middleware behavior.

### 22. Why should importing the test subject not start the server?

**Answer:** Starting a listener during import can cause port conflicts, open handles, and tests that cannot control setup. Separating app construction from `listen()` lets tests create an in-memory request target.

### 23. What is dependency injection in this chapter's context?

**Answer:** The app or service receives collaborators such as an authentication middleware, service, or repository from its caller. Tests can provide controlled fakes while production supplies real implementations.

### 24. Name four behaviors a route test can verify.

**Answer:** It can verify route matching, input validation, authentication and authorization outcomes, status codes, response JSON, and safe error translation. Any four are sufficient.

### 25. Why isn't a fake repository enough to verify a MongoDB query?

**Answer:** A fake only returns the values programmed into it. It cannot prove the real query, index, schema constraint, or connection behavior works; those require an integration test against an isolated database.

### 26. How should a test suite handle records it creates in a test database?

**Answer:** Use a dedicated test target, create only the required fixtures, and remove or isolate only the records that the test created. Do not run broad cleanup against a shared or production database.

### 27. What makes an assertion valuable?

**Answer:** It checks an important observable contract or rule and would fail if that behavior regressed. Assertions should avoid brittle details unrelated to the requirement.

### 28. How should an unexpected exception be presented to the API client?

**Answer:** Return the stable, documented server-error status and a safe error body. Record diagnostic details in protected server-side logs without exposing stack traces or secrets.

### 29. What is one limitation of code coverage?

**Answer:** Coverage shows that code ran, not that tests asserted the right outcomes or would catch a defect. Meaningful cases and clear assertions still need review.

### 30. Why keep unit and route tests in addition to end-to-end tests?

**Answer:** They are faster, more isolated, and usually identify the failing boundary more clearly. End-to-end tests add broad confidence but are slower and cannot efficiently cover every rule.

## Application questions

### 31. A test imports `server.js` and fails because port 3000 is already in use. What design change would help?

**Answer:** Move Express middleware and route construction to an exported `createApp()` module. Let only the process entry point call `listen()`, and have tests import the factory.

### 32. A route test fails randomly because it expects a product inserted by another test. How should it be fixed?

**Answer:** Give each test its own controlled service result or isolated database fixture. Remove cross-test shared state and make the test pass independently.

### 33. The API returns 500 when a product ID has invalid syntax. The service is being called before validation. What should change?

**Answer:** Validate the parameter in the route or request-validation middleware before invoking the service, return the documented 400 response, and assert the service was not called.

### 34. The route test passes with a fake service, but a production query returns the wrong record. Which test level is missing?

**Answer:** Add a database integration test using the real repository and an isolated test database. The fake route test cannot validate the actual query.

### 35. An error test asserts that the response includes the exact MongoDB exception message. Why is that risky, and what should it assert?

**Answer:** Driver messages can change and may expose internal details. Assert the stable public status and error shape; verify safe diagnostics through the protected logging path separately.

### 36. A developer says the service test must mock every method on the Mongoose model. What simpler seam could be used?

**Answer:** Inject a small repository interface into the service and use a simple fake repository for unit tests. Reserve the actual model and database for integration tests.

### 37. An endpoint requires authentication. How can a route test cover both success and unauthenticated behavior without using real credentials?

**Answer:** Inject a test authentication middleware or test identity provider. Exercise the real route and assert the public 401 response for rejected access and the expected response for an accepted test identity.

### 38. Tests pass locally but CI reports open handles after completion. What resources should be checked?

**Answer:** Check for listeners, database connections, timers, background workers, and pending asynchronous work. Close or stop resources created by the test and avoid importing modules that start them as side effects.

### 39. A team reaches 100% line coverage but invalid input still produces an undocumented response. What should they improve?

**Answer:** Add assertions for the API contract and meaningful boundary cases such as malformed input, status, and error body. Line coverage alone does not guarantee those behaviors were checked.

### 40. A CI script runs tests but ignores a failing exit code and succeeds. What should change?

**Answer:** Remove the success fallback and let the test command's nonzero exit status fail the job. A failing test must be visible as a failed CI result.

## Chapter navigation

| Previous chapter | Lesson | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [058 - API documentation and versioning](../lessons/058-api-documentation-and-versioning.md) | [Lesson](../lessons/059-test-express-routes-and-services.md) | [Example](../examples/059-test-express-routes-and-services.md) | [060 - Search, filtering, sorting, and pagination APIs](../lessons/060-search-filtering-sorting-and-pagination-apis.md) |
