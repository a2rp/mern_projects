# Chapter 037 Q&A: Create an Express app and server

Review Express and Node responsibilities, project setup, middleware, app/server separation, host and port configuration, and startup behavior.

## Part 1: Multiple-choice questions

### 1. What role does Express play in a MERN application?

- **A.** It handles HTTP routing and middleware inside a Node.js process.
- **B.** It replaces the Node.js runtime.
- **C.** It stores application data as a MongoDB database.
- **D.** It builds the React bundle in every request.

**Answer: A.** Express provides the HTTP application and request-processing layer. Node.js runs the process, and MongoDB stores data.

### 2. What is an Express application?

- **A.** A configured request handler with methods for settings, middleware, and routes.
- **B.** A MongoDB database user.
- **C.** The npm lock file.
- **D.** A port number assigned by the operating system.

**Answer: A.** The app object is where the service's Express behavior is configured.

### 3. What does app.listen() do?

- **A.** Creates and starts an HTTP server that accepts network requests for the app.
- **B.** Installs Express from npm.
- **C.** Opens a MongoDB connection automatically.
- **D.** Parses every request body without middleware.

**Answer: A.** app.listen starts the network listener and returns a Node HTTP server object.

### 4. Why separate app.js from server.js?

- **A.** The app can be configured and reused without opening a network port; the server file starts listening.
- **B.** Express requires both files to compile.
- **C.** It prevents the application from using middleware.
- **D.** It stores passwords in the correct file.

**Answer: A.** Separating application setup from listening supports reuse in testing, scripts, and deployment.

### 5. What does npm install express do in the project directory?

- **A.** Adds Express as a project dependency and installs it.
- **B.** Starts the server on port 3000.
- **C.** Creates a MongoDB collection.
- **D.** Changes all JavaScript files to TypeScript.

**Answer: A.** npm installs the package and records it in the dependency manifest and lock file.

### 6. Why commit package-lock.json?

- **A.** It records resolved dependency versions so installs can reproduce the dependency tree.
- **B.** It contains the Express server's runtime logs.
- **C.** It replaces package.json.
- **D.** It stores production passwords.

**Answer: A.** The lock file helps keep dependency installs consistent across environments.

### 7. What does setting package.json type to module enable for ordinary .js files?

- **A.** ECMAScript module import and export syntax.
- **B.** Automatic database authentication.
- **C.** Automatic TypeScript compilation.
- **D.** Public access to the server.

**Answer: A.** The package type tells Node to interpret .js files in that package as ES modules.

### 8. What does express.json() do?

- **A.** Parses eligible JSON request bodies and makes the parsed value available on req.body.
- **B.** Converts every response into HTML.
- **C.** Validates user authorization.
- **D.** Opens a server socket.

**Answer: A.** It is built-in Express middleware for parsing JSON bodies.

### 9. Where should JSON body-parsing middleware usually be registered?

- **A.** Before routes that read req.body.
- **B.** After every response has been sent.
- **C.** Only inside package-lock.json.
- **D.** After app.listen has finished handling all requests.

**Answer: A.** Middleware order determines whether a route can read the parsed body.

### 10. What must a middleware function do if it does not end the response?

- **A.** Call next() to pass control onward.
- **B.** Start another listener on the same port.
- **C.** Delete the request object.
- **D.** Return an empty package.json.

**Answer: A.** A middleware function must end the request-response cycle or pass control onward; otherwise the request can hang.

### 11. Which method registers a route for GET requests to a path?

- **A.** app.get()
- **B.** app.listen()
- **C.** express.json()
- **D.** npm install

**Answer: A.** app.get registers a route handler for the GET method and its path.

### 12. What does res.json(value) do?

- **A.** Sends a JSON response representation to the client.
- **B.** Parses the request body.
- **C.** Creates a package lock.
- **D.** Starts a new process.

**Answer: A.** It serializes a value as a JSON response and sets the response content type.

### 13. What is a suitable local-only default host for a practice server?

- **A.** 127.0.0.1
- **B.** A public wildcard address with no firewall.
- **C.** The MongoDB database name.
- **D.** An empty string that is never checked.

**Answer: A.** Loopback binding allows access from the same machine and is appropriate for local-only practice.

### 14. Why might a containerized service need to bind to 0.0.0.0?

- **A.** It may need to accept traffic arriving through the container's network interface.
- **B.** It automatically adds TLS.
- **C.** It restricts access to the local browser only.
- **D.** It creates a random MongoDB password.

**Answer: A.** A loopback-only listener inside a container may not be reachable through the container network. Broader binding should match an intentional network and firewall setup.

### 15. What does PORT=0 commonly ask the operating system to do?

- **A.** Choose an available ephemeral port for the listener.
- **B.** Disable all route handlers.
- **C.** Bind to port 27017.
- **D.** Make the app private in npm.

**Answer: A.** The server can read the assigned port from its address after listening starts.

### 16. Which error commonly means another process already occupies the chosen port?

- **A.** EADDRINUSE
- **B.** ENOENT
- **C.** SyntaxError
- **D.** ECONNRESET only

**Answer: A.** EADDRINUSE indicates that the address and port combination is already in use.

### 17. What is the difference between a liveness check and a readiness check?

- **A.** Liveness checks whether the process responds; readiness checks whether it can safely serve its required work and dependencies.
- **B.** They are always identical and need no definition.
- **C.** Readiness only checks whether package.json exists.
- **D.** Liveness verifies every database record.

