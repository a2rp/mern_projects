# Chapter 038 Q&A: Middleware order and request lifecycle

Review the Express request path, middleware registration order, response completion, route skipping, error forwarding, and not-found handling.

## Part 1: Multiple-choice questions

### 1. What is Express middleware?

- **A.** A function in the request-processing stack that can inspect or change the request or response, continue, end the response, or forward an error.
- **B.** A MongoDB collection that stores route definitions.
- **C.** A browser-only JavaScript callback.
- **D.** A package-lock entry.

**Answer: A.** Middleware participates in Express's request-response cycle.

### 2. What is the usual order in which Express runs registered middleware?

- **A.** In the order the middleware and routes were registered, subject to matching paths and methods.
- **B.** Alphabetically by function name.
- **C.** From the last registration to the first.
- **D.** Randomly for each request.

**Answer: A.** Registration order is significant. Only matching layers participate in the path.

### 3. Where should express.json() be registered if a route reads req.body?

- **A.** Before that route.
- **B.** After the response has been sent.
- **C.** Only inside the package lock file.
- **D.** After every error handler.

**Answer: A.** The parser must run before the route so it can parse the body first.

### 4. What should middleware do if it does not send or end a response?

- **A.** Call next() or otherwise deliberately pass control onward.
- **B.** Do nothing and wait for the browser to continue.
- **C.** Call app.listen() again.
- **D.** Delete the response object.

**Answer: A.** Without a response or continuation, the request may hang.

### 5. What does next() normally do?

- **A.** Passes control to the next matching middleware or route handler.
- **B.** Sends a 404 response automatically.
- **C.** Starts a MongoDB transaction.
- **D.** Closes the Node process.

**Answer: A.** next() marks the current handler as finished and continues the normal flow.

### 6. What does next(err) do?

- **A.** Skips ordinary handlers and forwards the error to error-handling middleware.
- **B.** Continues to the next ordinary handler with the error as req.body.
- **C.** Sends a successful 200 response.
- **D.** Clears the current request.

**Answer: A.** Passing an error enters Express's error flow.

### 7. What is the signature of Express error-handling middleware?

- **A.** (err, req, res, next)
- **B.** (req, res)
- **C.** (req, next)
- **D.** (res, err, req)

**Answer: A.** Error-handling middleware has four parameters in this order.

### 8. Why must error-handling middleware include four parameters even if it does not use next?

- **A.** Express identifies error handlers by their four-argument signature.
- **B.** The fourth argument starts the HTTP server.
- **C.** It converts the handler into a router.
- **D.** It parses JSON.

**Answer: A.** Omitting the fourth parameter can make Express treat the function as ordinary middleware.

### 9. Where should a final not-found handler usually be registered?

- **A.** After the routes that might handle the request.
- **B.** Before every route.
- **C.** In package.json.
- **D.** Before the app is created.

**Answer: A.** The handler should respond only after routes have had a chance to match and finish the request.

### 10. Is a not-found handler the same as an error-handling middleware?

- **A.** No. A 404 handler is ordinary middleware for requests that fall through without a route response.
- **B.** Yes. Both always receive four arguments.
- **C.** Yes. Both only run for database errors.
- **D.** No. A 404 handler can only run before routes.

**Answer: A.** Not-found handling is a normal response path; errors are forwarded to error middleware.

### 11. What happens when a route sends a response and returns without calling next()?

- **A.** The normal request-response cycle ends for that request.
- **B.** Express always calls the next route anyway.
- **C.** The response is automatically deleted.
- **D.** The request becomes a database transaction.

**Answer: A.** A completed response does not continue to later normal middleware.

### 12. Why can calling next() after sending a response be a bug?

- **A.** A later handler may try to write a second response.
- **B.** It makes the response safe by default.
- **C.** It changes the HTTP method to GET.
- **D.** It reorders the middleware stack.

**Answer: A.** A response should have one clear owner; writing after it has ended can trigger a headers-already-sent error.

### 13. What does next("route") do in route-specific middleware?

- **A.** Skips the remaining callbacks for the current route and tries another matching route.
- **B.** Sends the error to every error handler.
- **C.** Exits the Node.js process.
- **D.** Calls the next application-level middleware regardless of route matching.

**Answer: A.** It is a route-selection control available in method-specific route callbacks.

### 14. Where is next("router") intended to be used?

- **A.** Inside router-level middleware to exit that router and return control to the app.
- **B.** In any error handler to send JSON.
- **C.** In package.json scripts.
- **D.** In the browser's fetch callback.

**Answer: A.** It skips out of the current Express Router when that router-level behavior is intentional.

### 15. How are rejected promises from returned async middleware handled in Express 5?

- **A.** Express forwards the rejection to error handling.
- **B.** They are always silently ignored.
- **C.** Express converts them to a 200 response.
- **D.** They restart the app automatically.

**Answer: A.** Express 5 forwards thrown errors and rejected promises from returned async handlers.

### 16. How should a callback-based API report an error to Express?

- **A.** Call next(err) from its callback.
- **B.** Throw from an unrelated future callback and assume Express catches it.
- **C.** Return the error as a 200 JSON response.
- **D.** Register another body parser.

**Answer: A.** Callback errors are outside the original synchronous call unless explicitly passed to Express.

### 17. What does the res.headersSent check help an error handler decide?

- **A.** Whether a response has already begun, in which case the handler should delegate instead of starting a second response.
- **B.** Whether the database password is valid.
- **C.** Whether a route parameter exists.
- **D.** Whether the request is a GET.

