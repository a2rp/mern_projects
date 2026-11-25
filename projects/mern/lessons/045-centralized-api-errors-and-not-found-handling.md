# 045 - Centralized API errors and not-found handling

A web API needs one predictable place to turn failures into HTTP responses. Without a shared policy, each route may return a different shape, expose internal details, or accidentally leave a request unfinished.

This chapter builds on async error propagation: routes and middleware pass failures to Express, a not-found layer handles requests that match no API route, and one final error handler maps known application errors to safe responses.

## Learning goals

By the end of this chapter, you should be able to:

- Explain why an unmatched route does not automatically enter error middleware.
- Distinguish a missing API route from a missing resource.
- Place a not-found layer and an error handler in the correct order.
- Represent expected HTTP failures with a small application error type.
- Map known errors to safe status codes and response messages.
- Return a generic response for unexpected server errors.
- Keep logging, client responses, and error propagation separate.
- Delegate errors when response headers have already been sent.

## Request handling has two different endings

A request can finish normally, match no route, or fail while a route is running:

~~~text
request
  -> matching route sends a success response
  -> no route matches: API not-found middleware sends a 404
  -> route or middleware fails: error middleware handles the error
~~~

A 404 from an unmatched URL is not automatically an application error. Express reaches the end of the ordinary middleware and route stack without a response. Add a normal middleware after the routes to decide what that means for the API.

An error, by contrast, enters the error flow through a synchronous throw, a rejected promise returned by an Express 5 handler, or a call such as next(error). The error handler does not replace the route-not-found layer.

## Two kinds of not-found responses

These requests can both return HTTP 404, but they describe different situations:

| Situation | Example | Meaning |
| --- | --- | --- |
| Route not found | GET /api/ordres | The server has no route matching this URL and method. |
| Resource not found | GET /api/orders/9999 | The route exists, but the requested order does not. |

A route fallback handles the first case. A route that looks up a resource handles the second. Give them distinct stable error codes so a client can distinguish them without parsing human-readable text.

A 404 is different from a 500. A 404 describes the requested route or resource. A 500 describes an unexpected failure in the server. Do not report database outages, programming errors, or unavailable services as if the requested record simply did not exist.

## Middleware order

Express executes middleware in the order it is registered. A typical API setup has this shape:

~~~js
app.use(express.json());

app.use("/api", apiRouter);

// Normal middleware: reached when no earlier API route responded.
app.use("/api", apiNotFoundHandler);

// Error-handling middleware: keep it after routes and other middleware.
app.use(apiErrorHandler);
~~~

If a router is mounted at /api, mount its not-found layer after that router. Keep the application error handler last so it can receive errors from parsers, routers, and route handlers.

Error-handling middleware has four parameters: error, request, response, and next. Keep all four parameters even if a particular handler does not use every one; Express uses the signature to recognize the error handler.

## Use application errors for expected failures

A route can encounter failures that are expected and safe to report to a client: a requested record is absent, a user is not allowed to perform an action, or the request conflicts with current state. Represent those cases explicitly instead of relying on message text:

~~~js
class ApiError extends Error {
  constructor(status, code, publicMessage) {
    super(publicMessage);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.publicMessage = publicMessage;
  }
}
~~~

The application creates these errors intentionally. Their status, code, and public message are part of the API policy. Avoid turning every unknown Error into a client error just because it happens to have a status-like property.

For a missing resource, the route can throw a known error:

~~~js
const order = await orderService.findById(orderId);

if (!order) {
  throw new ApiError(
    404,
    "ORDER_NOT_FOUND",
    "The requested order was not found."
  );
}
~~~

In Express 5, the rejected async handler reaches error middleware automatically. If an error comes from callback-based work, forward it with next(error), as covered in the previous chapter.

## Route-not-found middleware

An API not-found middleware should run after all API routers and before the error handler. It can send a response directly, or forward a typed 404 error so the centralized handler owns the response format.

Forwarding the typed error keeps one place responsible for formatting API errors:

