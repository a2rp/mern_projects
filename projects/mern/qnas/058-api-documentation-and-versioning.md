# 058 - API documentation and versioning: Q&A

This chapter review contains 40 questions: 20 multiple-choice questions, 10 short-answer questions, and 10 application questions. Answers and explanations are included for self-study.

## Multiple-choice questions

### 1. What does an API contract describe?

- A. Only the programming language used by the server.
- B. The requests clients may send, their meaning, and the responses they may receive.
- C. The internal database password.
- D. The exact source code of every client.

**Answer: B.** An API contract explains the interface clients depend on: operations, inputs, outputs, errors, and related behavior.

### 2. What is OpenAPI primarily used to describe?

- A. HTTP APIs in a language-independent format.
- B. MongoDB backup schedules.
- C. React component state.
- D. Operating-system process permissions.

**Answer: A.** OpenAPI provides a machine-readable description of HTTP API paths, operations, parameters, bodies, responses, schemas, and security.

### 3. What does the `paths` section of an OpenAPI description contain?

- A. HTTP path templates and their operations.
- B. The server's environment variables.
- C. The application's Git history.
- D. Database index definitions only.

**Answer: A.** Each path describes a URL template and may define operations such as `get`, `post`, or `delete`.

### 4. What is a useful purpose for a stable `operationId`?

- A. It helps tools generate predictable operation names for clients and docs.
- B. It stores a MongoDB object in the API description.
- C. It grants access to the operation.
- D. It replaces all HTTP status codes.

**Answer: A.** Stable operation identifiers help generated clients and tooling produce consistent names. They should be unique and meaningful.

### 5. What can an OpenAPI security declaration do by itself?

- A. It configures Express authentication automatically.
- B. It documents the expected security scheme but does not enforce it in the server.
- C. It creates valid bearer tokens.
- D. It hides every route from the network.

**Answer: B.** The document describes the intended contract. Express middleware and application policy still have to authenticate callers and authorize resources.

### 6. How does an API path version such as `/api/v1` differ from OpenAPI's `info.version`?

- A. They always mean the same number and must change together.
- B. The path selects an API contract version; `info.version` identifies the description or contract revision.
- C. `info.version` identifies a MongoDB database.
- D. The path version names the Node.js package.

**Answer: B.** API routing, the contract description, and the server package have distinct versioning purposes.

### 7. What is one benefit of URI path versioning?

- A. The version is visible and straightforward to route and cache.
- B. It eliminates the need to document responses.
- C. It automatically migrates clients.
- D. It guarantees no breaking changes.

**Answer: A.** A path such as `/api/v1` makes the selected version explicit and is easy for clients and routing layers to observe.

### 8. What is a trade-off of versioning through a request header or media type?

- A. The version cannot be transmitted over HTTP.
- B. It can keep the resource path stable but is less visible and requires clients and infrastructure to support negotiation.
- C. It forces MongoDB collections to be renamed.
- D. It prevents API documentation tools from working.

**Answer: B.** Header-based or media-type versioning can be useful, but the version is less obvious and may need careful proxy, cache, and client configuration.

### 9. Which change is commonly breaking for existing clients?

- A. Adding a new endpoint.
- B. Removing a response field that clients use.
- C. Adding a documented optional response property that clients ignore.
- D. Adding an optional query parameter with a safe default.

**Answer: B.** Removing or renaming a field changes the shape clients depend on and can make them fail.

### 10. Why can adding a new enum value break a client even though it is additive?

- A. A client may use an exhaustive switch that assumes only the old values exist.
- B. JSON does not support strings.
- C. OpenAPI forbids adding enum values.
- D. The server will automatically reject the client.

**Answer: A.** Some clients handle only a fixed list of values. Compatibility depends on how consumers interpret the contract, not only whether a change adds fields.

### 11. Which response should be documented for a failed request?

- A. Only the server stack trace.
- B. The expected status, stable error code or shape, and safe message.
- C. A database connection string.
- D. Any response the server happens to return.

**Answer: B.** Clients need a stable documented error contract. Internal stacks and database details should remain private.

### 12. What should an API example in an OpenAPI document do?

