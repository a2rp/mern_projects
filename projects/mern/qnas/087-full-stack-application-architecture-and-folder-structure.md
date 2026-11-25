# 087 - Full-stack application architecture and folder structure: Q&A

These questions review MERN request flow, client/server boundaries, feature organization, workspaces, API contracts, configuration, testing, and choosing only the layers an application needs.

## Multiple-choice questions

### 1. Which sequence best describes a typical read request in a MERN application?

- **A.** React UI, client API, Express route and handler, service or persistence adapter, MongoDB
- **B.** MongoDB, CSS, React state, keyboard
- **C.** Browser, database password, stylesheet, router
- **D.** Express, browser, npm, HTML parser

**Answer: A.** The client requests data through an HTTP boundary; the server handles the use case and persistence, then returns a response to the UI.

### 2. What is one benefit of a monorepo with client and server workspaces?

- **A.** A feature can be developed with both packages in one clone while retaining separate package scripts
- **B.** The browser can import server secrets
- **C.** Both packages must run as one process in production
- **D.** The API no longer needs validation

**Answer: A.** A monorepo can coordinate development without erasing runtime or deployment boundaries.

### 3. What is a reason to use separate client and server repositories?

- **A.** They have independent ownership, permissions, or release schedules
- **B.** MERN requires exactly two repositories
- **C.** React cannot use workspaces
- **D.** MongoDB only works in a separate repository

**Answer: A.** Repository boundaries are a workflow and ownership choice.

### 4. What should the browser import from the server package?

- **A.** Only a deliberately shared, safe contract if the project needs one
- **B.** Database credentials and models
- **C.** The connection pool
- **D.** Server-only authentication middleware

**Answer: A.** The browser should depend on an API contract, not privileged server implementation.

### 5. Which layer is a suitable place for business rules that are reused across HTTP handlers?

- **A.** A feature service or use-case module
- **B.** A CSS stylesheet
- **C.** The root HTML file
- **D.** A client-side environment variable

**Answer: A.** A service can express the application rule independently from HTTP details.

### 6. What is a main responsibility of a controller?

- **A.** Translate HTTP input and output around an application operation
- **B.** Store browser colors
- **C.** Define the MongoDB server process
- **D.** Render React components on every route

**Answer: A.** A controller handles the HTTP boundary; it should not become a repository for all business logic.

### 7. Why map a MongoDB document to an API response?

- **A.** The database record may contain fields or representation details the client should not receive
- **B.** MongoDB documents cannot be returned as JSON
- **C.** The mapping removes the need for authorization
- **D.** React requires a particular field order

**Answer: A.** The public response should be an intentional contract that can differ from internal storage.

### 8. Where should database connection configuration live?

- **A.** On the server side, validated at startup
- **B.** In the built React bundle
- **C.** In CSS custom properties
- **D.** In an HTML comment

**Answer: A.** Database credentials and privileged configuration belong on the server.

### 9. Are Vite-prefixed client environment variables secret?

- **A.** No; values included in browser assets should be considered public
- **B.** Yes, because they start with a prefix
- **C.** Yes, if the variable name is long
- **D.** Only in production builds

**Answer: A.** A browser user can inspect built assets, so client variables must not contain private secrets.

### 10. What is a useful purpose for a server-side <code>.env.example</code>?

- **A.** Document required variable names using safe placeholder values
- **B.** Store actual production credentials
- **C.** Replace runtime configuration validation
- **D.** Publish a database dump

**Answer: A.** An example file helps setup without committing real credentials.

### 11. What should a workspace root script reference?

- **A.** Commands that actually exist in the selected workspaces
- **B.** Guessed commands for all packages
- **C.** Production secrets
- **D.** Every installed dependency by name

**Answer: A.** A root script should coordinate existing package scripts and be verified against the workspace configuration.

### 12. What is the purpose of a package's own <code>package.json</code> in a workspace?

- **A.** Describe that package's dependencies and scripts
- **B.** Hide all source files
- **C.** Replace the repository README
- **D.** Declare database records

**Answer: A.** Workspaces can share an install while retaining package-level ownership and commands.

### 13. Which code usually belongs in the React client?

- **A.** Browser UI, user interaction, and a client API wrapper
- **B.** MongoDB credentials
- **C.** Database connection setup
- **D.** Server-only session signing keys

**Answer: A.** The client owns browser-facing concerns and communicates through HTTP.

### 14. What is a repository or database adapter boundary useful for?

- **A.** Isolating persistence operations when that separation improves testing or changeability
- **B.** Making every project use four folders per file
- **C.** Automatically securing all API routes
- **D.** Replacing request validation

**Answer: A.** Add the boundary when it gives clear benefits, not as a mandatory layer for every query.

### 15. What is an appropriate role for <code>server.js</code> in the example layout?

- **A.** Load configuration, establish infrastructure, and start listening
- **B.** Render every React route
- **C.** Store global CSS
- **D.** Generate client-side filters

**Answer: A.** Process startup is separate from constructing the Express app.

### 16. Why may client and server deploy independently even in one Git repository?

- **A.** Source-control organization does not require one runtime process
- **B.** Monorepos cannot contain deployment configuration
- **C.** React builds are always deployed by MongoDB
- **D.** Git requires one production server

**Answer: A.** A monorepo can contain packages with separate build and deployment targets.

### 17. Where should a client API function for courses normally live?

- **A.** In the client course feature or a small shared client HTTP layer
- **B.** In a MongoDB server-only model file
- **C.** In a CSS module
- **D.** In the root Git configuration

