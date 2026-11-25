# Example 003 - HTTP Requests, Responses, Methods, and Status Codes

## Question

Use a small local API to observe how the request method changes an operation and how the status code describes the result.

You will be able to request a task list, create a task, replace or partially update one, delete one, and inspect the response status and body.

## Goal

This example puts the HTTP concepts from lesson 003 into one browser page and one Node.js server:

- The browser acts as the client.
- The server reads the request method and path.
- The server returns a status code and, when appropriate, a JSON body.
- The browser displays the response without assuming that every response is successful.

The API uses an in-memory array, so its data resets when the server restarts. No database is used in this example.

## Complete example

Save this as **server.mjs**:

~~~js
import { createServer } from "node:http";

let tasks = [
  {
    id: "1",
    title: "Read the HTTP lesson",
    completed: false
  }
];

let nextId = 2;

const page = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>HTTP methods and status codes</title>
    <style>
      body {
        max-width: 52rem;
        margin: 2rem auto;
        padding: 0 1rem;
        font-family: system-ui, sans-serif;
        line-height: 1.5;
      }

      label {
        display: block;
        margin-top: 1rem;
        font-weight: 700;
      }

      input,
      select,
      textarea,
      button {
        box-sizing: border-box;
        width: 100%;
        padding: 0.65rem;
        font: inherit;
      }

      textarea {
        min-height: 8rem;
        font-family: ui-monospace, monospace;
      }

      button {
        margin-top: 1rem;
        cursor: pointer;
      }

      pre {
        overflow: auto;
        padding: 1rem;
        background: #f1f5f9;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>HTTP request explorer</h1>
      <p>
        Choose a method, enter an API path, and inspect the returned status
        and body.
      </p>

      <label for="method">Request method</label>
      <select id="method">
        <option>GET</option>
        <option>POST</option>
        <option>PUT</option>
        <option>PATCH</option>
        <option>DELETE</option>
      </select>

      <label for="path">Request path</label>
      <input id="path" value="/api/tasks">

      <label for="body">JSON request body</label>
      <textarea id="body">{"title":"Study HTTP","completed":false}</textarea>

      <button id="send" type="button">Send request</button>

      <h2>Response</h2>
      <pre id="result" role="status">Choose a method and send a request.</pre>
    </main>

    <script>
      const methodField = document.querySelector("#method");
      const pathField = document.querySelector("#path");
      const bodyField = document.querySelector("#body");
      const result = document.querySelector("#result");

      document.querySelector("#send").addEventListener("click", async () => {
        const method = methodField.value;
        const options = {
          method,
          headers: {
            Accept: "application/json"
          }
        };

        if (["POST", "PUT", "PATCH"].includes(method)) {
          options.headers["Content-Type"] = "application/json";
          options.body = bodyField.value;
        }

        try {
          const response = await fetch(pathField.value, options);
          const responseBody = await response.text();
          const resultType = response.ok ? "HTTP success" : "HTTP error";

          result.textContent =
            resultType +
            ": " +
            response.status +
            " " +
            response.statusText +
            "\n\n" +
            (responseBody || "(No response body)");
        } catch (error) {
          result.textContent = "Network or browser error: " + error.message;
        }
      });
    </script>
  </body>
</html>`;

function sendJson(response, status, value, extraHeaders = {}) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    ...extraHeaders
  });
  response.end(JSON.stringify(value));
}

function hasJsonContentType(request) {
  const contentType = request.headers["content-type"] || "";
  return contentType.split(";")[0].trim().toLowerCase() === "application/json";
}

async function readJson(request) {
  let text = "";

  for await (const chunk of request) {
    text += chunk;
  }

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    const error = new Error("The request body must contain valid JSON.");
    error.statusCode = 400;
    throw error;
  }
}

function isJsonObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function validTitle(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function sendMethodNotAllowed(response, allow) {
  sendJson(
    response,
    405,
    { error: "This method is not allowed for this resource." },
    { Allow: allow }
  );
}

const server = createServer(async (request, response) => {
  const url = new URL(
    request.url || "/",
    "http://" + (request.headers.host || "localhost")
  );
  const path = url.pathname;
  const method = request.method || "GET";

  if (method === "GET" && path === "/") {
    response.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8"
    });
    response.end(page);
    return;
  }

  if (path === "/api/tasks") {
    if (method === "GET") {
      sendJson(response, 200, { tasks });
      return;
    }

    if (method === "POST") {
      if (!hasJsonContentType(request)) {
        sendJson(response, 415, {
          error: "Send the request body as application/json."
        });
        return;
      }

      try {
        const body = await readJson(request);

        if (!isJsonObject(body) || !validTitle(body.title)) {
          sendJson(response, 400, {
            error: "A non-empty task title is required."
          });
          return;
        }

        const task = {
          id: String(nextId++),
          title: body.title.trim(),
          completed: false
        };

        tasks.push(task);

        sendJson(
          response,
          201,
          { task },
          { Location: "/api/tasks/" + task.id }
        );
        return;
      } catch (error) {
        sendJson(response, error.statusCode || 500, {
          error: error.message || "The server could not create the task."
        });
        return;
      }
    }

    sendMethodNotAllowed(response, "GET, POST");
    return;
  }

  const itemMatch = path.match(/^\/api\/tasks\/([0-9]+)$/);

  if (itemMatch) {
    const id = itemMatch[1];
    const taskIndex = tasks.findIndex((task) => task.id === id);

    if (method === "GET") {
      if (taskIndex === -1) {
        sendJson(response, 404, { error: "Task not found." });
        return;
      }

      sendJson(response, 200, { task: tasks[taskIndex] });
      return;
    }

    if (method === "PUT") {
      if (!hasJsonContentType(request)) {
        sendJson(response, 415, {
          error: "Send the request body as application/json."
        });
        return;
      }

      try {
        const body = await readJson(request);

        if (!isJsonObject(body) || !validTitle(body.title) || typeof body.completed !== "boolean") {
          sendJson(response, 400, {
            error: "PUT requires a non-empty title and a boolean completed value."
          });
          return;
        }

        if (taskIndex === -1) {
          sendJson(response, 404, { error: "Task not found." });
          return;
        }

        tasks[taskIndex] = {
          id,
          title: body.title.trim(),
          completed: body.completed
        };

        sendJson(response, 200, { task: tasks[taskIndex] });
        return;
      } catch (error) {
        sendJson(response, error.statusCode || 500, {
          error: error.message || "The server could not replace the task."
        });
        return;
      }
    }

    if (method === "PATCH") {
      if (!hasJsonContentType(request)) {
        sendJson(response, 415, {
          error: "Send the request body as application/json."
        });
        return;
      }

      try {
        const body = await readJson(request);

        if (!isJsonObject(body)) {
          sendJson(response, 400, { error: "PATCH body must be a JSON object." });
          return;
        }

        const hasTitle = Object.prototype.hasOwnProperty.call(body, "title");
        const hasCompleted = Object.prototype.hasOwnProperty.call(body, "completed");
        const hasUnknownField = Object.keys(body).some(
          (key) => key !== "title" && key !== "completed"
        );

        if (
          taskIndex === -1
        ) {
          sendJson(response, 404, { error: "Task not found." });
          return;
        }

        if (
          (!hasTitle && !hasCompleted) ||
          hasUnknownField ||
          (hasTitle && !validTitle(body.title)) ||
          (hasCompleted && typeof body.completed !== "boolean")
        ) {
          sendJson(response, 400, {
            error: "PATCH needs a valid title or completed value."
          });
          return;
        }

        if (hasTitle) {
          tasks[taskIndex].title = body.title.trim();
        }

        if (hasCompleted) {
          tasks[taskIndex].completed = body.completed;
        }

        sendJson(response, 200, { task: tasks[taskIndex] });
        return;
      } catch (error) {
        sendJson(response, error.statusCode || 500, {
          error: error.message || "The server could not update the task."
        });
        return;
      }
    }

    if (method === "DELETE") {
      if (taskIndex === -1) {
        sendJson(response, 404, { error: "Task not found." });
        return;
      }

      tasks.splice(taskIndex, 1);
      response.writeHead(204);
      response.end();
      return;
    }

    sendMethodNotAllowed(response, "GET, PUT, PATCH, DELETE");
    return;
  }

  sendJson(response, 404, { error: "This path was not found." });
});

server.listen(3000, "127.0.0.1", () => {
  console.log("Open http://127.0.0.1:3000");
});
~~~

The template string around the HTML page must use opening and closing backticks in the JavaScript file. The code block displays them as part of the server source.

## How to try it

1. Save the code as **server.mjs**.
2. Open a terminal in that folder.
3. Start the local server:

~~~sh
node server.mjs
~~~

4. Open **http://127.0.0.1:3000** in a browser.
5. Use the request method, path, and JSON body fields, then select **Send request**.

The sample server listens on the local loopback address and keeps its tasks in memory. Restarting the process resets the list.

## Requests to try

### Read the task list

Choose GET and use this path:

~~~text
/api/tasks
~~~

Expected response: status **200 OK** and a JSON object containing the task list.

### Create a task

Choose POST, use the collection path, and send this body:

~~~json
{
  "title": "Practice HTTP methods"
}
~~~

Expected response: status **201 Created**, a JSON body containing the new task, and a Location header pointing to the created task.

### Replace a task

Choose PUT, use an existing task path such as **/api/tasks/1**, and send the complete representation:

~~~json
{
  "title": "Read the HTTP lesson again",
  "completed": true
}
~~~

Expected response: status **200 OK** and the replaced task. Both title and completed are required by this example's API contract.

### Partially update a task

Choose PATCH, use **/api/tasks/1**, and send only the field to change:

~~~json
{
  "completed": true
}
~~~

Expected response: status **200 OK**. The title remains as it was, while completed changes to true.

### Delete a task

Choose DELETE and use **/api/tasks/1**.

Expected response: status **204 No Content** with an empty body. The browser page displays the status and “No response body.”

### Trigger common errors

- Choose POST with an empty title to receive **400 Bad Request**.
- Use a request body with an unsupported content type to receive **415 Unsupported Media Type**. The browser explorer sends JSON for POST, PUT, and PATCH by default.
- Request **/api/tasks/999** with GET to receive **404 Not Found**.
- Choose DELETE for an already deleted task to receive **404 Not Found**.
- Choose POST for **/api/tasks/1** to receive **405 Method Not Allowed** and an Allow header.

## Expected output

For the initial GET request, the response panel shows a status similar to:

~~~text
HTTP success: 200 OK

{"tasks":[{"id":"1","title":"Read the HTTP lesson","completed":false}]}
~~~

After creating a task, the panel shows **201 Created** and the created task. After deleting a task, it shows **204 No Content** followed by **(No response body)**.

For a rejected request, the panel labels the response **HTTP error** and shows its status and JSON error message. A network or browser failure is reported separately.

## Explanation

- The browser is the client because it sends requests when you select the button.
- The Node.js program is the server because it receives requests and creates responses.
- The request method selects the operation: GET reads, POST creates, PUT replaces, PATCH partially changes, and DELETE removes.
- The server returns a specific status for success and common errors.
- The Content-Type request header tells the server that the submitted body is JSON.
- The response Content-Type tells the browser that returned data is JSON.
- A 201 response describes a newly created task. A 204 response has no body.
- A 404 response means the server was reached but could not find that task or path.
- A 405 response means the resource exists in this small API but does not allow the selected method; the Allow header lists supported methods.
- The server keeps data in an array for this demonstration. A later MERN chapter uses MongoDB for persistent data.

## What this example teaches

- A method and a path work together to identify an API operation.
- Status codes and response bodies give related but distinct information.
- The client should inspect status and handle an empty response body.
- Validation errors, missing records, unsupported methods, and network failures are separate cases.
- A successful DELETE does not need to return JSON.
- The API contract defines which fields PUT and PATCH accept.

## Try it yourself

1. Create two tasks. Which status does each successful POST return?
2. Repeat a DELETE request for the same task. Why can the response status differ while the intended result stays the same?
3. Change a PATCH request to send an empty object. Which status appears?
4. Use PUT with only a title. Why does this example reject the request?
5. Change the path to **/api/tasks** and choose DELETE. Which status and Allow value do you expect?
6. Stop the server and send a request from the page. Is the result an HTTP status or a network error?

## Important note

This local teaching server has no authentication, persistent database, request-size limit, or production deployment configuration. Do not expose it as a public service. Later lessons add the safeguards and persistence needed for a real application.

## Related chapter files

- [Lesson 003 - HTTP requests, responses, methods, and status codes](../lessons/003-http-requests-responses-methods-and-status-codes.md)
- [Q&A 003 - HTTP requests, responses, methods, and status codes](../qnas/003-http-requests-responses-methods-and-status-codes.md)

---

### Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Next chapter |
| :--- | --- | --- | ---: |
| [002 - How browsers, servers, and clients communicate](../lessons/002-how-browsers-servers-and-clients-communicate.md) | [Lesson](../lessons/003-http-requests-responses-methods-and-status-codes.md) | [Q&A](../qnas/003-http-requests-responses-methods-and-status-codes.md) | [004 - JSON and API data basics](../lessons/004-json-and-api-data-basics.md) |
