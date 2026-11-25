# 090 - Build a CRUD feature across UI, API, and database: Q&A

These questions review CRUD routes, request and response contracts, server-side validation, Mongoose behavior, React state updates, and error handling.

## Multiple-choice questions

### 1. What does CRUD stand for?

- **A.** Create, read, update, delete
- **B.** Cache, route, upload, deploy
- **C.** Compile, render, use, debug
- **D.** Connect, return, undo, dispatch

**Answer: A.** CRUD names the four common operations on a resource.

### 2. Which method and route commonly create a course?

- **A.** POST /api/courses
- **B.** GET /api/courses/:id
- **C.** DELETE /api/courses
- **D.** OPTIONS /api/courses

**Answer: A.** POST to the collection commonly creates a new resource.

### 3. Which method and route commonly retrieve one course?

- **A.** GET /api/courses/:id
- **B.** POST /api/courses/:id
- **C.** DELETE /api/courses/:id
- **D.** PATCH /api/courses

**Answer: A.** The identifier selects a particular resource.

### 4. Which method commonly represents a partial update?

- **A.** PATCH
- **B.** GET
- **C.** OPTIONS
- **D.** HEAD

**Answer: A.** PATCH applies the fields provided by the request rather than replacing the entire resource.

### 5. Which response status is commonly returned after successful creation?

- **A.** 201 Created
- **B.** 404 Not Found
- **C.** 304 Not Modified
- **D.** 503 Service Unavailable

**Answer: A.** A create operation can return 201 with the new resource representation.

### 6. Which response status is commonly returned for successful deletion with no body?

- **A.** 204 No Content
- **B.** 201 Created
- **C.** 302 Found
- **D.** 409 Conflict

**Answer: A.** A 204 response should not include a response body.

### 7. What should the client do after receiving a 204 response?

- **A.** Avoid parsing the empty response as JSON
- **B.** Assume the JSON body contains the deleted record
- **C.** Retry the DELETE indefinitely
- **D.** Treat it as a network failure

**Answer: A.** Handle the empty success separately in the shared request helper.

### 8. Why return 404 for an unknown resource identifier?

- **A.** It communicates that the requested resource does not exist
- **B.** It means the request body is invalid
- **C.** It indicates the server crashed
- **D.** It tells React to use an array index

**Answer: A.** A missing resource is different from an unexpected server failure.

### 9. Why validate identifiers before querying by them?

- **A.** To reject malformed input with a client error instead of treating it as an unexpected failure
- **B.** To prove the caller owns the resource
- **C.** To skip database authorization
- **D.** To convert an ID into an access token

**Answer: A.** Identifier format validation improves error handling; authorization remains separate.

### 10. Why is an explicit allowed-field list useful?

- **A.** It prevents clients from setting server-owned or unsupported fields
- **B.** It makes every field public
- **C.** It removes the need for database schemas
- **D.** It encrypts request bodies

**Answer: A.** Only copy values the endpoint intends to let callers change.

### 11. Does client-side validation enforce an API rule?

- **A.** No, the server must enforce it because callers can bypass the UI
- **B.** Yes, all HTTP clients must use the browser form
- **C.** Yes, because React code runs on the server
- **D.** No, but databases cannot validate data either

**Answer: A.** Client checks improve experience, while server checks protect the API boundary.

### 12. What does the Mongoose schema provide?

- **A.** Document structure, defaults, and schema-level validation
- **B.** Authentication for every request
- **C.** Browser CORS headers
- **D.** React event handlers

**Answer: A.** The service and API still need request-specific validation and authorization.

### 13. What should a PATCH request mean in a partial-update API?

- **A.** Only supplied, accepted fields are changed
- **B.** Every omitted field is automatically deleted
- **C.** The resource is always created if absent
- **D.** The client replaces the entire database

**Answer: A.** Preserve omitted fields unless the API explicitly defines different semantics.

### 14. Why reject an empty PATCH body?

- **A.** It communicates that no update was requested
- **B.** Empty updates always delete the record
- **C.** MongoDB cannot store text
- **D.** React requires a nonempty response

**Answer: A.** Requiring at least one supported update field avoids a misleading no-op.

### 15. How can an update preserve fields not supplied in a PATCH?

- **A.** Load the document, assign only validated fields, and save it
- **B.** Replace the document with an empty object
- **C.** Delete the document and return 200
- **D.** Copy all request fields to every record

**Answer: A.** Apply the partial input to the existing record deliberately.

### 16. What should be considered when using Mongoose update queries?

- **A.** Update validators may need to be enabled and have limitations
- **B.** They always run every full-document validator by default
- **C.** They bypass all database operations
- **D.** They can only be used by React

**Answer: A.** Understand the selected update method and validation behavior.

### 17. What does DTO mean in this context?

- **A.** A deliberate data shape sent across the API boundary
- **B.** A MongoDB password file
- **C.** A React DOM event
- **D.** A development transport option

**Answer: A.** A DTO can hide database-specific or private fields from the client.

