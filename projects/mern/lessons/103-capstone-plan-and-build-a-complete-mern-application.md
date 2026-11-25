# 103 - Capstone: plan and build a complete MERN application

This capstone combines the course's frontend, API, database, authentication, testing, and deployment work into one application. The goal is not to write the most code; it is to deliver a small, coherent product whose user journeys work end to end and whose data and operations are designed deliberately.

The project in this chapter is a learning library. Visitors can browse published courses. Registered users can save courses and create private notes. An administrator can manage course content. You can adapt the product, but keep the same discipline: define scope, design the data and API, implement vertical slices, verify each journey, and deploy a known release.

Chapter 104 performs the final accessibility, security, performance, and deployment review.

## Learning outcomes

After this chapter, you should be able to:

- Turn product requirements into a bounded MVP and explicit acceptance criteria.
- Design a MERN architecture and data model before implementation.
- Define API contracts and ownership rules.
- Build and integrate features in vertical slices.
- Test user journeys across UI, API, and database boundaries.
- Keep authentication, authorization, validation, and error handling consistent.
- Plan deployment, monitoring, migration, and rollback work.
- Deliver a README and release that another developer can operate.

## 1. Define the product and its users

A useful capstone begins with a clear user and problem. This example serves people who want to find and organize published learning material.

### Visitor

- Browse published courses.
- Search and filter the catalog.
- Open a course detail page.
- Register for an account or sign in.

### Registered learner

- Use all visitor features.
- Save or remove courses from a personal list.
- Create, edit, and delete private notes attached to saved courses.
- View only their own private notes and saved list.
- Sign out and revoke the current session.

### Administrator

- Use learner features.
- Create, edit, publish, and archive course entries.
- See validation feedback and the result of each change.
- Cannot use the role field from a request body to grant themselves access.

A role describes application capability, not trustworthiness. Every privileged action is checked by the server on every request.

## 2. Define MVP scope and acceptance criteria

An MVP is the smallest release that solves the chosen problem safely. Write down what is included and what is deliberately postponed.

### Included

- Public course catalog and course detail.
- Account registration, login, logout, and durable shared sessions.
- Learner saved-course list.
- Private learner notes with ownership enforcement.
- Administrator course management and publication state.
- Search, filtering, sorting, and pagination.
- Loading, empty, success, and error UI states.
- Automated tests for important service, route, component, and end-to-end behavior.
- Production configuration, health checks, logs, backups, and a release plan.

### Postponed

- Payments and subscriptions.
- Public user profiles.
- Comments, messaging, or real-time collaboration.
- File uploads unless they are a core requirement.
- Complex recommendation models.
- Multiple administrative permission tiers.

For each included behavior, write a testable acceptance criterion. Examples:

- A visitor sees only published courses.
- An unauthenticated request to create a note receives the established authentication response.
- A learner cannot read, update, or delete another learner's note by changing an ID.
- An administrator can publish a valid course and sees the new catalog state.
- An empty search result explains that no matching courses were found.
- A network failure leaves the form state understandable and retryable.
- A direct refresh on a course detail URL still renders the React application.

## 3. Sketch the system boundaries

~~~~mermaid
flowchart LR
  Visitor[Visitor or learner browser] --> Edge[HTTPS edge]
  Edge --> Client[React application]
  Client -->|/api requests and session cookie| API[Express API]
  API --> Users[(Users)]
  API --> Courses[(Courses)]
  API --> Saved[(Saved courses)]
  API --> Notes[(Private notes)]
  API --> Sessions[(Shared session store)]
  CI[CI workflow] --> Artifact[Reviewed release artifact]
  Artifact --> Edge
  Artifact --> API
~~~~

The browser contains public code and public URLs. The server owns credentials, validation, authorization, session logic, and database access. MongoDB is not accessed directly from React.

Write down which component owns each concern:

| Concern | Owner |
| --- | --- |
| Route navigation and interaction states | React client |
| Authentication and session validation | Express API |
| Authorization and record ownership | Express API |
| Request validation and public response shape | Express API |
| Persistent application records | MongoDB |
| Shared session persistence | Session store |
| TLS termination and public routing | Trusted edge |
| Build verification | CI |
| Backup and recovery operation | Database and operations process |

## 4. Plan the data model

Start with the relationships and query patterns the product needs. Avoid creating a collection for every screen.

### User

- Normalized unique email.
- Password hash or identity-provider reference.
- Server-controlled role.
- Creation and update timestamps.
- Account state needed for deletion or suspension.

### Course

- Unique slug.
- Title, summary, and content.
- Topic or category.
- Publication state and timestamps.
- Creator or editor identifier.
- Fields needed for catalog sort and search.

### SavedCourse

- Learner identifier.
- Course identifier.
- Creation timestamp.
- Unique compound index on learner and course.

### Note

