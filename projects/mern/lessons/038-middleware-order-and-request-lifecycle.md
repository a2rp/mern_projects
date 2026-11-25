# 038 - Middleware order and request lifecycle

Express processes each HTTP request through an ordered stack of middleware and matching route handlers. Each handler can change the request or response, finish the response, pass control onward, skip to another route, or forward an error.

Understanding that order explains why a body parser must run before a route that reads the body, why a logger placed after a final route does not run, and why error handlers belong at the end.

## Learning goals

By the end of this chapter, you should be able to:

- Describe the path a request takes through an Express application.
- Register middleware in an order that supports later handlers.
- Distinguish normal continuation, route skipping, and error forwarding.
- Avoid hanging requests and duplicate response attempts.
- Place not-found and error-handling middleware correctly.
- Forward errors from promises and callback-based asynchronous work.

## The request-response lifecycle

A simplified request travels through these stages:

1. Node accepts the HTTP connection and creates request and response objects.
2. Express checks registered middleware and routes in the order they were added.
3. Matching middleware can inspect or change the request, attach context, or send a response.
4. A handler either ends the response or tells Express how to continue.
5. Express sends an error to the next error-handling middleware when an error is forwarded.
6. The response finishes, and the request lifecycle ends.

A middleware function usually receives req, res, and next. An error-handling middleware function receives err, req, res, and next.

~~~javascript
function requestLogger(req, res, next) {
  console.log(req.method, req.originalUrl);
  next();
}
~~~

This logger records method and URL, then passes the request onward. If it omitted next() and did not send a response, the request would remain pending.

## Registration order matters

Express executes middleware in the order it is registered. A middleware that runs only after the response has ended cannot affect that response.

~~~javascript
app.use(requestLogger);
app.use(express.json());
app.use("/api", apiRouter);
app.use(notFound);
app.use(errorHandler);
~~~

This order gives the logger a chance to see requests, parses JSON before API routes read req.body, routes API requests, produces a not-found response for requests that fall through, and leaves the final error handler available for errors.

This is only a common layout. An application may have other middleware for configuration, security headers, cookies, sessions, CORS, static files, or authentication. Put each one where its input and output requirements are satisfied.

### Middleware before the route that needs it

If a route reads req.body, register the relevant body parser first:

~~~javascript
app.use(express.json());

app.post("/api/v1/messages", (req, res) => {
  res.status(201).json({
    received: req.body
  });
});
~~~

If the route is registered before the parser, the route may run before req.body has been populated.

Middleware can add information that later handlers use:

~~~javascript
app.use((req, res, next) => {
  req.receivedAt = new Date();
  next();
});

app.get("/api/v1/time", (req, res) => {
  res.json({
    receivedAt: req.receivedAt
  });
});
~~~

When using TypeScript, extend the Express request type before adding a custom property. Keep shared request context small, documented, and safe to pass to later handlers.

### A response ends the normal path

Once a handler sends or ends a response, later normal middleware does not run for that request:

~~~javascript
app.get("/", (req, res) => {
  res.send("Done");
});

app.use((req, res, next) => {
  console.log("This does not run for the completed root route.");
  next();
});
~~~

Put middleware that must see the request before routes that can finish it. A handler must not send a second response after another handler has already completed the request.

## How middleware passes control

### next()

Calling next() tells Express that the current handler is done and the next matching handler should run. The current handler should not later try to send a competing response.

~~~javascript
app.use((req, res, next) => {
  req.requestStartedAt = Date.now();
  next();
});
~~~

### Finish the response

A handler that sends the complete response does not need to call next():

~~~javascript
app.get("/status", (req, res) => {
  res.status(200).json({
    status: "ok"
  });
});
~~~

Calling next() after finishing a response can cause later handlers to attempt another response and trigger a headers-already-sent error.

### next(err)

Passing an error to next() skips ordinary middleware and route handlers until Express reaches an error-handling middleware:

~~~javascript
app.use((req, res, next) => {
  const error = new Error("Request could not be completed.");
  next(error);
});
~~~

An error handler has four parameters, in this order:

~~~javascript
function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  console.error("Request failed:", err.message);

  return res.status(500).json({
    error: "Internal server error."
  });
}
~~~

The four-argument signature identifies error-handling middleware. Include next even if the handler only uses it to delegate an error after headers have been sent. Do not send stack traces, credentials, or private database details to clients.

### next("route")

