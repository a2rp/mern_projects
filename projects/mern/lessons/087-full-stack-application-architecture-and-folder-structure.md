# 087 - Full-stack application architecture and folder structure

A MERN application has several responsibilities: the browser interface, an HTTP API, and a database. A useful architecture makes those responsibilities and their boundaries easy to find without creating folders for layers the application does not need yet.

A single repository can hold the React client and Node/Express server as separate workspaces. They can share a lockfile and local development scripts while building and deploying independently. The repository structure should explain where a change belongs and which boundaries must be crossed to deliver a feature.

## Learning goals

After this chapter, you should be able to:

- Describe the request flow from React through Express to MongoDB and back.
- Separate client, server, and optional shared packages.
- Organize code by feature while keeping infrastructure and configuration explicit.
- Understand when a monorepo is useful and when separate repositories are appropriate.
- Keep API contracts separate from database implementation details.
- Manage environment variables and secrets at the correct boundary.
- Avoid both a single crowded folder and unnecessary layers.
- Plan tests and deployment around the actual package boundaries.

## Follow one request through the system

A typical list request follows this path:

~~~text
Browser page
  -> client API function
  -> HTTP request
  -> Express middleware
  -> route
  -> controller
  -> feature service
  -> repository or database adapter
  -> MongoDB
  <- result and response
  <- client loading, success, or error state
~~~

Each step has a clear responsibility:

- The React feature renders UI and collects user input.
- The client API layer serializes requests and parses responses.
- Express middleware handles cross-cutting concerns such as request parsing and authentication.
- A route maps an HTTP path and method to a handler.
- A controller translates HTTP input and output to application operations.
- A service applies business rules.
- A repository or database adapter performs persistence operations.
- MongoDB stores the database representation.

For a small application, some adjacent responsibilities can live in one module. Keep boundaries clear even if the first version does not use a separate file for every box.

## Choose a repository shape

A single repository with workspaces can work well when the client and server are developed together:

- One clone contains everything needed for a feature.
- A root script can start client and server processes.
- One lockfile can coordinate the dependency graph.
- Client and server can still have independent package scripts and deployments.

Separate repositories may fit when the client and server have independent teams, permissions, release schedules, or ownership. The choice is a workflow and ownership decision, not a requirement of MERN.

A workspace monorepo does not mean the browser can import every server module. Package boundaries still matter. The React build must not bundle database drivers, server secrets, or privileged code.

## A practical starting layout

~~~text
mern-app/
  package.json
  package-lock.json
  .gitignore
  README.md
  .env.example

  client/
    package.json
    index.html
    src/
      app/
        App.jsx
        routes.jsx
      components/
        ui/
      features/
        courses/
          CoursePage.jsx
          CourseList.jsx
          courseApi.js
      lib/
        http.js
      styles/
        global.css
    public/

  server/
    package.json
    src/
      app.js
      server.js
      config/
        env.js
        database.js
      middleware/
        errorHandler.js
        notFound.js
        requireAuth.js
      features/
        courses/
          course.routes.js
          course.controller.js
          course.service.js
          course.repository.js
          course.validation.js
      lib/
        asyncHandler.js
        HttpError.js
    tests/

  packages/
    contracts/
      package.json
      src/
        course.js
~~~

The folder names are conventions, not rules. Start with fewer layers if the application is small. Add <code>packages/contracts</code> only when the client and server genuinely need a shared, stable contract.

## Keep the client organized around UI features

The client owns presentation and browser interaction:

- <code>app/</code> wires the application and routes.
- <code>features/</code> groups pages, components, and API calls for a product feature.
- <code>components/ui/</code> contains reusable cross-feature primitives.
- <code>lib/</code> holds small browser-side infrastructure such as an HTTP wrapper.
- <code>styles/</code> contains global styles and design tokens.
- <code>public/</code> contains static assets served as-is.

A feature can own its API functions, such as <code>features/courses/courseApi.js</code>. If several features share request behavior, a small HTTP client can handle base URL, headers, and response parsing.

Do not put database queries, server authentication secrets, or server-only modules into the client tree. Client environment variables are embedded into browser assets by build tools and should be considered public.

## Keep the server organized around features and boundaries

The server owns HTTP handling, business rules, persistence, and privileged configuration.

- <code>app.js</code> constructs the Express app and registers middleware and routes.
- <code>server.js</code> loads configuration, connects infrastructure, and starts listening.
- <code>config/</code> reads and validates server configuration.
- <code>middleware/</code> contains cross-cutting request behavior.
- <code>features/</code> groups route, controller, service, validation, and persistence code for a domain.
- <code>lib/</code> holds small shared server infrastructure.
- <code>tests/</code> contains server tests using the chosen test organization.

A request controller should translate HTTP details, not become the home for every business rule. A service should express use cases. A repository should hide database-specific operations when that boundary helps. A small feature may keep some of these in one file; add a layer when it improves separation or testing.

## Keep API contracts distinct from database documents

The database document is not automatically the public API response. A stored document may contain internal fields, version keys, or data that clients must not receive.

Define response objects deliberately:

