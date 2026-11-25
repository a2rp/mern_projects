# 047 - REST status codes and consistent response shapes: Q&A

Use these questions to review the status-code choices and response conventions from the lesson. The answers explain the reasoning so they can be used for revision, not just memorized.

## Multiple-choice questions

### 1. Which part of an HTTP response communicates the broad outcome to clients, caches, and monitoring tools?

- A. The JSON message string
- B. The HTTP status code
- C. The route name
- D. The database document

**Answer: B.** The HTTP status code is the protocol-level signal for the broad result. A body can explain the result, but it should not contradict the status.

### 2. A POST request creates an order and the API returns the created representation. Which status is the best fit?

- A. 200 OK
- B. 201 Created
- C. 202 Accepted
- D. 204 No Content

**Answer: B.** The operation created a resource, so 201 communicates that outcome. A Location header should identify its canonical URL when available.

### 3. When is 202 Accepted appropriate?

- A. Every time validation succeeds
- B. When the request was accepted but its processing is still pending
- C. When a resource was deleted without a body
- D. When an unknown error occurs

**Answer: B.** 202 says processing has not completed. The API should avoid implying success before the work is finished and can provide a job identifier or status URL.

### 4. Which is the correct response pattern for a successful delete that returns no representation?

- A. 200 with an empty JSON object
- B. 201 with a null body
- C. 204 with no body
- D. 404 with no body

**Answer: C.** 204 means the request succeeded and the response has no content. Do not send JSON with this status.

### 5. What should a client expect from a response to HEAD?

- A. A JSON body containing the GET response
- B. No body, with headers generally corresponding to GET
- C. A redirect in every case
- D. A 204 status regardless of the resource

**Answer: B.** HEAD responses do not include a body. Their headers generally describe the response that a corresponding GET would produce.

### 6. A valid user is authenticated but is not permitted to edit an order. Which status usually represents this?

- A. 400 Bad Request
- B. 401 Unauthorized
- C. 403 Forbidden
- D. 409 Conflict

**Answer: C.** 403 describes an understood request that the server refuses to authorize. 401 is for missing or unacceptable authentication credentials.

### 7. What header may be required with a 401 response to describe the authentication scheme?

- A. Allow
- B. Location
- C. WWW-Authenticate
- D. Retry-After

**Answer: C.** WWW-Authenticate carries an authentication challenge. Its value should match a scheme the API actually supports.

### 8. An API recognizes a resource path, but that resource does not support the submitted HTTP method. What status and header are appropriate?

- A. 404 with Location
- B. 405 with Allow
- C. 409 with Retry-After
- D. 415 with Content-Length

**Answer: B.** 405 communicates that the method is not allowed for the resource. The Allow header lists the methods that are supported.

### 9. A request is syntactically valid but asks to change an order from delivered back to pending, which the business rules forbid. Which status can represent this state conflict?

- A. 201
- B. 204
- C. 409
- D. 502

**Answer: C.** 409 is appropriate when the request conflicts with the resource's current state. The API should explain the conflict safely and consistently.

### 10. The request body exceeds the server's configured maximum size. Which status is the best fit?

- A. 401
- B. 413
- C. 415
- D. 504

**Answer: B.** 413 Content Too Large describes content that exceeds the server's accepted limit. The server should enforce size limits before doing expensive processing.

### 11. A JSON endpoint receives a request with an unsupported media type. Which status fits?

- A. 400
- B. 404
- C. 415
- D. 422

**Answer: C.** 415 Unsupported Media Type indicates that the request's representation format is not supported for the operation. This differs from malformed JSON sent as JSON.

### 12. What is a sound way for an API to choose between 400 and 422 for invalid fields?

- A. Randomly choose either for each route
- B. Use a documented policy and apply it consistently
- C. Always use 500
- D. Use 200 and explain the issue in a message

**Answer: B.** An API can use 400 for all invalid input or distinguish malformed requests from semantically invalid content with 422. Consistency and clear documentation matter.