- Learner identifier.
- Course identifier.
- Note body with an explicit size limit.
- Creation and update timestamps.
- Indexes that support the learner's course-specific note view.

### Session

- Opaque session identifier and server-side session data.
- Expiration policy and cleanup behavior.
- Shared storage across API instances.

Use references where the data and lifecycle make them appropriate. Embed small bounded values that are read and updated with their parent. Define deletion behavior: for example, archiving a course can preserve learner notes while preventing new saves.

Add indexes for real uniqueness and query requirements. A unique index is a data integrity rule, not merely a performance hint. Verify existing data before introducing one.

## 5. Define the API contract

Write method, path, access rule, validation, and response behavior before building the pages.

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | <code>/api/courses</code> | Public | Search and paginate published courses |
| GET | <code>/api/courses/:slug</code> | Public | Read one published course |
| POST | <code>/api/auth/register</code> | Public with rate limits | Create a learner account |
| POST | <code>/api/auth/login</code> | Public with rate limits | Authenticate and establish a session |
| POST | <code>/api/auth/logout</code> | Authenticated with CSRF protection | Revoke the current session |
| GET | <code>/api/auth/me</code> | Authenticated | Read the current user's public profile |
| GET | <code>/api/saved-courses</code> | Authenticated | List the current learner's saved courses |
| POST | <code>/api/saved-courses</code> | Authenticated with CSRF protection | Save a course |
| DELETE | <code>/api/saved-courses/:courseId</code> | Authenticated with CSRF protection | Remove a saved course |
| GET | <code>/api/notes</code> | Authenticated | List the current learner's notes |
| POST | <code>/api/notes</code> | Authenticated with CSRF protection | Create a private note |
| PATCH | <code>/api/notes/:noteId</code> | Owner with CSRF protection | Update an owned note |
| DELETE | <code>/api/notes/:noteId</code> | Owner with CSRF protection | Delete an owned note |
| POST | <code>/api/admin/courses</code> | Administrator with CSRF protection | Create a course |
| PATCH | <code>/api/admin/courses/:courseId</code> | Administrator with CSRF protection | Update or publish a course |
| POST | <code>/api/admin/courses/:courseId/archive</code> | Administrator with CSRF protection | Archive a course |

For every endpoint, define:

- Request schema and maximum sizes.
- Authentication and authorization requirements.
- Whether CSRF protection applies.
- Success status and response shape.
- Validation, conflict, not-found, and server-error behavior.
- Pagination and sorting limits.
- Whether the route reveals that a private record exists.

A route parameter is not proof of ownership. Scope queries to the authenticated user, for example by filtering notes with both the note ID and <code>req.session.userId</code>.

## 6. Choose the application structure

Separate code by responsibility and feature so the same behavior is not implemented in multiple layers.

~~~~text
client/
  src/
    app/
    components/
    features/
      auth/
      catalog/
      saved-courses/
      notes/
      admin-courses/
    lib/
server/
  src/
    config/
    middleware/
    features/
      auth/
      courses/
      saved-courses/
      notes/
      admin-courses/
    migrations/
    app.js
    server.js
~~~~

A feature can contain routes, request validation, service logic, data access, and focused tests. Keep shared helpers small and explicit. Avoid both extremes: one giant file and a separate layer for every one-line function.

## 7. Build vertical slices

A vertical slice makes one user journey work from browser to database. A useful sequence is:

1. Public catalog list and detail, including pagination.
2. Registration, login, current-user state, and logout.
3. Save and remove a course with ownership tied to the session.
4. Create, update, list, and delete private notes.
5. Administrator-only course creation and publication.
6. Search, filtering, empty states, and recovery from request errors.
7. Deployment configuration, health, logs, and release verification.

For each slice:

- Define the API and UI states.
- Validate input at the server boundary.
- Enforce ownership in the query or service.
- Return the established response shape.
- Show loading, success, empty, and failure states in the client.
- Add focused tests before moving to the next slice.
- Update the README or API documentation when the contract changes.

Do not build every screen against temporary mock behavior and postpone all server integration until the end. A vertical slice reveals data-model and authorization problems earlier.

## 8. Implement authentication and authorization consistently

Authentication answers who is making a request. Authorization answers whether that identity may perform the requested operation.

Use the course's established session, password hashing, CSRF, and cookie approach. Keep the session identifier in a secure cookie and the session record in a shared production store. Regenerate the session at authentication boundaries and revoke it on logout.

Enforce role and ownership checks on the server:

- The client may hide an administrator button, but the API remains authoritative.
- Never trust a submitted user ID or role as the caller's identity.
- Scope private data by the authenticated user.
- Make authorization checks part of route and service tests.
- Return a consistent response for missing or inaccessible private records when existence should not be disclosed.

## 9. Design the React experience around states

For every page, describe:

