# 002 - How Browsers, Servers, and Clients Communicate

When you open a page or submit a form, your browser communicates with another program over a network. This lesson introduces the client-server model and follows a request from the browser to a server and back.

The goal is to understand the communication pattern before studying the detailed parts of HTTP in the next chapter.

## What you will learn

By the end of this lesson, you should be able to:

- Explain what client and server mean in a communication.
- Describe what a browser does when it requests a web page.
- Distinguish the browser, web server, application server, and database.
- Identify the basic parts of a request and response.
- Explain how a React frontend later communicates with an Express API.
- Recognize that network, server, and application failures are different.

## Client and server are roles

A **client** is a program that initiates a request for a resource or action. A **server** is a program that accepts requests and sends responses. These names describe the role a program plays in a particular exchange; they do not have to describe different kinds of computers.

In a typical web visit:

- Your **browser** acts as a client.
- A **web server** accepts the browser's request and provides a response.
- That response might be a file, such as HTML, CSS, JavaScript, or an image.
- For an application request, a backend program may run code, read data, and produce a response.

A single computer can run both client and server programs. A program can also act as a client in one exchange and as a server in another. For example, an Express application acts as a server when it receives a browser request, then may act as a client when it requests information from another service.

## A web request at a high level

When someone enters a web address or follows a link, the browser needs to contact the server responsible for that address. A simplified mental model is:

1. The browser interprets the address and identifies the destination.
2. The browser establishes or reuses a suitable network connection. For an HTTPS address, secure communication is established.
3. The browser sends a request describing what it needs.
4. A server or an intermediary such as a proxy receives and routes the request.
5. The responsible server processes the request and sends a response.
6. The browser interprets the response. For a web page, it may request more files referenced by the document.
7. The browser renders the page and runs allowed scripts.

Real browsers and networks do more work, and some steps can happen in parallel or use cached information. The details also depend on the HTTP version and deployment. For learning full-stack development, keep the central idea in mind: a client sends a request, and a server responds.

## What a server might return

A request for a website can return a static file, such as an HTML document. The browser may then request its stylesheet, scripts, fonts, and images.

A request to an API can return data instead of a complete page. A React application commonly loads its interface and then requests data from an API. The API may return JSON for React to display.

| Request purpose | Possible response |
| --- | --- |
| Open a page | HTML document |
| Load a stylesheet | CSS file |
| Load an image | Image data |
| Read a task list | JSON data containing tasks |
| Create a task | JSON data for the created task and an HTTP status |

A **web server** is the software that accepts web requests. It may serve files itself, forward requests to another application, or combine these approaches. The terms “web server” and “application server” describe responsibilities that may be handled by separate programs or by parts of the same deployment.

## The request and response

An HTTP request commonly contains:

- A **method**, which describes the requested operation, such as GET or POST.
- A **target**, identifying the resource or endpoint.
- **Headers**, which provide information about the request or its content.
- Sometimes a **body**, containing submitted data such as JSON.

A response commonly contains:

- A **status code**, describing the result at the HTTP level.
- **Headers**, describing the response and its content.
- Sometimes a **body**, containing the requested document, data, or an error explanation.

Here is a simplified example of a browser asking for its task list:

~~~http
GET /api/tasks
Accept: application/json
~~~

A server might answer:

~~~http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "tasks": [
    {
      "id": "task-123",
      "title": "Read the next lesson",
      "completed": false
    }
  ]
}
~~~

The request and response are messages in a protocol. The browser does not need to know how the server stores the tasks. It needs to understand the agreed endpoint and response format.

## The browser is more than a page viewer

A browser can make requests for several reasons:

- A person enters an address or clicks a link.
- The browser loads resources such as CSS, JavaScript, images, and fonts.
- A form submits information.
- Client-side JavaScript calls an API.
- A page requests information again after a user action.

The same browser can act as the client for the initial page request and later requests made by the page's JavaScript. A React interface uses browser capabilities to display the page and send requests; React itself is not the network or the server.

## From a browser request to a MERN request

A MERN application often has two related communication stages:

~~~text
A. Load the frontend
Browser -> web server or frontend host -> HTML, CSS, JavaScript files

