# 098 - Deploy the API and configure database secrets: Q&A

### 1. What does production API deployment include beyond starting a Node.js process?

**Answer:** It includes a repeatable release artifact, validated runtime configuration, database identity and network access, a trusted request path, secure session handling, health signals, logging, capacity limits, and a controlled shutdown and rollback plan.

### 2. Which parts of the MERN deployment should remain private?

**Answer:** The MongoDB endpoint, server credentials, session secret, internal service ports, private file storage, and administrative interfaces should not be exposed to the browser. The browser receives only public frontend assets and public API URLs.

### 3. Why deploy the same artifact to staging and production?

**Answer:** Promoting the same reviewed artifact reduces the chance that production runs different code or dependencies from those checked in staging. Environment-specific values are injected at runtime, rather than being baked into the artifact.

### 4. Why should an API release identify its source revision?

**Answer:** A source revision or artifact digest lets the team identify exactly what is running, correlate incidents with changes, compare environments, and restore a known release.

### 5. Why install production dependencies from the lockfile?

**Answer:** The lockfile records a resolved dependency graph, making automated builds more repeatable than resolving package versions from scratch during every deployment.

### 6. Can a public frontend variable contain <code>MONGODB_URI</code>?

**Answer:** No. Frontend build variables are delivered to the browser and can be inspected by users. The MongoDB URI belongs only in protected server runtime configuration.

### 7. What is the purpose of a deployment secret manager or protected runtime variable?

**Answer:** It supplies sensitive values to the process at runtime with controlled access and without storing them in the source tree or public release artifact.

### 8. Why separate local, staging, and production database credentials?

**Answer:** A credential leak or mistake in one environment should not automatically grant access to production data. Separate identities also allow independent revocation and least-privilege permissions.

### 9. What database role should the API account receive?

**Answer:** Only the role necessary for its application operations on the application's database, commonly application-scoped read/write access. It should not receive cluster administration, user management, or backup privileges unless a separate operational task explicitly requires them.

### 10. How do database network restrictions and database roles differ?

**Answer:** Network restrictions limit which systems can attempt a connection. Authentication and roles determine which identity connected and what it may do. Both controls are needed.

### 11. Why is allowing every source address to connect to MongoDB a poor permanent fix?

**Answer:** It expands the locations from which a stolen credential can be used and removes an important boundary. Diagnose the deployed runtime's network path and allow only the required addresses or private route.

### 12. Why must database connectivity be checked from the deployed runtime?

**Answer:** A developer machine can have a different outbound address, DNS route, firewall, and certificate store. A laptop connection does not prove the deployed service can reach MongoDB.

### 13. Why should configuration be parsed and validated before the API listens?

**Answer:** Missing or malformed settings should fail startup instead of allowing a partially configured API to accept traffic or silently use an unsafe default.

### 14. What makes a good error when a required environment variable is missing?

**Answer:** It names the missing setting without printing its value or exposing other secrets. For example, it can say that <code>MONGODB_URI</code> is required without including the URI.

### 15. Does checking a session secret's character length prove that it has enough entropy?

**Answer:** No. A length check only rejects obviously short values. Generate the secret from a cryptographically secure source and keep it private.

### 16. What should <code>CLIENT_ORIGINS</code> contain for a credentialed browser API?

**Answer:** An explicit list of the exact allowed browser origins, including the correct scheme, hostname, and port where applicable. Do not use a wildcard for credentialed access.

### 17. What does <code>TRUST_PROXY_HOPS</code> validate?

**Answer:** A parser can ensure it is a nonnegative integer, but only deployment knowledge can determine whether the value matches the actual trusted proxy path. Valid syntax does not make the selected proxy trustworthy.

### 18. Why should MongoDB TLS certificate verification remain enabled?

**Answer:** Verification helps ensure the API is connected to the intended server and protects against interception. Fix the underlying certificate, DNS, or network issue instead of disabling verification.

### 19. Why connect to MongoDB before calling <code>app.listen()</code>?

**Answer:** If MongoDB is required for normal API requests, the process should not accept traffic while the database connection is unavailable. Startup should fail or remain unready until the dependency is usable.

### 20. Why should startup retries avoid a tight infinite loop?

**Answer:** A tight loop can consume CPU and flood logs while the underlying problem remains. Use bounded connection timeouts and let the platform's restart policy and monitoring handle repeated startup failures.

### 21. What does a MongoDB connection pool limit represent?

