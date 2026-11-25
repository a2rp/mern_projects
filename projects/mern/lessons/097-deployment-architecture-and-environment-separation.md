# 097 - Deployment architecture and environment separation

A MERN application is not one process in production. The React build is static browser content, the Express API is a server process, MongoDB is a persistent service, and uploads or sessions may have their own storage. Deployment architecture decides how those pieces communicate, which environment owns each resource, and how a release moves without exposing secrets or losing data.

This chapter maps the components, compares common hosting shapes, and separates local, test, staging, and production configuration. It also covers artifact promotion, stateful dependencies, network boundaries, and release compatibility.

## Learning outcomes

After this chapter, you should be able to:

- Describe the runtime parts of a deployed MERN application.
- Compare same-origin and separately hosted frontend/API architectures.
- Keep development, test, staging, and production resources isolated.
- Distinguish build-time browser configuration from runtime server secrets.
- Design the API and storage layer to support multiple instances.
- Understand reverse proxy, TLS, cookie, and CORS responsibilities.
- Plan deployment artifacts, environment variables, and rollback.
- Make database and API changes compatible with rolling deployments.
- Identify where static files, sessions, uploads, and logs should live.
- Review a deployment topology before choosing a hosting product.

## 1. Map the deployed components

A typical production request crosses several systems:

~~~~mermaid
flowchart LR
  Browser --> CDN[Static frontend or CDN]
  Browser --> Edge[HTTPS edge or reverse proxy]
  Edge --> API1[Express API instance]
  Edge --> API2[Express API instance]
  API1 --> Sessions[Shared session store]
  API2 --> Sessions
  API1 --> Mongo[(MongoDB)]
  API2 --> Mongo
  API1 --> Files[Private durable file storage]
  API2 --> Files
~~~~

The static frontend and API may use one hostname or separate hosts. The API may run as one instance or several. Sessions, databases, and uploaded files must remain available across every instance that serves a request.

A production architecture should name the owner and failure mode for each component:

| Component | Stores or serves | Needs to survive an API restart? |
| --- | --- | --- |
| Frontend artifact | HTML, JavaScript, styles, images | Yes, as a deployed release artifact |
| Express instance | Request processing and short-lived computation | No local process state should be assumed |
| Session store | Active server-side browser sessions | Yes, according to session policy |
| MongoDB | Application records and indexes | Yes, with backups and recovery |
| Upload storage | User file bytes | Yes, with access control and lifecycle rules |
| Logs and telemetry | Operational events and measurements | Must be exported and retained deliberately |

## 2. Choose a hosting shape

### Same-origin or reverse-proxied API

The browser requests the frontend and API through one public origin, such as <code>https://app.example.test</code>. A reverse proxy serves static files and forwards <code>/api</code> to Express.

Advantages:

- Browser requests avoid many cross-origin configuration issues.
- Session cookies can stay host-scoped.
- The public API can remain on a private network.

Trade-offs:

- The edge proxy must route static and API paths correctly.
- Static and API releases may be coupled operationally unless versioned independently.

### Separately hosted frontend and API

The static frontend is served from one origin and the API from another. The browser calls the API directly.

Advantages:

- Frontend assets and API can scale and deploy separately.
- A CDN can serve the static application globally.

Trade-offs:

- CORS, cookie, CSRF, and origin configuration must match the actual deployment.
- The frontend build needs the correct public API base URL.
- Browser and API failures have separate operational paths.

Neither shape is universally best. Choose one that fits the product, team, traffic, and security boundaries, then document how requests and cookies move.

## 3. Keep environments isolated

Use separate resource sets for each environment:

| Environment | Intended use | Database and credentials |
| --- | --- | --- |
| Development | Daily local feature work | Local or developer-only database and non-production secrets |
| Test | Automated or manual verification | Disposable isolated database and test-only accounts |
| Staging | Release rehearsal using production-like topology | Separate staging database, storage, cookies, and credentials |
| Production | Real users | Production database, storage, least-privilege credentials, protected secrets |