B. Use the frontend
Browser running React -> HTTP API -> Express on Node.js -> MongoDB
Browser running React <- HTTP response <- Express on Node.js <- query result
~~~

The initial frontend request and a later API request may go to the same origin or to different origins. Either way, React does not normally connect directly to MongoDB. The backend receives the request, checks it, and accesses the database.

The Express route and its middleware form part of the server's request handling. The backend can validate the input, check identity and permissions, call the data layer, and choose the response. The browser then decides how to present that response.

## Requests can succeed or fail at different layers

Communication has several boundaries, and each can fail in a different way:

- **Network failure:** the browser cannot reach the server or the connection is interrupted.
- **HTTP error response:** the server was reached but reports a problem, such as invalid input or a missing resource.
- **Application error:** the server encountered an unexpected problem while handling the request.
- **Data error:** the requested record does not exist, or the database operation failed.
- **Display error:** the request succeeded, but the frontend could not interpret or present the response as expected.

A browser's JavaScript fetch API generally resolves with a response when an HTTP response is received, including an HTTP error status. The code must check the status instead of assuming every resolved request succeeded. A network failure, by contrast, may reject the request promise.

A page should give the user a useful state for work that is loading, successful, or unsuccessful. The frontend should not show a saved record until it has a successful response or another deliberate confirmation strategy.

## HTTP is stateless by default

HTTP request semantics are designed so each request can be understood on its own. A server should not assume that two requests came from the same signed-in person just because they use the same connection.

Applications that need to recognize a signed-in user provide appropriate identity information with requests, such as a session cookie or a token, and the server validates it. The exact authentication design is a later topic. For now, remember that connection reuse alone does not authenticate a user.

## A local development example

On your own computer, the browser and server can communicate through a local address. For example, a development frontend might be served from one local port while an Express API listens on another. Both programs run on the same machine, but the browser still sends requests to the server through the normal web communication model.

In this arrangement:

- The browser is the client.
- The React development server may serve frontend files.
- The Express process accepts API requests.
- MongoDB is a separate database service or hosted deployment.
- The frontend needs the API's address to send data requests.

Using a local machine does not make the browser and backend the same program. They remain separate roles with a defined boundary.

## Common misunderstandings

- **A client is always a physical computer.** It is a program's role in a particular request.
- **A server is always a special machine.** A server is software that accepts and responds to requests; it may run locally or remotely.
- **The browser sends only one request for a page.** It may request many files and later make API requests.
- **Every server response is a web page.** APIs often return data, commonly JSON.
- **A successful network request means the application operation succeeded.** The response status and content must still be checked.
- **A reused connection proves who the user is.** Authentication must be provided and verified separately.
- **The browser should talk straight to the database.** The backend normally controls and protects database access.

## Try it yourself

1. Describe one example where a browser is a client and a server is software rather than a physical device.
2. Name four kinds of files or data a browser may request.
3. Identify the method, target, header, and body in a request example from this lesson.
4. What is the difference between an HTTP error response and a network failure?
5. Why can the first page request and a later API request be separate exchanges?
6. In a local MERN project, identify the client, frontend process, API process, and database.
7. Explain why a persistent network connection does not prove that two requests came from the same signed-in user.

## Key points

- Client and server describe roles in a communication.
- A browser sends requests and interprets responses; a server accepts requests and sends responses.
- HTTP messages have request or response information such as methods, targets, headers, status codes, and optional bodies.
- A web page may require many requests for its files and its application data.
- A MERN browser frontend communicates with an API; the backend mediates access to MongoDB.
- Check response status and handle network failures, server errors, and application states separately.
- HTTP connection reuse is not a substitute for authentication.

---

### Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| :--- | --- | --- | ---: |
| [001 - Course overview and MERN architecture](001-course-overview-and-mern-architecture.md) | [Q&A](../qnas/002-how-browsers-servers-and-clients-communicate.md) | [Example](../examples/002-how-browsers-servers-and-clients-communicate.md) | [003 - HTTP requests, responses, methods, and status codes](003-http-requests-responses-methods-and-status-codes.md) |