**Answer: A.** The API function belongs to the client feature that uses it, with common HTTP behavior separated if shared.

### 18. Which is a healthy reason to add a layer or package?

- **A.** It creates a meaningful boundary that improves ownership, testing, or contract stability
- **B.** A diagram contains an empty box
- **C.** Every project needs a folder named <code>use-cases</code>
- **D.** The source file has one exported function

**Answer: A.** Structure should solve a real coordination or change-management problem.

### 19. Which test belongs most naturally to a client workspace?

- **A.** A React component test using the client test setup
- **B.** A MongoDB backup restore job
- **C.** A production secret rotation
- **D.** An Express middleware test that imports no client code

**Answer: A.** Framework-specific setup should live with the package that owns it.

### 20. What should happen to committed environment examples?

- **A.** They should use safe placeholders and never contain real credentials
- **B.** They should contain working production secrets
- **C.** They should be bundled into the React app
- **D.** They should replace secret management

**Answer: A.** Documentation examples must not expose credentials.

## Short-answer and scenario questions

### 21. A React component imports a Mongoose model to display course data. What boundary is being crossed incorrectly?

**Answer:** The browser is importing a server/database implementation detail. It should call an HTTP API and use the response contract instead.

### 22. A MongoDB document includes a private moderation field. Should the API return the document directly to every client?

**Answer:** No. Map it to a deliberate response that includes only fields the caller is authorized to receive.

### 23. A route handler contains parsing, authorization, business rules, database writes, and response mapping in one long function. What could improve the design?

**Answer:** Keep HTTP parsing and response behavior in the route/controller, move reusable business rules to a feature service, and isolate persistence if that boundary improves clarity or tests.

### 24. A tiny application has one course endpoint. Is a separate repository layer mandatory?

**Answer:** No. A direct persistence call in a small feature can be clear enough. Add a repository when it creates a useful boundary for reuse, testing, or persistence changes.

### 25. The client needs the API base URL. Is it safe to expose that URL in a Vite client variable?

**Answer:** A public service URL can be exposed; it is not a secret. Do not put credentials or private keys in the client bundle.

### 26. The database URI is placed in a variable prefixed for the client build. What is the risk?

**Answer:** The value may be embedded in browser assets and exposed to users. Keep database configuration exclusively on the server.

### 27. A team puts production credentials in <code>.env.example</code> so setup is easy. What should change?

**Answer:** Replace them with safe placeholders, remove the real credentials from the file and history as appropriate, and rotate any exposed secrets.

### 28. The root <code>dev</code> script references <code>npm run dev --workspace server</code>, but the server package has no <code>dev</code> script. What should be fixed?

**Answer:** Add the intended server development script or update the root script to use a command that exists. Verify the workspace script names rather than assuming them.

### 29. A code change needs the client and server. Does one repository make the client a trusted caller?

**Answer:** No. Client code is controlled by the user and can be modified. The server must authenticate, authorize, and validate requests regardless of repository structure.

### 30. A package named <code>contracts</code> is proposed to share the server's database model with the browser. What should be reconsidered?

**Answer:** Share only a safe API contract or validation schema, not database implementation details or sensitive server fields. The public response model should be intentional.

### 31. A feature folder contains one route, one controller, one service, and one repository, but each file has only two lines. What should the team evaluate?

**Answer:** Whether the layers provide a real ownership or testing benefit. Combine unnecessary layers while preserving the boundary that matters.

### 32. Two unrelated server features import each other's internal files, creating a cycle. What can help?

**Answer:** Clarify ownership, move genuinely shared behavior to a neutral module or stable contract, and avoid cross-feature imports of private internals.

### 33. A React bundle includes a server database package after a shared package import. What should be checked?

**Answer:** Inspect the package dependency direction and exports. The client should import only browser-safe contracts and must not transitively bundle server-only modules.

### 34. The server starts listening before validating its required database configuration. What operational issue can result?

**Answer:** The app may appear started but fail on the first request. Validate required configuration during startup and fail clearly if it is incomplete.

### 35. The application is in a monorepo and the deployment platform builds the whole repository by default. What should be clarified?

**Answer:** Define each package's build command and deployment target. The client and API may deploy separately even though they share source control.

### 36. A service returns a raw database object to a controller, which returns it unchanged. What risks should be reviewed?

**Answer:** Internal fields may leak, storage shape may become an accidental public API, and database changes may break clients. Map to an intentional response contract.

### 37. Where should Express error middleware and request middleware live in the sample architecture?

**Answer:** In the server package, often in a server middleware directory, and be registered by the Express app setup.

### 38. A developer adds a shared package before any second consumer exists. What is a practical alternative?

**Answer:** Keep the code inside the current package with a clear module boundary and extract it when a second independent consumer or release need appears.

### 39. Why should an Express app-construction module be separate from the process entry point?

**Answer:** It lets tests construct the app without starting a listening server and keeps startup configuration separate from request middleware and routes.

### 40. How can a team tell whether its folder structure is useful?

**Answer:** A developer can find the owner of a feature and understand the dependency boundaries without navigating unnecessary layers or circular imports.

## Chapter navigation

| Previous chapter | Chapter lesson | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [086 - Build a reusable component system](../lessons/086-build-a-reusable-component-system.md) | [Lesson](../lessons/087-full-stack-application-architecture-and-folder-structure.md) | [Example](../examples/087-full-stack-application-architecture-and-folder-structure.md) | [088 - Configure frontend and backend origins](../lessons/088-configure-frontend-and-backend-origins.md) |
