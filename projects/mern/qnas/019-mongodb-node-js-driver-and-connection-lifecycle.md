# 019 - MongoDB Node.js Driver and Connection Lifecycle: Questions and Answers

Use these questions to review the MongoDB Node.js driver, MongoClient, connection pools, application startup, and graceful cleanup. Each answer includes a short explanation.

Related lesson: [019 - MongoDB Node.js driver and connection lifecycle](../lessons/019-mongodb-node-js-driver-and-connection-lifecycle.md)

## Multiple-choice questions

### 1. What is the MongoDB Node.js driver?

- A. A library that lets Node.js application code communicate with MongoDB
- B. The MongoDB database server
- C. A Windows service
- D. A document collection

**Answer: A.** The driver provides the application-facing client and operations for communicating with a MongoDB deployment.

### 2. Which driver object represents the application connection to MongoDB?

- A. MongoClient
- B. MongoDocument
- C. MongoRoute
- D. MongoPage

**Answer: A.** MongoClient uses a connection URI and manages the driver's network connections and pools.

### 3. What information does a connection URI provide?

- A. Which MongoDB deployment to connect to and any configured authentication or connection options
- B. The HTML page to render
- C. The application's route list
- D. The source code for every collection

**Answer: A.** The URI identifies the deployment and may include credentials, database context, and options.

### 4. What does constructing a MongoClient do?

- A. Creates a client object configured with the URI; it does not by itself prove the server is reachable.
- B. Automatically inserts a document.
- C. Creates every database and collection in the URI.
- D. Closes the process.

**Answer: A.** Use an explicit connection or a database operation to verify that the deployment is reachable.

### 5. Why might an application call client.connect() during startup?

- A. To confirm the database is reachable before the application accepts database-dependent work
- B. To create a new database for every request
- C. To replace the connection URI
- D. To close the HTTP server

**Answer: A.** Awaiting connect during startup can make connection failure visible before the app is marked ready.

### 6. Which statement about explicit connect() is accurate?

- A. Supported driver versions can also connect when the first database operation runs.
- B. It is required before every single query.
- C. It inserts a sample document.
- D. It creates a different client for each collection.

**Answer: A.** The driver can connect lazily for operations, while explicit startup connection is useful when readiness must be checked first.

### 7. What does a MongoClient connection pool do?

- A. Keeps connections available for reuse by database operations
- B. Stores every document in a JavaScript array
- C. Replaces Atlas network access settings
- D. Creates one database per user

**Answer: A.** The driver obtains and reuses connections instead of establishing a new client connection for every operation.

### 8. How many MongoClient instances should a typical long-running Node.js application process create?

- A. One shared client for that process
- B. One new client for each route request
- C. One new client for every field in a document
- D. A new client before every response

**Answer: A.** Reuse the client and its pool across requests handled by the process.

### 9. Why is creating a MongoClient inside every HTTP request handler a poor pattern?

- A. It repeatedly creates clients and pools, adding overhead and consuming connections.
- B. It prevents the database from storing numbers.
- C. MongoDB allows only one HTTP route.
- D. It turns collections into databases.

**Answer: A.** A client per request discards the benefit of pooling and can exhaust available resources.

### 10. What does client.db("mern_demo") return?

- A. A handle for selecting a database through that client
- B. A document inserted into the database
- C. A new network process
- D. A Windows service

**Answer: A.** The database handle selects a database for later commands; obtaining the handle does not itself persist a database.

### 11. What is a good way to check that a client can reach MongoDB?

- A. Send a ping command and await its result.
- B. Construct a collection handle and assume success.
- C. Print the URI, including its password.
- D. Create another MongoClient for every check.

**Answer: A.** A ping operation checks communication with the deployment and returns a response.

### 12. Where should a short one-time script close its MongoClient?

- A. In a finally block around its work
- B. Only if every database operation succeeds
- C. Before calling connect()
- D. Inside a document field

**Answer: A.** A finally block runs cleanup whether the script's work succeeds or throws an error.

### 13. When should a long-running web server close its MongoClient during graceful shutdown?

- A. After stopping acceptance of new requests and allowing active work to finish
- B. After every response
- C. Before the first request
- D. Only when the operating system is reinstalled

**Answer: A.** Let in-flight requests finish before closing the client those requests use.

### 14. What is an appropriate shutdown order for a database-backed web server?

- A. Stop accepting requests, drain active requests, then close the database client.
- B. Close the database client, then accept more requests.
- C. Create a new client for each active request.
- D. Delete the database before stopping the server.

**Answer: A.** The HTTP server should finish active work before the shared database connection is closed.

### 15. What is a sensible way to provide the connection URI to Node.js code?

- A. Read it from configuration such as an environment variable.
- B. Commit the production password in the source code.
- C. Print the full URI to the console at startup.
- D. Put the password in the collection name.

**Answer: A.** Configuration keeps environment-specific values out of source code; credential-bearing values should remain private.

### 16. Which statement about database and collection handles is correct?

- A. They select targets for operations; creating them does not prove connectivity or persist data.
- B. They are the same as an open socket for every request.
- C. They store credentials in source control.
- D. They create a document automatically.

**Answer: A.** A handle is an object used to address a database or collection through the client.

### 17. What should an app do if the database is required before it can serve requests and startup connection fails?