### 13. A route's rate limit has been exceeded. Which status is designed for this outcome?

- A. 301
- B. 409
- C. 429
- D. 503

**Answer: C.** 429 Too Many Requests describes a client exceeding a rate limit. Retry-After can be included when the server can give a useful retry time.

### 14. An unexpected application exception occurs and no safe, more specific mapping applies. What should the public response generally use?

- A. 400
- B. 404
- C. 500
- D. 204

**Answer: C.** 500 is for an unexpected server-side failure. The client should receive a safe message while diagnostic details remain in private logs.

### 15. A service is temporarily overloaded and knows it will resume accepting requests in about 30 seconds. Which status and optional header are suitable?

- A. 503 and Retry-After
- B. 401 and WWW-Authenticate
- C. 405 and Allow
- D. 201 and Location

**Answer: A.** 503 communicates temporary unavailability. Retry-After may communicate when the server expects clients can try again.

### 16. What does the Location header commonly identify after a resource is created?

- A. The server's source-code directory
- B. The new resource's canonical URL
- C. The request's JSON body
- D. The permitted HTTP methods

**Answer: B.** Location can tell clients where to retrieve the newly created resource. It is protocol metadata, not a replacement for the response representation.

### 17. Why should clients use a stable error code instead of parsing the error message?

- A. Messages are guaranteed to be identical forever
- B. Codes can be stable identifiers while message wording can change or be localized
- C. Codes make the HTTP status unnecessary
- D. Messages are not allowed in JSON

**Answer: B.** Machine-readable codes provide a stable basis for client behavior. Human-readable text can evolve without breaking that behavior.

### 18. Which success envelope is predictable for clients if it is used consistently?

- A. Sometimes raw objects, sometimes result, sometimes payload
- B. A documented data property, with metadata in a documented place
- C. An HTTP error status with every response
- D. The entire server exception object

**Answer: B.** A stable envelope lets clients know where representations and metadata appear. The exact shape is a design choice as long as it stays consistent.

### 19. What should an API do with stack traces and database diagnostics in client-facing error bodies?

- A. Include them on every 500 response
- B. Include them only for authenticated users
- C. Keep them in private logs and return a safe public message
- D. Put them in the message property

**Answer: C.** Internal details can expose implementation information or sensitive data. Log diagnostics securely and return a safe error shape to clients.

### 20. In Express, which method is intended to serialize a value as a JSON response?

- A. res.json()
- B. res.location()
- C. res.end()
- D. res.redirect()

**Answer: A.** res.json() sends a JSON representation and sets the corresponding content type. Use res.status() to set the HTTP status before sending it.

## Short-answer questions

### 21. What three parts make up a typical HTTP response?

**Answer:** A response has a status line, headers, and optionally a body. The status communicates the broad outcome, headers carry protocol or representation metadata, and the body contains the representation or error details when applicable.

### 22. Explain the difference among 200, 201, and 202.

**Answer:** 200 means the operation succeeded and a representation is returned. 201 means a resource was created. 202 means the request was accepted for processing, but that processing has not completed yet.

### 23. Why must a 204 response have no response body?

**Answer:** 204 explicitly means the request succeeded without a response representation. Sending JSON with it contradicts the status semantics and can cause clients to handle the response incorrectly.

### 24. How should an API distinguish a missing resource from a forbidden operation?

**Answer:** It can use 404 when the resource or route is unavailable and 403 when it is willing to say that access is denied. Some systems intentionally return 404 for protected resources to hide their existence, but they should apply that policy consistently.

### 25. What is the purpose of the Allow header with 405?

**Answer:** It lists the HTTP methods supported by the resource. Clients can use it to understand which methods are valid for the recognized path.

### 26. Give one reasonable API policy for 400 versus 422.

**Answer:** One policy uses 400 for malformed requests and 422 for syntactically valid content whose field values fail semantic rules. Another policy uses 400 for all validation failures. Either can work if documented and consistent.

