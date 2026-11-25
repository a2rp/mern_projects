# 042 - Separate routes, controllers, and services: Q&A

Use these questions to review the responsibilities and request flow in a modular Express application.

## Multiple choice

### 1. What is the primary job of a route module?
- A. Define HTTP methods, paths, middleware order, and handlers
- B. Open a database connection for every request
- C. Format database records for storage
- D. Start the Node.js process




**Answer: A.** A route module describes the HTTP surface and composes middleware and handlers for its endpoints.

### 2. What is a controller's usual responsibility?
- A. Adapt HTTP request data to application calls and choose the HTTP response
- B. Define every business rule in the system
- C. Own the database server process
- D. Parse JavaScript source files



**Answer: A.** The controller is the HTTP adapter: it takes request values, invokes application logic, and formats the response.

### 3. Where should a rule such as “product names must be unique” usually live?
- A. The route path string
- B. The application service
- C. The JSON response serializer only
- D. The server port configuration



**Answer: B.** Uniqueness is an application rule that should apply regardless of which transport calls the workflow.

### 4. What does a repository typically hide?
- A. How data is stored and retrieved
- B. How a browser renders a page
- C. Which URL path is public
- D. Which HTTP status code is 201



**Answer: A.** A repository provides application-oriented data operations while hiding details of the storage mechanism.

### 5. Which dependency direction is generally easiest to reason about?
- A. Repository imports controller, controller imports route, route imports app
- B. Routes depend on controllers, controllers on services, services on data-access abstractions
- C. Every module imports every other module
- D. Services depend on Express response objects and route files



**Answer: B.** A one-way direction avoids cycles and keeps HTTP details away from application rules and data access.

### 6. Why might the app entry point create and pass a repository to a service factory?
- A. To make dependencies explicit and replaceable
- B. To make the route path longer
- C. To hide the server port in the database
- D. To let the repository send HTTP responses



**Answer: A.** The application composition point wires concrete dependencies. Factories can receive substitutes without importing hidden global instances.

### 7. Which is a good reason to use Express Router?
- A. It creates modular, mountable route groups
- B. It automatically validates every body field
- C. It replaces all controllers and services
- D. It creates database indexes



**Answer: A.** Router instances group middleware and routes and can be mounted under a path prefix.

### 8. Which information should usually stay out of a service?
- A. Application rules
- B. A plain product identifier
- C. Express-specific req and res objects
- D. The result of a repository operation



**Answer: C.** Services should accept application values and return results or errors, keeping them independent of Express.

### 9. Where is a suitable place to check request-body field types and URL parameter format?
- A. HTTP validation middleware at the request boundary
- B. The TCP network stack
- C. The package manager lock file
- D. The database seed script only



**Answer: A.** HTTP-specific parsing and validation belong near the request boundary, before the controller calls application logic.

### 10. Why can a controller use res.locals for a normalized value set by validation middleware?
- A. It provides request-scoped data to later middleware and handlers
- B. It stores values permanently in MongoDB
- C. It changes the HTTP method
- D. It authenticates the request automatically



**Answer: A.** res.locals is scoped to the current request and can carry a validated value to the next handler.

### 11. What is a danger of importing a router into a service?
- A. It couples business logic to HTTP routing and can create dependency cycles
- B. It automatically makes the service faster
- C. It encrypts the service
- D. It prevents async functions



**Answer: A.** Services should not need knowledge of URL handlers. This dependency also makes cycles more likely.

### 12. In Express 5, what happens when an async route handler's returned promise rejects?
- A. Express forwards the rejection to error handling middleware
- B. Express converts it to a successful 200 response
- C. The error is silently discarded in all cases
- D. Express restarts the server



**Answer: A.** Express 5 automatically passes rejected promises from async handlers to the error flow when the promise is returned by the handler.

### 13. How many parameters identify Express error-handling middleware?
- A. Two
- B. Three
- C. Four
- D. Five



**Answer: C.** Its signature has four parameters: error, request, response, and next.

### 14. Where should the application's error handler usually be registered?
- A. Before the routes
- B. After routes and other middleware that may pass errors
- C. Inside package.json
- D. Before app is created



**Answer: B.** Error middleware is registered after the route and middleware stack so errors can reach it.

### 15. What should a custom error handler do when res.headersSent is true?
- A. Send a second JSON response
- B. Delegate the error with next(error)
- C. Reset the request body
- D. Call the route again



**Answer: B.** Once headers have been sent, the handler should delegate instead of attempting another response.

### 16. What does an application error such as PRODUCT_NOT_FOUND help with?
- A. It gives the application a recognizable failure that can be mapped to a safe HTTP response
- B. It stores a route path in the browser
- C. It bypasses all error handlers
- D. It replaces validation middleware



**Answer: A.** A typed or coded application error lets centralized error middleware map expected failures consistently.

### 17. Why should an unexpected error's raw message not be sent to a production client?
- A. It can reveal internal implementation details or sensitive data
- B. Clients cannot read strings
- C. Express rejects messages over 20 characters
- D. It changes the route method



**Answer: A.** Log useful diagnostic details in a controlled way and return a safe generic response.

### 18. What is a not-found middleware's job?
- A. Respond when no earlier route handled the request
- B. Convert all errors into database queries
- C. Start the server
- D. Set every response to 201



**Answer: A.** A fallthrough 404 handler covers requests that do not match an earlier endpoint.

