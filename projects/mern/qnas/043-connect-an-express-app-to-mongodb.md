# 043 - Connect an Express app to MongoDB: Q&A

Review the connection string, application startup sequence, Mongoose lifecycle, and safe handling of database configuration.

## Multiple choice

### 1. What is Mongoose in a typical MERN backend?

- A. An object data modeling library built on the MongoDB Node.js driver
- B. A MongoDB hosting provider
- C. An Express router
- D. A browser database

**Answer: A.** Mongoose builds schema and model APIs on top of the MongoDB Node.js driver.

### 2. What does a MongoDB connection URI provide?

- A. The app's route list
- B. The connection target and potentially database and authentication options
- C. The Express port only
- D. The React build directory

**Answer: B.** A URI identifies where the client connects and may include the database name, credentials, and options.

### 3. Why does this course use 127.0.0.1 for a local MongoDB URI?

- A. It forces MongoDB authentication off.
- B. It avoids possible localhost IPv6 resolution mismatches when the server listens only on IPv4.
- C. It connects to MongoDB Atlas.
- D. It selects the production database automatically.

**Answer: B.** Some environments resolve localhost to IPv6 while a local mongod listens only on IPv4.

### 4. Where should a hosted MongoDB URI with credentials be stored?

- A. In a committed JavaScript source file
- B. In a URL path returned to the browser
- C. In an environment variable or secret manager
- D. In a public README

**Answer: C.** Keep secrets outside source control and supply them through runtime configuration.

### 5. What does awaiting mongoose.connect(uri) accomplish during startup?

- A. It ensures the initial connection has succeeded before the next startup step runs.
- B. It creates an Express route.
- C. It converts every MongoDB document to JSON.
- D. It closes the database pool.

**Answer: A.** The returned promise resolves after connection succeeds and rejects if the initial connection fails.

### 6. When should an app that requires MongoDB call app.listen()?

- A. Before it reads the URI
- B. After the initial database connection succeeds
- C. Once for every API request
- D. Only after each model query

**Answer: B.** Waiting prevents the server from accepting requests while its required database is unavailable.

### 7. What happens if the first mongoose.connect() call rejects?

- A. Mongoose always retries the initial attempt forever.
- B. The startup code must handle the rejected promise; the server should not listen as ready.
- C. Express turns the error into a 404.
- D. The URI is removed from the environment.

**Answer: B.** Initial connection errors must be caught by startup code. Mongoose does not automatically retry that initial failure.

### 8. What is the purpose of listening for Mongoose disconnection events after startup?

- A. To observe later connection state changes
- B. To validate route parameters
- C. To retry every HTTP response
- D. To modify the database URI

**Answer: A.** Events such as disconnected help report a connection loss after the initial connection was established.

### 9. Where should mongoose.connect() generally be called in a single-process API?

- A. Inside every route handler
- B. Once during process startup
- C. Inside every repository method
- D. Once per response

**Answer: B.** Mongoose manages a shared default connection and underlying pool; do not create a fresh connection per request.

### 10. What does mongoose.connection refer to after using mongoose.connect()?

- A. The default Mongoose connection
- B. A browser WebSocket
- C. The Express router
- D. The current request body

**Answer: A.** mongoose.connect() connects Mongoose's default connection, which is available as mongoose.connection.

### 11. What does a Mongoose connection readyState value of 1 mean?

- A. Disconnected
- B. Connected
- C. Connecting
- D. Disconnecting

**Answer: B.** The connection's readyState is 1 when connected.

### 12. Why should application logs not print the full database URI?

- A. It may include credentials or other sensitive connection details.
- B. It changes the database name.
- C. MongoDB rejects all logs.
- D. It makes the Express port unavailable.

**Answer: A.** A full URI can expose secrets. Log safe diagnostic details without the connection string.

### 13. What is a sensible permission policy for a database user used by the app?

- A. Grant only the permissions the application needs.
- B. Always grant unrestricted administrator access.
- C. Disable authentication.
- D. Reuse a personal account password in source code.

**Answer: A.** Least privilege limits the impact if application credentials are exposed.

### 14. What should happen to reserved URL characters in a URI password?

- A. They should be percent-encoded.
- B. They should be copied raw into source code.
- C. They should be removed from the password.
- D. They should be placed in an HTTP header instead.

**Answer: A.** Reserved characters must be encoded so they are interpreted as part of the credential rather than URI syntax.

### 15. What should a database health endpoint reveal to an unauthenticated caller?

- A. The full MongoDB URI and password
- B. Safe status information only
- C. The database user's permissions
- D. Internal stack traces

**Answer: B.** Health responses should report useful status without disclosing credentials or internal diagnostics.

### 16. What is a graceful-shutdown sequence for an HTTP app using MongoDB?

- A. Disconnect from MongoDB, then keep accepting new requests
- B. Stop accepting new HTTP requests, let active requests finish, then disconnect Mongoose
- C. Delete the database
- D. Start a second connection and exit immediately

**Answer: B.** Close the HTTP server first so active request work can finish before the database connection is closed.

### 17. What is one risk of starting to listen before awaiting the database connection?

- A. Requests may arrive while database-backed operations cannot succeed.
- B. Express stops parsing route paths.
- C. The URI becomes public automatically.
- D. Mongoose schemas are deleted.

**Answer: A.** The app can appear ready while its required database is unavailable, leading to failed or buffered requests.