**Answer:** It limits concurrent connections managed by one MongoDB client in one process. It is not a single global limit for all API instances and other database clients.

### 22. How should an API estimate its maximum database connection demand?

**Answer:** Multiply the maximum API instance count by the application pool size, then add session-store pools and connections used by jobs, migrations, monitoring, and administration. Keep operational headroom below database capacity.

### 23. Why count instances that are temporarily overlapping during deployment?

**Answer:** A rolling deployment can run old and new instances at the same time. Both sets may hold connections, so capacity planning should include the maximum overlap and autoscaling size.

### 24. Why might the Mongo-backed session store need a separate pool budget?

**Answer:** When configured with its own MongoDB URI, it owns a separate MongoDB client and pool in each API process. Its connections add to the application's Mongoose pool.

### 25. Why should session storage be shared across production API instances?

**Answer:** Any instance may receive the next request. A shared durable store lets each instance resolve the same session identifier; process-local memory cannot reliably do this across restarts or instances.

### 26. What must be true before Express trusts forwarded headers?

**Answer:** The edge must be known and trusted, it must overwrite the forwarded headers it owns, and untrusted clients must not have a direct path that lets them forge those headers. Configure trust to match that actual topology.

### 27. What can go wrong if Express trusts too many proxy hops?

**Answer:** A client may be able to influence forwarded protocol or address information. That can affect secure-cookie behavior, redirects, logging, or rate limits and weaken assumptions made by middleware.

### 28. What is the difference between a liveness endpoint and a readiness endpoint?

**Answer:** Liveness indicates whether the process can respond. Readiness indicates whether the instance can serve ordinary traffic and required dependencies, such as MongoDB, are available.

### 29. Should liveness fail whenever MongoDB has a brief outage?

**Answer:** Usually no. Readiness can remove the instance from traffic while the dependency is unavailable. Restarting a healthy process because a remote dependency is briefly down can make recovery harder.

### 30. What information should a public health response avoid returning?

**Answer:** It should not return secrets, connection strings, database names, internal hostnames, stack traces, or raw driver errors. Keep detailed diagnostics in protected monitoring.

### 31. Why should application logs avoid raw connection errors and URIs?

**Answer:** Raw error fields may contain hostnames, topology details, or credentials, and a URI directly contains authentication data. Log a sanitized error category and use restricted diagnostics for deeper investigation.

### 32. What should graceful shutdown do after receiving <code>SIGTERM</code>?

**Answer:** Stop accepting new requests, allow in-flight work to finish within a bounded deadline, close the session-store client and application database connection, and close other owned resources before the process terminates.

### 33. Why is closing Mongoose alone insufficient in the course's session setup?

**Answer:** The session store created with its own MongoDB URI owns a separate client. The process must retain the store reference and call its supported close method as well as disconnect Mongoose.

### 34. Why should shutdown have a deadline?

**Answer:** The platform provides a finite termination grace period. A bounded deadline allows normal cleanup while ensuring a stuck request or connection cannot keep the instance alive indefinitely.

### 35. Why avoid calling <code>process.exit()</code> immediately during shutdown?

**Answer:** It can terminate the process before active requests and cleanup promises finish. Set an exit code after cleanup and let the runtime enforce its deadline.

### 36. What should the deployment platform do with an instance that has not passed readiness?

**Answer:** It should keep that instance out of normal user traffic until startup and required dependencies are ready. The exact probe and routing behavior should match the platform's lifecycle model.

### 37. What is a safe order for database connection troubleshooting?

**Answer:** Check runtime variable presence, URI structure and encoding, database user and role, network allowlist or private route, DNS, TLS, driver timeout details, and pool capacity. Do not first widen access or disable security.

### 38. What should a deployment rollback restore?

**Answer:** Restore a known working artifact together with compatible runtime configuration. Keep schema changes backward-compatible during a rollout so the prior application version can still run.

### 39. Why should a deployment retain the previous release until the new one is stable?

**Answer:** A known artifact provides a fast recovery path if readiness, error rates, latency, or database behavior becomes unacceptable after traffic moves.

### 40. A production API cannot reach MongoDB after deployment. Name a safe investigation sequence.

**Answer:** Confirm <code>MONGODB_URI</code> exists in the deployed process without printing it; inspect its host, database, and encoded credentials; verify the application user's role; confirm the runtime's network route is allowed; check DNS and TLS from that runtime; inspect sanitized timeout errors; then compare instance count and pool use with database capacity. Do not expose MongoDB to all addresses, grant administrator access, or disable TLS verification.
