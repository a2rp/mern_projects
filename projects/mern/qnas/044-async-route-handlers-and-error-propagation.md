# 044 - Async route handlers and error propagation: Q&A

These questions review how Express receives synchronous errors, returned promise rejections, callback errors, and middleware continuation signals.

## Multiple choice

### 1. What happens when a route handler throws synchronously while Express is running it?

- A. Express passes the error into its error flow.
- B. Express retries the route automatically.
- C. Express converts the error into a 204 response.
- D. The request always remains open forever.

**Answer: A.** Synchronous errors thrown while Express is invoking a handler are forwarded to error handling.

### 2. In Express 5, what happens when a returned async route-handler promise rejects?

- A. Express automatically forwards the rejection to error middleware.
- B. Express ignores it.
- C. Express treats it as a route match.
- D. Express automatically retries the database query.

**Answer: A.** Express 5 forwards a thrown error or rejected returned promise to the error flow.

### 3. What should an Express 5 async handler do with work it needs before sending the response?

- A. Start it without keeping a reference to the promise.
- B. Await it or return the promise as part of the handler.
- C. Put it in a setTimeout callback.
- D. Call next() before starting it.

**Answer: B.** Keeping work in the handler's returned promise allows Express to observe a rejection.

### 4. Why is this handler unsafe: it starts a promise with then(), but does not return it?

- A. Express may finish the handler before the promise settles and cannot observe a later rejection.
- B. Express forbids then().
- C. It changes the HTTP method.
- D. It forces a 404 response.

**Answer: A.** A detached promise is no longer part of the route handler's returned work.

### 5. How can a promise chain communicate a rejection to Express 5?

- A. Return the promise chain from the handler.
- B. Store the promise in a global variable.
- C. Write the rejection into req.query.
- D. Send a second response.

**Answer: A.** Express can observe a returned promise and forward its rejection.

### 6. Do Express 5 automatically catch an error-first Node callback's error argument?

- A. Yes, all callbacks are automatically converted to promises.
- B. No, the callback must pass the error to next(error), or be wrapped appropriately.
- C. Only if the callback is named error.
- D. Only after a response has been sent.

**Answer: B.** Callback errors are not promise rejections unless wrapped; explicitly pass the error to Express.

### 7. Why does a throw inside a setTimeout callback need special handling?

- A. It runs after the route's synchronous stack has returned.
- B. Timers cannot throw errors.
- C. It always becomes an HTTP 302.
- D. Express disables timers.

**Answer: A.** A later timer callback is outside the synchronous handler call. Catch its error and pass it to Express, or use a promise-based flow.

### 8. What does next(error) mean to Express?

- A. Continue through ordinary middleware.
- B. Enter the error flow and skip ordinary route handlers.
- C. Retry the current route.
- D. Clear the response headers.

**Answer: B.** Passing an error to next routes control to error-handling middleware.

### 9. What does next() normally mean in middleware that has not sent a response?

- A. Continue to the next middleware or handler.
- B. Send a 500 response.
- C. Close MongoDB.
- D. Skip every route.

**Answer: A.** next() passes normal control onward; middleware must otherwise end the response.

### 10. What is the special meaning of next("route") in a route callback?

- A. Treat the string as an application error.
- B. Skip the remaining callbacks for the current route and try another matching route.
- C. End the response with status 500.
- D. Restart the Express app.

**Answer: B.** next("route") is a routing control signal, not an error.

### 11. How many parameters identify Express error-handling middleware?

- A. Two
- B. Three
- C. Four
- D. Five

**Answer: C.** Error middleware uses four parameters in order: error, req, res, and next.

### 12. Where should application error middleware generally be registered?

- A. Before all routes
- B. After routes and other ordinary middleware
- C. Inside every database model
- D. Before the Express app is created

**Answer: B.** It must be downstream of middleware and routes that may pass errors to it.

### 13. What should an error handler do when res.headersSent is true?

- A. Send another response body.
- B. Delegate with next(error).
- C. Call the controller again.
- D. Clear the sent headers and restart the response.

**Answer: B.** A second response cannot safely be sent after headers have gone out; delegate to Express's default handler.

### 14. Why should a middleware return after calling next(error)?

- A. To prevent later code in the same function from sending a success response too.
- B. To make the error disappear.
- C. To run the middleware twice.
- D. To make next() synchronous.

**Answer: A.** Returning stops the current branch and avoids double handling.

### 15. What can happen if a handler sends a response and then calls next()?

- A. Another route can run after the response started, causing duplicate handling.
- B. The response becomes automatically encrypted.
- C. The request gets a second URL.
- D. Nothing can happen because Express blocks next().

**Answer: A.** Sending and continuing the same request can produce a second response or headers-already-sent error.

### 16. Should every Express 5 async handler wrap all of its work in try/catch only to call next(error)?

- A. Usually no; Express 5 forwards thrown and rejected errors from returned async handlers.
- B. Yes, Express 5 does not support promises.
- C. Yes, but only for synchronous code.
- D. No, errors should be ignored.

**Answer: A.** A catch is useful when transforming or cleaning up, but is unnecessary if it only forwards the error.

### 17. What is different about Express 4 and Express 5 async error propagation?

- A. Express 4 automatically forwards all promise rejections; Express 5 does not.
- B. Express 5 automatically forwards rejected returned promises; Express 4 generally needs explicit forwarding or a wrapper.
- C. Neither version supports error middleware.
- D. Express 4 and 5 treat rejected promises identically.