- A. Do not mark the app ready to serve database-dependent traffic.
- B. Ignore the error and log a successful connection.
- C. Print the full URI with its password.
- D. Create a client inside each route.

**Answer: A.** The app should make database availability part of its startup or readiness behavior.

### 18. What does a MongoServerSelectionError commonly indicate?

- A. The driver could not find a suitable reachable server using its configuration.
- B. A document field has the wrong CSS color.
- C. The project uses too many headings.
- D. The application has no HTML template.

**Answer: A.** Check the server state, host, port, DNS, network access, and connection URI.

### 19. What should you do before increasing pool size to address slow requests?

- A. Investigate slow operations and workload; more connections do not automatically make a slow query faster.
- B. Create one client per route.
- C. Put the URI in a public repository.
- D. Delete the connection pool.

**Answer: A.** Pool tuning should follow evidence. Query performance and application concurrency may be the actual cause.

### 20. If a Node.js application runs four worker processes, what is the usual client pattern?

- A. Each process owns and reuses its own client and pool.
- B. All processes share one in-memory JavaScript object automatically.
- C. Every incoming request creates a client.
- D. Only one worker may access MongoDB.

**Answer: A.** Each process has its own memory and normally creates one shared client for that process.

## Short-answer questions

### 1. What problem does the MongoDB Node.js driver solve?

**Answer:** It provides Node.js code with APIs to connect to MongoDB and perform database operations without manually managing the wire protocol and sockets.

### 2. What is a MongoClient?

**Answer:** It is the driver's client object configured with a deployment URI. It performs operations and manages connection pools.

### 3. What is the difference between creating a MongoClient and connecting it?

**Answer:** Construction creates the configured client object. Connecting or performing a database operation verifies communication with the deployment.

### 4. Why can explicit connect() be useful during server startup?

**Answer:** The application can wait for the database connection to succeed before accepting requests that require MongoDB.

### 5. Can the driver connect without calling connect() explicitly?

**Answer:** Supported driver versions can connect when the first database operation runs. Explicit connect is still useful when the application needs an early readiness check.

### 6. What does a connection pool provide?

**Answer:** It keeps a set of connections that the driver can reuse for operations, avoiding the cost of creating a new connection for every request.

### 7. Why should a long-running process reuse its MongoClient?

**Answer:** Reuse avoids repeated client and pool creation, reduces connection overhead, and supports concurrent operations through the same managed pool.

### 8. Why should you avoid constructing a MongoClient in an Express route handler?

**Answer:** That creates repeated clients and pools during incoming requests, wastes resources, and can exhaust deployment connections.

### 9. What is the purpose of a database handle returned from client.db()?

**Answer:** It identifies which database to target for operations. It does not by itself open a separate client or create persisted database contents.

### 10. How can a program confirm that MongoDB is reachable?

**Answer:** Explicitly connect or send an operation such as a ping command, then await the response and handle any connection error.

### 11. How should a short script ensure cleanup if an operation fails?

**Answer:** Put client.close() in a finally block so cleanup runs after success or failure.

### 12. When should a web server close its shared MongoClient?

**Answer:** During graceful shutdown, after it has stopped accepting new requests and active requests using the database have finished.

### 13. Why should an app avoid closing its client after every database operation?

**Answer:** Closing after each operation discards pooled connections, adds repeated setup overhead, and can disrupt concurrent work.

### 14. Where should a credential-bearing MongoDB URI be stored?

**Answer:** In private runtime configuration such as an environment variable or an appropriate secret store, not committed source code or logs.

### 15. What should an application do if connection setup fails before it becomes ready?

**Answer:** Report a useful error without exposing secrets, and do not mark the app ready for database-dependent requests. Retry only when it is appropriate and controlled.

### 16. What should you check first for a server selection timeout?

**Answer:** Verify that the deployment is available, the host and port are correct, DNS and network access work, Atlas permits the client's IP, and the URI is valid.

### 17. Why does one client per process not necessarily mean one client for the entire deployed service?

**Answer:** A service may run several independent Node.js processes or workers. Each process has its own memory and generally owns one reusable client and pool.

### 18. Why might increasing maxPoolSize fail to fix slow database requests?

**Answer:** The bottleneck may be a slow query, server load, or request pattern. More connections do not make an inefficient operation faster and can add server load.

## Review checklist

You are ready to move on when you can:

- Explain what the Node.js driver and MongoClient do.
- Distinguish client construction from an established connection.
- Describe the role of a connection pool.
- Reuse a client across requests in one process.
- Explain how database handles relate to the client.
- Place close() in a script's finally block or after a server drains requests.
- Keep credential-bearing URIs out of source control and logs.
- Diagnose basic server-selection, network, URI, and authentication failures.

---

### Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Chapter example | Next chapter |
| :--- | :--- | :--- | :--- | :---: |
| [018 - Install, run, and connect to MongoDB](../lessons/018-install-run-and-connect-to-mongodb.md) | [Lesson](../lessons/019-mongodb-node-js-driver-and-connection-lifecycle.md) | Q&A | [Example](../examples/019-mongodb-node-js-driver-and-connection-lifecycle.md) | [020 - Create and read MongoDB documents](../lessons/020-create-and-read-mongodb-documents.md) |
