# Example 004 - JSON and API Data Basics

## Question

How does JSON text travel from a client to an API, become usable JavaScript data, and return as a JSON response?

## Goal

This example uses a small Node.js HTTP server and a separate Node.js client:

- The client creates a request body with `JSON.stringify()`.
- The server reads and parses JSON text.
- The server validates the parsed data against a small contract.
- The server serializes a response with `JSON.stringify()`.
- The client parses the response and displays its status and data.

The server keeps no database. Its task ID is fixed so you can focus on the data format and request/response flow.

## API contract

The endpoint accepts:

- Method and path: `POST /api/tasks`
- Request media type: `application/json`
- Required field: `title`, a non-empty string
- Optional field: `completed`, a Boolean; defaults to `false`

A successful request returns status `201 Created` and a JSON object with `id`, `title`, and `completed`. Invalid JSON, a wrong media type, or invalid fields return a JSON error body with an appropriate status.

## Complete example

### 1. Create the server

Save the following as **server.mjs**:

~~~js
import { createServer } from "node:http";

function sendJson(response, status, data, extraHeaders = {}) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    ...extraHeaders,
  });

  response.end(JSON.stringify(data));
}

function makeHttpError(status, code, message) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

async function readJson(request) {
  const contentType = request.headers["content-type"] ?? "";
  const mediaType = contentType.split(";")[0].trim().toLowerCase();

  if (mediaType !== "application/json") {
    throw makeHttpError(
      415,
      "UNSUPPORTED_MEDIA_TYPE",
      "Send the request body as application/json."
    );
  }

  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  const requestText = Buffer.concat(chunks).toString("utf8");

  try {
    return JSON.parse(requestText);
  } catch {
    throw makeHttpError(400, "INVALID_JSON", "The request body is not valid JSON.");
  }
}

const server = createServer(async (request, response) => {
  if (request.url !== "/api/tasks") {
    sendJson(response, 404, {
      error: {
        code: "NOT_FOUND",
        message: "No route matches this path.",
      },
    });
    return;
  }

  if (request.method !== "POST") {
    sendJson(
      response,
      405,
      {
        error: {
          code: "METHOD_NOT_ALLOWED",
          message: "Use POST for this endpoint.",
        },
      },
      { Allow: "POST" }
    );
    return;
  }

  try {
    const payload = await readJson(request);

    if (payload === null || typeof payload !== "object" || Array.isArray(payload)) {
      throw makeHttpError(
        400,
        "INVALID_BODY",
        "The JSON body must be an object."
      );
    }

    const unknownFields = Object.keys(payload).filter(
      (key) => !["title", "completed"].includes(key)
    );

    if (unknownFields.length > 0) {
      throw makeHttpError(
        400,
        "UNKNOWN_FIELDS",
        "Only title and completed fields are accepted."
      );
    }

    if (typeof payload.title !== "string" || payload.title.trim() === "") {
      throw makeHttpError(
        400,
        "INVALID_TITLE",
        "title must be a non-empty string."
      );
    }

    if (payload.completed !== undefined && typeof payload.completed !== "boolean") {
      throw makeHttpError(
        400,
        "INVALID_COMPLETED",
        "completed must be a Boolean when provided."
      );
    }

    const task = {
      id: "task-104",
      title: payload.title.trim(),
      completed: payload.completed ?? false,
    };

    sendJson(response, 201, task);
  } catch (error) {
    const status = error.status ?? 500;

    sendJson(response, status, {
      error: {
        code: error.code ?? "INTERNAL_ERROR",
        message: error.status ? error.message : "The server could not process the request.",
      },
    });
  }
});

server.listen(3000, () => {
  console.log("Task API listening at http://127.0.0.1:3000");
});
~~~

### 2. Create the client

Save this as **client.mjs**:

~~~js
const requestData = {
  title: "Practice JSON from a client",
};

const requestText = JSON.stringify(requestData);

const response = await fetch("http://127.0.0.1:3000/api/tasks", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  body: requestText,
});

const responseText = await response.text();

let result;