### 18. What can Mongoose operation buffering do before a connection is ready?

- A. Queue model operations, which may make requests appear to hang if startup is not gated.
- B. Encrypt the URI.
- C. Create an Express middleware stack.
- D. Close the HTTP server.

**Answer: A.** Buffering can obscure startup problems. Awaiting the initial connection before listening keeps readiness explicit.

### 19. What Node.js version does Mongoose 9 require?

- A. Node.js 12 or higher
- B. Node.js 16 or higher
- C. Node.js 18 or higher
- D. Node.js 20.19.0 or higher

**Answer: D.** Mongoose 9's current version requirements specify Node.js 20.19.0 or higher.

### 20. Which module should start the HTTP listener?

- A. The server entry point
- B. Every model file
- C. The database URI
- D. The request validation middleware

**Answer: A.** Keeping app construction separate from the server entry point allows the app to be created without automatically listening on a port.

## Short answers

### 21. Explain the difference between the MongoDB Node.js driver and Mongoose.

**Answer:** The driver is the lower-level library that communicates with MongoDB. Mongoose builds an object data modeling layer, including schemas and models, on top of the driver.

### 22. Why should the database URI come from an environment variable?

**Answer:** It keeps environment-specific configuration and credentials out of committed source and lets deployment environments provide their own connection target.

### 23. What does the initial mongoose.connect() promise tell startup code?

**Answer:** It resolves when the initial connection succeeds and rejects when that initial attempt fails, so startup can decide whether to begin listening.

### 24. Why should a server wait to listen until its required database is connected?

**Answer:** This prevents the API from accepting requests while database operations cannot yet be served and makes readiness truthful.

### 25. Name two Mongoose connection events that can help monitor a connection after startup.

**Answer:** disconnected and error are useful examples. connected or reconnected can also indicate recovery.

### 26. Why is 127.0.0.1 sometimes more reliable than localhost for a local MongoDB URI?

**Answer:** localhost may resolve to IPv6 while the MongoDB process only listens on IPv4. 127.0.0.1 explicitly selects the IPv4 loopback address.

### 27. Why should an app avoid opening a connection inside each request?

**Answer:** It wastes resources, creates unnecessary connection setup, and bypasses the shared connection pool intended for application operations.

### 28. What is a secret manager used for?

**Answer:** It securely supplies sensitive values, such as a hosted MongoDB URI, to an application at runtime without storing them in source code.

### 29. What should the app do if MONGODB_URI is missing?

**Answer:** Report a clear configuration error and do not start listening. Do not silently fall back to a different database.

### 30. What is the role of graceful shutdown?

**Answer:** It stops new HTTP work, allows active requests to complete, and then closes database resources cleanly when the process is asked to stop.

## Application questions

### 31. The server logs that Express is listening, but MongoDB is down and requests fail. What startup order should be changed?

**Answer:** Await the initial mongoose.connect() before calling app.listen(). If the connection fails, report startup failure and do not accept requests.

### 32. A developer writes a hosted URI with a username and password directly in db.js. What should change?

**Answer:** Read the URI from an environment variable or secret manager. Remove the credential from source and avoid exposing it in logs or commits.

### 33. A local connection to localhost fails with a connection-refused error, but MongoDB is running on IPv4. What URI host can be tried?

**Answer:** Use 127.0.0.1 in the local MongoDB URI to avoid a localhost IPv6 resolution mismatch.

### 34. The initial call to connectDatabase rejects. Should the app start its HTTP listener anyway?

**Answer:** No. Catch the startup rejection, report a safe diagnostic, set a nonzero exit status, and leave the listener unopened.

### 35. The database becomes disconnected after the app has started. Which two responses are needed at different levels?

**Answer:** Observe and report the connection state at the process/operations level, and ensure request operations handle their own failures. A connection event alone does not handle rejected route operations.

### 36. A developer adds mongoose.connect() to a controller so each route “makes sure” the database is available. Why is this a poor design?

**Answer:** It repeats connection setup per request and couples request handling to connection lifecycle. Establish one shared connection during process startup instead.

### 37. A developer wants to stop on SIGTERM. What should the shutdown handler do?

**Answer:** Make shutdown idempotent, close the HTTP server to new connections and wait for active requests, then await mongoose.disconnect() and set an appropriate process exit code.

### 38. A MongoDB password includes a slash or at-sign. What should be checked?

**Answer:** Ensure reserved characters in the credential are percent-encoded in the URI so they are not parsed as URI delimiters.

### 39. A health endpoint returns the raw connection error and connection URI. What should be changed?

**Answer:** Return only safe health status and keep diagnostic details in protected application logs. Never include credentials or raw internal errors in a public response.

### 40. Outline the startup sequence for a small Express API that requires MongoDB.

**Answer:** Read and validate MONGODB_URI, await the initial Mongoose connection, construct the Express app and its middleware/routes, then start the HTTP listener. If startup fails, report it safely and exit without listening.

## Chapter navigation

| Previous chapter | Lesson | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [042 - Separate routes, controllers, and services](../lessons/042-separate-routes-controllers-and-services.md) | [Lesson](../lessons/043-connect-an-express-app-to-mongodb.md) | [Example](../examples/043-connect-an-express-app-to-mongodb.md) | [044 - Async route handlers and error propagation](../lessons/044-async-route-handlers-and-error-propagation.md) |
