# 097 - Deployment architecture and environment separation: Example

This example plans a deployment for the course application without tying it to a specific cloud vendor. The browser and API use one public origin: a trusted edge serves the React build and forwards <code>/api</code> requests to two Express instances. Both instances use the same production session store, MongoDB cluster, and private file storage.

The hostnames and resource names below are examples only. Use separate staging resources and production secrets.

## 1. Draw the request and data paths

~~~~mermaid
flowchart LR
  Browser --> Edge[HTTPS edge]
  Edge -->|static files| Frontend[React build]
  Edge -->|/api| APIA[Express instance A]
  Edge -->|/api| APIB[Express instance B]
  APIA --> Sessions[Shared session store]
  APIB --> Sessions
  APIA --> Mongo[(Private MongoDB)]
  APIB --> Mongo
  APIA --> Storage[Private durable file storage]
  APIB --> Storage
~~~~

The public browser origin is <code>https://learn.example.test</code>. It requests <code>/api</code> from the same origin, so the frontend build does not need an environment-specific API hostname. The edge keeps MongoDB, session storage, and file storage private.

## 2. Keep only a safe environment template in Git

~~~~text
# server/.env.example
NODE_ENV=development
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/mern_course_dev
SESSION_SECRET=replace-with-a-local-random-value
SESSION_COOKIE_NAME=mern.sid
COOKIE_SAME_SITE=lax
COOKIE_SECURE=false
CLIENT_ORIGINS=http://localhost:5173
TRUST_PROXY_HOPS=0
PRIVATE_UPLOAD_DIR=<local-private-storage-path>
~~~~

The actual local file remains untracked:

~~~~gitignore
# server/.gitignore
.env
.env.*
!.env.example
~~~~

Use separate protected environment values for staging and production. Never commit their secret values.

## 3. Use separate staging and production settings

| Setting | Staging example | Production example |
| --- | --- | --- |
| Browser origin | <code>https://staging-learn.example.test</code> | <code>https://learn.example.test</code> |
| API path | <code>/api</code> through staging edge | <code>/api</code> through production edge |
| MongoDB | Staging cluster and staging database | Production cluster and production database |
| Session store | Staging shared store | Production shared store |
| Session secret | Staging-only generated secret | Production-only generated secret |
| Session cookie name | <code>__Host-mern.sid</code> | <code>__Host-mern.sid</code> |
| Cookie policy | Secure, HttpOnly, explicit SameSite | Secure, HttpOnly, explicit SameSite |
| Upload storage | Private staging storage | Private production storage |
| Proxy trust | Staging's actual edge path | Production's actual edge path |
| Frontend API base | <code>/api</code> | <code>/api</code> |

The app configuration differs by environment while the frontend can use the same relative API path. The session secret, database URI, storage path, and deployment credentials must remain different.

## 4. Build a relative-API frontend artifact

Set the public API path before building the static client:

~~~~text
# client build environment
VITE_API_BASE_URL=/api
~~~~

The API client constructs URLs under <code>/api</code>. The static build contains only a public path, not credentials. Because staging and production use the same path behind their own edges, they can promote the same frontend artifact.

If the frontend and API are hosted on different origins instead, the API base URL becomes public build configuration and the API needs an exact credentialed CORS allowlist for that environment. Do not put server secrets in the client environment.

## 5. Inject server configuration at runtime

For production, the platform should provide values equivalent to:

~~~~text
NODE_ENV=production
PORT=4000
MONGODB_URI=<production-database-secret>
SESSION_SECRET=<production-session-secret>
SESSION_COOKIE_NAME=__Host-mern.sid
COOKIE_SAME_SITE=lax
COOKIE_SECURE=true
CLIENT_ORIGINS=https://learn.example.test
TRUST_PROXY_HOPS=1
PRIVATE_UPLOAD_DIR=<private-durable-storage-path>
~~~~

The application validates this configuration before listening. The value <code>TRUST_PROXY_HOPS=1</code> is correct only if the real production network has exactly one trusted proxy hop before Express and the edge overwrites forwarded headers. Determine it from the deployment topology rather than copying this example blindly.

All Express instances that serve the same sessions must use the same environment's session secret and shared session store. Staging and production must never share either value.

## 6. Configure the edge paths

The edge needs a rule equivalent to:

~~~~text
Public request: https://learn.example.test/
Serve:          immutable React build files

Public request: https://learn.example.test/api/*
Forward to:     private Express API service

Private network:
Express -> MongoDB
Express -> session store
Express -> upload storage
~~~~

Serve hashed frontend assets with a long cache lifetime and revalidate the HTML entry point so users receive the current asset manifest after a release. Do not cache authenticated API responses publicly unless the API has an explicit, reviewed cache policy.

