# 045 - Centralized API errors and not-found handling: Q&A

These questions review API route fallbacks, resource errors, middleware order, safe error mapping, and centralized Express error handling.

## Multiple choice

### 1. An Express API request reaches the end of the middleware stack without a route sending a response. What normally happened?

- A. Express necessarily created an application error.
- B. No matching route or middleware responded; a not-found layer should decide the API response.
- C. The error handler automatically turns it into a 500.
- D. Express retries every route once.

**Answer: B.** An unmatched route is not automatically an application error. Add a normal not-found middleware after the API routes.

### 2. Where should an API route-not-found middleware normally be registered?

- A. Before all routes.
- B. Between the JSON parser and the first router.
- C. After the relevant API routers and before the error handler.
- D. After the error handler.

**Answer: C.** It must run after the routers have had the chance to respond, while remaining before the final error handler.

### 3. Which function signature identifies Express error-handling middleware?

- A. (req, res)
- B. (req, res, next)
- C. (error, req, res)
- D. (error, req, res, next)

**Answer: D.** Express recognizes error middleware by its four-argument signature.

### 4. What is the difference between a route-not-found 404 and a resource-not-found 404?

- A. A route 404 means no endpoint matched; a resource 404 means a matched endpoint could not find the requested item.
- B. A route 404 must be a 500, while a resource 404 is a 404.
- C. A route 404 is handled only by error middleware.
- D. They have identical meanings and should always use the same error code.

**Answer: A.** Both use status 404, but distinct codes can communicate whether the URL or the requested resource was missing.

### 5. What status should an unexpected programming or database failure normally produce?

- A. 200
- B. 301
- C. 404
- D. 500

**Answer: D.** An unexpected server failure is not a missing resource or successful operation; it should be reported as a server error.

### 6. Why should an API avoid returning an unexpected error's stack trace to a client?

- A. Stack traces are invalid JSON.
- B. They can reveal implementation details, paths, and other internal information.
- C. The browser cannot display them.
- D. They prevent Express from logging the error.

**Answer: B.** Send a generic public message and keep diagnostic details in server-side logs.

### 7. What is a useful role for an application-specific error class?

- A. To classify known failures with intentional status, code, and safe public message.
- B. To make every error return status 404.
- C. To bypass Express middleware.
- D. To replace all logging.

**Answer: A.** A known error type lets the centralized handler apply an explicit API policy.

### 8. Why should route-not-found and resource-not-found errors use distinct codes?

- A. The HTTP protocol requires different status codes for each.
- B. Clients can distinguish the situations without inspecting free-form messages.
- C. Express cannot send a 404 without two codes.
- D. A 404 response cannot include a message.

**Answer: B.** Stable codes let clients react to different 404 causes while both remain HTTP 404 responses.

### 9. What should a custom error handler do when res.headersSent is already true?

- A. Try to send a second JSON response.
- B. Change the response status and restart the route.
- C. Pass the error onward with next(error).
- D. Ignore the error and leave the connection open.

**Answer: C.** Once headers are sent, the handler cannot safely replace the response; delegate to Express.

### 10. Which approach is safest for mapping unknown errors?

- A. Trust every error's status and publicMessage fields.
- B. Choose a status by checking whether the message contains the words "missing" or "invalid".
- C. Treat only recognized application errors as client-safe; map unknown errors to a generic 500.
- D. Return the stack trace so clients can classify it.

**Answer: C.** Arbitrary error objects and message text are not reliable public API policy.

### 11. What does a route fallback do when mounted after all API routes?

- A. It handles API requests for which no earlier route responded.
- B. It runs before every successful route.
- C. It catches every rejected promise automatically.
- D. It changes all statuses to 500.

**Answer: A.** The fallback is ordinary middleware at the end of the API route stack.

### 12. Which status best describes a request with invalid syntax or required input?

- A. 200
- B. 400
- C. 404
- D. 503

**Answer: B.** A 400 response commonly describes a malformed or invalid request. More specific validation policy can be layered on later.

### 13. What does passing next(error) do in Express?

- A. Skips remaining ordinary handlers and enters the error flow.
- B. Sends a 404 response immediately.
- C. Restarts the current route.
- D. Logs the error without changing control flow.

**Answer: A.** Passing an error to next moves the request into error-handling middleware.

### 14. Why should a handler avoid blindly trusting an arbitrary error.status field?

- A. Status fields can only contain text.
- B. An unknown error may carry an unintended or unsafe value; classify errors the application recognizes.
- C. Express does not support numeric statuses.
- D. The status field always means a redirect.

**Answer: B.** The API should apply its own explicit status policy rather than trusting unclassified errors.

### 15. Why is matching on error.message text a poor way to identify error types?

- A. Error messages cannot contain letters.
- B. Message text may change, collide, or contain sensitive details.
- C. Only the browser can read error messages.
- D. Express removes every message before middleware runs.

**Answer: B.** Use a known error class or stable internal code instead of fragile free-form text.

### 16. Why does middleware registration order matter?

- A. Express executes middleware in the order it is registered.
- B. Express runs the last middleware first.
- C. Error middleware is always global regardless of its position.
- D. Routers ignore middleware registered before them.

**Answer: A.** A route fallback or error handler cannot handle work that has not yet reached it in the stack.

### 17. If a resource lookup succeeds but no item exists, which layer knows best how to classify the result?

- A. The global route-not-found fallback.
- B. The route or service that performed the resource lookup.
- C. The HTTP server socket.
- D. The JSON serializer.

**Answer: B.** The lookup route or service knows which resource was requested and can raise a resource-specific 404.

### 18. Which status communicates that a required service is temporarily unavailable?

- A. 201
- B. 304
- C. 404
- D. 503

