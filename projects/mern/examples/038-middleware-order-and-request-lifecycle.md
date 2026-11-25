# 038 - Middleware order and request lifecycle — complete example

This runnable-style example makes Express middleware order visible. It records which handlers a request reaches, demonstrates normal continuation, route skipping, a not-found response, and error forwarding. The code is documented here and is not executed by this repository.

## Question

How can you see which Express handlers run for a request, and what changes when a route sends a response or forwards an error?

## What this example demonstrates

- Registering request middleware before parsers and routes.
- Running a JSON parser before routes that read req.body.
- Mounting middleware on an API path prefix.
- Continuing through multiple callbacks with next().
- Skipping the rest of a route with next("route").
- Reaching a not-found handler only after routes fall through.
- Skipping normal middleware when next(err) enters the error flow.
- Returning a safe error response from four-argument error middleware.

## Prerequisites

- Node.js 18 or later and npm.
- PowerShell.
- A new practice directory.

## 1. Create and configure the project

~~~powershell
New-Item -ItemType Directory -Path middleware-flow-practice
Set-Location middleware-flow-practice
npm init -y
npm install express
npm pkg set type=module
npm pkg set scripts.start="node src/server.js"
New-Item -ItemType Directory -Path src
~~~

Create this structure:

~~~text
middleware-flow-practice/
├── src/
│   ├── app.js
│   └── server.js
├── package-lock.json
└── package.json
~~~

## 2. Create src/app.js

~~~javascript
import express from "express";

const app = express();

app.disable("x-powered-by");

// This runs first for every request and starts a trace for the example.
app.use((req, res, next) => {
  req.middlewareTrace = ["request logger"];
  next();
});

// Parse JSON before routes that read req.body.
app.use(express.json({ limit: "100kb" }));

// This middleware only runs for paths beginning with /api.
app.use("/api", (req, res, next) => {
  req.middlewareTrace.push("API prefix middleware");
  next();
});

function checkItemRoute(req, res, next) {
  req.middlewareTrace.push("item guard");

  if (req.params.itemId === "preview") {
    return next("route");
  }

  return next();
}

app.get(
  "/api/items/:itemId",
  checkItemRoute,
  (req, res) => {
    req.middlewareTrace.push("item response handler");

    return res.status(200).json({
      item: {
        id: req.params.itemId,
        name: "Example item"
      },
      middlewareTrace: req.middlewareTrace
    });
  }
);

// next("route") from the previous route allows this matching route to run.
app.get("/api/items/:itemId", (req, res) => {
  req.middlewareTrace.push("preview response handler");

  return res.status(200).json({
    item: {
      id: req.params.itemId,
      name: "Preview item"
    },
    middlewareTrace: req.middlewareTrace
  });
});

app.post("/api/echo", (req, res) => {
  req.middlewareTrace.push("echo route");

  if (
    req.body === null ||
    typeof req.body !== "object" ||
    Array.isArray(req.body)
  ) {
    return res.status(400).json({
      error: "A JSON object body is required.",
      middlewareTrace: req.middlewareTrace
    });
  }

  return res.status(200).json({
    received: req.body,
    middlewareTrace: req.middlewareTrace
  });
});

app.get("/api/fail", (req, res, next) => {
  req.middlewareTrace.push("failing route");
  return next(new Error("Demonstration error"));
});

app.get("/api/fail-async", async (req, res) => {
  req.middlewareTrace.push("async failing route");
  throw new Error("Demonstration async error");
});

// This is ordinary middleware: it responds only after every route falls through.
app.use((req, res) => {
  if (req.middlewareTrace) {
    req.middlewareTrace.push("not-found handler");
  }

  return res.status(404).json({
    error: "Route not found.",
    middlewareTrace: req.middlewareTrace ?? []
  });
});

