# 043 - Connect an Express app to MongoDB: Example

## Question

How can an Express process connect to MongoDB before accepting requests, expose a safe database health endpoint, and close the connection during shutdown?

## What this example demonstrates

This small Express 5 application uses Mongoose 9 and demonstrates:

- Reading the MongoDB URI from the MONGODB_URI environment variable.
- Awaiting the initial connection before starting the HTTP listener.
- Reporting database readiness without exposing the connection URI.
- Logging later connection errors and disconnections safely.
- Closing the HTTP server before disconnecting Mongoose on SIGINT or SIGTERM.

The example does not define a schema or query a collection. It focuses on connection setup; later chapters cover async route errors and database-backed models.

## Requirements

Mongoose 9 requires Node.js 20.19.0 or higher. Check the installed runtime before installing dependencies:

~~~powershell
node --version
~~~

## Project structure

~~~text
express-mongodb-connection/
|-- .gitignore
|-- package.json
|-- src/
    |-- app.js
    |-- server.js
    |-- db/
        |-- connect.js
~~~

## Setup

~~~powershell
mkdir express-mongodb-connection
cd express-mongodb-connection
npm init -y
npm install express@5 mongoose@9
npm pkg set "scripts.start=node src/server.js"
~~~

## .gitignore

Do not commit local credentials or installed packages.

~~~gitignore
node_modules/
.env
~~~

## src/db/connect.js

This module owns the default Mongoose connection. It validates that a URI exists, installs listeners for later connection state changes, and waits for the first successful connection.

~~~js
const mongoose = require("mongoose");

let listenersRegistered = false;

async function connectDatabase(uri = process.env.MONGODB_URI) {
  if (typeof uri !== "string" || uri.trim().length === 0) {
    throw new Error("MONGODB_URI is required.");
  }

  if (!listenersRegistered) {
    mongoose.connection.on("disconnected", () => {
      console.error("MongoDB connection was lost.");
    });

    mongoose.connection.on("error", (error) => {
      const errorName = error && error.name
        ? error.name
        : "UnknownError";

      console.error("MongoDB connection error:", errorName);
    });

    listenersRegistered = true;
  }

  await mongoose.connect(uri);

  console.log("MongoDB connection established.");
  return mongoose.connection;
}

module.exports = connectDatabase;
~~~

The connection events do not replace catching the initial connect promise. The server startup code below awaits this function and handles a rejection before opening the HTTP listener.

## src/app.js

This module creates the Express application. Its health endpoint reports only whether Mongoose's default connection is ready.

~~~js
const express = require("express");
const mongoose = require("mongoose");

function createApp() {
  const app = express();

  app.disable("x-powered-by");

  app.get("/health/database", (req, res) => {
    const connected = mongoose.connection.readyState === 1;

    return res.status(connected ? 200 : 503).json({
      status: connected ? "ok" : "unavailable",
      database: connected ? "connected" : "disconnected"
    });
  });

  return app;
}

module.exports = createApp;
~~~

A health response should not contain the URI, username, password, raw driver error, or stack trace.

## src/server.js

The server first awaits the database connection. Only then does it listen for HTTP requests. On shutdown, it stops accepting requests, waits for active requests to finish, and closes Mongoose.

~~~js
const mongoose = require("mongoose");
const createApp = require("./app");
const connectDatabase = require("./db/connect");

const port = Number(process.env.PORT) || 3000;

async function startServer() {
  await connectDatabase();

  const app = createApp();
  const server = app.listen(port, () => {
    console.log("Express server listening on port " + port);
  });

  let isShuttingDown = false;

  function shutdown(signal) {
    if (isShuttingDown) {
      return;
    }

    isShuttingDown = true;
    console.log(signal + " received. Closing the HTTP server.");

    server.close(() => {
      mongoose.disconnect()
        .then(() => {
          console.log("MongoDB connection closed.");
        })
        .catch((error) => {
          const errorName = error && error.name
            ? error.name
            : "UnknownError";

          console.error("MongoDB shutdown error:", errorName);
          process.exitCode = 1;
        });
    });
  }

  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));

  return server;
}

startServer().catch((error) => {
  console.error(
    "Startup failed. Check MONGODB_URI, MongoDB availability, authentication, and network access."
  );

  if (error && error.name) {
    console.error("Error type:", error.name);
  }

  process.exitCode = 1;
});
~~~

If the URI is missing or the initial connection fails, startServer() rejects, the catch block reports a safe diagnostic, and app.listen() is never called.

## Configure a local MongoDB URI

Start a local MongoDB server using your installed MongoDB setup. In PowerShell, set the URI in the same terminal and start the app:

~~~powershell
$env:MONGODB_URI = "mongodb://127.0.0.1:27017/mern_learning"
npm start
~~~

If MongoDB is running and the connection succeeds, the terminal shows:

~~~text
MongoDB connection established.
Express server listening on port 3000
~~~

The environment variable is scoped to that PowerShell session. Set it again in a new terminal.

For a hosted cluster, use the private URI supplied by the provider and store it in an environment variable or secret manager. Do not paste real credentials into this example, source files, commits, or screenshots. Ensure the database user has limited permissions and that the network configuration permits this app to connect.

## Check database readiness

~~~powershell
curl.exe -i http://localhost:3000/health/database
~~~

Expected response while connected:

~~~http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{
  "status": "ok",
  "database": "connected"
}
~~~

If the connection is lost after startup, the route returns 503 and the process logs a safe disconnection message. A health route is only a status signal; it does not restore the database connection or replace handling errors from individual database operations.

## Test startup failure handling manually

Open a new PowerShell terminal and remove the URI for that terminal:

~~~powershell
Remove-Item Env:MONGODB_URI -ErrorAction SilentlyContinue
npm start
~~~

Expected behavior:

- Startup reports that configuration or the initial connection failed.
- The server does not print the listening message.
- No HTTP listener is opened.

Do not print environment variables to debug a hosted connection. Verify the setting name, database availability, network access, authentication, and URI format without exposing the secret.

## What to notice

- The connection function is called once during process startup.
- The initial connection promise is awaited.
- The HTTP server starts only after the connection succeeds.
- Later disconnections and errors are observable through connection events.
- The health response reveals status but not connection details.
- Shutdown is guarded against repeated signals.
- The HTTP server closes before Mongoose disconnects.
- The source contains no database credentials.
- Mongoose 9's Node.js runtime requirement is stated before installation.

## Common mistakes

- Calling mongoose.connect() from a route handler.
- Listening before the connection promise resolves.
- Ignoring the initial connection rejection.
- Storing the hosted URI in a committed source file.
- Printing the URI or credentials while debugging.
- Using localhost when the local server is listening only on IPv4.
- Assuming the connection can never drop after startup.
- Disconnecting Mongoose before active HTTP requests finish.
- Calling process.exit() before asynchronous shutdown work completes.
- Returning driver errors or connection details from the health endpoint.

## Chapter navigation

| Previous chapter | Chapter Q&A | Lesson | Next chapter |
| --- | --- | --- | --- |
| [042 - Separate routes, controllers, and services](../lessons/042-separate-routes-controllers-and-services.md) | [Q&A](../qnas/043-connect-an-express-app-to-mongodb.md) | [Lesson](../lessons/043-connect-an-express-app-to-mongodb.md) | [044 - Async route handlers and error propagation](../lessons/044-async-route-handlers-and-error-propagation.md) |
