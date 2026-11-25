# 097 - Deployment architecture and environment separation: Q&A

### 1. What are the main runtime pieces of a deployed MERN application?

**Answer:** The React build is delivered as static browser assets, Express handles API requests, MongoDB stores application records, and the system may also use a session store, private file storage, a reverse proxy, and centralized logs or telemetry.

### 2. Why draw the deployment topology before choosing a hosting product?

**Answer:** A topology makes public and private boundaries, request paths, shared state, and failure points visible. It helps the team choose a platform based on the application's actual needs rather than assuming all parts run as one process.

### 3. What is a same-origin API deployment?

**Answer:** The browser accesses the frontend and API through one public origin, often with a reverse proxy serving static files and forwarding an <code>/api</code> path to Express. This can simplify browser origin and cookie configuration.

### 4. What is a separately hosted frontend and API?

**Answer:** The static frontend and API have separate origins and may deploy or scale independently. The browser then needs a correct public API URL, exact CORS policy, credential behavior, cookie policy, and CSRF design.

### 5. Is one deployment shape always best?

**Answer:** No. Same-origin and separate-origin designs have different operational and browser-security trade-offs. Choose based on product requirements, team operations, traffic, and the intended trust boundary.

### 6. What is the difference between development and production?

**Answer:** Development is for active code work and is usually private and convenient. Production is the environment used by real users and must account for reliability, performance, security, data retention, and incident response.

### 7. Why keep a test environment separate from production?

**Answer:** Tests create and delete data, run experimental code, and may use disposable credentials. A separate test database and storage prevent tests or cleanup from altering real user data.

### 8. Why have a staging environment?

**Answer:** Staging rehearses a release with production-like routing, cookies, API origins, database behavior, and deployment steps, but uses separate data and credentials. It can reveal configuration failures before production.

### 9. Should staging use the production database?

**Answer:** Normally no. Staging should use its own database and credentials. If production data is needed for a specific approved purpose, follow a controlled data-handling process that limits access and protects personal information.

### 10. What is a build-time frontend variable?

**Answer:** It is a value resolved while building the static client, such as a Vite API URL. Once included in the JavaScript bundle, it is public to anyone who can download that bundle.

### 11. Can a Vite-prefixed variable contain a server secret?

**Answer:** No. Vite-prefixed values are intended for browser access and can be embedded in delivered JavaScript. Keep MongoDB URIs, session secrets, private keys, and server-only paths in protected server runtime configuration.

### 12. How can the same frontend artifact be promoted across environments?

**Answer:** Use a same-origin relative API path or provide a deliberately public runtime configuration file at deployment. Do not put secrets in the artifact. If the API URL is baked in at build time, each environment requires a corresponding build.

### 13. What is an immutable release artifact?

**Answer:** It is a built version identified by a revision or digest that does not change after creation. Promoting the same artifact from staging to production avoids accidentally deploying code or dependencies different from those reviewed.

### 14. Why install dependencies from a lockfile in CI?

**Answer:** A lockfile records the dependency resolution used by the project. Installing from it makes CI and deployment builds more repeatable than resolving a potentially different dependency graph each time.

### 15. Why should every environment use separate credentials?

**Answer:** Separate credentials limit the impact of a leak and allow access to be revoked per environment. A development secret should not grant access to production data or storage.

### 16. Should production secrets be stored in source control?

**Answer:** No. Inject them through protected deployment variables or a secret manager. Do not write them in source files, public artifacts, issue text, logs, or frontend bundles.

### 17. Why should environment configuration fail safely?

**Answer:** If a required value is missing or invalid, the service should stop before accepting traffic rather than silently fall back to a production database, a default session secret, or an unsafe origin.

### 18. Why is process memory not shared state?

**Answer:** Each Express instance has separate memory, and it disappears when that process restarts. A load balancer may send the next request to another instance, so state that must persist belongs in a shared durable service.

### 19. What is session affinity?

**Answer:** It is a load-balancer behavior that tends to send a client's requests to the same instance. It may reduce cross-instance session lookups in some designs, but it does not make process memory durable or replace a shared session store.

### 20. Where should server-side sessions live when the API has several instances?

**Answer:** In a shared session store, such as the MongoDB-backed store used in this course, so each instance can resolve the same session ID. The store needs appropriate availability, capacity, access control, and retention.

### 21. Why should uploaded files not live only on one API instance's local disk?

**Answer:** Other instances may not see the file, and the file may disappear when the instance or container is replaced. Use durable shared private storage or object storage and store metadata that every instance can access.

