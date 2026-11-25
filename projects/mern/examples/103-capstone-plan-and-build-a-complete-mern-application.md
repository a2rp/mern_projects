# 103 - Capstone: plan and build a complete MERN application: Example

This example turns the capstone into a concrete project: a Learning Library where visitors browse published courses, learners save courses and write private notes, and administrators manage course content.

It is a project plan and implementation slice, not a finished product repository. Adapt hostnames, scripts, and package structure to the application you build.

## 1. Write the product brief

**Problem:** Learners need a simple way to find courses and keep their own study notes alongside the material.

**Primary users:**

- Visitors browse publicly available courses.
- Learners save courses and manage private notes.
- Administrators maintain and publish course information.

**MVP boundary:**

- Catalog search, filtering, pagination, and detail pages.
- Registration, login, current-user state, and logout.
- Saved-course list for each learner.
- Private notes scoped to learner and course.
- Administrator course creation, editing, publishing, and archiving.
- Production-ready error handling, tests, deployment configuration, and operational notes.

**Postponed:** Payments, public profiles, comments, messaging, user uploads, and recommendation algorithms.

## 2. Turn the product brief into acceptance criteria

- A visitor can browse published courses without an account.
- An unpublished course is not returned by public catalog or detail routes.
- Search and pagination have documented bounds and stable sorting.
- A learner can save a published course once.
- A learner can read and edit only their own notes.
- Changing a note ID in the URL never grants access to another learner's note.
- An administrator can publish a valid course; a learner cannot.
- Logout invalidates the current server-side session.
- Each page explains loading, empty, validation, and network-error states.
- A hard refresh on a course detail URL returns the React application.
- CI runs the project's lint, tests, and frontend build on a proposed change.
- Production configuration contains no database or session secrets in the browser artifact.

## 3. Draw the deployed system

~~~~mermaid
flowchart LR
  Visitor[Browser] --> Edge[HTTPS edge]
  Edge --> Static[React static assets]
  Edge -->|/api| API[Express API]
  API --> Mongo[(MongoDB)]
  API --> Sessions[(Shared session collection)]
  CI[CI workflow] --> Release[Reviewed artifact]
  Release --> Edge
  Release --> API
~~~~

The browser only knows the public site and API path. Express owns validation, sessions, access decisions, and MongoDB queries. Production MongoDB remains on a private network path.

## 4. Choose data records and constraints

| Collection | Important fields | Integrity rule or query |
| --- | --- | --- |
| User | normalized email, password hash, server-controlled role, account state | Unique normalized email |
| Course | slug, title, summary, content, topic, publication state, timestamps | Unique slug; public list filters to published |
| SavedCourse | owner ID, course ID, creation time | Unique compound index on owner and course |
| Note | owner ID, course ID, body, timestamps | Query by owner and course; body has a maximum length |
| Session | opaque session ID, data, expiry | Shared store with expiration behavior |

Example course fields:

~~~~text
Course
  slug: string
  title: string
  summary: string
  body: string
  topic: string
  status: "draft" | "published" | "archived"
  createdBy: ObjectId
  createdAt: Date
  updatedAt: Date
  publishedAt: Date | null
~~~~

Keep the user role controlled by an administrator or trusted seed process. Do not copy a submitted role from a registration request into the user record.

## 5. Create the ownership-scoped note model

~~~~js
// server/src/features/notes/note.model.js
import mongoose from "mongoose";

const noteSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      immutable: true
    },
    body: {
      type: String,
      required: true,
      trim: true,
      maxlength: 4000
    }
  },
  { timestamps: true }
);

noteSchema.index({ ownerId: 1, courseId: 1, createdAt: -1 });

export const Note = mongoose.model("Note", noteSchema);
~~~~

If the product allows only one note per learner per course, choose a unique compound index instead of the list index. Decide this product rule before publishing the schema.

## 6. Define the key API contracts