**Answer: D.** A temporary dependency outage or service unavailability can be represented with 503 when that matches the API policy.

### 19. Why should an API error handler aim to send only one response?

- A. Multiple responses can cause headers-already-sent errors and confusing request behavior.
- B. HTTP supports only one status code in an entire application.
- C. Express cannot serialize more than one JSON property.
- D. It is required only for GET requests.

**Answer: A.** A response is a one-time completion of the request; after sending it, stop handling that request.

### 20. When does the centralized API error handler normally run?

- A. Before any parser or route.
- B. Only when a URL is misspelled.
- C. After a route or middleware forwards an error and the stack reaches the error handler.
- D. For every successful response.

**Answer: C.** Errors enter its path through a throw, a rejected returned promise, or next(error), subject to middleware order.

## Short-answer questions

### 21. Why is an unmatched URL not automatically caught by Express error middleware?

**Answer:** No error necessarily occurred. Express has simply exhausted the ordinary middleware and route stack without a response. A normal fallback middleware must create the desired 404 behavior.

### 22. Explain the difference between a missing route and a missing database record.

**Answer:** A missing route means no endpoint matches the request. A missing record means an endpoint matched and looked up a resource that does not exist. Both may return 404, but separate error codes make the reason clear.

### 23. Where should the route-not-found layer and error handler appear relative to the API router?

**Answer:** Register the route-not-found layer after the API router. Register the four-parameter error handler after that and after other middleware that can raise errors.

### 24. What information could an application error carry?

**Answer:** It can carry a known HTTP status, a stable internal/API error code, a safe public message, and optionally an internal cause for diagnostics. Do not expose internal causes directly.

### 25. How should an unexpected error be represented to the API client?

**Answer:** Return a generic server-error status and safe message, such as 500 with an internal-error code. Keep stack and diagnostic details in server-side logs.

### 26. Why should a centralized handler check res.headersSent?

**Answer:** If response headers have already been sent, it is too late to replace the response safely. The handler should delegate with next(error) so Express can finish handling the partially written response.

### 27. Why is it useful to have distinct codes for ROUTE_NOT_FOUND and ORDER_NOT_FOUND?

**Answer:** Both can use HTTP 404, but clients can distinguish an invalid endpoint from a valid endpoint whose requested order does not exist.

### 28. What is wrong with classifying errors by searching their message for "not found"?

**Answer:** Messages are free-form, may change, and may contain private data. A typed error or stable internal code gives the handler a reliable classification.

### 29. Name three details that should normally stay out of a public error response.

**Answer:** Stack traces, database or filesystem internals, and secrets such as credentials or connection strings. These belong in controlled server diagnostics, if needed.

### 30. What should happen after a route calls next(error)?

**Answer:** The route should stop its current response path. Express skips remaining ordinary handlers and finds error middleware; the route must not continue and send a second response.

## Application questions

### 31. A request to GET /api/ordres gets Express's default response. The API wants a JSON 404. What should you add?

**Answer:** Add a normal API fallback middleware after the API routers. It can send the JSON 404 directly or forward a typed ROUTE_NOT_FOUND error to the centralized handler.

### 32. GET /api/orders/9999 matches a route, but the database has no order 9999. Where should this become a 404?

**Answer:** In the route or service that knows the order lookup returned no record. Raise an ORDER_NOT_FOUND application error with status 404; do not rely on the route fallback.

### 33. A database connection timeout reaches the error handler. It is not a recognized client error. What should the handler send?

**Answer:** A generic 500 or an intentionally defined 503 if the application explicitly classifies dependency unavailability that way. Do not return the database's raw message to the client.

### 34. A route throws a typed error with status 401 and code AUTH_REQUIRED. How should the handler respond?

**Answer:** If the error is a recognized application error and its status is valid, return 401 with its stable code and safe public message. Do not include its stack trace.

### 35. A custom error handler receives an error after a file download has started. What should it do?

**Answer:** Detect res.headersSent and call next(error). It must not attempt to send a JSON body over the partially sent download response.

### 36. A route catches an error, logs it, then responds with status 200 and an empty list. Why is this dangerous?

**Answer:** It makes a failed operation look successful and may cause clients to cache or act on false data. Handle a known expected case deliberately; otherwise forward the error and return an error status.

### 37. The global handler sees an unknown error with a message saying "user not found". Should it send 404?

**Answer:** No. Message text is not a trustworthy classifier. Unless the application recognizes the error type or code as a not-found condition, treat it as an unexpected error and return a generic 500.

### 38. A malformed URL misses every route, while a valid route asks for a nonexistent product. How can clients distinguish these cases?

**Answer:** Both can return 404, but use separate stable codes such as ROUTE_NOT_FOUND and PRODUCT_NOT_FOUND, with safe messages describing each situation.

### 39. An API developer registers the error handler before mounting the routers. What is wrong?

**Answer:** Express processes middleware in registration order. Errors from routers mounted later will not flow backward to an earlier handler. Move the error handler after the routers and fallback.

### 40. Outline a safe centralized error response flow for an Express 5 API.

**Answer:** Put parsers and routers first, then a route-not-found fallback for unmatched API paths, then a four-parameter error handler. Recognize trusted application errors, return validated statuses and safe messages, log unexpected server failures without secrets, use a generic 500 for unknown errors, and delegate if res.headersSent is true.

## Chapter navigation

| Previous chapter | Lesson | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [044 - Async route handlers and error propagation](../lessons/044-async-route-handlers-and-error-propagation.md) | [Lesson](../lessons/045-centralized-api-errors-and-not-found-handling.md) | [Example](../examples/045-centralized-api-errors-and-not-found-handling.md) | [046 - Validate and sanitize client input](../lessons/046-validate-and-sanitize-client-input.md) |
