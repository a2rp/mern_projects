# 019 - MongoDB Node.js Driver and Connection Lifecycle

## Learning goals

By the end of this lesson, you should be able to:

- Explain how a Node.js application communicates with MongoDB through the official driver.
- Install the driver in a Node.js project and keep its version in the project manifest.
- Create a `MongoClient` from a connection URI.
- Explain the difference between constructing a client, connecting it, and getting database or collection handles.
- Reuse one client and its connection pool throughout an application process.
- Close the client at the right point in a short script or long-running server.
- Keep connection strings and credentials out of source code.
- Recognize common connection errors and know what to check first.

## The driver sits between your app and MongoDB

The official MongoDB Node.js driver is a package that lets Node.js code send database commands and receive results. Your application does not open raw database sockets itself. It uses a `MongoClient`, which handles server discovery, network connections, authentication, and connection pooling.

A typical flow is:

~~~text
Node.js application
    |
    | MongoDB Node.js driver
    v
MongoDB deployment
    |
    v
database -> collection -> documents
~~~

The driver works with local Community deployments, Atlas deployments, and other supported MongoDB deployments. It uses a connection URI to identify the target and any required connection options.

## Install the official Node.js driver

Run the installation command from the root of a Node.js project:

~~~bash
npm install mongodb
~~~

This adds the `mongodb` package to `package.json` and installs it under `node_modules`. The package lock file records the resolved version so another install can reproduce the project dependency tree.

Use the driver's supported Node.js version for the release you install. Check the package's compatibility information when choosing or upgrading a driver version; avoid copying a version number from an old tutorial.

## Provide the connection URI through configuration

A URI identifies the deployment. A local development URI commonly looks like:

~~~text
mongodb://127.0.0.1:27017
~~~

For Atlas, use the URI generated for your deployment. It can contain a username, password, hostname, and options. Do not hard-code a credential-bearing URI in committed application code.

For a temporary local PowerShell session, set an environment variable before starting Node.js:

~~~powershell
$env:MONGODB_URI = 'mongodb://127.0.0.1:27017'
node connect.mjs
~~~

Environment variables are configuration inputs, not a complete secret-management system. Keep local secret files out of version control, restrict access to production secrets, and do not print a full URI in logs or error messages.

## Create a MongoClient

In an ES module, import `MongoClient` from the driver and construct one client with the URI:

~~~javascript
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("Set the MONGODB_URI environment variable.");
}

const client = new MongoClient(uri);
~~~

Construction configures the client but does not necessarily prove that a server is reachable. The driver can establish a connection when the application performs an operation. Calling `await client.connect()` explicitly during application startup is useful when you want startup to fail before accepting requests if the database is unavailable.

A connection URI contains the server address and can also contain authentication information, the default authentication database, and connection options. Keep the URI provided for your deployment intact except for replacing its placeholders with your credentials.

## Database and collection handles

The client can provide database and collection handles:

~~~javascript
const database = client.db("mern_lifecycle_demo");
const courses = database.collection("courses");
~~~

These handles describe which database and collection later operations should target. Creating a handle does not create a persisted database or collection by itself. A write creates stored data; collection creation and indexes are covered in later chapters.

The client can also select the deployment's `admin` database for a ping:

~~~javascript
await client.db("admin").command({ ping: 1 });
~~~

A successful ping confirms the client can communicate with the server and receive a response. It does not verify that every later operation is authorized or that every application feature is working.

## Understand the connection pool

A `MongoClient` manages a pool of open connections to the deployment. When application code issues operations, the driver obtains a connection from the pool, sends the operation, and makes that connection available for reuse.

This is why a normal Node.js application should create a client once per application process and reuse it:

- Reusing a client avoids repeatedly creating connection pools.
- The pool supports multiple operations without creating a new client for each request.
- The driver manages connection selection and reuse.
- Pool options can be tuned when there is evidence that defaults do not fit the application's workload.

Do not construct a new `MongoClient` inside every Express route or request handler. That repeats setup, creates extra pools, and can exhaust server or operating-system connection resources. Connection pooling is separate from MongoDB's database-level connection limits and does not replace application request limits.

## Explicit connect and automatic connection

For a short script, the common explicit pattern is:

~~~javascript
await client.connect();

try {
  const result = await client.db("admin").command({ ping: 1 });
  console.log(result);
} finally {
  await client.close();
}
~~~

