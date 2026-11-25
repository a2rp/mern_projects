# Example 045: Centralized API errors and not-found handling

This example creates a small Express 5 API with one response policy for expected application errors and unexpected server failures. It demonstrates both an unmatched API route and a missing order. The code is for study and has not been run.

## What this example demonstrates

- A route can raise a typed application error for a missing resource.
- A fallback middleware can handle an API path that matched no route.
- Both 404 cases flow through one error handler but use different codes.
- Unexpected errors return a generic 500 response.
- Internal error details are logged on the server and kept out of the response.
- The error handler delegates if the response headers have already been sent.

## Project setup

Create a new folder and install Express 5:

~~~powershell
mkdir centralized-api-errors-demo
cd centralized-api-errors-demo
npm init -y
npm install express@5
~~~

Create app.js and add this complete server:

~~~js
const express = require("express");

const app = express();
const apiRouter = express.Router();
const port = 3000;

class ApiError extends Error {
    constructor(status, code, publicMessage) {
        super(publicMessage);

        if (!Number.isInteger(status) || status < 400 || status > 599) {
            throw new RangeError("ApiError status must be between 400 and 599.");
        }

        this.name = "ApiError";
        this.status = status;
        this.code = code;
        this.publicMessage = publicMessage;
    }
}

// In-memory data keeps this example focused on HTTP error handling.
const orders = [
    { id: "1001", item: "Notebook", quantity: 2 },
    { id: "1002", item: "Pen", quantity: 5 }
];

async function findOrderById(orderId) {
    return orders.find((order) => order.id === orderId) || null;
}

apiRouter.get("/orders", (req, res) => {
    return res.json({ data: orders });
});

apiRouter.get("/orders/:orderId", async (req, res) => {
    const order = await findOrderById(req.params.orderId);

    if (!order) {
        throw new ApiError(
            404,
            "ORDER_NOT_FOUND",
            "The requested order was not found."
        );
    }

    return res.json({ data: order });
});

// This route is only here to show how an unexpected failure is sanitized.
apiRouter.get("/demo-failure", (req, res) => {
    throw new Error("Internal database connection details stay on the server.");
});

// Register the API router before its not-found fallback.
app.use("/api", apiRouter);

// This normal middleware runs only if no earlier API route responded.
// Forward a typed error so the centralized handler formats the response.
app.use("/api", (req, res, next) => {
    return next(
        new ApiError(
            404,
            "ROUTE_NOT_FOUND",
            "The requested API route was not found."
        )
    );
});

// Keep the four-parameter error handler after routes and the route fallback.
app.use((error, req, res, next) => {
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
});

app.listen(port, () => {
    console.log("API listening on http://localhost:" + port);
});
~~~

The demo stores two orders in memory. It does not connect to MongoDB; the error policy is the subject of this chapter.

## Start the API

~~~powershell
node app.js
~~~

Expected terminal message:

~~~text
API listening on http://localhost:3000
~~~

Keep the server running and use a second PowerShell terminal for the requests below.

## Request an existing resource

~~~powershell
curl.exe -i http://localhost:3000/api/orders/1001
~~~

Expected response:

~~~http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{"data":{"id":"1001","item":"Notebook","quantity":2}}
~~~

The route matched, the order exists, and the route sent one successful response.

## Request a missing resource

~~~powershell
curl.exe -i http://localhost:3000/api/orders/9999
~~~

Expected status and body:

~~~http
HTTP/1.1 404 Not Found
Content-Type: application/json; charset=utf-8

{"error":{"code":"ORDER_NOT_FOUND","message":"The requested order was not found."}}
~~~

The order route exists, but its lookup returned no order. It throws a typed ORDER_NOT_FOUND error, which Express 5 forwards from the async route to the error handler.

## Request an unknown API route

~~~powershell
curl.exe -i http://localhost:3000/api/ordres
~~~

Expected status and body:

~~~http
HTTP/1.1 404 Not Found
Content-Type: application/json; charset=utf-8

{"error":{"code":"ROUTE_NOT_FOUND","message":"The requested API route was not found."}}
~~~

No API route matched this path. The normal fallback middleware after the router forwards a typed ROUTE_NOT_FOUND error. This is separate from the missing-order case even though both responses have status 404.

## Trigger an unexpected error

~~~powershell
curl.exe -i http://localhost:3000/api/demo-failure
~~~

Expected status and body:

~~~http
HTTP/1.1 500 Internal Server Error
Content-Type: application/json; charset=utf-8

{"error":{"code":"INTERNAL_SERVER_ERROR","message":"An unexpected error occurred."}}
~~~

The server terminal logs the error for diagnosis. The response does not include its message or stack trace.

## Trace the middleware order

~~~text
request
  -> API router
       -> route responds, or
       -> route throws/rejects a typed or unexpected error
  -> API route-not-found middleware, if no route responded
  -> centralized four-parameter error handler
       -> safe JSON error response
       -> or next(error) if headers were already sent
~~~

A resource lookup is handled inside its route because that route knows which order was requested. The route fallback handles only paths that no API route matched. Both can forward errors to the same formatter.

## Important implementation notes

- Only errors created as ApiError values are treated as known, client-safe failures in this demo.
- Unknown errors always become a generic 500 response.
- The demo logs the complete error object only on the server. Production logging should also avoid secrets and sensitive request data.
- The error handler checks res.headersSent before writing. It does not try to replace a response that has already begun.
- The fallback is mounted under /api. Other application paths may need a separate website or router not-found policy.
- A real application should centralize the mapping of validation, authentication, authorization, conflict, and dependency failures as those policies are introduced.

## Chapter navigation

| Previous chapter | Lesson | Chapter Q&A | Next chapter |
| --- | --- | --- | --- |
| [044 - Async route handlers and error propagation](../lessons/044-async-route-handlers-and-error-propagation.md) | [Lesson](../lessons/045-centralized-api-errors-and-not-found-handling.md) | [Q&A](../qnas/045-centralized-api-errors-and-not-found-handling.md) | [046 - Validate and sanitize client input](../lessons/046-validate-and-sanitize-client-input.md) |
