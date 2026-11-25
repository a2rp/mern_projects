# 043 - Connect an Express app to MongoDB

An Express server and a MongoDB database are separate processes. The application needs a connection before it can reliably serve database-backed requests. With Mongoose, the usual startup sequence is:

~~~text
read the MongoDB URI from the environment
    -> connect to MongoDB
    -> create and configure the Express app
    -> start listening for HTTP requests
~~~

This chapter focuses on the connection lifecycle. Mongoose schemas and models, database queries, and async route error handling are covered in later chapters.

## Learning goals

By the end of this chapter, you should be able to:

- Explain what a MongoDB connection string identifies.
- Store the connection URI outside source code.
- Connect with Mongoose and wait for the connection promise.
- Avoid accepting requests before the database is ready.
- Handle initial connection failure without exposing credentials.
- Close the HTTP server and database connection during shutdown.

## MongoDB, the driver, and Mongoose

MongoDB stores data in databases and collections. The Node.js MongoDB driver communicates with a MongoDB deployment. Mongoose is an object data modeling library built on that driver; it provides a connection, schemas, models, and document-oriented APIs.

This course uses Mongoose for the Express-to-MongoDB connection. Mongoose's default connection is shared by models that use the default connection. Create it once during process startup. Do not call mongoose.connect() inside a request handler or create a new client for each request.

## Connection string

A connection URI tells the driver where to connect and may include a database name, authentication information, and connection options.

A local development URI can look like:

~~~text
mongodb://127.0.0.1:27017/mern_learning
~~~

Use 127.0.0.1 for a local server. On some systems, localhost resolves to IPv6 while the MongoDB server only listens on IPv4, which can cause a confusing connection refusal.

A hosted deployment usually provides a URI with a mongodb+srv scheme. Replace the provider's placeholder values with the correct cluster, database, and credentials. Do not paste a real URI with credentials into source code, README files, screenshots, terminal recordings, or commits.

A URI password containing reserved URL characters must be percent-encoded. Prefer a database user with only the permissions the application needs.

## Store configuration outside the source

The application reads MONGODB_URI from the process environment. For a local database, set it in PowerShell before starting the server:

~~~powershell
$env:MONGODB_URI = "mongodb://127.0.0.1:27017/mern_learning"
npm start
~~~

The variable is scoped to that PowerShell session. Set it again in a new terminal. For a hosted database, place the provider's private URI in an environment variable or a secret manager. A local .env file can be used with a loader, but it must be excluded from Git.

Do not provide a fallback URI that silently points production code at a developer's local machine. Fail clearly when the required variable is missing.

## Connect before listening

mongoose.connect() returns a promise. Await it before calling app.listen(). If the initial connection fails, the promise rejects. Do not start a server that reports itself ready while its required database connection is unavailable.

~~~js
async function startServer() {
  await connectDatabase(process.env.MONGODB_URI);

  const app = createApp();
  app.listen(port);
}
~~~

This ordering also makes startup failures easier to understand: either the database is ready and the HTTP server starts, or startup reports a connection failure and exits with a nonzero status.

Mongoose may buffer model operations while it is connecting. Buffering can make requests appear to hang when the app starts too early. Waiting for the connection before listening keeps startup behavior explicit.

## Handle the connection lifecycle

Initial connection errors and later connection events are different cases:

- If the first connection attempt fails, await mongoose.connect() in a try/catch. Mongoose does not automatically retry that initial failure.
- After a successful connection, Mongoose attempts to reconnect if the connection drops. Listen for disconnected and error events so the application can report operational state.
- A disconnected event does not itself tell the application to expose raw diagnostics to a client.
- On shutdown, stop accepting new HTTP requests and close the database connection.

Log enough information for an operator to investigate, such as the error class and a safe message. Never log the full URI or include credentials in client responses.

## Connection readiness

The Mongoose connection has a readyState property. A value of 1 means connected. Since this example waits for connect() before listening, a basic database health endpoint should report connected at startup.

A health endpoint is not a substitute for handling failures during later requests. If MongoDB becomes unavailable after startup, a database operation can still fail. The async route and centralized error chapters explain how those failures reach HTTP error middleware.

## Graceful shutdown

When the process receives SIGINT or SIGTERM, stop accepting new HTTP connections, let active requests finish, then disconnect Mongoose. Avoid closing the database connection while active requests are still using it.

Shutdown code should be idempotent so a second signal does not start a second close sequence. Prefer setting process.exitCode after cleanup rather than terminating immediately before buffered logs and cleanup complete.

## Common mistakes

- Calling mongoose.connect() for every request.
- Starting app.listen() before awaiting the initial database connection.
- Ignoring a rejected connection promise.
- Hard-coding a hosted connection URI in the repository.
- Printing the full connection string while debugging.
- Using localhost when the local MongoDB server is only reachable over IPv4.
- Assuming a successful initial connection means later database operations cannot fail.
- Treating a connection event as a substitute for handling rejected operations.
- Closing Mongoose before active HTTP requests have finished.
- Creating a connection in each model or route module instead of sharing the app connection.

## Practical checklist

Before starting an Express process that requires MongoDB, ask:

- Is the MongoDB URI supplied through an environment variable or secret manager?
- Does the selected Mongoose major version support this Node.js runtime?
- Does startup await the initial connection?
- Does a connection failure prevent the HTTP server from listening?
- Are credentials absent from source, logs, screenshots, and commits?
- Is one shared connection used by the application's models?
- Are later disconnects and errors observable?
- Does shutdown close the HTTP server before disconnecting Mongoose?
- Does the app return only safe information to clients?
- Is a separate health check available for deployment monitoring?

## Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [042 - Separate routes, controllers, and services](042-separate-routes-controllers-and-services.md) | [Q&A](../qnas/043-connect-an-express-app-to-mongodb.md) | [Example](../examples/043-connect-an-express-app-to-mongodb.md) | [044 - Async route handlers and error propagation](044-async-route-handlers-and-error-propagation.md) |
