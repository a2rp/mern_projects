# 037 - Create an Express app and server — complete example

This example creates a small Express 5 service with separate app and server files. It includes JSON parsing, a root route, a health route, a JSON echo endpoint, and an explicit JSON 404 response. The commands and code are documented here; this repository does not run them.

## Question

How do you create an Express application, start its HTTP server, and inspect the responses from a few routes?

## What this example demonstrates

- Initializing a Node.js project and installing Express.
- Using ES modules with package.json.
- Keeping app configuration separate from starting the HTTP listener.
- Parsing JSON requests before the route that reads the body.
- Returning JSON from successful and not-found routes.
- Reading PORT and HOST from runtime configuration.
- Handling a server startup error without exposing it in an HTTP response.

## Prerequisites

- Node.js 18 or later and npm.
- PowerShell, since the setup and request commands below use Windows syntax.
- A new practice directory. Do not create this inside another Node project.

## 1. Create and configure the project

Run each command in PowerShell:

~~~powershell
New-Item -ItemType Directory -Path express-server-practice
Set-Location express-server-practice
npm init -y
npm install express
npm pkg set type=module
npm pkg set scripts.start="node src/server.js"
New-Item -ItemType Directory -Path src
~~~

npm install adds Express to package.json and generates or updates package-lock.json. Commit those two files so another developer can install the same resolved dependency tree with npm install. Keep node_modules out of Git.

The type setting makes .js files in this package use ECMAScript modules, so the source can use import and export.

Create this project structure:

~~~text
express-server-practice/
├── src/
│   ├── app.js
│   └── server.js
├── package-lock.json
└── package.json
~~~

## 2. Create src/app.js

Save this complete application file as src/app.js:

~~~javascript
import express from "express";

const app = express();

app.disable("x-powered-by");
app.use(express.json({ limit: "100kb" }));

app.get("/", (req, res) => {
  res.status(200).json({
    message: "MERN API server is running"
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok"
  });
});

app.post("/api/v1/echo", (req, res) => {
  if (
    req.body === null ||
    typeof req.body !== "object" ||
    Array.isArray(req.body)
  ) {
    return res.status(400).json({
      error: "A JSON object body is required."
    });
  }

  return res.status(200).json({
    received: req.body
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: "Route not found."
  });
});

export default app;
~~~

The JSON parser runs before the routes. It parses a valid JSON request body into req.body. The echo route checks that the body is an object, then sends it back under received. The example does not save the submitted data.

The last app.use() handles paths that did not match earlier routes. Because it is registered after the routes, it can send a deliberate JSON 404 response.

## 3. Create src/server.js

Save this complete server file as src/server.js:

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

  console.log("Express server is listening on port " + actualPort);
  console.log("Local URL: http://localhost:" + actualPort);
});

server.on("error", (error) => {
  console.error("Express server failed to start:", error.message);
  process.exitCode = 1;
});
~~~

The app module defines routes but does not start listening as a side effect. The server module owns the network listener and its runtime settings. If PORT is 0, the operating system chooses an available port, and server.address() provides the assigned value after the server starts.

The default host, 127.0.0.1, keeps this practice server local to the same machine. A container deployment may require HOST=0.0.0.0 so traffic can reach the process through the container network; use that only when the deployment's network boundaries are configured intentionally.

## 4. Start the server

~~~powershell
npm start
~~~

With no PORT or HOST variable set, the terminal should show:

~~~text
Express server is listening on port 3000
Local URL: http://localhost:3000
~~~

Keep that terminal open while making requests. Press Ctrl+C in the same terminal when finished.

## 5. Request the root route

In another PowerShell window:

~~~powershell
curl.exe -i http://localhost:3000/
~~~

Expected response body:

~~~json
{
  "message": "MERN API server is running"
}
~~~

The response status is 200 OK.

## 6. Request the liveness route

~~~powershell
curl.exe -i http://localhost:3000/health
~~~

Expected response body:

~~~json
{
  "status": "ok"
}
~~~

The response status is 200 OK. This confirms the process answered an HTTP request. It does not check MongoDB or prove that the application is ready to serve every operation.

## 7. Send a JSON request body

~~~powershell
curl.exe -i -X POST http://localhost:3000/api/v1/echo -H "Content-Type: application/json" --data-raw '{"topic":"MERN","chapter":37}'
~~~

Expected response body:

~~~json
{
  "received": {
    "topic": "MERN",
    "chapter": 37
  }
}
~~~

The response status is 200 OK. The request's Content-Type tells the server that the body is JSON. The express.json() middleware parses the body before the route runs.

## 8. Request an unknown route

~~~powershell
curl.exe -i http://localhost:3000/unknown
~~~

Expected response status and body:

~~~http
HTTP/1.1 404 Not Found
Content-Type: application/json; charset=utf-8
~~~

~~~json
{
  "error": "Route not found."
}
~~~

## Expected behavior summary

| Request | Expected status | Expected result |
| --- | --- | --- |
| GET / | 200 | JSON message confirms the API process is responding |
| GET /health | 200 | JSON liveness status is ok |
| POST /api/v1/echo with a JSON object | 200 | The parsed object is returned under received |
| GET /unknown | 404 | JSON not-found message |

Exact headers and formatting can vary with Node.js, Express, and curl versions. The status and JSON values are the contract for this example.

## How it works

1. npm creates the project manifest, installs Express, and writes the dependency lock file.
2. package.json declares the ES module mode and the start script.
3. app.js creates an Express app, registers JSON middleware, then registers routes and a final not-found handler.
4. server.js reads and validates PORT and HOST before starting app.listen().
5. Node accepts HTTP connections and Express dispatches each request through the configured app.
6. The server logs its chosen port but does not print secrets or request bodies.

## Common mistakes

- Running npm start from a parent directory that does not contain this package.json.
- Forgetting the .js extension in an ES module relative import.
- Installing Express globally instead of as a project dependency.
- Registering express.json() after the route that reads req.body.
- Using Content-Type other than application/json for a JSON request.
- Binding to 127.0.0.1 and expecting another machine to connect.
- Returning from middleware without sending a response or passing control onward.
- Treating the liveness route as proof that MongoDB is ready.
- Returning internal stack traces or secrets in public responses.
- Committing node_modules instead of the package manifest and lock file.

## Safety and scope

This is a local starter server. It has no authentication, database persistence, CORS policy, rate limiting, or production deployment configuration. Add those deliberately in the chapters that cover each concern. Do not expose a learning server to an untrusted network.

## Chapter navigation

| Previous chapter | Chapter Q&A | Next chapter |
| --- | --- | --- |
| [036 - REST API design and resource modeling](../lessons/036-rest-api-design-and-resource-modeling.md) | [Q&A](../qnas/037-create-an-express-app-and-server.md) | [037 - Create an Express app and server](../lessons/037-create-an-express-app-and-server.md) |