~~~js
function apiNotFoundHandler(req, res, next) {
  return next(
    new ApiError(
      404,
      "ROUTE_NOT_FOUND",
      "The requested API route was not found."
    )
  );
}
~~~

This handler should only be mounted where it represents the API's route fallback. If the application also serves a website or another router, choose a separate not-found policy for those requests.

## Central error handler

A centralized handler has three main jobs:

1. Decide whether the error is a known, safe application error.
2. Log useful server-side context without exposing secrets.
3. Send one response with a suitable status and safe message.

~~~js
function apiErrorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  const isKnownApiError = error instanceof ApiError;
  const status = isKnownApiError ? error.status : 500;
  const code = isKnownApiError ? error.code : "INTERNAL_SERVER_ERROR";
  const message = isKnownApiError
    ? error.publicMessage
    : "An unexpected error occurred.";

  if (status >= 500) {
    console.error({
      method: req.method,
      path: req.originalUrl,
      error
    });
  }

  return res.status(status).json({
    error: {
      code,
      message
    }
  });
}
~~~

When headers have already been sent, do not try to replace the response. Pass the error onward with next(error) so Express can handle the partially written response.

## Safe error responses

Treat the response body as public. It can be recorded by clients, logs, proxies, and monitoring systems. Do not send stack traces, database messages, filesystem paths, connection strings, secret values, or raw request bodies to a client.

Expected application failures can have a concise public message and stable code. Unexpected errors should receive a generic message. Keep diagnostic details in server logs, and avoid logging credentials or sensitive payloads.

An error's message is not a safe classifier. Avoid checks such as if error.message includes "not found". Message text can change, collide, or contain private data. Use a known class or an explicit internal code.

## Status-code policy

The handler should only use valid HTTP error statuses. A simple API policy often includes:

| Status | Typical meaning in an API |
| --- | --- |
| 400 | The request cannot be processed because its syntax or required input is invalid. |
| 401 | Authentication is required or has failed. |
| 403 | The caller is known but is not permitted to perform the action. |
| 404 | The route or requested resource does not exist. |
| 409 | The request conflicts with the current resource state. |
| 429 | The caller has exceeded a rate limit. |
| 500 | An unexpected server failure occurred. |
| 503 | A required service is temporarily unavailable. |

Choose a status based on the meaning of the failure, not on which response is easiest to write. The authentication, validation, and response-design chapters will develop these policies further.

## Avoid common mistakes

### Sending a 404 from the error handler for every error

This hides server failures as missing resources. The route fallback handles unmatched URLs; unexpected errors normally become 500 responses.

### Expecting the error handler to catch unmatched routes

No error was necessarily thrown. Add a normal not-found middleware after the routers.

### Putting the error handler before the routes

Middleware runs in order. An error handler registered before a route cannot receive failures that happen later in the stack.

### Returning internal details to the client

A stack trace or raw database message can reveal implementation details. Log diagnostics on the server and return a safe public message.

### Sending a response twice

Once a response is sent, stop handling that request. In the error handler, check res.headersSent and delegate if headers have already been sent.

### Trusting arbitrary status fields

Only map errors that the application recognizes. Do not accept an arbitrary status or public message from an unknown error object.

## Checklist

Before finishing an API error policy, check that:

- Every API router has a deliberate unmatched-route behavior.
- Missing resources are handled by the route that knows what was requested.
- Route-not-found and resource-not-found errors have distinguishable codes.
- The not-found layer follows the API routers.
- The four-parameter error handler follows the not-found layer.
- Known errors map to intentional 4xx or 5xx status codes.
- Unknown errors return a generic 500 response.
- Internal diagnostics stay in server logs.
- The handler delegates when res.headersSent is true.
- Each request gets at most one response.

## Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [044 - Async route handlers and error propagation](044-async-route-handlers-and-error-propagation.md) | [Q&A](../qnas/045-centralized-api-errors-and-not-found-handling.md) | [Example](../examples/045-centralized-api-errors-and-not-found-handling.md) | [046 - Validate and sanitize client input](046-validate-and-sanitize-client-input.md) |
