# Example 002 - How Browsers, Servers, and Clients Communicate

## Question

Create a tiny local server that sends a web page to a browser and provides a JSON endpoint. When the person selects a button, the browser should request the endpoint and display the server's message.

Identify which program is the client, which program is the server, and what travels in each request and response.

## Goal

See two browser-server exchanges:

1. The browser requests a page and receives HTML.
2. The page's JavaScript requests data and receives JSON.

This small example uses Node.js's built-in HTTP module to make the communication visible. It does not use Express or MongoDB yet; those are introduced later. The code is displayed here as text and is not run by this Markdown page.

## Prerequisite

To try the example yourself, install Node.js, save the server code below as `server.mjs`, and use a terminal in that file's folder. The next Node.js lessons explain setup and project files in more detail.

## Complete example: one local server and one browser client

~~~js
import { createServer } from "node:http";

const page = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Browser and server example</title>
  </head>
  <body>
    <main>
      <h1>Ask the server</h1>
      <p id="message" role="status">Select the button to request a message.</p>
      <button id="request-button" type="button">Ask the server</button>
    </main>

    <script>
      const message = document.querySelector("#message");
      const button = document.querySelector("#request-button");

      button.addEventListener("click", async () => {
        message.textContent = "Waiting for the server...";

        try {
          const response = await fetch("/api/greeting");
          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || "The request was not successful.");
          }

          message.textContent = data.message;
        } catch (error) {
          message.textContent = error.message;
        }
      });
    </script>
  </body>
</html>`;

const server = createServer((request, response) => {
  if (request.method === "GET" && request.url === "/") {
    response.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8"
    });
    response.end(page);
    return;
  }

  if (request.method === "GET" && request.url === "/api/greeting") {
    response.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8"
    });
    response.end(JSON.stringify({
      message: "Hello from the server."
    }));
    return;
  }

  response.writeHead(404, {
    "Content-Type": "application/json; charset=utf-8"
  });
  response.end(JSON.stringify({
    error: "This address was not found."
  }));
});

server.listen(3000, "127.0.0.1", () => {
  console.log("Server listening at http://127.0.0.1:3000");
});
~~~

The HTML page is stored as a template string in the server file; the opening and closing backticks delimit that string.

## How to try it

1. Save the code as `server.mjs`.
2. Open a terminal in the same folder.
3. Start the server with:

~~~sh
node server.mjs
~~~

4. Open `http://127.0.0.1:3000` in a browser.
5. Select **Ask the server**.

The server listens only on the local loopback address, so this example is intended for local learning.

## Expected output

The page initially displays:

~~~text
Ask the server

Select the button to request a message.
[Ask the server]
~~~

After the button is selected, the browser requests `/api/greeting`. When the response arrives, the page displays:

~~~text
Ask the server

Hello from the server.
[Ask the server]
~~~

The browser's Network panel will show a successful request for `/` when loading the page and a second successful request for `/api/greeting` after the button is selected. The first response contains HTML; the second contains JSON.

If you request an unknown address such as `/missing`, the server responds with a 404 status and a JSON error. An HTTP error response is still a response; the browser received a status and content from the server.

## Follow the first exchange: loading the page

When the browser opens `http://127.0.0.1:3000`:

1. The browser acts as the **client** and sends a GET request for `/`.
2. Node.js runs the server program and receives that request.
3. The server matches the method and path.
4. The server sets a successful status and a content type of HTML.
5. The server sends the HTML page in the response body.
6. The browser interprets the HTML, displays the heading, paragraph, and button, and prepares the page script.

The response's content type helps the browser interpret the body as an HTML document.

## Follow the second exchange: requesting data

When the person selects the button:

1. The event handler in the browser runs.
2. The page's JavaScript calls `fetch("/api/greeting")`.
3. The browser sends a new GET request to the same server.
4. Node.js receives the request and matches the `/api/greeting` route.
5. The server serializes a JavaScript object as JSON and sends it with an application/json content type.
6. The browser reads the response body as JSON.
7. The page displays the message using `textContent`.

The endpoint returns data, not a second HTML page. The browser remains responsible for displaying that data in the existing page.

## Request and response summary

| Exchange | Request | Response |
| --- | --- | --- |
| Load page | GET `/` | 200 status, HTML body |
| Ask for message | GET `/api/greeting` | 200 status, JSON body |
| Ask for an unknown path | GET `/missing` | 404 status, JSON error body |

The request method and path help the server decide what the client wants. The response status describes the result, and the content type helps the browser interpret the response body.

## Explanation

- `createServer` creates an HTTP server using Node.js's built-in module.
- The browser is the client because it initiates both requests.
- The Node.js program is the server because it accepts requests and sends responses.
- The server checks both the request method and path before selecting a response.
- A 200 status represents a successful response in this example; a 404 status represents an unknown path.
- The HTML response contains the interface. The JSON response contains data for the existing interface.
- `fetch` is a browser API for making a request. A response with an error status still needs to be checked through `response.ok`.
- `textContent` inserts the message as text instead of interpreting it as HTML.
- No database is involved. A later MERN feature can have an Express route read or write MongoDB data before returning its response.
- This example uses a Node.js server directly to reveal the client-server exchange. Express provides a more convenient routing and middleware layer for larger applications.

## Try changing the example

1. Change the message in the JSON response and reload the page.
2. Change the button's request path to `/missing`. What status and message appear?
3. Change the page route's content type to JSON. Why would that no longer describe an HTML page correctly?
4. Add a new route that returns a different JSON value, then add a button that requests it.
5. Explain why the browser is still the client even though JavaScript inside the page sends the second request.

## Important note

This is a local learning example, not a production server. A production application needs deliberate input handling, security controls, robust error handling, logging, configuration, and deployment settings. Later lessons add these practices and introduce Express and MongoDB.

## Related chapter files

- [Lesson 002 - How browsers, servers, and clients communicate](../lessons/002-how-browsers-servers-and-clients-communicate.md)
- [Q&A 002 - How browsers, servers, and clients communicate](../qnas/002-how-browsers-servers-and-clients-communicate.md)

---

### Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Next chapter |
| :--- | --- | --- | ---: |
| [001 - Course overview and MERN architecture](../lessons/001-course-overview-and-mern-architecture.md) | [Lesson](../lessons/002-how-browsers-servers-and-clients-communicate.md) | [Q&A](../qnas/002-how-browsers-servers-and-clients-communicate.md) | [003 - HTTP requests, responses, methods, and status codes](../lessons/003-http-requests-responses-methods-and-status-codes.md) |