- A. Match the schema and actual API behavior.
- B. Contain a live user's email address.
- C. Include a valid production access token.
- D. Omit all required fields.

**Answer: A.** Consistent examples help clients understand and try operations. Use synthetic values and keep them consistent with schema constraints.

### 13. Why should public response schemas be separate from Mongoose documents?

- A. Database models should never be used by Node.js.
- B. Internal schema changes should not accidentally change the public contract.
- C. OpenAPI requires every property to be stored in memory.
- D. Mongoose cannot return JSON.

**Answer: B.** Mapping internal data to an explicit API response lets storage evolve without exposing database details or accidental fields.

### 14. What is the role of a deprecation plan?

- A. Mark an operation old without informing users.
- B. Explain the replacement, migration steps, and support or retirement timeline.
- C. Remove an endpoint immediately after adding a new version.
- D. Change the API response without notice.

**Answer: B.** Deprecation is a communication and migration process. Consumers need enough information and time to move to the replacement.

### 15. What should a CI linter for an OpenAPI file primarily catch?

- A. Structural or configured style problems in the API description.
- B. Every semantic mismatch between implementation and contract.
- C. All authorization bugs in the deployed server.
- D. Whether customers have upgraded their apps.

**Answer: A.** Linting can identify structural and rule-based problems, but separate checks are needed to catch mismatches with live behavior and security enforcement.

### 16. Why should the API document be checked with implementation changes in the same review workflow?

- A. To keep the documented contract aligned with the routes and responses being changed.
- B. To force a new API version for every server code commit.
- C. To put secrets in the document.
- D. To eliminate the need for clients.

**Answer: A.** Reviewing the contract alongside implementation helps detect undocumented behavior changes and inaccurate examples.

### 17. What should an OpenAPI document say about authentication?

- A. Nothing; clients can infer it from a 500 response.
- B. Which operations require which documented security scheme and permissions.
- C. The production secret value.
- D. Only the database host.

**Answer: B.** Documenting security requirements helps clients understand how to call an operation, while the server independently enforces authentication and authorization.

### 18. Why document pagination rules explicitly?

- A. To explain how clients request the next page, ordering, and page-size limits.
- B. To hide all query parameters.
- C. Because MongoDB requires a URL version.
- D. To automatically create client-side state.

**Answer: A.** Clients need predictable cursor or offset semantics, ordering, limits, and empty-page behavior.

### 19. What should a team do when a change breaks existing clients?

- A. Silently change the current endpoint.
- B. Use a planned new contract/version or migration path and communicate the change.
- C. Delete the OpenAPI document.
- D. Ask clients to inspect the server source.

**Answer: B.** Breaking changes need an explicit policy, version or migration plan, and communication so clients can adapt predictably.

### 20. What is the safest source of sample data in public API docs?

- A. Real customer records.
- B. Synthetic data that matches the documented schema.
- C. Live credentials from production.
- D. Internal database connection strings.

**Answer: B.** Synthetic examples demonstrate the contract without exposing real personal data or secrets.

## Short-answer questions

### 21. Name at least six things a useful API operation description should specify.

**Answer:** It should explain the method and path, purpose, authentication and permission, path/query/header parameters, request body and media type, success response schemas, possible error responses, and relevant limits or pagination behavior.

### 22. What is the difference between contract-first and code-first API documentation?

**Answer:** Contract-first writes and reviews the API description before implementation. Code-first derives a description from code or annotations. Both require review to ensure the document matches actual behavior.

### 23. Why is an OpenAPI document not the same thing as the API implementation?

**Answer:** It describes expected behavior in a standard format, but does not itself implement routes, validate requests, enforce permissions, or guarantee the server returns those responses.

### 24. Give three examples of details clients need for pagination.

**Answer:** Clients need to know whether pagination uses cursors or offsets, how to request the next page, the maximum allowed page size, what ordering is applied, and what an empty page looks like.

### 25. List four changes that commonly break an API client.

**Answer:** Removing/renaming a field or endpoint, changing a field type or meaning, making an optional request field required, changing auth requirements or error/status behavior, and tightening accepted input are examples.

