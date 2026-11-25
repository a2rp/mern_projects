# 040 - Requests, responses, and content types - complete example

This example documents an Express 5 API that returns JSON and plain text, negotiates response formats, creates and deletes a resource, and handles request media types.

The source code is provided in Markdown for study. This repository does not execute it.

## Question

How should an Express API describe responses and handle request and response media types?

## What this example demonstrates

- Reading Accept and Content-Type through Express request helpers.
- Parsing JSON before routes that need req.body.
- Returning JSON with a suitable response Content-Type.
- Returning plain text with an explicit media type.
- Negotiating response formats and returning 406 when there is no match.
- Returning 201 with a Location header when a resource is created.
- Returning 204 with no body after deletion.
- Returning 415 for an unsupported request media type.
- Returning a safe 400 response for malformed JSON.

## Prerequisites

- Node.js 18 or later and npm.
- PowerShell.
- A new practice directory.

## 1. Create the project

~~~powershell
New-Item -ItemType Directory -Path http-content-types-practice
Set-Location http-content-types-practice
npm init -y
npm install express
npm pkg set type=module
npm pkg set scripts.start="node src/server.js"
New-Item -ItemType Directory -Path src
~~~

Create this structure:

~~~text
http-content-types-practice/
|-- src/
|   |-- app.js
|   |-- server.js
|-- package-lock.json
|-- package.json
~~~

## 2. Create src/app.js

~~~javascript
import express from "express";

const app = express();

app.disable("x-powered-by");

// This parser runs before routes that read req.body.
app.use(express.json({ limit: "20kb" }));

const messages = [
  { id: "501", text: "Hello from the API" }
];

let nextMessageId = 502;

app.get("/api/health", (req, res) => {
  return res
    .type("text/plain")
    .status(200)
    .send("ready");
});

app.get("/api/messages", (req, res) => {
  return res.status(200).json({
    messages
  });
});

app.get("/api/messages/:messageId", (req, res) => {
  const message = messages.find(
    (item) => item.id === req.params.messageId
  );

  if (!message) {
    return res.status(404).json({
      error: "Message not found."
    });
  }

  res.vary("Accept");

  return res.format({
    "application/json": () => {
      res.json({ message });
    },
    "text/plain": () => {
      res.type("text/plain").send(message.text);
    },
    default: () => {
      res.status(406).end();
    }
  });
});

app.get("/api/reports/daily", (req, res) => {
  res.vary("Accept");

  return res.format({
    "application/json": () => {
      res.json({
        title: "Daily report",
        totalMessages: messages.length
      });
    },
    "text/plain": () => {
      res.type("text/plain").send(
        "Daily report: " + messages.length + " messages"
      );
    },
    default: () => {
      res.status(406).end();
    }
  });
});

app.post("/api/messages", (req, res) => {
  const requestType = req.is("application/json");

  if (requestType === null) {
    return res.status(400).json({
      error: "A JSON request body is required."
    });
  }

  if (requestType === false) {
    return res.status(415).json({
      error: "Send this request as application/json."
    });
  }

  if (
    req.body === null ||
    typeof req.body !== "object" ||
    Array.isArray(req.body) ||
    typeof req.body.text !== "string" ||
    req.body.text.trim() === ""
  ) {
    return res.status(400).json({
      error: "text must be a non-empty string."
    });
  }

  const message = {
    id: String(nextMessageId),
    text: req.body.text.trim()
  };

  nextMessageId += 1;
  messages.push(message);

  return res
    .location("/api/messages/" + encodeURIComponent(message.id))
    .status(201)
    .json({ message });
});

app.delete("/api/messages/:messageId", (req, res) => {
  const index = messages.findIndex(
    (item) => item.id === req.params.messageId
  );

  if (index === -1) {
    return res.status(404).json({
      error: "Message not found."
    });
  }

  messages.splice(index, 1);
  return res.status(204).end();
});