| Method and path | User | Behavior |
| --- | --- | --- |
| GET <code>/api/courses?q=&topic=&page=</code> | Public | Return only published, bounded, sorted results |
| GET <code>/api/courses/:slug</code> | Public | Return one published course |
| GET <code>/api/auth/me</code> | Session | Return the current public user or the established anonymous response |
| POST <code>/api/saved-courses</code> | Session and CSRF | Save a published course for the current user |
| GET <code>/api/notes?courseId=</code> | Session | Return notes owned by the current user |
| POST <code>/api/notes</code> | Session and CSRF | Create a note for the current user |
| PATCH <code>/api/notes/:noteId</code> | Owner and CSRF | Update an owned note |
| DELETE <code>/api/notes/:noteId</code> | Owner and CSRF | Delete an owned note |
| POST <code>/api/admin/courses</code> | Administrator and CSRF | Create a draft course |
| PATCH <code>/api/admin/courses/:courseId</code> | Administrator and CSRF | Edit or publish a course |

For each route, document its accepted fields, limits, response status, error shape, and access rule. The public course query must not return draft or archived documents.

## 7. Implement an owner-scoped update

After authentication middleware and request validation, scope the database operation to both the record and current session user:

~~~~js
// server/src/features/notes/notes.controller.js
export async function updateOwnedNote(req, res, next) {
  try {
    const input = validateNoteUpdate(req.body);

    const note = await Note.findOneAndUpdate(
      {
        _id: req.params.noteId,
        ownerId: req.session.userId
      },
      { $set: { body: input.body } },
      { new: true, runValidators: true }
    ).lean();

    if (!note) {
      return res.status(404).json({
        error: {
          code: "NOTE_NOT_FOUND",
          message: "The note was not found."
        },
        requestId: req.requestId
      });
    }

    res.status(200).json({ data: note });
  } catch (error) {
    next(error);
  }
}
~~~~

The exact response envelope should match the course API convention. Do not first load by note ID and then trust a client-supplied owner ID. Keep the authenticated owner condition in the database operation.

## 8. Map the first vertical slices

| Slice | Server work | Client work | Completion signal |
| --- | --- | --- | --- |
| Public catalog | Published query, filters, pagination | Catalog list, search, empty state | Visitor can search and open a course |
| Course detail | Slug lookup and safe response | Detail route and hard-refresh fallback | A shared URL opens the right course |
| Account | Registration, login, session, logout | Forms and authenticated navigation | Session survives reload and logout revokes it |
| Saved courses | Owner-scoped create/list/delete | Save control and personal list | Duplicate save is handled safely |
| Private notes | Owner-scoped CRUD and validation | Note list and editor | Another learner cannot read or mutate a note |
| Course administration | Role checks, draft/publish/archive | Protected editor and status feedback | Learner is denied admin operations |
| Release | Runtime configuration and health | Production API base path | Main journey works through the public edge |

Finish one row before expanding the next. Each slice should include a request validation path and the relevant error or empty state.

## 9. Lay out the code by feature

~~~~text
client/src/
  app/
  components/
  features/
    auth/
    catalog/
    saved-courses/
    notes/
    admin-courses/
  lib/
server/src/
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

Routes should connect HTTP input to validation and service behavior. Services hold application rules. Models and queries handle persistence. Keep authentication and owner checks visible near the operation they protect.

## 10. Define the screen states

| Page | Loading | Empty | Error or recovery |
| --- | --- | --- | --- |
| Catalog | Show a clear loading state | Explain no courses match | Retry failed search |
| Course detail | Keep title or placeholder stable | Show not-found state | Offer a return to catalog |
| Login | Disable duplicate submission | Not applicable | Explain safe authentication failure |
| Saved courses | Load current user's list | Invite the learner to browse | Retry without losing navigation |
| Notes | Load only owned notes | Explain there are no notes yet | Keep unsaved edits recoverable |
| Course editor | Load the selected draft | Start a new draft | Show field errors and retry status |

Keep labels, focus order, keyboard interaction, and error announcements usable. Chapter 104 has the final accessibility review.

## 11. Build a test matrix

