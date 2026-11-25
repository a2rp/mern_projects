# 044 - Async route handlers and error propagation

Express handlers often call asynchronous work: a service, a database, a file system API, or another network service. When that work fails, the error must reach Express so the request can receive an error response instead of hanging or creating an unhandled rejection.

In Express 5, a rejected promise returned by a route handler or middleware automatically enters the error flow. Other asynchronous APIs, especially callback APIs and detached work, still need explicit error forwarding.

## Learning goals

By the end of this chapter, you should be able to:

- Explain how Express handles synchronous throws and returned promise rejections.
- Write async route handlers whose failures reach Express 5 error middleware.
- Recognize when a promise is detached and no longer tracked by Express.
- Forward callback-based and timer errors explicitly.
- Distinguish next(), next(error), and next("route").
- Avoid sending multiple responses or forwarding the same failure twice.

## The request flow

A normal middleware can either finish the response or pass control to the next middleware with next(). Error propagation changes the path: next(error) skips ordinary middleware and routes, and Express looks for error-handling middleware.

~~~text
route handler or middleware
    -> succeeds and sends response
    -> succeeds and calls next()
    -> fails and passes error to Express
          -> error-handling middleware
          -> Express default error handler if no custom handler handles it
~~~

The error handler is part of the Express middleware stack. A thrown or rejected error is useful only if Express can observe it.

## Synchronous errors

Express catches an error thrown synchronously while a route handler or middleware is running:

~~~js
app.get("/broken", (req, res) => {
  throw new Error("The handler failed.");
});
~~~

Express passes the error to error middleware. You do not need a try/catch around every line of synchronous route code solely to call next(error).

## Express 5 async handlers

An async function returns a promise. In Express 5, if that promise rejects because an awaited operation throws, Express automatically forwards the error:

~~~js
app.get("/products/:productId", async (req, res) => {
  const product = await productService.getById(req.params.productId);
  return res.json({ data: product });
});
~~~

If getById rejects, Express sends the rejection into the error flow. The same applies when an async middleware returns a rejected promise.

Keep asynchronous work inside the handler's returned promise. Do not start a promise and forget to return or await it:

~~~js
app.get("/products", (req, res) => {
  productService.list().then((products) => {
    res.json({ data: products });
  });
});
~~~

In this version, the handler returns before the promise settles. Express cannot observe a later rejection. Either use an async handler and await the operation, or return the promise chain:

~~~js
app.get("/products", (req, res) => {
  return productService.list().then((products) => {
    return res.json({ data: products });
  });
});
~~~

Prefer async/await when it makes the control flow clearer.

## Express 4 compatibility

Express 4 does not automatically forward rejected promises from async handlers. If maintaining an Express 4 app, explicitly catch and pass errors to next(error), or use a well-understood async-handler wrapper.

Do not add an Express 4 wrapper to Express 5 handlers without understanding what it does. Passing the same rejection to next twice can result in duplicate error handling.

## Callback-based APIs

A callback error is not automatically a rejected promise. For an error-first callback, explicitly pass its error to next:

~~~js
const fs = require("node:fs");

app.get("/read-note", (req, res, next) => {
  fs.readFile("note.txt", "utf8", (error, contents) => {
    if (error) {
      return next(error);
    }

    return res.type("text").send(contents);
  });
});
~~~

Always stop the callback branch after forwarding the error. Do not send a success response after next(error).

If a callback API has no error-first convention, read its API carefully and create a promise wrapper if appropriate. Do not assume Express can catch an error that occurs later in a callback merely because the callback was started inside a route.

## Timers and detached asynchronous work

A timer callback runs after the current route handler has returned. A throw inside that callback is outside the route's synchronous call stack:

~~~js
app.get("/timer-error", (req, res, next) => {
  setTimeout(() => {
    try {
      throw new Error("The timer failed.");
    } catch (error) {
      next(error);
    }
  }, 10);
});
~~~

More often, use a promise-based API and return or await its promise. If work must continue after the HTTP response has finished, it is background work and needs its own error handling and observability. Do not try to call next(error) after the request has already ended.

## Middleware continuation rules

A middleware function must do one of three things:

1. Send a response and end the request.
2. Call next() to continue normally.
3. Call next(error) to enter the error flow.

Do not both send a response and call next() for the same request. That can cause a second route to run after a response is already in progress.

The special call next("route") skips the remaining callbacks for the current route and tries the next matching route. It is a routing control signal, not an error. Other values passed to next(), except the documented routing signals, are treated as errors.

Return after calling next() or sending a response when code could otherwise continue:

~~~js
if (!req.user) {
  return next(new Error("Authentication context is missing."));
}

return res.json({ user: req.user });
~~~

This avoids accidental fallthrough and double handling.

## Error-handling middleware

Error middleware has four parameters in this order:

~~~js
app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  return res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred."
    }
  });
});
~~~

The four-argument signature identifies the function as error middleware. It should be registered after routes and ordinary middleware. If headers were already sent, delegate to Express with next(error); do not try to send another response.

The next chapter covers a fuller centralized error strategy, including application error classes, not-found handling, and consistent client responses. Here the key point is that errors must first reach this boundary.

## Catch, transform, or forward?

A try/catch is useful when it adds meaning:

- Add context to an error while preserving its cause.
- Clean up a resource that the current function owns.
- Translate a lower-level error into a known application error.
- Handle a specific expected failure locally.

If the handler only catches an error to call next(error), an async Express 5 handler usually needs no extra try/catch:

~~~js
app.get("/products", async (req, res) => {
  const products = await productService.list();
  return res.json({ data: products });
});
~~~

Avoid catching an error, logging it, and then returning success. Also avoid logging the same error at every layer; choose a responsible logging boundary so one failure does not produce duplicate noisy records.

## Common mistakes

- Assuming Express 5 catches errors from every asynchronous API, including detached callbacks.
- Starting a promise without returning or awaiting it.
- Throwing inside a timer callback and expecting Express to catch it.
- Forgetting next(error) in an error-first callback.
- Calling next(error) and then sending a response.
- Calling next() twice from one middleware.
- Sending a response and then continuing into another handler.
- Writing error middleware with only three parameters.
- Registering error middleware before routes.
- Sending another response after res.headersSent is true.
- Wrapping Express 5 async handlers in code that can forward the same error twice.
- Treating next("route") as an error signal.

## Practical checklist

For each route or middleware that starts asynchronous work, ask:

- Does the handler return a promise or await the asynchronous operation?
- Will a rejection reach Express 5 automatically?
- Is this callback-based or detached work that needs explicit forwarding?
- After next(error), does this code stop?
- Does every successful path send a response or call next()?
- Could any branch send twice or call next twice?
- Does the error handler have four parameters and appear after routes?
- Does it delegate when res.headersSent is true?
- Are errors logged once at an appropriate boundary?
- Is response policy centralized in the next chapter's error handling layer?

## Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [043 - Connect an Express app to MongoDB](043-connect-an-express-app-to-mongodb.md) | [Q&A](../qnas/044-async-route-handlers-and-error-propagation.md) | [Example](../examples/044-async-route-handlers-and-error-propagation.md) | [045 - Centralized API errors and not-found handling](045-centralized-api-errors-and-not-found-handling.md) |