Configure request-body and timeout limits at both the edge and Express. Keep proxy forwarded-header behavior consistent with the Express trust setting.

## 7. Keep API instances replaceable

A deployment may run two or more API instances behind a load balancer. Each instance should:

- Be replaceable without losing sessions, uploaded files, or database records.
- Read the same per-environment runtime configuration.
- Use the shared session store and private file storage.
- Stop accepting new requests during shutdown and close its connections.
- Expose safe readiness and liveness signals.
- Log a request ID and service version without logging secrets.

Do not store session state or important uploaded files only in an instance's local directory. A local temporary staging directory is fine only for files that are moved to shared durable storage before the API reports success.

## 8. Sequence a release with compatibility in mind

A practical rollout for a release that adds a field might be:

1. Review the database change and add the new optional field or index in a compatible way.
2. Deploy the new API version while old API instances may still run.
3. Confirm the new version starts, connects to staging resources, and passes the release checks.
4. Deploy or promote the frontend artifact.
5. Observe API errors, latency, database load, and client failures.
6. Backfill data if required.
7. Remove old fields or old code in a later release after no active version depends on them.

For an existing application, database migrations and index creation need a deployment owner and rollback plan. Do not assume that reverting application code will reverse data already written.

## 9. Define an environment-level release record

A release record can describe the values without storing secrets:

~~~~yaml
release:
  revision: "git-revision"
  frontendArtifact: "frontend-artifact-digest"
  apiArtifact: "api-artifact-digest"

environment:
  name: "staging"
  frontendOrigin: "https://staging-learn.example.test"
  apiPath: "/api"
  databaseResource: "staging-mern-db"
  sessionStoreResource: "staging-sessions"
  uploadStorageResource: "staging-private-uploads"
  secretsSource: "deployment-secret-store"

checks:
  - api-ready
  - session-cookie
  - csrf-request
  - create-and-read-course
  - private-upload-access
~~~~

Do not store real secret values in this record. It should identify the secret source or version using a safe reference.

## 10. Use a staging rehearsal and production promotion

~~~~text
1. Build once from the reviewed source revision.
2. Publish immutable frontend and API artifacts.
3. Deploy them to staging with staging-only configuration.
4. Confirm database, cookie, upload, proxy, and API behavior.
5. Record the exact artifact digests that passed staging.
6. Promote those digests to production with production-only configuration.
7. Monitor readiness, errors, latency, and dependency health.
8. Roll back to the previous artifacts if the release is unhealthy.
~~~~

Release checks and test commands should run in CI or staging according to the team's pipeline. This example describes the plan; it does not deploy the course application.

## 11. Prepare a rollback before release

Before promoting, record:

- Previous frontend and API artifact identifiers.
- Database changes and whether they are backward-compatible.
- Which secrets or hostnames changed.
- How to route traffic back to the previous artifact.
- What data changes cannot be safely reversed.
- Who decides whether to roll back.

A rollback is not a substitute for backups. Verify restoration procedures for MongoDB and uploaded files separately and keep the recovery credentials available to authorized operators.

## Manual architecture review

1. Confirm browser traffic reaches a trusted HTTPS edge.
2. Confirm the edge serves React and forwards only intended API paths.
3. Confirm API instances share sessions, MongoDB, and private uploads.
4. Confirm no important state depends on one instance's memory or disk.
5. Confirm development, test, staging, and production have separate data and secrets.
6. Confirm the static bundle contains only public configuration.
7. Confirm session cookie and CSRF behavior matches the public origin design.
8. Confirm proxy trust and forwarded headers match the real path.
9. Confirm rollout order works while old and new API versions overlap.
10. Confirm the previous artifacts and recovery plan are ready before production promotion.

## Common mistakes

- Assuming all production components run in one process.
- Pointing staging or test to the production database.
- Reusing session secrets or upload storage across environments.
- Putting a database URI in the Vite build.
- Building a static frontend with the wrong API origin.
- Keeping sessions in instance memory while scaling to multiple instances.
- Saving final uploaded files only on an ephemeral API disk.
- Trusting forwarded headers from untrusted clients.
- Caching private API responses at the edge.
- Releasing a destructive database change while old API code still runs.
- Promoting untracked artifacts that differ from the staging release.
- Planning rollback without accounting for already-written data.

## Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- | --- |
| [096 - Profile MongoDB queries and improve indexes](../lessons/096-profile-mongodb-queries-and-improve-indexes.md) | [Lesson](../lessons/097-deployment-architecture-and-environment-separation.md) | [Q&A](../qnas/097-deployment-architecture-and-environment-separation.md) | [Example](097-deployment-architecture-and-environment-separation.md) | [098 - Deploy the API and configure database secrets](../lessons/098-deploy-the-api-and-configure-database-secrets.md) |