app.use((req, res) => {
  return res.status(404).json({
    error: "Route not found."
  });
});

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  const status =
    Number.isInteger(error.status) &&
    error.status >= 400 &&
    error.status < 500
      ? error.status
      : 500;

  const publicMessage =
    status === 400
      ? "Invalid request body."
      : status === 413
        ? "Request body is too large."
        : "Internal server error.";

  console.error("Request failed:", error.message);

  return res.status(status).json({
    error: publicMessage
  });
});

export default app;
~~~

The JSON parser runs before the routes. It parses bodies whose Content-Type matches JSON. The create route checks the request type and validates the parsed value; the media type alone does not validate the fields.

The message route negotiates JSON or plain text using Accept. It returns 406 when the client accepts neither. Vary: Accept tells caches that the chosen representation may depend on that request header.

The create route returns 201 and a Location header. The delete route returns 204 and ends without a body.

## 3. Create src/server.js

~~~javascript
import app from "./app.js";

const port = 3000;
const host = "127.0.0.1";

const server = app.listen(port, host, () => {
  console.log("Content types example listening at http://localhost:" + port);
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
Content types example listening at http://localhost:3000
~~~

Keep the server running. Send requests from a second PowerShell window.

## 5. Return plain text

~~~powershell
curl.exe -i http://localhost:3000/api/health
~~~

Expected status and selected header:

~~~http
HTTP/1.1 200 OK
Content-Type: text/plain; charset=utf-8
~~~

Expected body:

~~~text
ready
~~~

The response type is explicitly plain text.

## 6. Return a JSON representation

~~~powershell
curl.exe -i -H "Accept: application/json" http://localhost:3000/api/messages/501
~~~

Expected status and selected headers:

~~~http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
Vary: Accept
~~~

Expected body:

~~~json
{
  "message": {
    "id": "501",
    "text": "Hello from the API"
  }
}
~~~

The route chooses JSON because the client accepts application/json.

## 7. Return a plain-text representation of the same resource

~~~powershell
curl.exe -i -H "Accept: text/plain" http://localhost:3000/api/messages/501
~~~

Expected status and selected headers:

~~~http
HTTP/1.1 200 OK
Content-Type: text/plain; charset=utf-8
Vary: Accept
~~~

Expected body:

~~~text
Hello from the API
~~~

The resource is the same, but the route selects the representation requested through Accept.

## 8. Return 406 when the requested response type is unsupported

~~~powershell
curl.exe -i -H "Accept: application/xml" http://localhost:3000/api/messages/501
~~~

Expected status and selected header:

~~~http
HTTP/1.1 406 Not Acceptable
Vary: Accept
~~~

The response has no body. The server offers JSON and plain text, but the client accepts only application/xml.

## 9. Create a message with a JSON request body

~~~powershell
curl.exe -i -X POST http://localhost:3000/api/messages -H "Content-Type: application/json" -H "Accept: application/json" --data-raw '{"text":"Hello"}'
~~~

Expected status and selected headers:

~~~http
HTTP/1.1 201 Created
Content-Type: application/json; charset=utf-8
Location: /api/messages/502
~~~

Expected body:

~~~json
{
  "message": {
    "id": "502",
    "text": "Hello"
  }
}
~~~

Content-Type describes the submitted JSON. Accept asks for a JSON response. The server validates the parsed text field, creates the resource, and identifies it in the Location header.

## 10. Reject an unsupported request media type

~~~powershell
curl.exe -i -X POST http://localhost:3000/api/messages -H "Content-Type: text/plain" --data-raw "not JSON"
~~~

Expected status and selected header:

~~~http
HTTP/1.1 415 Unsupported Media Type
Content-Type: application/json; charset=utf-8
~~~

Expected body:

~~~json
{
  "error": "Send this request as application/json."
}
~~~

The JSON parser does not parse this text/plain body. req.is() reports a media-type mismatch, and the route returns 415.

## 11. Handle malformed JSON safely

~~~powershell
curl.exe -i -X POST http://localhost:3000/api/messages -H "Content-Type: application/json" --data-raw '{"text":'
~~~

Expected status and selected header:

~~~http
HTTP/1.1 400 Bad Request
Content-Type: application/json; charset=utf-8
~~~

Expected body:

~~~json
{
  "error": "Invalid request body."
}
~~~

The JSON parser forwards its syntax error to the error middleware. The handler returns a safe message instead of exposing parser internals or a stack trace.

## 12. Return a JSON 404 for a missing resource

~~~powershell
curl.exe -i -H "Accept: application/json" http://localhost:3000/api/messages/999
~~~

Expected status:

~~~http
HTTP/1.1 404 Not Found
~~~

Expected body:

~~~json
{
  "error": "Message not found."
}
~~~

The route exists, but the requested message does not.

## 13. Negotiate the daily report representation

Run this after creating message 502:

~~~powershell
curl.exe -i -H "Accept: text/plain" http://localhost:3000/api/reports/daily
~~~

Expected status and selected headers:

~~~http
HTTP/1.1 200 OK
Content-Type: text/plain; charset=utf-8
Vary: Accept
~~~

Expected body:

~~~text
Daily report: 2 messages
~~~

The report route chooses text because of Accept. Use Accept: application/json to receive the JSON report instead.

## 14. Delete a message without returning a body

Run this after step 9 created message 502:

~~~powershell
curl.exe -i -X DELETE http://localhost:3000/api/messages/502
~~~

Expected response:

~~~http
HTTP/1.1 204 No Content
~~~

There is no response body. A 204 response communicates success when the API has no representation to return.

## Expected behavior summary

| Request | Expected status | Response representation |
| --- | --- | --- |
| GET /api/health | 200 | Plain text |
| GET /api/messages/501 with Accept: application/json | 200 | JSON |
| GET /api/messages/501 with Accept: text/plain | 200 | Plain text |
| GET /api/messages/501 with Accept: application/xml | 406 | No body |
| POST /api/messages with valid JSON | 201 | JSON and Location header |
| POST /api/messages with text/plain | 415 | JSON error |
| POST /api/messages with malformed JSON | 400 | Safe JSON error |
| GET /api/messages/999 | 404 | JSON error |
| DELETE /api/messages/502 after creation | 204 | No body |

## How it works

1. express.json() runs before routes and parses matching JSON request bodies.
2. req.is() checks the request Content-Type; it does not parse or validate the body.
3. req.accepts() is used by res.format() to choose a response representation.
4. res.vary("Accept") marks responses whose representation depends on Accept.
5. res.status(), res.type(), res.location(), and res.json() set response details before the body is sent.
6. 201 identifies successful creation and Location points to the new message.
7. 204 ends the response without a body.
8. The error handler preserves a safe client status for parser errors and hides internal details.

## Common mistakes

- Treating request Content-Type and Accept as the same header.
- Assuming a matching Content-Type proves that the body has valid fields.
- Assuming a body parser reads every media type.
- Sending JSON with a text/html response Content-Type.
- Sending unescaped user data inside an HTML string.
- Returning a JSON string through res.send() when res.json() is intended.
- Using 406 for a request body type the server cannot parse.
- Using 415 because the client rejects the response representation.
- Sending a body with 204 No Content.
- Returning a status-text response when the API promises structured JSON.
- Changing headers after the response has started.
- Continuing execution after a response branch without returning.
- Exposing parser messages or stack traces in public responses.
- Omitting Vary: Accept when a cacheable response differs by Accept.

## Safety and scope

The data is in memory and is reset when the process restarts. This example does not implement authentication, authorization, persistent storage, rate limiting, or production caching rules. The media-type check is only one step; validate request data and enforce the permissions required for each operation.

## Chapter navigation

| Previous chapter | Chapter Q&A | Next chapter |
| --- | --- | --- |
| [039 - Routes, route parameters, and routers](../lessons/039-routes-route-parameters-and-routers.md) | [Q&A](../qnas/040-requests-responses-and-content-types.md) | [041 - Parse path, query, and body inputs](../lessons/041-parse-path-query-and-body-inputs.md) |