### 22. What is a reverse proxy?

**Answer:** It is a service in front of the application that can route requests, terminate TLS, serve static content, compress responses, apply limits, cache suitable responses, or distribute traffic across instances.

### 23. What must be true before Express trusts forwarded headers?

**Answer:** The network path and trusted proxy count must be known, the edge must overwrite client-supplied forwarded headers, and direct untrusted access to Express must be prevented or handled. Trust proxy settings must match the real topology.

### 24. Why should MongoDB normally be private?

**Answer:** The database is an application data service, not a browser endpoint. Restricting network access to the API and operational systems reduces exposure and makes the intended trust boundary clearer.

### 25. What must align when the frontend and API are on separate origins?

**Answer:** The frontend's API URL, CORS allowlist, credential setting, session cookie attributes, CSRF token flow, HTTPS configuration, and proxy routing must all agree with the deployed scheme, host, and site relationship.

### 26. Is CORS an authorization mechanism?

**Answer:** No. It controls whether browser JavaScript can read a cross-origin response. The API still authenticates the session, checks authorization, validates input, and enforces ownership.

### 27. Why can old and new API versions overlap during deployment?

**Answer:** Rolling deployments start new instances before all old instances have stopped. Requests may reach both versions for a period, so both must be able to read and write compatible data during the transition.

### 28. What is an expand-and-contract database change?

**Answer:** First add the new schema capability while old code still works, then deploy code that uses it, migrate existing data if needed, and only later remove the obsolete representation after no old code depends on it.

### 29. Why are destructive schema changes risky during a rolling deploy?

**Answer:** An old API instance may still expect a field or shape that a new migration removed. The old code can fail while the deployment is in progress or during rollback.

### 30. What is a liveness check?

**Answer:** It indicates whether the process is alive enough to continue running or should be restarted. It should be small and should not expose secrets or detailed infrastructure information.

### 31. What is a readiness check?

**Answer:** It indicates whether an instance is prepared to receive application traffic, considering the dependencies required to serve requests. A ready process can still be unhealthy in other ways, so monitoring needs more than one signal.

### 32. Should a health endpoint return database credentials or internal connection details?

**Answer:** No. It should return only safe operational status appropriate for its audience. Detailed diagnostics belong in restricted logs and monitoring systems.

### 33. Why plan graceful shutdown?

**Answer:** During deployment or process replacement, an instance should stop accepting new traffic, allow in-flight work to complete within a limit, and close database and store connections. This reduces interrupted requests and leaked resources.

### 34. Why should retries be bounded?

**Answer:** Unbounded retries can create a retry storm when a dependency is already overloaded. Use limits, timeouts, and backoff as appropriate, and ensure non-idempotent writes are not duplicated without an idempotency design.

### 35. How should CI deployment permissions be scoped?

**Answer:** Give CI only the credentials and permissions necessary for the target environment and release task. Separate staging and production permissions and require the intended release gate for production changes.

### 36. What does an environment matrix document?

**Answer:** It records each environment's public origins, API route, database and storage resource names, secret source, cookie policy, and proxy topology without exposing secret values. It helps operators verify that related settings agree.

### 37. Why should source maps and build logs be reviewed?

**Answer:** They may reveal source paths or accidentally printed configuration. Ensure public artifacts contain only intended public information, and ensure CI logs do not display secret values.

### 38. Is a database backup enough for recovery?

**Answer:** Not always. Recovery may also require upload bytes, session handling decisions, encryption keys, compatible application artifacts, and restore instructions. Test the recovery process in an isolated environment.

### 39. What should a rollback plan include?

**Answer:** It should identify the previous artifact, compatible schema state, configuration changes, traffic switch, and data changes that cannot be reversed. A rollback should not assume a destructive database migration can simply be undone.

### 40. What should be reviewed before release?

**Answer:** Confirm the topology, environment isolation, public artifact configuration, secret source, browser origins and cookies, shared session and file storage, proxy trust, database compatibility, health and shutdown behavior, backups, monitoring, CI permissions, and a rollback plan.

## Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- | --- |
| [096 - Profile MongoDB queries and improve indexes](../lessons/096-profile-mongodb-queries-and-improve-indexes.md) | [Lesson](../lessons/097-deployment-architecture-and-environment-separation.md) | [Q&A](097-deployment-architecture-and-environment-separation.md) | [Example](../examples/097-deployment-architecture-and-environment-separation.md) | [098 - Deploy the API and configure database secrets](../lessons/098-deploy-the-api-and-configure-database-secrets.md) |