// Error middleware has four parameters and belongs after ordinary routes.
app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  if (req.middlewareTrace) {
    req.middlewareTrace.push("error handler");
  }

  console.error("Request failed:", error.message);

  const status =
    Number.isInteger(error.status) && error.status >= 400 && error.status < 500
      ? error.status
      : 500;
  const publicMessage =
    status === 400 ? "Invalid request body." : "Internal server error.";

  return res.status(status).json({
    error: publicMessage,
    middlewareTrace: req.middlewareTrace ?? []
  });
});

export default app;
~~~

The first middleware initializes a trace, so later middleware can append its name. The JSON parser runs before the routes. The API prefix middleware runs only for requests whose path starts with /api.

For GET /api/items/42, the guard calls next(), so the item response handler runs next. For GET /api/items/preview, the guard calls next("route"), so Express skips the rest of that route and tries the next matching route.

The not-found handler is registered after all routes. A call to next(error) skips normal handlers and reaches the error handler. In Express 5, the rejected promise from the async failing route is also forwarded to error handling.

The trace is intentionally returned in this learning example to make order visible. Remove it from production responses; clients should receive only the documented public representation.

## 3. Create src/server.js

~~~javascript
import app from "./app.js";

const rawPort = process.env.PORT ?? "3000";
const port = Number(rawPort);
const host = process.env.HOST ?? "127.0.0.1";

if (!Number.isInteger(port) || port < 0 || port > 65535) {
  throw new Error("PORT must be an integer from 0 through 65535.");
}

if (host.trim() === "") {
  throw new Error("HOST must not be empty.");
}

const server = app.listen(port, host, () => {
  const address = server.address();
  const actualPort =
    typeof address === "object" && address !== null ? address.port : port;

  console.log("Middleware example listening on port " + actualPort);
  console.log("Local URL: http://localhost:" + actualPort);
});

server.on("error", (error) => {
  console.error("Server failed to start:", error.message);
  process.exitCode = 1;
});
~~~

## 4. Start the server

~~~powershell
npm start
~~~

Expected terminal output:

~~~text
Middleware example listening on port 3000
Local URL: http://localhost:3000
~~~

Keep the server running in this terminal. Run the following requests in another PowerShell window.

## 5. Follow a normal route

~~~powershell
curl.exe -i http://localhost:3000/api/items/42
~~~

Expected JSON body:

~~~json
{
  "item": {
    "id": "42",
    "name": "Example item"
  },
  "middlewareTrace": [
    "request logger",
    "API prefix middleware",
    "item guard",
    "item response handler"
  ]
}
~~~

The route response ends the normal path. The preview route, not-found handler, and error handler do not run.

## 6. Skip to another matching route

~~~powershell
curl.exe -i http://localhost:3000/api/items/preview
~~~

Expected JSON body:

~~~json
{
  "item": {
    "id": "preview",
    "name": "Preview item"
  },
  "middlewareTrace": [
    "request logger",
    "API prefix middleware",
    "item guard",
    "preview response handler"
  ]
}
~~~

The guard calls next("route"). The remaining handler in the first route is skipped, then the next matching GET route sends the response.

## 7. See JSON parser and route order

~~~powershell
curl.exe -i -X POST http://localhost:3000/api/echo -H "Content-Type: application/json" --data-raw '{"topic":"MERN"}'
~~~

Expected JSON body:

~~~json
{
  "received": {
    "topic": "MERN"
  },
  "middlewareTrace": [
    "request logger",
    "API prefix middleware",
    "echo route"
  ]
}
~~~

The parser runs before the API middleware and route, so the route receives the parsed object in req.body.

## 8. Follow a route that forwards an error

~~~powershell
curl.exe -i http://localhost:3000/api/fail
~~~

Expected status and JSON body:

~~~http
HTTP/1.1 500 Internal Server Error
Content-Type: application/json; charset=utf-8
~~~

~~~json
{
  "error": "Internal server error.",
  "middlewareTrace": [
    "request logger",
    "API prefix middleware",
    "failing route",
    "error handler"
  ]
}
~~~

