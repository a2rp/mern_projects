# Chapter 036 Q&A: REST API design and resource modeling

Review resource URLs and representations, HTTP method semantics, status codes, validation, pagination, authorization, and API compatibility.

## Part 1: Multiple-choice questions

### 1. What is a resource in an API?

- **A.** A thing or collection of things that the API identifies and exposes through a representation.
- **B.** Only a MongoDB collection with its database name exposed in a URL.
- **C.** A JavaScript function inside an Express route.
- **D.** A status code returned after every request.

**Answer: A.** A resource is part of the public API model. It does not have to map one-to-one to a database collection.

### 2. Which URL convention clearly identifies a collection and one item?

- **A.** /api/v1/projects and /api/v1/projects/prj_123
- **B.** /api/v1/getProjects and /api/v1/getProjectById
- **C.** /api/v1/project-list and /api/v1/project-delete
- **D.** /api/v1/projects?delete=prj_123

**Answer: A.** A collection path and an item path with an identifier are a common, predictable resource-oriented convention.

### 3. Where should a client normally put filters and pagination options?

- **A.** In query parameters on the collection URL.
- **B.** In the path as a fake resource name.
- **C.** In a GET request body without a documented contract.
- **D.** In an undocumented MongoDB operator object.

**Answer: A.** Query parameters can select a filtered, sorted, or paginated view of a collection.

### 4. Which method is normally used to retrieve a resource without requesting a state change?

- **A.** GET
- **B.** POST
- **C.** PATCH
- **D.** DELETE

**Answer: A.** GET is defined as a safe method: its intended operation is read-only.

### 5. Which statement best describes POST to a collection?

- **A.** It commonly asks the server to create a new resource in that collection.
- **B.** It always replaces a known resource completely.
- **C.** It is always safe to repeat without deduplication.
- **D.** It must return 204 with no body in every API.

**Answer: A.** POST commonly creates a resource under a collection. Repeating it can create another resource unless the API defines deduplication.

### 6. Which statement best describes PUT?

- **A.** It commonly replaces the state of a known resource and has an idempotent intended effect.
- **B.** It always applies a partial update.
- **C.** It is a safe read operation.
- **D.** It is only valid for deleting a resource.

**Answer: A.** PUT is generally used to replace the target resource state. The API should document omitted-field and creation behavior.

### 7. What is a common use for PATCH?

- **A.** Applying a documented partial change to a resource.
- **B.** Retrieving a collection without a state change.
- **C.** Creating a database user.
- **D.** Replacing every resource in a collection.

**Answer: A.** PATCH changes selected parts of a resource according to the patch semantics defined by the API.

### 8. Which property describes an idempotent method?

- **A.** Repeating the same request has the same intended effect as performing it once.
- **B.** Every repeated request must return the same status and response body.
- **C.** The method never writes to a database.
- **D.** The server must cache every response.

**Answer: A.** Idempotence describes the intended effect, not necessarily identical responses. A repeated DELETE could return a different status while leaving the resource absent.

### 9. What is a suitable response for a successful resource creation?

- **A.** 201 Created, with the new representation and a Location header when practical.
- **B.** 204 No Content with a JSON body.
- **C.** 401 Unauthorized.
- **D.** 500 Internal Server Error.

**Answer: A.** 201 communicates that creation succeeded. Location can identify the new resource.

### 10. What should a successful DELETE with no representation return?

- **A.** 204 No Content with no response body.
- **B.** 201 Created with a Location header for the deleted item.
- **C.** 401 Unauthorized.
- **D.** 200 with an unrelated full database dump.

**Answer: A.** 204 indicates success without a response body.

### 11. Which status usually means the request has no valid authentication credentials?

- **A.** 401 Unauthorized
- **B.** 403 Forbidden
- **C.** 404 Not Found
- **D.** 409 Conflict

**Answer: A.** 401 is used when valid authentication credentials are missing or invalid. 403 is commonly used when an authenticated caller is not allowed to perform the operation.

### 12. When is 409 Conflict commonly useful?

- **A.** When a request conflicts with current resource state, such as a uniqueness constraint.
- **B.** Whenever the client sends malformed JSON.
- **C.** For every successful create.
- **D.** When an endpoint does not exist.