Do not let staging or tests connect to production by falling back to a default URI. Give each environment its own database name, storage location, session namespace, origin allowlist, and secret set.

A production backup must not be restored into a broadly accessible staging environment without an approved data-handling process. Use synthetic or properly protected data for release rehearsal.

## 4. Separate build-time and runtime configuration

A static React application runs in the user's browser. Values embedded during a Vite build are visible to anyone who downloads the JavaScript bundle. A frontend API URL is public configuration; a database URI or session secret is not.

~~~~text
# public browser build configuration
VITE_API_BASE_URL=https://api.example.test

# server runtime configuration; inject outside the browser build
MONGODB_URI=<provided-by-secret-manager>
SESSION_SECRET=<provided-by-secret-manager>
CLIENT_ORIGINS=https://app.example.test
PRIVATE_UPLOAD_DIR=<private-durable-storage-path>
~~~~

A Vite environment variable is usually resolved when the frontend is built. If the same static artifact must be promoted through several environments without rebuilding, provide a deliberately public runtime configuration file or use a same-origin relative API path. Never solve build promotion by placing secrets in the browser bundle.

## 5. Promote artifacts deliberately

A release pipeline commonly performs these steps:

1. Build frontend and backend artifacts from a reviewed source revision.
2. Install from the lockfile and run the required checks in CI.
3. Publish immutable artifacts with a revision identifier.
4. Deploy the same artifact to staging with staging configuration.
5. Verify application startup, API connectivity, and a small set of release checks.
6. Promote the artifact to production with production-only configuration.
7. Observe the deployment and retain a rollback target.

Do not rebuild different code for production after staging approval. A rebuild can produce a different dependency graph or artifact. Environment-specific values should be injected according to a clear policy.

Never place secrets in public artifact names, source maps published to untrusted locations, build logs, or CI output.

## 6. Keep the API stateless across instances

A load balancer may send consecutive requests from one user to different Express instances. Do not rely on process memory for state that must survive across requests.

Examples of state that should not live only in an instance:

- Sessions that need to persist across requests.
- Uploaded files that need to be available from any instance.
- Rate-limit counters that should apply across the service.
- Jobs that need durable retry and recovery.

Use a shared session store, durable private file storage, and an appropriate shared counter or queue. Sticky sessions can route requests to one instance but do not replace a durable shared store when instances restart or scale.

## 7. Put a trusted edge in front of the API

A reverse proxy or load balancer can terminate TLS, route traffic, set request limits, compress responses, and distribute traffic. The deployment must define which headers it owns and whether clients can reach Express directly.

If Express uses forwarded protocol or IP values, configure proxy trust to match the real path. The edge should overwrite, not blindly append to, the relevant forwarded values. The API must not trust arbitrary client-supplied forwarding headers.

Keep the database and private storage off the public internet unless the service explicitly requires public access. Restrict network paths to the API and operational systems that need them.

## 8. Align browser origins, cookies, and API routing

For each environment, write down:

- The browser page origin.
- The API origin or reverse-proxy path.
- Whether cookies are same-origin, same-site, or cross-site.
- The CORS allowlist and credential policy.
- The session cookie's Secure, HttpOnly, SameSite, Path, and Domain settings.
- The CSRF token flow for state-changing requests.

A production API should allow only its deployed frontend origins. A development origin must not be present in production unless it is a real, controlled application origin. CORS is not authorization; every API route still checks the authenticated user and permission.

## 9. Make deploys compatible with more than one version

During a rolling deployment, old and new API instances may run at the same time. A safe release should tolerate this overlap:

- Add a database field before deploying code that requires it.
- Allow old and new API versions to read data during the transition.
- Backfill data in a controlled job if needed.
- Remove obsolete fields only after old code no longer runs.
- Keep API response changes backward-compatible for deployed browser clients where practical.
- Avoid destructive database changes in the same step as a code deployment.

