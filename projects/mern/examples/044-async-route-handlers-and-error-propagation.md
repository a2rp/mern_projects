# Example 044: Async route handlers and error propagation

This example shows how errors from Express 5 routes reach error-handling middleware. It covers synchronous throws, rejected promises, callback APIs, and timer callbacks. The code is provided for study; it has not been run.

## What this example demonstrates

- Express 5 forwards a synchronous throw from a route.
- Express 5 forwards a rejected promise returned by a route handler.
- Callback APIs must pass their errors to Express with next(error).
- Errors thrown later inside a timer callback must also be forwarded explicitly.
- A four-parameter error handler can produce one safe error response.
- If a response has already started, the error handler delegates to Express.

## Set up the small demo

Create a new folder for this example, then run these commands in PowerShell:

~~~powershell
npm init -y
npm install express@5
~~~

Create a file named app.js in that folder and add the following complete application:

~~~js
const express = require("express");
const fs = require("node:fs");

const app = express();
const port = 3000;

app.use(express.json());

// Success path: the route sends one response and finishes.
app.get("/ok", (req, res) => {
    return res.json({
        message: "The route completed successfully."
    });
});

// Express 5 forwards a synchronous route throw to the error middleware.
app.get("/sync-error", (req, res) => {
    throw new Error("The synchronous route failed.");
});

// Express 5 observes the returned rejected promise and forwards its error.
app.get("/async-error", async (req, res) => {
    await Promise.reject(new Error("The asynchronous operation failed."));
    return res.json({ message: "This line is not reached." });
});

// Returning the promise lets Express 5 observe its rejection.
app.get("/promise-error", (req, res) => {
    return Promise.reject(new Error("The returned promise was rejected."));
});

// A callback's error is outside the route's returned promise.
// Forward it explicitly and stop this callback branch.
app.get("/callback-error", (req, res, next) => {
    fs.readFile("__example_missing_directory__/file.txt", "utf8", (error, contents) => {
        if (error) {
            return next(error);
        }

        return res.type("text/plain").send(contents);
    });
});

// The timer callback runs after the route handler has returned.
// Catch its throw and forward it explicitly.
app.get("/timer-error", (req, res, next) => {
    setTimeout(() => {
        try {
            throw new Error("The timer callback failed.");
        } catch (error) {
            return next(error);
        }
    }, 0);
});

// This handler must have four parameters so Express recognizes it
// as error-handling middleware. Place it after routes and middleware.
app.use((error, req, res, next) => {
    if (res.headersSent) {
        return next(error);
    }

    // Keep detailed diagnostics in server logs, not in the API response.
    console.error(error);

    return res.status(500).json({
        error: "Internal server error"
    });
});

app.listen(port, () => {
    console.log("Demo server listening on http://localhost:" + port);
});
~~~

## Start the server

~~~powershell
node app.js
~~~

Expected terminal message:

~~~text
Demo server listening on http://localhost:3000
~~~

Keep this terminal open while making requests from another PowerShell terminal.

## Try the routes

### Successful route

~~~powershell
curl.exe -i http://localhost:3000/ok
~~~

Expected response:

~~~http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{"message":"The route completed successfully."}
~~~

### Synchronous route throw

~~~powershell
curl.exe -i http://localhost:3000/sync-error
~~~

Expected response body:

~~~json
{"error":"Internal server error"}
~~~

Express forwards the thrown error to the error middleware.

### Rejected async handler

~~~powershell
curl.exe -i http://localhost:3000/async-error
~~~

Expected response body:

~~~json
{"error":"Internal server error"}
~~~

The server log contains the underlying error message. The route does not need a try/catch just to pass a rejection to Express 5.

### Returned rejected promise

~~~powershell
curl.exe -i http://localhost:3000/promise-error
~~~

Expected response body:

~~~json
{"error":"Internal server error"}
~~~

The important detail is that the route returns the promise. Express cannot forward a rejection from asynchronous work that the handler neither returns nor awaits.

### Callback API error

~~~powershell
curl.exe -i http://localhost:3000/callback-error
~~~

The example directory and file are intentionally absent. The callback calls next(error), so the same error middleware handles the failed file read. The client receives the generic 500 response; the server log contains the detailed error.

### Timer callback error

~~~powershell
curl.exe -i http://localhost:3000/timer-error
~~~

The route returns before the timer callback runs. The try/catch inside the timer forwards its later error with next(error), producing the generic 500 response.

## Follow the error paths

| Route | Where the error happens | How Express receives it |
| --- | --- | --- |
| /sync-error | The route throws before returning | Express forwards the synchronous throw |
| /async-error | An awaited promise rejects | Express 5 observes the rejected handler promise |
| /promise-error | A returned promise rejects | Express 5 observes the returned promise |
| /callback-error | A file-system callback receives an error | The callback calls next(error) |
| /timer-error | A timer callback throws later | The callback catches the throw and calls next(error) |

The error handler checks res.headersSent before attempting to write a response. If headers have already been sent, it calls next(error) so Express can apply its default handling for that situation. It never attempts to send a second response.

## Patterns to avoid

Do not start asynchronous work and discard its promise:

~~~js
app.get("/unobserved-work", (req, res) => {
    saveRecord().then(() => {
        res.json({ saved: true });
    });

    // The route does not return or await the promise.
    // A later rejection is not connected to this route's error flow.
});
~~~

Return or await the promise instead:

~~~js
app.get("/observed-work", async (req, res) => {
    await saveRecord();
    return res.json({ saved: true });
});
~~~

Do not call next(error) and then continue as if the route still owns the response:

~~~js
if (error) {
    next(error);
    return res.json({ message: "This must not also run." });
}
~~~

Use a return so this branch stops after forwarding:

~~~js
if (error) {
    return next(error);
}
~~~

In Express 5, avoid an async wrapper that catches and forwards a rejection when Express already observes the same returned promise. Forwarding the same error twice can create duplicate error handling. Add a wrapper only when its behavior is deliberate and it does not also return the same rejected promise to Express.

## Key takeaways

1. Express 5 automatically forwards errors from thrown route code and rejected promises returned by route handlers.
2. Await asynchronous work or return its promise so Express can observe its failure.
3. Callback-style APIs need an explicit next(error) call.
4. Later callbacks such as timers need their own error forwarding.
5. Use a four-parameter error handler after the routes.
6. Check res.headersSent before writing an error response, and delegate when the response has already started.
7. Send safe client messages; keep internal error details in server-side diagnostics.

## Chapter navigation

| Previous chapter | Lesson | Chapter Q&A | Next chapter |
| --- | --- | --- | --- |
| [043 - Connect an Express app to MongoDB](../lessons/043-connect-an-express-app-to-mongodb.md) | [Lesson](../lessons/044-async-route-handlers-and-error-propagation.md) | [Q&A](../qnas/044-async-route-handlers-and-error-propagation.md) | [045 - Centralized API errors and not-found handling](../lessons/045-centralized-api-errors-and-not-found-handling.md) |