**Answer: A.** A process can be alive while a required dependency is unavailable, so the checks answer different questions.

### 18. What does app.disable("x-powered-by") accomplish?

- **A.** Disables Express's X-Powered-By response header.
- **B.** Enables authentication for every route.
- **C.** Hides every server error from all logs.
- **D.** Disables the HTTP server.

**Answer: A.** It reduces one piece of implementation information in responses, but is not a complete security control.

### 19. Why should a production server avoid returning stack traces to clients?

- **A.** They can reveal internal implementation details and sensitive context.
- **B.** JSON cannot contain strings.
- **C.** Stack traces prevent a response status from being set.
- **D.** They make the package lock invalid.

**Answer: A.** Return safe public errors and keep protected diagnostics in server-side logs.

### 20. What does the server object returned by app.listen() represent?

- **A.** The underlying Node HTTP server that listens for connections.
- **B.** A Mongoose model.
- **C.** A React component.
- **D.** The response body for the root route.

**Answer: A.** The server object provides network-server events and lifecycle methods such as close().

## Part 2: Short-answer questions

### 21. Explain how Node.js, Express, and MongoDB differ in responsibility.

**Answer:** Node.js runs the JavaScript process, Express processes HTTP requests and responses, and MongoDB stores application data. They work together but are separate components.

### 22. Why should the app definition avoid starting the listener as an import side effect?

**Answer:** A separate server entry point can start the listener when needed, while other code can import the app without binding a port. This supports controlled startup and later testing.

### 23. What does express.json({ limit: "100kb" }) contribute?

**Answer:** It parses JSON request bodies before routes and limits accepted body size. A production limit should reflect the application's actual request needs.

### 24. Why are package.json and the lock file both useful?

**Answer:** package.json declares the project and dependency intent, while the lock file records the resolved dependency tree so installs can be reproduced more consistently.

### 25. How do res.status() and res.json() work together?

**Answer:** res.status(code) sets the HTTP status, and res.json(value) sends a JSON representation. For example, res.status(200).json({ status: "ok" }) sends a successful JSON response.

### 26. Why can a request hang when middleware forgets to respond or call next()?

**Answer:** Express has not been told that the current handler is finished or that it should continue to the next handler, so no response may be sent.

### 27. Why should a practice service default to 127.0.0.1?

**Answer:** It limits connections to the same machine. A wider binding may expose the service to other network clients and should be used only when deployment networking is intentionally configured.

### 28. How should a server handle an invalid PORT value?

**Answer:** Validate it during startup and fail with a clear configuration error rather than silently binding to an unintended port or behaving unpredictably.

### 29. What does the health route in this chapter prove, and what does it not prove?

**Answer:** It proves that the process can answer an HTTP request. It does not prove MongoDB or other required dependencies are healthy or that the app is ready for production traffic.

### 30. What should happen when a local server is stopped for production-style shutdown?

**Answer:** Stop accepting new work, allow active requests to finish within a bounded period, close database and other resources, and then let the process exit cleanly.

## Part 3: Practical scenarios

### 31. npm start reports that it cannot find src/server.js. What should you inspect?

**Answer:** Check that the file exists at the expected path, the package script names the same path, and the project was opened in the directory containing package.json.

### 32. The app imports express but Node says the package cannot be found. What is the likely fix?

**Answer:** Run npm install from the project directory and confirm Express is listed in package.json. Do not copy node_modules from another unrelated project.

### 33. A route reads req.body but gets undefined for a valid JSON request. What should you check?

**Answer:** Confirm express.json() runs before the route, the request uses Content-Type application/json, and the request body is valid JSON.

### 34. You added a body parser after all routes. Why does it not help those routes?

**Answer:** Express executes middleware in registration order. The body parser must run before the route handler that reads req.body.

### 35. The console reports EADDRINUSE on port 3000. What are safe next steps?

**Answer:** Identify whether another intended development server is using the port, stop that process if appropriate, or configure a different port. Do not terminate an unknown process blindly.

### 36. A laptop can access the service but a device on the LAN cannot. What should you investigate?

**Answer:** Check the host binding and firewall/network rules. If LAN access is intended, configure it deliberately and restrict access; do not assume 0.0.0.0 is always safe.

### 37. A deployment assigns a port in the PORT environment variable, but the app always uses 3000. What should change?

**Answer:** Read and validate process.env.PORT at startup, using 3000 only as a local default.

### 38. The root route responds, but MongoDB is down. Should the current /health route report the database as ready?

**Answer:** No. The example's route is a liveness check only. A readiness endpoint should include required dependency state and should not claim readiness while essential services are unavailable.

### 39. An unknown URL returns the default HTML 404, but the project promises JSON API responses. What should be added?

**Answer:** Add an application-level not-found handler after the routes that sends the documented JSON 404 response. Centralized error handling is covered in a later chapter.

### 40. A server startup error includes an internal stack trace in its public response. What should change?

**Answer:** Do not expose startup diagnostics to clients. Log an appropriately limited server-side message, set a failing process exit code when startup cannot succeed, and return a safe API error only for requests the server is able to handle.

## Chapter navigation

| Previous chapter | Chapter lesson | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [036 - REST API design and resource modeling](../lessons/036-rest-api-design-and-resource-modeling.md) | [Lesson](../lessons/037-create-an-express-app-and-server.md) | [Example](../examples/037-create-an-express-app-and-server.md) | [038 - Middleware order and request lifecycle](../lessons/038-middleware-order-and-request-lifecycle.md) |