**Answer: A.** Once headers or a response have been sent, a new error body cannot safely replace them.

### 18. If ordinary middleware is registered after a route that ends every matching response, what happens to it for those requests?

- **A.** It is not reached.
- **B.** It always runs first.
- **C.** It becomes an error handler.
- **D.** It runs only after the process exits.

**Answer: A.** The route ended the response before the later middleware was reached.

### 19. What is true about errors thrown inside an unrelated timer callback?

- **A.** They are not automatically part of the original Express handler call; catch and forward them explicitly.
- **B.** Express always catches them as synchronous route errors.
- **C.** They always produce a 404.
- **D.** They are converted to req.params.

**Answer: A.** Express handles errors it receives through the request handler's returned promise or explicit error forwarding.

### 20. What should an API avoid sending in an error response?

- **A.** Stack traces, secrets, and sensitive internal details.
- **B.** A safe status code.
- **C.** A documented public message.
- **D.** A stable client-facing error code.

**Answer: A.** Keep detailed diagnostics in protected server-side logs, and return a safe public error.

## Part 2: Short-answer questions

### 21. Describe the basic request path through an Express app.

**Answer:** Node accepts the connection, Express checks registered matching middleware and routes in order, handlers modify data or continue, a route or middleware sends a response or forwards an error, and the response ends the cycle.

### 22. Why does middleware order matter?

**Answer:** Later handlers depend on work performed by earlier middleware, and a route may finish the response before later middleware can run. Parsers, authentication, routers, not-found handlers, and error handlers must be ordered to match those dependencies.

### 23. What is the difference between next() and next(err)?

**Answer:** next() continues normal matching middleware or route handling. next(err) skips normal handlers and enters the error-handling path.

### 24. Why should a middleware function not call both res.json() and next() in the ordinary case?

**Answer:** Sending the response ends its normal path. Continuing can let a later handler attempt a second write, causing a headers-already-sent error or other incorrect behavior.

### 25. When is next("route") useful?

**Answer:** It is useful in route-specific middleware when a condition means the current route's remaining callbacks should be skipped so another matching route can handle the request.

### 26. What is the difference between 404 handling and error handling?

**Answer:** A 404 handler responds when no route has completed the request. Error middleware responds to an error explicitly thrown, rejected, or passed to next(err).

### 27. What does Express 5 do with a rejection from a returned async route handler?

**Answer:** It forwards the rejection to Express error handling, so a centralized error handler can produce the response.

### 28. Why must callback-based errors be passed to next(err)?

**Answer:** A callback may run after the original handler call has returned, so its error is not automatically part of that handler's synchronous or returned-promise flow. Calling next(err) connects it to Express's error pipeline.

### 29. What should an error handler do if res.headersSent is already true?

**Answer:** It should pass the error to the next error handler, commonly with next(err), instead of trying to start another response.

### 30. Why should request logging avoid recording full bodies and credentials?

**Answer:** Request bodies can contain personal data, passwords, access tokens, and secrets. Logs are often stored and shared separately, creating another exposure path.

## Part 3: Practical scenarios

### 31. A JSON route sees req.body as undefined. The app registers express.json() after the router. What is the fix?

**Answer:** Register express.json() before the router or route that reads req.body so the parser runs first.

### 32. A logger is placed after a root route that always sends a response, and it never logs requests to /. Why?

**Answer:** The root route ends the response before the logger is reached. Move the logger earlier if it must observe those requests.

### 33. Middleware validates a request and then calls neither next() nor a response method. The client waits forever. What is missing?

**Answer:** On the valid path, call next() or send a response. Every path through middleware must either finish or continue.

### 34. A handler calls res.json() and then next(). A later handler also sends JSON. What should change?

**Answer:** Choose one handler to own the response. Once res.json() ends the response, do not call next() into another normal response handler.

### 35. A developer writes an error handler as (err, req, res). Why might Express not use it as an error handler?

**Answer:** Error-handling middleware is identified by its four-argument signature. Add the next parameter even if the handler does not otherwise use it.

### 36. A request to an unknown URL returns Express's default response instead of the API's JSON 404. What should be added?

**Answer:** Add a normal not-found middleware after all routes that sends the documented JSON 404 response.

### 37. An async Express 5 handler awaits a database call that rejects. Does it need a try/catch only to call next(err)?

**Answer:** No, not in Express 5 when the async handler's promise is returned by the handler. Express forwards the rejection. A try/catch may still be used when the handler needs to translate or recover from a specific error.

### 38. A route calls a callback-based file API, and the callback receives an error. How should it reach the app's error handler?

**Answer:** Call next(err) from the callback. Do not throw the error later and assume Express can associate it with the request.

### 39. An error handler starts writing JSON, but headersSent is already true because a stream began. What should happen?

**Answer:** Delegate with next(err) so Express's remaining error handling can close or otherwise handle the failed response. Do not attempt to send a second status or body.

### 40. A middleware calls next(err), then its code continues and also sends a response. What is wrong?

**Answer:** The error has already been handed to Express. The middleware should return after forwarding it and must not compete with the error handler by sending another response.

## Chapter navigation

| Previous chapter | Chapter lesson | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [037 - Create an Express app and server](../lessons/037-create-an-express-app-and-server.md) | [Lesson](../lessons/038-middleware-order-and-request-lifecycle.md) | [Example](../examples/038-middleware-order-and-request-lifecycle.md) | [039 - Routes, route parameters, and routers](../lessons/039-routes-route-parameters-and-routers.md) |