### 27. What belongs in a stable API error envelope?

**Answer:** A stable machine-readable code and a safe human-readable message are the core. Field-level details can be added when useful, without echoing sensitive input or internal exception data.

### 28. Why should a 503 response include Retry-After only when the server has a meaningful retry estimate?

**Answer:** The header tells clients when a retry may be appropriate. A misleading estimate can trigger harmful or needless retries, so the server should send it only when it can support that guidance.

### 29. Why is 200 with success:false a poor representation of a failed request?

**Answer:** The HTTP protocol still reports success to caches, clients, and monitoring, even though the JSON says failure. A client may rely on the status for control flow, so use an appropriate 4xx or 5xx status.

### 30. What is the difference between a public error message and a private diagnostic log entry?

**Answer:** A public message should be safe, useful, and free of internal details. A private diagnostic can contain carefully controlled context such as a stack trace and request identifier, subject to access and data-retention rules.

## Application questions

### 31. A client posts a new order successfully. Design the important parts of the response.

**Answer:** Return 201 Created, set Location to the new order's canonical URL when available, and return the created order under the API's success envelope, for example { "data": order }. Make sure the order representation contains only fields safe for that caller.

### 32. A user starts a report-generation job that may take several minutes. What response should the API send and what should it include?

**Answer:** Return 202 Accepted because the report is not complete. Include a job identifier or status URL so the client can check progress and retrieve the eventual result.

### 33. A DELETE endpoint removes an order and the API has no representation to return. What should it send?

**Answer:** Return 204 No Content and end the response without a body. If the API instead chooses to return a representation or deletion result, it should select a status and body that match that documented contract.

### 34. An endpoint accepts JSON, but the client sends malformed JSON with Content-Type application/json. How should the API classify it?

**Answer:** Treat it as a malformed request, typically 400 Bad Request. Return a safe, consistent error body; do not include the raw body or parser stack trace.

### 35. A caller's token is valid, but the caller cannot view a particular account. Should the route return 401 or 403?

**Answer:** Usually return 403 because authentication succeeded but authorization failed. If the application intentionally hides protected-resource existence, it may return 404 instead, consistently with its policy.

### 36. A resource path exists, but a client sends PUT and the API supports only GET and PATCH. What should the response contain?

**Answer:** Return 405 Method Not Allowed and an Allow header such as GET, HEAD, PATCH. Use the API's standard error envelope to explain that the method is unsupported.

### 37. A request asks to cancel an order that has already shipped, and cancellation is disallowed. What status and error details are useful?

**Answer:** Return 409 Conflict because the action conflicts with the order's current state. Use a stable code such as ORDER_STATE_CONFLICT and a safe message that tells the client the transition is unavailable.

### 38. A dependency is temporarily unavailable and the API cannot complete a request. What should the API consider returning?

**Answer:** A temporary service failure may be represented by 503 when the API itself is unable to serve the request. Include Retry-After only if a useful retry time is known, and avoid exposing dependency internals.

### 39. A developer adds the database exception message and stack trace to a 500 JSON body to speed up debugging. What should change?

**Answer:** Remove those details from the public response. Log them privately with a request identifier, and return a stable 500 error code and safe message to the client.

### 40. Two endpoints return the same error differently: one uses { "error": "Not found" } and another returns { "message": "Missing" }. What improvement should the API make?

**Answer:** Adopt and document a common error envelope with stable codes and messages, then use it consistently across routes. The response status should also accurately describe the failure so clients do not have to infer it from body text.

## Chapter navigation

| Previous chapter | Lesson | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [046 - Validate and sanitize client input](../lessons/046-validate-and-sanitize-client-input.md) | [Lesson](../lessons/047-rest-status-codes-and-consistent-response-shapes.md) | [Example](../examples/047-rest-status-codes-and-consistent-response-shapes.md) | [048 - CORS and browser cross-origin requests](../lessons/048-cors-and-browser-cross-origin-requests.md) |
