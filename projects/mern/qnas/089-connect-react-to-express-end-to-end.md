# 089 - Connect React to Express end to end: Q&A

These questions review HTTP request flow, JSON contracts, Fetch behavior, Express middleware and routes, server validation, UI request states, and debugging.

## Multiple-choice questions

### 1. Which sequence best describes a React-to-Express request?

- **A.** React feature calls client API, browser sends HTTP, Express route handles it, server returns a response
- **B.** React connects directly to MongoDB and Express renders CSS
- **C.** Express sends a database password to React before every render
- **D.** MongoDB calls the browser with a JSX response

**Answer: A.** The browser communicates with the API over HTTP; database access stays on the server.

### 2. What belongs in an API contract?

- **A.** Method, path, request shape, response shape, and expected statuses
- **B.** Only the React component color
- **C.** A private server password
- **D.** The developer's local file path

**Answer: A.** The contract makes both client and server expectations explicit.

### 3. What does Fetch return when the server responds with HTTP 404?

- **A.** It always rejects the promise
- **B.** It resolves with a Response that has a non-success status
- **C.** It converts the response to a successful empty array
- **D.** It reloads the page

**Answer: B.** Check <code>response.ok</code> or the status; Fetch does not reject solely for HTTP error statuses.

### 4. What does <code>response.ok</code> indicate?

- **A.** The status is in the successful 200–299 range
- **B.** The JSON body is valid for the application
- **C.** The user is authorized
- **D.** The API is cross-origin

**Answer: A.** The application still needs to parse and interpret the body.

### 5. What does <code>express.json()</code> do?

- **A.** Parses matching incoming JSON request bodies
- **B.** Validates all domain rules
- **C.** Connects the app to MongoDB
- **D.** Parses browser response bodies

**Answer: A.** It makes parsed input available to handlers such as <code>req.body</code>.

### 6. Where should JSON parsing middleware be registered?

- **A.** Before routes that need <code>req.body</code>
- **B.** Only in the browser
- **C.** After the response has been sent
- **D.** Inside MongoDB

**Answer: A.** Express middleware runs in registration order.

### 7. Which status is commonly used after successfully creating a resource?

- **A.** 201 Created
- **B.** 204 No Content with a required JSON body
- **C.** 301 Moved Permanently
- **D.** 418 for every create request

**Answer: A.** A 201 response indicates creation and can include the new resource.

### 8. Which status is commonly appropriate for a successful GET response with a body?

- **A.** 200 OK
- **B.** 302 Found
- **C.** 401 Unauthorized
- **D.** 500 Internal Server Error

**Answer: A.** The server can return the requested representation with status 200.

### 9. Why create a client API module?

- **A.** To centralize base URL, headers, response handling, and endpoint functions
- **B.** To let the browser access the database directly
- **C.** To hide requests from users
- **D.** To bypass the server's routes

**Answer: A.** Components stay focused on UI rather than repeating HTTP details.

### 10. Why must the API validate a form submission?

- **A.** A caller can bypass the browser form and send an HTTP request directly
- **B.** React cannot validate strings
- **C.** MongoDB rejects every HTTP request
- **D.** A user can only submit from a browser

**Answer: A.** Client validation improves usability but cannot enforce server trust.

### 11. What is a benefit of constructing a new object from accepted request fields?

- **A.** It prevents callers from setting fields the endpoint does not allow
- **B.** It automatically encrypts every field
- **C.** It removes the need for server validation
- **D.** It guarantees a database query is fast

**Answer: A.** Explicit field selection reduces accidental mass assignment.

### 12. What should a client helper do when a response is not successful?

- **A.** Convert the response to a useful error for the caller
- **B.** Treat every response as success
- **C.** Hide all errors and return a fake object
- **D.** Send the database URI to the component

**Answer: A.** A consistent error policy lets components render a meaningful failure state.

### 13. Which states should a simple data-loading component usually represent?

- **A.** Loading, success or empty, and error
- **B.** Only success
- **C.** Only a database state
- **D.** Build, publish, and delete

**Answer: A.** Users need feedback while data is loading and when a request fails.

### 14. Why might a component abort a request during Effect cleanup?

- **A.** To cancel unnecessary work when the component unmounts
- **B.** To convert a 404 into a 200
- **C.** To authenticate the request
- **D.** To create a server route

**Answer: A.** An AbortController can cancel a fetch that is no longer needed.

### 15. What is a stale response problem?

- **A.** An older request resolves after a newer one and overwrites current UI state
- **B.** A JSON value is too small
- **C.** A server route has an HTTP method
- **D.** A database returns records in order

**Answer: A.** Cancellation or an ignore guard can prevent obsolete results from being applied.

### 16. Why should a database-backed list item use a stable key?

- **A.** React uses it to identify the item consistently between renders
- **B.** It authorizes an HTTP request
- **C.** It is required by Express routing
- **D.** It replaces server-side validation

**Answer: A.** Use a stable identifier rather than an array index when records can change order.

### 17. Where should a controller generally sit in this architecture?

- **A.** At the HTTP boundary, translating request and response
- **B.** In the browser bundle
- **C.** Inside the MongoDB server
- **D.** In a CSS stylesheet