### 26. What information should a deprecation notice include?

**Answer:** It should identify the deprecated operation/version, its replacement, a migration guide, the support or retirement window, and a way to get help. The docs, product communication, and server behavior should agree.

### 27. Why should public API responses map from internal database models to explicit schemas?

**Answer:** This prevents internal field additions, renames, or database-specific values from accidentally changing the public contract. It also gives the API a stable shape independent of storage.

### 28. What can an OpenAPI linter validate, and what can it not guarantee?

**Answer:** It can check structural validity and configured rules. It cannot guarantee that every route behaves as documented, authorization is enforced, examples match runtime responses, or the API is secure.

### 29. Why can adding an optional response field still need a compatibility review?

**Answer:** Some clients reject unknown fields or use strict schemas, and the field might reveal data unexpectedly. Confirm consumer behavior and whether the new value is safe before calling the change compatible.

### 30. Why should the API version and OpenAPI `info.version` not be casually conflated?

**Answer:** The API route version selects a public contract, while `info.version` identifies the description revision. Server package versions are separate again; they may evolve at different rates.

## Application questions

### 31. A team adds `GET /api/v1/products/:id` but documents only the 200 response. What else should be added?

**Answer:** Document authentication and permissions, the required path parameter and format, the response schema and content type, and expected failures such as invalid identifier, unauthorized request, missing product, and internal error. Include examples that match the implementation.

### 32. A database migration changes `price` from a numeric amount to a nested object. How can the team avoid accidentally breaking v1 clients?

**Answer:** Keep the v1 response mapping stable by translating the new storage shape into the documented v1 representation. If the public meaning or shape must change, publish an explicit new contract/version and migration path.

### 33. An OpenAPI document declares bearer authentication, but the Express route has no authentication middleware. Is the endpoint protected?

**Answer:** No. The document only describes the expectation. Add and verify server-side authentication and authorization middleware; otherwise the documentation and actual behavior disagree.

### 34. A new optional response field is added, and one mobile client crashes when it appears. What does this show?

**Answer:** Additive changes are not automatically compatible with every consumer. Review how clients parse the response and coordinate or version the change if strict consumers cannot ignore unknown fields.

### 35. An operation returns a different error shape for validation failures than for missing records. How should the contract evolve?

**Answer:** Decide and document a consistent error format with stable status and code semantics. Update the implementation and examples together, and assess whether existing clients will be affected before changing a live contract.

### 36. A public API moves from `/api/v1` to `/api/v2`, but the team plans to remove v1 the same day. What is missing?

**Answer:** A support and deprecation plan is missing. Keep v1 available during a communicated migration window, publish replacement examples, notify consumers, measure safe version usage, and retire it according to the policy.

### 37. A docs page uses the production server URL and a real bearer token in its “Try it” example. What should change?

**Answer:** Remove the token and any secret or private deployment details. Use synthetic examples, a safe server URL policy, and an authentication flow that lets each authorized user provide their own credentials securely.

### 38. CI successfully lints `openapi.yaml`, but clients still report that the API returns fields with different names. Why did CI miss this?

**Answer:** Linting checks the description's structure and configured rules, not necessarily runtime behavior. Add route/contract tests and review implementation and OpenAPI changes together so actual responses match the document.

### 39. A request adds a new value to an enum used by mobile clients. How should compatibility be assessed?

**Answer:** Check whether consumers tolerate unknown enum values or use exhaustive switches. Document the new value and, if some clients would fail, coordinate support or use a compatible migration/version plan.

### 40. A `POST` operation may be retried by a client after a timeout and create duplicate orders. What contract detail should be discussed?

**Answer:** Document whether the operation supports an idempotency key or another duplicate-prevention mechanism, its required format and retention behavior, and what response a retry receives. Implement the behavior on the server as well.

## Chapter navigation

| Previous chapter | Lesson | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [057 - Logging and request tracing](../lessons/057-logging-and-request-tracing.md) | [Lesson](../lessons/058-api-documentation-and-versioning.md) | [Example](../examples/058-api-documentation-and-versioning.md) | [059 - Test Express routes and services](../lessons/059-test-express-routes-and-services.md) |