| Behavior | Test level | Important assertion |
| --- | --- | --- |
| Search parsing and page limits | Unit | Invalid and excessive values are rejected or bounded |
| Public course query | API integration | Draft and archived courses stay hidden |
| Session logout | API integration | The prior session cannot access a protected route |
| Note ownership | API integration | Another user's ID cannot read, edit, or delete the note |
| Duplicate save | API integration | One learner cannot create duplicate relationship records |
| Catalog empty state | Component | The user sees a clear message and recovery action |
| Admin editor | Component | Validation and publishing state are clear |
| Learner journey | End-to-end | Register, browse, save, create a note, sign out |
| Deployment smoke check | Release | Public frontend, API, session, and health route work together |

Use synthetic accounts and an isolated database. Pair successful access tests with denied access tests.

## 12. Release checkpoints

### Before merge

- Lint and all relevant test suites pass in CI.
- Production frontend and API builds succeed.
- No secret appears in client assets or logs.
- A migration is backward-compatible with overlapping application versions.

### Before production traffic

- The API has valid runtime configuration and database access.
- Readiness passes and health output is sanitized.
- The edge forwards API routes and serves static assets correctly.
- Session cookie, CSRF, and browser origin behavior match the deployment.
- A recent backup and restore procedure are available.

### After release

- Check the public catalog and authenticated learner journey.
- Check administrator denial and allowed publishing behavior.
- Review errors, latency, readiness, and database pool pressure.
- Record the artifact revision and keep a compatible rollback available.

## 13. Prepare the project README

Use a README outline that another developer can follow:

1. Product summary, intended users, and MVP scope.
2. Feature list and postponed work.
3. Architecture diagram and repository structure.
4. Supported runtime versions and local prerequisites.
5. Safe environment variable template and startup commands.
6. Lint, test, build, and CI commands.
7. API routes and authorization rules.
8. Data records, important indexes, and migrations.
9. Deployment configuration without secret values.
10. Monitoring, backup, restore, and rollback process.
11. Accessibility, security, privacy, and known limitations.
12. Ownership and contribution workflow.

The README should describe the actual repository and scripts. Do not leave commands that were copied from an outdated project layout.

## 14. Run a five-minute product demonstration

1. Open the public course catalog as a visitor.
2. Search for a topic and open a course detail page.
3. Register or sign in as a learner.
4. Save the course and create a private note.
5. Show that the note appears after a page reload.
6. Sign in as another learner and confirm the first learner's note is unavailable.
7. Sign in as an administrator and publish a draft course.
8. Confirm the course appears in the public catalog.
9. Show the CI result, deployment revision, health route, and README setup steps.

Use seeded synthetic demo data and do not display real user information.

## Capstone completion checklist

- [ ] Product brief and MVP boundary are documented.
- [ ] Acceptance criteria are observable and testable.
- [ ] Architecture and data relationships are explicit.
- [ ] API contracts include auth, validation, limits, and errors.
- [ ] Public queries expose only published records.
- [ ] Private operations enforce ownership on the server.
- [ ] Admin operations verify the server-controlled role.
- [ ] UI covers loading, empty, validation, success, and failure.
- [ ] Tests cover successful and denied behavior.
- [ ] CI checks lint, tests, and the production build.
- [ ] Deployment uses protected secrets and a known artifact.
- [ ] Health, logs, monitoring, backups, and rollback are ready.
- [ ] README setup and recovery steps match the actual project.
- [ ] Demo data is synthetic and the complete user journey works.

## Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- | --- |
| [102 - Backups, migrations, recovery, and releases](102-backups-migrations-recovery-and-releases.md) | [Lesson](../lessons/103-capstone-plan-and-build-a-complete-mern-application.md) | [Q&A](../qnas/103-capstone-plan-and-build-a-complete-mern-application.md) | [Example](103-capstone-plan-and-build-a-complete-mern-application.md) | [104 - Capstone: accessibility, security, performance, and deployment](104-capstone-accessibility-security-performance-and-deployment.md) |
