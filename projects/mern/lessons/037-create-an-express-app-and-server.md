# 037 - Create an Express app and server

Express is a web framework for Node.js. It provides an application object for registering middleware and route handlers, then lets Node accept HTTP connections and pass each request through that application.

This chapter builds the smallest useful Express service and separates the app definition from starting the network listener. Later chapters add route modules, request validation, MongoDB connections, and centralized errors.

## Learning goals

By the end of this chapter, you should be able to:

- Create a Node.js project and install Express.
- Build an Express application and register a few initial routes.
- Parse JSON request bodies with Express middleware.
- Start an HTTP server on a configurable port and host.
- Distinguish the Express app from the running server.
- Diagnose common startup and request problems safely.

## What Express provides

Express is a Node.js web framework. An Express application is configured by registering settings, middleware, and routes. When a request arrives, Express runs the matching middleware and route handlers in order.

Express does not replace Node.js or MongoDB:

- Node.js runs the JavaScript process.
- Express handles the HTTP request and response flow.
- MongoDB stores application data; a later chapter connects it to the app.

The app can be created without opening a network port. A separate server entry point imports that app and starts listening. This separation makes it easier to reuse the app in later testing and deployment setups.

## Create the project

Use a supported Node.js release. Express 5 requires Node.js 18 or later. In a new practice directory, initialize npm and install Express:

~~~powershell
mkdir express-server-practice
cd express-server-practice
npm init -y
npm install express
npm pkg set type=module
npm pkg set scripts.start="node src/server.js"
~~~

npm creates package.json and a lock file. Keep both under version control so the declared dependency and exact dependency tree can be reproduced. Do not commit node_modules; it is recreated with npm install.

The type setting makes ordinary .js files in this package use ECMAScript modules. This matches the import/export syntax used in the course.

Create this structure:

~~~text
express-server-practice/
├── src/
│   ├── app.js
│   └── server.js
├── package-lock.json
└── package.json
~~~

## Build the Express application

An Express application is a function-like request handler with methods for configuration and routes. A small app can add JSON parsing, a root route, a health route, a demonstration JSON endpoint, and a final not-found handler.

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

express.json() is built-in middleware. It parses JSON request bodies and makes the parsed value available as req.body. It must be registered before routes that read req.body. The 100 KB limit bounds the size accepted by this practice endpoint; production limits should reflect the application's real needs.

app.get() and app.post() register route handlers for an HTTP method and path. res.status() sets a status code, and res.json() sends a JSON response. A route handler must finish the response or pass control onward; otherwise the request remains open.

The example disables the X-Powered-By response header. This is a small information-reduction setting, not a replacement for secure configuration, validation, authentication, or authorization.

## Start the HTTP server

The app definition does not listen on a port. The server entry point reads deployment configuration, validates the port, and starts listening:

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

The PORT environment variable lets the runtime or hosting platform choose the listening port. Port 0 asks the operating system for an available port, which is useful for isolated examples; the callback reads back the assigned port.

The HOST setting controls which network interface accepts connections. The default 127.0.0.1 is appropriate for local-only practice. A container or deployment may need a different host such as 0.0.0.0 so traffic can reach the process through the container network. Only use a broader binding when the deployment network and firewall are configured intentionally.

app.listen() creates and starts the underlying Node HTTP server. The returned server object can be used for network-server events and shutdown. Database startup coordination and graceful shutdown are covered when the application begins managing MongoDB connections.

## App versus server

Keep the responsibilities clear:

- **app.js** configures Express: middleware, routes, and app-level settings.
- **server.js** reads runtime configuration and starts the listener.
- **package.json** declares the project type, scripts, and dependencies.
- **package-lock.json** records the resolved dependency tree.

Do not put database credentials in app.js or server.js. Read secrets from protected runtime configuration when a later chapter connects the service to MongoDB.

## Start and inspect the service

~~~powershell
npm start
~~~

With no PORT variable set, the console should show:

~~~text
Express server is listening on port 3000
Local URL: http://localhost:3000
~~~

Open the local URL in a browser or use an HTTP client. The root route returns JSON, /health returns a simple liveness response, and an unknown path returns a JSON 404.

A health route in this chapter confirms only that the process can answer an HTTP request. It does not confirm that MongoDB or every dependency is healthy. Later health-check design should distinguish liveness from readiness.

To stop the local server, press Ctrl+C in the terminal running it. Production shutdown should stop accepting new requests and close active connections deliberately.

## Common startup problems

- **Cannot find package express:** install dependencies from the project directory with npm install.
- **Cannot find module ./app.js:** check that src/app.js exists and that the import path includes its extension.
- **Address already in use:** another process is listening on the chosen port. Stop that process or choose another PORT.
- **The process starts but another device cannot connect:** the service may be bound to loopback only, or the host firewall/network may block the request. Do not broaden the binding until the intended network boundary is clear.
- **req.body is undefined:** confirm express.json() is registered before the route, the request includes a JSON Content-Type, and the body is valid JSON.
- **Browser shows an error while the terminal shows a stack trace:** inspect the server-side error without returning stack traces, secrets, or database details to a production client.

## Practical checklist

Before extending the starter service:

- Use a supported Node.js version and install Express as a project dependency.
- Commit package.json and the lock file; exclude node_modules.
- Use one module system consistently.
- Build and export the app separately from starting the server.
- Register required body parsers before routes that use them.
- Configure the port and host through runtime settings.
- Bind to a local interface during local-only practice.
- Return an intentional response from each route.
- Keep secrets out of source files and public error responses.
- Plan startup, health checks, and graceful shutdown before connecting external services.

## Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [036 - REST API design and resource modeling](036-rest-api-design-and-resource-modeling.md) | [Q&A](../qnas/037-create-an-express-app-and-server.md) | [Example](../examples/037-create-an-express-app-and-server.md) | [038 - Middleware order and request lifecycle](038-middleware-order-and-request-lifecycle.md) |