### 19. What is dependency injection in the small factory example?
- A. Passing a dependency into a module when creating it
- B. Importing every module from the global scope
- C. Installing Express from npm
- D. Sending an HTTP request to the repository



**Answer: A.** The caller provides a dependency such as a repository to a factory rather than having the service create or globally import it.

### 20. Which statement about a layered folder layout is correct?
- A. Express requires folders named controllers, services, and repositories.
- B. Folder names are a convention; useful responsibilities matter more than exact names.
- C. Every function must have a separate folder.
- D. A repository must always exist even for a tiny application.



**Answer: B.** Express does not prescribe the architecture. Choose a structure that clarifies real responsibilities without needless layers.

## Short answers

### 21. Describe the normal request flow from router to data storage and back.

**Answer:** The router matches the method and path, middleware validates request input, the controller calls the service, the service applies application rules and calls a repository, and the controller formats the HTTP response.

### 22. Why should a service avoid accepting req and res?

**Answer:** Those are Express transport objects. Keeping them out lets application rules be reused and understood without coupling them to HTTP.

### 23. What makes a repository useful?

**Answer:** It centralizes meaningful data operations and hides storage details from application logic. It is useful when that boundary clarifies the code or allows storage behavior to change.

### 24. Why is the application entry point a good place to assemble dependencies?

**Answer:** It makes the concrete object graph visible in one place and keeps lower-level modules from importing each other unpredictably.

### 25. How is a route different from a controller?

**Answer:** The route declares the HTTP method, path, and middleware composition. The controller is the handler that interprets the request, invokes application logic, and sends a response.

### 26. Where should an HTTP 409 status decision usually be made?

**Answer:** The service can identify a domain conflict, such as a duplicate name, with an application error. The HTTP error middleware or controller maps that error to status 409.

### 27. What is a circular dependency?

**Answer:** Two or more modules import each other through a dependency chain. This can make initialization order unclear and indicates that responsibilities or dependency direction may need adjustment.

### 28. Why should the not-found handler be after the route modules?

**Answer:** It should run only after earlier routes have had a chance to handle the request. If placed first, it would end the request before the route can match.

### 29. What should an async controller do with work it awaits?

**Answer:** Return or await that work as part of the handler's promise so Express 5 can forward any rejection to error middleware.

### 30. Why can too many layers make an application worse?

**Answer:** Pass-through modules can add navigation and indirection without clarifying responsibilities. A layer is useful when it isolates a real concern, change, or reuse need.

## Application questions

### 31. A controller contains 80 lines of duplicate-name checks, data lookups, and response branches. What would you move, and where?

**Answer:** Move the duplicate-name rule and data workflow into a service, and move data retrieval and persistence operations into a repository when that boundary is useful. Leave HTTP status and response formatting in the controller or centralized error handler.

### 32. A service imports express and calls res.status(404).json(...). What architectural change would make it reusable?

**Answer:** Have the service return the found result or raise a coded application error. Let the controller and error middleware translate that outcome into an HTTP response.

### 33. A route needs a numeric ID validated before controller execution. How can the normalized ID reach the controller?

**Answer:** Use route middleware to validate and convert the parameter, place the result in request-scoped res.locals, then let the controller read the normalized value.

### 34. Two endpoints both create a product and must enforce the same unique-name rule. Where should that rule live?

**Answer:** In a shared application service so both endpoints follow the same rule. Route-level validation can still check the HTTP shape before the service is called.

### 35. You want to use an in-memory repository locally and a MongoDB repository later. How can the app structure help?

**Answer:** Define the service in terms of the repository operations it needs and pass a concrete repository when assembling the app. Then the app can provide the MongoDB-backed implementation without moving HTTP behavior into the service.

### 36. An async controller rejects, but the error handler never receives the error. What should you inspect?

**Answer:** Check that the handler is registered with Express 5 and that the promise is returned or awaited rather than detached. Also ensure the error middleware has four parameters and is mounted after routes.

### 37. The error middleware sends a response and then calls next(error). What can go wrong?

**Answer:** Express may attempt to process the same error after a response has already been sent, potentially causing a second response or connection failure. It should either send one response or delegate when headers are already sent.

### 38. An unknown API path returns an HTML error page, while known route errors return JSON. How could the app make the API behavior consistent?

**Answer:** Add a JSON not-found middleware after the API routes and before the error handler. Keep the centralized error middleware last to map thrown and rejected errors to the same response format.

### 39. A new file called generic-manager.js only forwards one call to a service without adding behavior or isolating a dependency. Should it be added?

**Answer:** Probably not. Add an abstraction when it clarifies a distinct responsibility or enables a meaningful change, rather than adding layers by default.

### 40. Describe how a POST request should be split across layers in this architecture.

**Answer:** The router declares POST and validation middleware. Middleware validates and normalizes HTTP input. The controller passes that value to a service and sends the chosen success status and representation. The service enforces application rules, and the repository performs the data operation. Errors flow to centralized error middleware.

## Chapter navigation

| Previous chapter | Lesson | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [041 - Parse path, query, and body inputs](../lessons/041-parse-path-query-and-body-inputs.md) | [Lesson](../lessons/042-separate-routes-controllers-and-services.md) | [Example](../examples/042-separate-routes-controllers-and-services.md) | [043 - Connect an Express app to MongoDB](../lessons/043-connect-an-express-app-to-mongodb.md) |