**Answer: A.** 409 communicates a conflict between the request and the current resource state.

### 13. What is one reasonable API convention for a syntactically valid body with invalid field values?

- **A.** Return 422 Unprocessable Content with a consistent validation error.
- **B.** Return 201 Created.
- **C.** Return 204 No Content with the invalid record.
- **D.** Return 500 Internal Server Error for every validation issue.

**Answer: A.** An API may use 422 for semantic validation failures. Some APIs use 400 for all client input errors; consistency and documentation matter.

### 14. Why should a response use a public id field instead of returning a MongoDB document automatically?

- **A.** The API should control its public representation and avoid exposing storage details or private fields.
- **B.** MongoDB documents cannot contain identifiers.
- **C.** The browser cannot parse ObjectId values.
- **D.** It makes authorization unnecessary.

**Answer: A.** The API representation is a deliberate contract and need not expose the database's exact shape.

### 15. Why should a client not be allowed to set ownerId freely in a create or update body?

- **A.** It could let the client assign data to another user's account.
- **B.** MongoDB cannot store owner identifiers.
- **C.** It prevents GET requests from being safe.
- **D.** It changes the URL version.

**Answer: A.** Ownership and other trusted fields should usually be derived from authenticated server context, not trusted from arbitrary input.

### 16. Which pagination practice is safest?

- **A.** Validate requested limits and enforce a maximum page size.
- **B.** Accept any client-supplied limit, including enormous values.
- **C.** Pass every query parameter directly into a database filter.
- **D.** Ignore pagination and return every document.

**Answer: A.** Validation and limits prevent accidental or abusive unbounded queries.

### 17. What is one tradeoff of offset-based pagination on a large, changing collection?

- **A.** It can become slower and records can shift between pages as data changes.
- **B.** It cannot work with a JSON response.
- **C.** It automatically hides database fields.
- **D.** It guarantees stable results without sorting.

**Answer: A.** Cursor-based pagination may work better for large or frequently changing data, depending on the API's requirements.

### 18. How should an API handle client-supplied query parameters when building a MongoDB filter?

- **A.** Validate them and copy only explicitly supported fields into a fixed query shape.
- **B.** Pass the full query object directly to MongoDB.
- **C.** Treat every query parameter as an authorization grant.
- **D.** Convert every parameter into a MongoDB operator.

**Answer: A.** An allowlist makes the query contract explicit and reduces injection and resource-abuse risks.

### 19. What should an API error response avoid?

- **A.** Stack traces, database connection details, secrets, and sensitive document contents.
- **B.** A stable status code and machine-readable error type.
- **C.** A safe explanation of the client-visible problem.
- **D.** A documented validation error shape.

**Answer: A.** Detailed diagnostics belong in access-controlled server logs, not in public responses.

### 20. What is a safe approach to an API-breaking field rename?

- **A.** Plan a compatibility and deprecation path or introduce a deliberate new API version.
- **B.** Rename it without notice and assume all clients update simultaneously.
- **C.** Change the field's type without documenting it.
- **D.** Return raw database documents so clients infer the new contract.

**Answer: A.** Clients depend on an API contract. Breaking changes need a deliberate migration strategy.

## Part 2: Short-answer questions

### 21. Why should API resource design begin with client use cases rather than database collection names?

**Answer:** The API is a public contract shaped by client tasks. It may combine data, hide internal fields, or represent relationships differently from the database schema.

### 22. Why are plural nouns such as /projects commonly used for collection URLs?

**Answer:** They make collection paths predictable and easy to scan. This is a convention rather than a mandatory REST rule, so consistency matters most.

### 23. When is nested routing such as /projects/prj_123/tasks useful?

**Answer:** It is useful when the child collection is naturally viewed in the context of its parent. Keep nesting shallow and consider a top-level child URL when clients address that child independently.

### 24. Explain safe versus idempotent in HTTP method design.

**Answer:** A safe method does not request a state change, as with GET. An idempotent method has the same intended effect when repeated, as with PUT or DELETE; repeated responses do not have to be identical.