**Answer: B.** Automatic forwarding of returned promise rejections is an Express 5 behavior.

### 18. What does next(error) skip?

- A. Remaining ordinary handlers in the current middleware flow
- B. All error middleware
- C. The Node.js event loop
- D. The response status

**Answer: A.** Express looks for error handlers and skips non-error handlers while an error is active.

### 19. If a callback-based filesystem function reports an error, what should the callback usually do?

- A. Call next(error) and return.
- B. Send the file anyway.
- C. Call next() and then throw later.
- D. Ignore the error and keep the request open.

**Answer: A.** Forwarding the error and returning prevents the callback from also taking a success path.

### 20. Why can a promise wrapper help with a callback API?

- A. It converts the callback's completion and error into a promise that can be returned or awaited.
- B. It changes the URL path.
- C. It prevents all I/O errors.
- D. It removes the need for an error policy.

**Answer: A.** A properly constructed promise can make callback work part of an async handler's returned promise.

## Short answers

### 21. What does Express 5 do when an async route handler throws after an await?

**Answer:** The async function's promise rejects, and Express 5 forwards the rejection to the error flow if the handler returned that promise to Express.

### 22. What is a detached promise?

**Answer:** It is asynchronous work started by a handler but neither returned nor awaited. Express cannot observe its later rejection through the handler's promise.

### 23. What is the difference between next() and next(error)?

**Answer:** next() continues normal middleware flow. next(error) enters error handling and skips ordinary handlers.

### 24. Why should callback errors be explicitly forwarded?

**Answer:** A callback error is passed as a value to the callback and is not automatically a thrown exception or promise rejection. The callback must send it to Express or be wrapped in a promise.

### 25. Why should middleware call next() if it neither responds nor ends the request?

**Answer:** Otherwise the request remains unresolved and the client waits because no later middleware or route gets control.

### 26. What does next("route") do?

**Answer:** It skips the remaining callbacks for the current matching route and lets Express continue searching for another matching route.

### 27. Why must an error handler have four parameters even if it does not use next?

**Answer:** Express identifies error-handling middleware by its four-argument signature. Omitting the fourth argument makes it look like ordinary middleware.

### 28. When is a try/catch useful inside an async handler?

**Answer:** When it transforms a lower-level error, performs cleanup, or handles a specific expected failure locally. If it only calls next(error), Express 5 usually handles the rejection automatically.

### 29. What should happen when an error occurs after response headers are sent?

**Answer:** The error handler should delegate with next(error) rather than attempt another response.

### 30. Why should a branch return after sending a response?

**Answer:** Returning prevents the function from continuing into code that may call next() or send another response.

## Application questions

### 31. A database service rejects inside an async Express 5 controller, but the controller awaits it and sends no local response. Where does the error go?

**Answer:** The async handler's returned promise rejects, so Express 5 passes the error to the error-handling middleware.

### 32. A route calls service.list().then(...), but does not return the promise. The service later rejects. What should be fixed?

**Answer:** Make the handler async and await the service call, or return the promise chain. This makes the asynchronous operation observable to Express 5.

### 33. A filesystem callback receives an error, calls next(error), then continues to res.send(contents). What is wrong?

**Answer:** The callback continues after forwarding the error and may attempt a second response. Return immediately after next(error).

### 34. A timer callback throws after the HTTP handler returned. How can that error enter Express?

**Answer:** Catch the error inside the timer callback and call next(error), provided the request is still active. Prefer a returned or awaited promise-based operation when practical.

### 35. An error handler is declared as function(error, req, res). Express treats it as ordinary middleware. Why?

**Answer:** Error-handling middleware must have four parameters. Add next as the fourth parameter, even if the function only uses it when headers are already sent.

### 36. An endpoint sends JSON and then invokes next(). What is the safe correction?

**Answer:** End the handler after sending the response, typically by returning the response call. Do not pass control to another handler for the same completed request.

### 37. An Express 5 route uses a custom async wrapper whose catch calls next(error), while Express also catches the returned rejection. What risk does this create?

**Answer:** The same error may be forwarded twice, producing duplicate error handling or an error after headers have been sent. Remove the redundant wrapper or make its behavior compatible with the handler's return value.

### 38. A legacy callback API has no error-first callback but returns a handle that emits an error event. What should the route author do?

**Answer:** Follow that API's documented error mechanism, attach a listener or wrap it in a promise where appropriate, and explicitly pass failures to Express while the request is active.

### 39. A catch block logs an error and returns an empty success response. Why is this incorrect?

**Answer:** It hides a failed operation as success. Either handle a known expected failure deliberately or forward/rethrow the error so the error flow can produce an appropriate response.

### 40. Outline a safe flow for an async route that reads a record, returns 404 if absent, and otherwise sends JSON.

**Answer:** Await the service or repository call in an async handler. If the item is absent, throw or pass a known not-found error. Otherwise send one JSON response and return. Express 5 forwards any rejected handler promise to the error middleware.

## Chapter navigation

| Previous chapter | Lesson | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [043 - Connect an Express app to MongoDB](../lessons/043-connect-an-express-app-to-mongodb.md) | [Lesson](../lessons/044-async-route-handlers-and-error-propagation.md) | [Example](../examples/044-async-route-handlers-and-error-propagation.md) | [045 - Centralized API errors and not-found handling](../lessons/045-centralized-api-errors-and-not-found-handling.md) |