### 18. Which status is a reasonable choice for invalid input in the example contract?

- **A.** 400 Bad Request
- **B.** 301 Moved Permanently
- **C.** 204 No Content
- **D.** 101 Switching Protocols

**Answer: A.** The API can consistently report malformed or invalid input as a client error.

### 19. What should an unexpected 500 response expose?

- **A.** A generic message; log technical details server-side
- **B.** A full stack trace and environment dump
- **C.** The MongoDB URI
- **D.** The source code of all controllers

**Answer: A.** Internal details and credentials should not be disclosed to users.

### 20. Why use a stable ID as a React list key?

- **A.** It lets React associate each rendered item with the same resource across updates
- **B.** It authenticates the resource
- **C.** It makes the ID secret
- **D.** It replaces the API route

**Answer: A.** Stable keys are important when list contents or order can change.

## Short-answer and scenario questions

### 21. A create request receives a 201 response. What should the API ideally return?

**Answer:** A JSON representation of the created resource, including its stable ID and the fields the client needs.

### 22. A client sends a title and an unexpected <code>status</code> field. The caller must not publish courses directly. What should happen?

**Answer:** Reject the unsupported field or ignore it according to the API contract, and set status on the server under the authorized publish workflow.

### 23. A user requests a well-formed ID that does not exist. What status should the read endpoint return?

**Answer:** 404 Not Found, because the requested resource is missing.

### 24. A client supplies an identifier with an invalid format. What is a useful response?

**Answer:** Return a client error such as 400 with a safe message explaining that the identifier is invalid.

### 25. Why distinguish malformed ID from not-found ID?

**Answer:** They describe different client conditions: one is not a valid identifier, the other is a valid-looking identifier with no matching record.

### 26. What can go wrong if a service copies all of <code>req.body</code> into a MongoDB document?

**Answer:** A caller may set fields the endpoint does not authorize, such as ownership, roles, status, or timestamps.

### 27. A PATCH request changes only description. Should an omitted title become empty?

**Answer:** No. In a partial-update contract, omitted fields remain unchanged.

### 28. The edit endpoint uses a find-and-update query and schema validation does not reject an invalid title. What should you inspect?

**Answer:** Confirm the update operation enables Mongoose update validators, or load the document, assign validated fields, and save it.

### 29. Why might loading a document and calling save be clearer for some update flows?

**Answer:** It allows validation against a document and makes the partial-field changes explicit, though it uses a read followed by a write.

### 30. A delete succeeds but the client tries to parse JSON and throws. What is likely wrong?

**Answer:** The API returned 204 with no body, but the client helper unconditionally called <code>response.json()</code>.

### 31. When should the UI remove an item from the visible list after deletion?

**Answer:** In the simple server-confirmed pattern, after the API confirms success; optimistic removal is possible when the UI also handles rollback on failure.

### 32. Why should a 500 error message be generic?

**Answer:** Detailed internals could expose implementation details or secrets. Log those details on the server and return a safe message.

### 33. A form shows an error from server validation. Why keep the user's existing input?

**Answer:** Preserving the values lets the user correct the invalid field without re-entering the entire form.

### 34. Why have distinct loading and empty states?

**Answer:** Loading means a request is pending; empty means it succeeded but returned no resources.

### 35. A list uses array indexes as keys, then items are deleted and reordered. What issue can appear?

**Answer:** React can associate component state with the wrong item. Use each resource's stable identifier.

### 36. A client mutation succeeds in the database but the UI shows no change until reload. What could improve the interaction?

**Answer:** Return the updated resource and update local state from that response, or invalidate and refetch the collection.

### 37. A delete request for a missing ID arrives twice due to a retry. What contract choice should the API make?

**Answer:** Define whether a missing resource returns 404 or deletion is idempotently treated as success, then apply that behavior consistently. The example chooses 404.

### 38. Why can route authorization not be inferred from a valid resource ID?

**Answer:** Identifiers locate resources; they do not prove the caller is permitted to read or modify them. Authorization must check the authenticated principal and resource policy.

### 39. How can a browser Network panel help debug a failed update?

**Answer:** Inspect the request method, URL, path ID, JSON body, status, response error, and whether the request failed before reaching Express.

### 40. Summarize how a React edit reaches MongoDB and returns to the screen.

**Answer:** React sends a PATCH body through a feature API function; Express parses JSON and matches the item route; the controller calls the service; the service validates allowed fields and ID, updates and saves the document; the controller returns the mapped resource; React replaces the matching list item with that response.

## Chapter navigation

| Previous chapter | Chapter lesson | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [089 - Connect React to Express end to end](../lessons/089-connect-react-to-express-end-to-end.md) | [Lesson](../lessons/090-build-a-crud-feature-across-ui-api-and-database.md) | [Example](../examples/090-build-a-crud-feature-across-ui-api-and-database.md) | [091 - Authentication end to end](../lessons/091-authentication-end-to-end.md) |