- Initial loading.
- Loaded data.
- Empty collection or empty search results.
- Validation errors.
- Authentication required.
- Permission denied or unavailable record.
- Network or server failure.
- Retry or recovery behavior.

Keep the application state model simple. Server data, transient form state, and authenticated user state have different lifetimes and should not be mixed into one unstructured object.

Use semantic HTML, labelled form controls, visible focus, keyboard-accessible navigation, and announcements for important asynchronous status. Chapter 104 performs a deeper accessibility review.

## 10. Plan testing across boundaries

Use several test levels:

| Level | Capstone examples |
| --- | --- |
| Unit | Search parsing, normalization, policy helpers, validators |
| API integration | Session behavior, authorization, pagination, error responses |
| Component | Catalog loading, empty state, form validation, retry behavior |
| End-to-end | Register, browse, save, add a private note, sign out |
| Release smoke check | Production frontend URL, API route, health, session cookie |

Test both allowed and denied behavior. A test that confirms an owner can edit a note should be paired with a test that confirms another user cannot.

Use an isolated database and synthetic accounts. Avoid external email, payment, or production services in ordinary CI. Ensure test data and test sessions are cleaned up.

## 11. Review the product and operational risks

Before release, consider:

- Account enumeration, password guessing, session fixation, and CSRF.
- Cross-site scripting from course or note content.
- Query injection, mass assignment, and unsafe object selection.
- Oversized search, pagination, JSON body, or note values.
- Sensitive data in logs, errors, or browser bundles.
- Session-store availability and capacity across instances.
- MongoDB user permissions, network path, and connection pools.
- Database backup, migration, restore, and rollback compatibility.
- API latency, indexing, and unbounded list endpoints.
- Accessibility of forms, errors, dialogs, and navigation.

Use defense in depth. A UI control, schema validator, or CORS rule does not replace server-side authorization.

## 12. Define release and recovery checkpoints

A release candidate should have:

1. A reviewed source revision.
2. Passing lint, tests, and production builds.
3. A migration plan compatible with active application versions.
4. Environment-specific secrets and URLs reviewed.
5. Database network and application roles confirmed.
6. Readiness, logging, and dashboards available.
7. A recent backup and known restore procedure.
8. A rollback artifact and data compatibility decision.
9. A smoke-check list for the critical user journeys.
10. A release owner and follow-up plan.

Promote a known artifact. Do not rebuild a different set of files by hand for production after staging verification.

## 13. Prepare handoff documentation

A complete project README should explain:

- What the application does and who it serves.
- Main features and known scope limits.
- Architecture and package layout.
- Supported Node.js and MongoDB expectations.
- Local setup with safe environment templates.
- How to run the client, API, lint, tests, and build.
- API routes or a link to internal API documentation.
- Data model, roles, and important indexes.
- Deployment variables without secret values.
- Migration, backup, restore, and rollback process.
- Accessibility, security, and privacy notes.
- Troubleshooting and ownership.

A new developer should be able to clone the repository, configure local-only values, run the application, and understand how to validate a change.

## Common mistakes

- Starting implementation without choosing a bounded MVP.
- Designing pages without deciding the server and data contract.
- Trusting the client to enforce ownership or administrator access.
- Making every route return arbitrary database documents.
- Building all UI first and postponing server integration.
- Omitting empty, loading, validation, and failure states.
- Testing only successful behavior.
- Using production credentials or records in local and CI workflows.
- Deploying a data migration that old application versions cannot read.
- Treating a successful build as proof of a successful release.
- Forgetting backups, restore practice, monitoring, and ownership.
- Documenting setup steps that depend on an untracked secret.

## Manually inspect the capstone

1. Confirm the MVP and postponed features are written down.
2. Confirm acceptance criteria describe observable behavior.
3. Trace a public catalog request from React through Express to MongoDB.
4. Trace a private note request and confirm ownership is enforced server-side.
5. Confirm administrator actions require server-verified authorization.
6. Confirm API schemas, responses, errors, and pagination are documented.
7. Confirm each major journey has loading, empty, success, and failure states.
8. Confirm unit, integration, component, and end-to-end coverage is appropriate.
9. Confirm CI uses isolated data and no production secrets.
10. Confirm migrations support active-version overlap and have a recovery plan.
11. Confirm production logs and health checks help diagnose failures safely.
12. Confirm the README enables a new developer to operate the project.

## Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- | --- |
| [102 - Backups, migrations, recovery, and releases](102-backups-migrations-recovery-and-releases.md) | [Lesson](103-capstone-plan-and-build-a-complete-mern-application.md) | [Q&A](../qnas/103-capstone-plan-and-build-a-complete-mern-application.md) | [Example](../examples/103-capstone-plan-and-build-a-complete-mern-application.md) | [104 - Capstone: accessibility, security, performance, and deployment](104-capstone-accessibility-security-performance-and-deployment.md) |