This expand-and-contract approach reduces the chance that one application version writes data another active version cannot read.

## 10. Plan health, capacity, and failure boundaries

An instance can be running while it cannot serve requests. Define a small liveness check for process health and a readiness check for whether the instance can accept work. Avoid a readiness endpoint that exposes credentials or internal service details.

Plan capacity and failure behavior for:

- MongoDB connection pool limits.
- Concurrent uploads and request-body sizes.
- API timeouts and reverse-proxy timeouts.
- Session store availability.
- Durable storage access.
- Graceful shutdown and draining in-flight requests.
- Process restarts and repeated crash loops.

Avoid retry storms. Retries should be bounded, use backoff where appropriate, and avoid repeating non-idempotent writes without an idempotency design.

## 11. Keep configuration and operational access narrow

Use a separate credential per environment and service. Give the API only the database, bucket, and network permissions it needs. Give CI only the permissions required to build and deploy the intended environment.

Rotate credentials in a controlled way:

1. Create the replacement credential.
2. Update the relevant secret store.
3. Deploy or restart consumers.
4. Confirm the new credential is in use.
5. Revoke the old credential.
6. Record the change without recording the secret value.

Do not share personal database credentials with production services or commit service-account keys.

## 12. Document the architecture

Keep an environment matrix that identifies, without revealing secret values:

| Item | Development | Staging | Production |
| --- | --- | --- | --- |
| Frontend origin | Local URL | Staging URL | Public HTTPS URL |
| API origin/path | Local API or proxy | Staging API or proxy | Production API or proxy |
| Database name/cluster | Local developer DB | Isolated staging DB | Production DB |
| Session store | Local/test service | Shared staging store | Shared production store |
| Upload storage | Local private path | Staging bucket/volume | Production private bucket/volume |
| Secrets source | Untracked local file | Protected deployment variables | Secret manager |
| Proxy trust | Disabled unless needed | Actual staging topology | Actual production topology |
| Deployment artifact | Local build | Release candidate | Promoted release |

Document which team or system owns deployments, database changes, DNS, TLS, backups, and incidents. A diagram and matrix are more useful than a list of undocumented hostnames.

## Common mistakes

- Treating the React build and Express server as one runtime.
- Embedding server secrets in Vite variables or static assets.
- Reusing one database, storage bucket, or session secret across environments.
- Allowing tests or staging to fall back to production credentials.
- Assuming one API instance's local memory or disk is shared.
- Relying on sticky sessions instead of a shared session store.
- Exposing MongoDB or private file storage directly to the public network.
- Trusting forwarded headers without matching proxy configuration.
- Promoting a frontend build with the wrong baked-in API URL.
- Running destructive schema changes while old application instances remain active.
- Returning internal dependency status or secrets from health endpoints.
- Giving CI a broad credential that can change every environment.

## Manually review the deployment design

1. Draw the browser, static frontend, HTTPS edge, API, session store, MongoDB, and upload storage.
2. Identify which services are public and which are private.
3. Confirm each environment has separate data, storage, and credentials.
4. Confirm no secret enters a Vite bundle, build log, or public artifact.
5. Confirm the browser's API URL, CORS allowlist, cookie policy, and CSRF design agree.
6. Confirm API instances use shared durable sessions and file storage.
7. Confirm proxy trust matches the actual staging and production network paths.
8. Confirm staged database and API changes work with the version overlap during rollout.
9. Confirm health checks expose only safe operational status.
10. Identify rollback, backup restore, and credential-rotation owners.

## Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- | --- |
| [096 - Profile MongoDB queries and improve indexes](096-profile-mongodb-queries-and-improve-indexes.md) | [Lesson](097-deployment-architecture-and-environment-separation.md) | [Q&A](../qnas/097-deployment-architecture-and-environment-separation.md) | [Example](../examples/097-deployment-architecture-and-environment-separation.md) | [098 - Deploy the API and configure database secrets](098-deploy-the-api-and-configure-database-secrets.md) |