The not-found handler is skipped because the route passed an error to next(). The error handler logs a demonstration message in the server terminal and returns a safe client response.

The Express 5 async route also forwards a rejected promise to the error handler:

~~~powershell
curl.exe -i http://localhost:3000/api/fail-async
~~~

Expected JSON body:

~~~json
{
  "error": "Internal server error.",
  "middlewareTrace": [
    "request logger",
    "API prefix middleware",
    "async failing route",
    "error handler"
  ]
}
~~~

Express 4 does not automatically forward rejected async handlers in the same way. Use the version-specific error handling taught for the installed Express release.

## 9. See a JSON parser error enter the error flow

~~~powershell
curl.exe -i -X POST http://localhost:3000/api/echo -H "Content-Type: application/json" --data-raw '{"topic":'
~~~

Expected status and body:

~~~http
HTTP/1.1 400 Bad Request
Content-Type: application/json; charset=utf-8
~~~

~~~json
{
  "error": "Invalid request body.",
  "middlewareTrace": [
    "request logger",
    "error handler"
  ]
}
~~~

The JSON parser runs before the API prefix middleware. It rejects malformed JSON and forwards the error, so the API prefix middleware and normal routes are skipped. The error handler maps this parser error to 400 and returns a safe message.

## 10. Let the routes fall through

~~~powershell
curl.exe -i http://localhost:3000/api/missing
~~~

Expected JSON body:

~~~json
{
  "error": "Route not found.",
  "middlewareTrace": [
    "request logger",
    "API prefix middleware",
    "not-found handler"
  ]
}
~~~

No route handled this path, so normal middleware continued to the final 404 handler. The error handler does not run because no error was forwarded.

## Expected behavior summary

| Request | Expected status | Handlers in the trace |
| --- | --- | --- |
| GET /api/items/42 | 200 | logger, API middleware, guard, item response |
| GET /api/items/preview | 200 | logger, API middleware, guard, preview response |
| POST /api/echo with JSON | 200 | logger, API middleware, echo route |
| GET /api/fail | 500 | logger, API middleware, failing route, error handler |
| GET /api/fail-async | 500 | logger, API middleware, async failing route, error handler |
| POST /api/echo with malformed JSON | 400 | logger, error handler
| GET /api/missing | 404 | logger, API middleware, not-found handler |

## How it works

1. Express stores middleware and routes in registration order.
2. The request logger creates a trace before any route can end the response.
3. The JSON parser runs before routes that use the parsed body.
4. The /api middleware runs only for paths under that prefix.
5. Each matched handler chooses whether to call next(), send a response, skip the current route, or forward an error.
6. The not-found handler sends 404 only after ordinary routes fall through.
7. The four-argument error handler receives forwarded errors and sends an appropriate safe error response.

## Common mistakes

- Moving the JSON parser below the routes.
- Moving the logger below a route that sends a response.
- Forgetting next() in middleware that intends to continue.
- Sending a response and then continuing into another response handler.
- Registering the not-found handler before the API routes.
- Writing error handling with fewer than four parameters.
- Expecting the not-found handler to receive errors passed to next(error).
- Throwing from callback-based asynchronous work without forwarding the error.
- Assuming Express 4 automatically forwards rejected async handlers.
- Leaving diagnostic traces in production responses.

## Safety and scope

This example uses Express 5, returns internal middleware labels for teaching, and does not connect to a database or authenticate users. Do not expose it to an untrusted network. In a real API, remove the trace, keep error details out of responses, and add the authentication and validation appropriate to each route.

## Chapter navigation

| Previous chapter | Chapter Q&A | Next chapter |
| --- | --- | --- |
| [037 - Create an Express app and server](../lessons/037-create-an-express-app-and-server.md) | [Q&A](../qnas/038-middleware-order-and-request-lifecycle.md) | [038 - Middleware order and request lifecycle](../lessons/038-middleware-order-and-request-lifecycle.md) |