try {
  result = JSON.parse(responseText);
} catch {
  console.error("The server response was not valid JSON.");
  process.exitCode = 1;
}

if (result !== undefined) {
  console.log("HTTP " + response.status + " " + response.statusText);
  console.log(JSON.stringify(result, null, 2));
}
~~~

## Run the example

You need Node.js installed. Open one terminal in the folder containing both files and start the server:

~~~sh
node server.mjs
~~~

Leave it running. Open a second terminal in the same folder and run the client:

~~~sh
node client.mjs
~~~

The client sends this JSON text in its request body:

~~~json
{
  "title": "Practice JSON from a client"
}
~~~

It also sends `Content-Type: application/json` to identify the request body and `Accept: application/json` to indicate that it can handle a JSON response.

## Expected output

The client terminal prints:

~~~text
HTTP 201 Created
{
  "id": "task-104",
  "title": "Practice JSON from a client",
  "completed": false
}
~~~

The server terminal prints:

~~~text
Task API listening at http://127.0.0.1:3000
~~~

## Try the validation rules

Change the object in `client.mjs` and run the client again for each case:

| Request body or change | Expected result |
| --- | --- |
| `{"title":"Write notes"}` | `201 Created`; the server trims and returns the title. |
| `{"title":" "}` | `400 Bad Request`; the title cannot be blank. |
| `{"title":12}` | `400 Bad Request`; title must be a string. |
| `{"title":"Write notes","completed":"false"}` | `400 Bad Request`; completed must be a Boolean, not a string. |
| `{"title":"Write notes","owner":"Sam"}` | `400 Bad Request`; the contract accepts only title and completed. |
| Malformed JSON such as `{"title":` | `400 Bad Request`; the server cannot parse it. |
| Remove the Content-Type header | `415 Unsupported Media Type`. |
| Change the client method to GET | `405 Method Not Allowed`. |

The error response is JSON too. For example, an invalid title returns:

~~~json
{
  "error": {
    "code": "INVALID_TITLE",
    "message": "title must be a non-empty string."
  }
}
~~~

The HTTP status says that the request was rejected. The response body gives the client a stable error code and a readable message.

## How the data moves

1. The client begins with a JavaScript object in `requestData`.
2. `JSON.stringify(requestData)` turns that object into JSON text for the HTTP body.
3. The Content-Type header tells the server to interpret the body as JSON.
4. The server reads the text and `JSON.parse()` converts it to a JavaScript value.
5. The server checks that the value is an object and that the accepted fields follow the API contract.
6. The server builds a response object and `JSON.stringify()` serializes it as response text.
7. The client reads the response text, parses it, and checks the HTTP status separately from the JSON data.

Parsing succeeds for some JSON bodies that still violate the API contract. For example, `{"title":12}` is syntactically valid JSON, but this endpoint requires a string title. That is why the server validates after parsing.

## Explanation

- JSON is the shared text representation sent over HTTP. The JavaScript object exists inside the client or server program.
- The request and response both use `application/json`, but each message has its own headers.
- The API defines which fields and types it accepts; JSON itself does not define these task rules.
- The server uses status codes and a consistent error object so a client can handle success and failure clearly.
- The fixed ID and in-memory behavior keep the example small. A real application would generate identifiers, persist data, and apply appropriate request-size, authentication, authorization, and operational safeguards.

## Cleanup

Stop the server with `Ctrl+C` in the server terminal.

## Related chapter files

- [Lesson 004 - JSON and API data basics](../lessons/004-json-and-api-data-basics.md)
- [Q&A 004 - JSON and API data basics](../qnas/004-json-and-api-data-basics.md)

---

### Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Next chapter |
| :--- | :--- | :--- | :---: |
| [003 - HTTP requests, responses, methods, and status codes](../lessons/003-http-requests-responses-methods-and-status-codes.md) | [Lesson](../lessons/004-json-and-api-data-basics.md) | [Q&A](../qnas/004-json-and-api-data-basics.md) | [005 - Terminal, files, Git, and GitHub workflow](../lessons/005-terminal-files-git-and-github-workflow.md) |