An explicit `connect()` confirms connectivity at the point where it is awaited. Supported driver versions can also connect automatically when the first database operation runs. Explicit startup connection is often clearer in a server because the application can delay listening until the database is ready.

Calling `client.db()` or `database.collection()` does not prove the network connection works; they create handles. Run an operation or explicitly connect to check the deployment.

## Match cleanup to the application lifecycle

### One-time script

A script that connects, performs work, and exits should close the client when it finishes. Put cleanup in a `finally` block so success and failure paths both reach cleanup.

~~~text
create client
connect
perform work
close client in finally
exit
~~~

### Long-running web server

A web server keeps its client and pool open while it serves requests:

1. Read configuration and validate the URI.
2. Create one `MongoClient`.
3. Connect to MongoDB before accepting requests if the server requires the database to serve traffic.
4. Create database and collection handles for use by route handlers.
5. Reuse the same client for requests handled by this application process.
6. On shutdown, stop accepting new requests and let active requests finish.
7. Close the MongoClient after the HTTP server has drained.

Closing the client after each request defeats pooling and can break concurrent work. Closing it only after the HTTP server stops accepting requests gives in-flight handlers time to finish their database operations.

In a multi-process deployment, each Node.js process generally owns its own client and its own pool. A cluster of four workers therefore has four application clients; do not create another client for each request handled by a worker.

## Handle startup failures

If startup connection fails, do not report the application as ready to serve database-dependent traffic. Log a useful error category and stop startup or mark the service unavailable according to the application's design.

Avoid logging secrets. An error can include a hostname, network detail, or authentication message, but the application should not print a full connection URI if it includes a password.

Retrying can help with temporary network interruptions, but it should be deliberate. A short retry loop without delay can overload a deployment and fill logs. First classify the failure and verify that retrying is appropriate.

## Common connection errors

| Error or symptom | First checks |
| --- | --- |
| `MongoServerSelectionError` or server selection timeout | Is the server running? Is the host reachable? Is the Atlas IP access list correct? Can DNS resolve the hostname? |
| `ECONNREFUSED` | Is MongoDB listening on the URI's host and port? Check local service status and whether the client and server use the same IP family. |
| Authentication failure | Verify the database username, password, authentication database, URI, and percent encoding for reserved credential characters |
| `MONGODB_URI` is missing | Set the environment variable in the process environment before starting Node.js |
| The app opens many connections | Look for repeated `MongoClient` construction, workers or processes, pool settings, and concurrent workload |
| One request causes a slow operation | Investigate query and server performance; raising pool limits alone does not make a slow query faster |

The default server selection timeout can make a failed connection take time to report. Increasing timeouts should not be the first fix for an incorrect URI, stopped server, blocked network, or invalid credentials.

## Connection lifecycle checklist

- Create one client for a long-running application process.
- Keep its URI in configuration and keep credentials private.
- Connect during startup when readiness depends on MongoDB.
- Reuse the client and database handles across requests.
- Keep the HTTP server accepting work only while the application is ready.
- Stop accepting requests before closing the database client during shutdown.
- Close a client in a one-time script even if its work throws an error.
- Do not create one client per request or log credential-bearing URIs.

## Lesson summary

- The MongoDB Node.js driver is the application's client library.
- A `MongoClient` represents the deployment connection and manages a connection pool.
- Database and collection handles are lightweight selectors; creating them does not persist data.
- Explicit `connect()` can verify connectivity before application startup completes.
- One client should be reused per long-running Node.js process.
- Short scripts close the client in `finally`; servers close it after draining requests.
- Connection errors should be diagnosed from the URI, server state, network, DNS, and authentication settings.

## Review checklist

You are ready to move on when you can:

- Install the driver into a Node.js project.
- Create a client using an environment-provided URI.
- Explain why a database handle is not the same as a network connection.
- Describe what a connection pool does.
- Explain when explicit `connect()` is useful.
- Reuse one client across multiple requests in a process.
- Close the client after a script or after a server has drained.
- Troubleshoot connection, network, URI, and authentication failures without exposing secrets.

---

### Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Chapter example | Next chapter |
| :--- | :--- | :--- | :--- | :---: |
| [018 - Install, run, and connect to MongoDB](018-install-run-and-connect-to-mongodb.md) | Lesson | [Q&A](../qnas/019-mongodb-node-js-driver-and-connection-lifecycle.md) | [Example](../examples/019-mongodb-node-js-driver-and-connection-lifecycle.md) | [020 - Create and read MongoDB documents](020-create-and-read-mongodb-documents.md) |