Inside route-specific middleware registered with an HTTP method, next("route") skips the remaining handlers for the current route and lets Express try the next matching route:

~~~javascript
app.get(
  "/reports/:reportId",
  (req, res, next) => {
    if (req.params.reportId === "preview") {
      return next("route");
    }

    return next();
  },
  (req, res) => {
    res.send("Regular report");
  }
);

app.get("/reports/:reportId", (req, res) => {
  res.send("Preview report");
});
~~~

Use this for deliberate route selection. It is not the same as next(err), and next("route") applies to route handlers rather than arbitrary application-level middleware.

### next("router")

When working inside an Express Router, next("router") exits the current router and passes control back to the application. Use it only when that router-level behavior is intentional.

## Route fallthrough and 404 handling

A normal route or middleware can call next() when it cannot handle the request. If no later route responds, the request reaches the application's not-found handler.

~~~javascript
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found."
  });
});
~~~

Register the not-found handler after all routes. It is ordinary middleware, not error-handling middleware. A 404 means that no route produced a response; it does not mean an exception occurred.

The not-found handler should not call next() after sending its response.

## Error flow

Errors can enter the error flow in several ways:

- Synchronous code inside a route or middleware throws.
- A handler explicitly calls next(err).
- In Express 5, a returned promise rejects or an async handler throws; Express forwards that failure to error handling.
- A callback-based API reports an error, and the callback explicitly calls next(err).

Express 5 example:

~~~javascript
app.get("/api/v1/profile", async (req, res) => {
  const profile = await loadProfile(req.user.id);

  res.json(profile);
});
~~~

If loadProfile rejects, Express 5 forwards the error. The error handler should still decide which safe public response to send.

Callback-based asynchronous work must forward its error:

~~~javascript
app.get("/api/v1/file", (req, res, next) => {
  readFileFromCallback((error, contents) => {
    if (error) {
      return next(error);
    }

    return res.type("text/plain").send(contents);
  });
});
~~~

Errors thrown later from an unrelated timer callback are outside the original synchronous handler call. Catch them in that callback and pass them to next(err), or use a promise-based operation whose rejection is returned to Express.

Register the application error handler after routes and not-found middleware:

~~~javascript
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const status =
    Number.isInteger(err.status) && err.status >= 400 && err.status <= 599
      ? err.status
      : 500;

  return res.status(status).json({
    error: status === 500 ? "Internal server error." : err.message
  });
});
~~~

In a real API, map known error types to stable public messages and log diagnostics safely. Do not blindly expose err.message for arbitrary internal errors. Centralized error response design is covered in a later chapter.

## Common ordering patterns

- Request metadata or safe logging runs early so later failures can still be correlated.
- Body parsers run before handlers that read parsed bodies.
- Authentication runs before protected routes.
- Routers are mounted before the not-found handler.
- The not-found handler runs after routes.
- Error handlers run after ordinary middleware and routes.
- Static file middleware should be placed with awareness of which routes it can shadow.
- Response compression and security middleware should follow their documented configuration and ordering needs.

Middleware is not automatically safe because it is reusable. Review what it reads, what it changes, whether it calls next(), whether it can send a response, and what errors it may create.

## Common mistakes

- Registering a body parser after the routes that need it.
- Putting request logging after a route that sends the response.
- Forgetting to call next() in middleware that does not end the response.
- Calling next() after sending a response.
- Calling next(err) and then also trying to send a second response.
- Writing error middleware with only three parameters.
- Registering the not-found handler before the routes.
- Expecting ordinary middleware to receive errors forwarded with next(err).
- Assuming Express 4 and Express 5 handle rejected route promises identically.
- Throwing inside a timer or callback and assuming Express will catch it automatically.
- Logging full request bodies, access tokens, or other sensitive values during debugging.

## Practical checklist

For every middleware function, ask:

- Does it apply to all requests or only a specific mount path?
- Must it run before a parser, router, or route?
- Does it change req or res in a way later code depends on?
- Does it end the response, call next(), skip a route, or forward an error?
- Can every code path finish or continue?
- Can it be called twice or attempt to send after the response ended?
- Does it expose sensitive information in logs or error responses?

## Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [037 - Create an Express app and server](037-create-an-express-app-and-server.md) | [Q&A](../qnas/038-middleware-order-and-request-lifecycle.md) | [Example](../examples/038-middleware-order-and-request-lifecycle.md) | [039 - Routes, route parameters, and routers](039-routes-route-parameters-and-routers.md) |