~~~js
function toCourseResponse(course) {
  return {
    id: course._id.toString(),
    title: course.title,
    summary: course.summary,
    category: course.category
  };
}
~~~

The API contract should specify request fields, response fields, status codes, and error shapes. The client should depend on that contract rather than importing server models or database code.

A shared contracts package can hold stable validation schemas, field names, or plain types when both sides genuinely need them. It should not become a shortcut for sharing server implementation. Keep privileged code and database access on the server.

## Use workspaces for independent packages

A root package can coordinate local packages with npm workspaces:

~~~json
{
  "name": "mern-learning-app",
  "private": true,
  "workspaces": [
    "client",
    "server",
    "packages/contracts"
  ],
  "scripts": {
    "dev": "concurrently \"npm run dev --workspace client\" \"npm run dev --workspace server\"",
    "build": "npm run build --workspace client",
    "test": "npm run test --workspaces --if-present"
  },
  "devDependencies": {
    "concurrently": "^9.0.0"
  }
}
~~~

The dependency version shown is an example; use versions compatible with the active Node.js version and project tooling. The workspace packages have their own <code>package.json</code> files and scripts. Keep one root lockfile for the workspace dependency graph.

For example, a client package might provide <code>dev</code>, <code>build</code>, and <code>test</code> scripts. A server package might provide <code>dev</code>, <code>start</code>, <code>test</code>, and <code>lint</code>. Choose scripts that the repo actually supports; do not add a root script that points at a missing command.

If the server and client deploy separately, build and deploy the correct workspace independently. A monorepo is one source-control boundary, not one runtime process.

## Keep configuration and secrets server-side

A root <code>.env.example</code> can document the names required for local development without containing real credentials:

~~~dotenv
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/mern_course_dev
CLIENT_ORIGIN=http://localhost:5173
SESSION_SECRET=replace-with-a-local-secret
~~~

Ignore actual environment files and credential artifacts:

~~~gitignore
node_modules/
.env
.env.*
!.env.example
dist/
coverage/
.DS_Store
~~~

Check the ignore rules fit the repository. Some deployments inject environment variables without a local file. The server should validate required configuration at startup and fail clearly if it is missing.

Client variables such as a Vite-prefixed API base URL are visible to the browser. They can identify a public service endpoint but must not contain private keys or server secrets.

## Define module boundaries by dependency direction

A useful dependency direction is:

~~~text
Client UI -> client API contract -> HTTP boundary -> server feature -> persistence adapter -> database
~~~

The server can depend on shared contracts, but the browser should not import server-only modules. A route should not reach into arbitrary client code. Keep database connections and secrets in the server package.

Avoid circular dependencies between features. If two features need the same small rule, extract a neutral shared module only after the common ownership is clear.

## Decide how many layers the project needs

A small CRUD API may use a route and a handler that calls a database adapter. It does not always need separate route, controller, service, repository, mapper, and use-case folders.

Add a boundary when it provides one or more clear benefits:

- The responsibility has different reasons to change.
- The code needs independent testing.
- Multiple handlers share a business rule.
- The persistence technology should be replaceable or isolated.
- The interface between packages needs a stable contract.
- The file has become difficult to understand as a single module.

A folder structure should help a developer find the feature, not demonstrate that every architecture pattern exists.

## Plan test locations around boundaries

Tests can live next to the code they cover or in a package-level test directory:

- Client component tests belong near the feature component or in client tests.
- Client API tests check serialization and response handling.
- Server service tests check business rules without a live database when possible.
- Server integration tests exercise Express routes and controlled persistence.
- End-to-end tests exercise critical workflows across the browser and API.

Keep test setup inside the workspace that owns the framework. A root command may coordinate workspaces, but each package should be runnable on its own.

## Common mistakes

- Putting client and server source in one folder with unclear runtime boundaries.
- Importing a database model or secret-bearing module into React code.
- Treating the MongoDB document as the public API response without mapping.
- Creating many empty architecture layers for a small feature.
- Putting all server features into one large controller file.
- Duplicating API response data across several client stores without a sync rule.
- Committing actual environment files or credentials.
- Assuming client-prefixed environment variables are secret.
- Using a root script that references a package command that does not exist.
- Assuming one Git repository must deploy as one server process.
- Introducing a shared contracts package before the contract is actually shared.
- Letting features import each other's internal files in circles.

## Chapter checklist

Before a new feature is added:

- Its browser UI, HTTP endpoint, business rules, and persistence responsibilities are clear.
- Each file belongs to a package and feature with an identifiable owner.
- The client depends on an API contract, not database implementation details.
- The server validates input and maps stored data to intentional responses.
- Configuration and secrets stay out of browser code and Git.
- The local development command starts the required packages.
- Package scripts and deployment targets are explicit.
- Tests cover the boundaries that matter.
- The architecture contains only the layers the current project needs.

## Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [086 - Build a reusable component system](086-build-a-reusable-component-system.md) | [Q&A](../qnas/087-full-stack-application-architecture-and-folder-structure.md) | [Example](../examples/087-full-stack-application-architecture-and-folder-structure.md) | [088 - Configure frontend and backend origins](088-configure-frontend-and-backend-origins.md) |