**Answer: A.** A controller adapts HTTP; domain rules belong in the use-case/service layer.

### 18. What should an unexpected server error response reveal to the browser?

- **A.** A generic message, with diagnostic details logged server-side
- **B.** The entire stack trace and all environment values
- **C.** The MongoDB password
- **D.** The local Windows account name

**Answer: A.** Internal diagnostics should not expose secrets or implementation details.

### 19. When is an error middleware normally registered?

- **A.** After routes that pass errors to it
- **B.** Before the Node.js runtime starts
- **C.** Inside each HTML element
- **D.** After the process has exited

**Answer: A.** Express middleware order determines which handlers see the request and errors.

### 20. What is the purpose of an API response mapper?

- **A.** To expose a deliberate public shape instead of coupling the client to persistence details
- **B.** To make the React UI connect to MongoDB
- **C.** To disable HTTP status codes
- **D.** To grant all users admin access

**Answer: A.** Mapping allows the public contract to remain stable even if storage details change.

## Short-answer and scenario questions

### 21. A GET call returns HTTP 500, but the Fetch promise resolves. Why should the client still treat it as a failure?

**Answer:** Fetch resolves for HTTP error statuses; check <code>response.ok</code> and throw or return an application error when it is false.

### 22. The server route sees <code>req.body</code> as undefined for a JSON POST. What should you check first?

**Answer:** Confirm the request sends a JSON content type and body, and that <code>express.json()</code> is registered before the route.

### 23. Why should a controller avoid containing all business logic and persistence details?

**Answer:** Keeping HTTP adaptation separate from use-case rules makes each boundary easier to reason about and change.

### 24. A browser form limits a title to 160 characters. Is that enough to enforce the limit?

**Answer:** No. The API must enforce the limit because callers can bypass the browser UI.

### 25. A client sends an extra <code>status: "published"</code> field to a create endpoint that should create drafts. What should the server do?

**Answer:** Ignore or reject unapproved fields and set status on the server according to the use case.

### 26. Why does a successful API response need a deliberate JSON contract?

**Answer:** The client needs stable, documented field names and nesting to render data; an intentional contract avoids coupling UI code to database internals.

### 27. A list UI remains blank while data loads. What state is missing?

**Answer:** A loading state that tells the user the request is in progress; an empty state should also be distinct from loading.

### 28. A request fails but the page shows an empty list. Why is that misleading?

**Answer:** It conflates an error with a successful empty response. Keep a distinct error state and display an actionable message.

### 29. The user navigates away while a request is pending. What can cleanup do?

**Answer:** Abort the fetch with an AbortController or prevent its result from updating state after unmount.

### 30. A search query for “ca” returns after a later query for “cat” and replaces it. What happened?

**Answer:** The older request finished later and its stale result overwrote the newer one. Cancel prior work or guard results by request identity.

### 31. What should a server return after a successful create operation?

**Answer:** Usually status 201 and a JSON representation of the created resource, including its stable identifier when the UI needs it.

### 32. Why should the API avoid returning every MongoDB document field by default?

**Answer:** Some fields may be private or internal, and exposing storage structure makes the public contract fragile.

### 33. The browser reports a network error and no HTTP status appears. What could be happening?

**Answer:** The request may not have reached the API due to a wrong URL, stopped server, DNS/TLS/connectivity problem, or browser CORS blocking access. Inspect Network details and server logs.

### 34. The Network panel shows a 404 from Express. What should you compare?

**Answer:** Compare the request method and full path with the registered route and mount prefix, then verify the client base URL.

### 35. The server returns HTML for an endpoint but the client expects JSON. What should you investigate?

**Answer:** Check whether the API URL accidentally points to the frontend fallback, whether the route exists, and whether a proxy routes the path to Express.

### 36. Why should the API module accept an AbortSignal when the component may need to cancel requests?

**Answer:** It forwards the component's cancellation intent to Fetch without exposing URL construction throughout the UI.

### 37. When should a simple Effect-based fetch be replaced with a data-fetching library or framework mechanism?

**Answer:** When the application needs capabilities such as caching, deduplication, preloading, invalidation, or coordinated loading beyond the simple example.

### 38. If a route handler does not send a response or pass control onward, what can the user observe?

**Answer:** The request may remain pending because the request-response cycle was not completed.

### 39. What should the Network panel help you distinguish during debugging?

**Answer:** The target URL, method, request headers and body, HTTP status, response body, and whether the failure occurred at CORS, routing, validation, or server execution.

### 40. Trace a successful course creation from the form to the database and back.

**Answer:** The form calls a feature API function, which sends JSON to Express. Middleware parses it, the route invokes a controller, the service validates and persists accepted fields, and the controller returns status 201 with JSON. The client parses the result and updates UI state.

## Chapter navigation

| Previous chapter | Chapter lesson | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [088 - Configure frontend and backend origins](../lessons/088-configure-frontend-and-backend-origins.md) | [Lesson](../lessons/089-connect-react-to-express-end-to-end.md) | [Example](../examples/089-connect-react-to-express-end-to-end.md) | [090 - Build a CRUD feature across UI, API, and database](../lessons/090-build-a-crud-feature-across-ui-api-and-database.md) |