### 25. What should an API document about PATCH?

**Answer:** It should document which fields can change, how omitted fields behave, how null or removal is represented, and how invalid or unknown fields are handled.

### 26. What is the difference between server-controlled and client-editable fields?

**Answer:** Server-controlled fields include values such as IDs, ownership, and timestamps that the server derives or protects. Client-editable fields are explicitly accepted after validation and authorization.

### 27. When should an API use 202 Accepted?

**Answer:** When the server has accepted work but has not completed it. The response should explain how the client can learn the operation's eventual result when needed.

### 28. Why might an API return 404 for a resource the caller is not allowed to see?

**Answer:** Some APIs intentionally hide whether the resource exists. This policy should be deliberate and consistent; otherwise 403 can communicate that the resource exists but the caller is forbidden.

### 29. What information belongs in a consistent error contract?

**Answer:** A stable error type or code, a human-readable title or detail, the HTTP status, and optionally a request or resource instance. It should not reveal stack traces, secrets, or sensitive data.

### 30. What should a collection response document about pagination?

**Answer:** It should specify supported filters and sorts, default and maximum page sizes, page or cursor semantics, and metadata that tells the client what range it received and whether more results are available.

## Part 3: Practical scenarios

### 31. An endpoint is named /api/v1/deleteProject?id=prj_123 and deletes data on GET. What should be redesigned?

**Answer:** Use a resource URL such as /api/v1/projects/prj_123 and DELETE for the mutation. GET should remain a safe retrieval operation and must not trigger a requested deletion.

### 32. A create request returns 200 but no identifier or way to locate the new record. What would improve the contract?

**Answer:** Return 201 Created with the created representation and a Location header pointing to the new resource when practical.

### 33. A PATCH body includes name and a client-controlled ownerId. What should the handler do?

**Answer:** Allowlist editable fields such as name and ignore or reject ownerId according to the documented policy. Derive ownership from authenticated server context and check authorization for the record.

### 34. A client sends limit=1000000 to a collection endpoint. What safeguards should exist?

**Answer:** Validate the parameter, apply a documented maximum page size, and return a clear client error or use the maximum according to the API's documented policy.

### 35. A task URL is /projects/1/teams/2/members/3/tasks/4/comments/5. What design concern does this raise?

**Answer:** The path is deeply nested and couples requests to every ancestor relationship. Keep nesting shallow and provide a stable top-level resource URL when clients need to address the comment directly.

### 36. A duplicate project slug violates a unique constraint. What response is more helpful than a generic 500?

**Answer:** Return a documented conflict response such as 409, with a safe message or error code indicating the slug is already in use. Do not expose the database exception.

### 37. The API returns 403 for a caller whose credentials are missing. Is that the usual distinction?

**Answer:** Usually no. Missing or invalid credentials are generally reported as 401; 403 is used when an authenticated caller lacks permission. Follow one documented policy and account for cases where resource existence is intentionally hidden.

### 38. A repeated client POST after a timeout creates two identical orders. How could the API reduce duplicate creation?

**Answer:** For operations that need safe retry, define an idempotency-key contract or another deduplication mechanism, store the result associated with that key, and scope it to the authenticated caller. Do not assume POST is idempotent by default.

### 39. A developer returns a raw Mongoose document from every route, including passwordHash and internal fields. What should change?

**Answer:** Map database records to explicit response representations, omit sensitive and internal fields, and return only data the caller is authorized to read.

### 40. A frontend depends on a field that the API team wants to rename. How should the change be introduced?

**Answer:** Add the new field while keeping the old one during a transition, update and observe clients, publish a deprecation timeline, and remove the old field only after dependent clients have migrated. If compatibility cannot be maintained, use a deliberate versioning plan.

## Chapter navigation

| Previous chapter | Chapter lesson | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [035 - MongoDB security, backup, and restore](../lessons/035-mongodb-security-backup-and-restore.md) | [Lesson](../lessons/036-rest-api-design-and-resource-modeling.md) | [Example](../examples/036-rest-api-design-and-resource-modeling.md) | [037 - Create an Express app and server](../lessons/037-create-an-express-app-and-server.md) |
