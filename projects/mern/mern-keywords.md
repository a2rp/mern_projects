# MERN Keywords and Concepts

MERN is a stack of technologies, not a programming language, so it has no single official list of reserved keywords. This guide is a practical glossary of terms used across MongoDB, Express, React, Node.js, and full-stack development. JavaScript syntax words such as `const`, `import`, `async`, and `await` belong to JavaScript; this file explains how they appear in MERN work rather than repeating the JavaScript reserved-word list.

## Contents

- [How to read this guide](#how-to-read-this-guide)
- [The MERN stack](#the-mern-stack)
- [Web and API fundamentals](#web-and-api-fundamentals)
- [JavaScript and Node.js](#javascript-and-nodejs)
- [MongoDB](#mongodb)
- [Mongoose](#mongoose)
- [Express and REST APIs](#express-and-rest-apis)
- [React](#react)
- [Authentication and security](#authentication-and-security)
- [Testing and operations](#testing-and-operations)
- [Common abbreviations](#common-abbreviations)
- [Terms that are not MERN keywords](#terms-that-are-not-mern-keywords)
- [Version and compatibility notes](#version-and-compatibility-notes)
- [Continue learning](#continue-learning)

## How to read this guide

Terms are grouped by the part of an application where they are most often used. Some terms, such as **middleware**, **schema**, and **state**, have different meanings in different layers; the relevant section gives the intended meaning.

Code-formatted names identify syntax, properties, or APIs. A name in this glossary is not necessarily a JavaScript language keyword. Where a tool or library is optional, it is identified as such rather than presented as a required part of MERN.

## The MERN stack

| Term | Meaning |
| --- | --- |
| **MERN** | MongoDB, Express, React, and Node.js used together to build a web application. |
| **MongoDB** | A document database commonly used to store an application's persistent data. |
| **Express** | A Node.js web framework commonly used to build HTTP servers and APIs. |
| **React** | A JavaScript library for describing and updating user interfaces with components. |
| **Node.js** | A JavaScript runtime used for server-side programs, tooling, and build tasks. |
| **Full stack** | The application layers working together: user interface, server/API, and data storage. |
| **Frontend** | The client-side interface a user interacts with, often a React application running in a browser. |
| **Backend** | Server-side code that processes requests, applies application rules, and accesses data. |
| **Database layer** | The code and database responsible for storing, querying, and maintaining application data. |
| **Data flow** | The path data takes from a user action through the frontend and API to storage, and back. |
| **Client** | A program, usually a browser, that sends requests to a server. |
| **Server** | A program that listens for requests and sends responses. |
| **Application boundary** | A trust boundary between components, such as a browser and an API; validate data when it crosses the boundary. |

## Web and API fundamentals

| Term | Meaning |
| --- | --- |
| **HTTP** | The request-and-response protocol commonly used by browsers and web APIs. |
| **HTTPS** | HTTP protected by TLS, which encrypts traffic in transit and helps verify the server. |
| **Request** | A message from a client to a server, containing a method, URL, headers, and sometimes a body. |
| **Response** | A server's reply, containing a status code, headers, and sometimes a body. |
| **HTTP method** | The operation requested, commonly GET, POST, PUT, PATCH, or DELETE. |
| **GET** | Conventionally retrieves a representation and should not change server state. |
| **POST** | Conventionally submits data or requests an operation that may create or change state. |
| **PUT** | Conventionally replaces a resource representation; applications should define its exact behavior. |
| **PATCH** | Conventionally applies a partial change to a resource. |
| **DELETE** | Conventionally removes a resource or marks it as removed. |
| **URL** | The address used to locate a resource, including scheme, host, path, and optional query string. |
| **Endpoint** | An API location and method combination that handles a particular kind of request. |
| **Route** | A rule that matches a request path and method and selects a handler. |
| **Path parameter** | A named value embedded in a route path, such as an identifier in `/users/:userId`. |
| **Query string** | Key-value data after `?` in a URL, often used for search, filtering, sorting, or pagination. |
| **Header** | Metadata sent with a request or response, such as content type or authorization information. |
| **Request body** | Data sent with a request, commonly JSON for an API. |
| **Status code** | A numeric response result, such as 200 for success, 201 for creation, 400 for invalid input, 401 for unauthenticated, 403 for forbidden, 404 for missing, or 500 for server failure. |
| **Content type** | A header value describing the format of a message body, such as `application/json`. |
| **JSON** | A text format for representing objects, arrays, strings, numbers, booleans, and null values. |
| **API** | An interface through which one program requests data or actions from another. |
| **REST** | An architectural style for APIs organized around resources and standard HTTP semantics. |
| **Resource** | A domain object or collection exposed through an API, such as a user, post, or order. |
| **CRUD** | Create, read, update, and delete: common operations for managing records. |
| **Idempotency** | A property where repeating the same request has the same intended effect as doing it once; useful for safe retries. |
| **Serialization** | Converting an in-memory value into a transferable or storable format, such as JSON. |
| **Deserialization** | Parsing a transferred or stored representation back into usable values. |
| **Pagination** | Splitting a large result set into smaller pages or cursor-based segments. |
| **CORS** | A browser-enforced mechanism that controls whether a page from one origin may read responses from another origin. |
| **Origin** | The combination of scheme, hostname, and port that identifies a web origin. |
| **Preflight request** | A browser's OPTIONS request that checks whether a cross-origin request is allowed. |

## JavaScript and Node.js

| Term | Meaning |
| --- | --- |
| **ECMAScript** | The language specification that defines JavaScript syntax and core behavior. |
| **Module** | A file or unit with its own scope that can expose and import values. |
| **ES modules (ESM)** | JavaScript's standard module system, using `import` and `export`. |
| **CommonJS (CJS)** | Node.js's traditional module system, commonly using `require` and `module.exports`. |
| **Package** | A distributable unit of code and metadata, usually described by `package.json`. |
| **Dependency** | A package an application needs to run or build. |
| **Development dependency** | A package needed for authoring, testing, linting, or building rather than at application runtime. |
| **Package manager** | A tool such as npm that installs packages and manages dependency metadata. |
| **Lockfile** | A file such as `package-lock.json` that records the resolved dependency tree for repeatable installs. |
| **Semantic versioning** | A version convention with major, minor, and patch components; version ranges can permit different updates. |
| **Environment variable** | A process-level configuration value, commonly used for ports, database URLs, and secrets. Values read from `process.env` are strings and should be validated and parsed. |
| **Secret** | Sensitive configuration such as a database password or signing key; keep it out of source code and Git history. |
| **Process** | A running program; Node exposes process information and controls through the `process` object. |
| **Event loop** | The mechanism Node uses to schedule JavaScript callbacks and coordinate asynchronous work. Long synchronous work can block it. |
| **Non-blocking I/O** | I/O work that lets a program continue while the operating system or another service completes the operation. |
| **Callback** | A function passed to another function to run later or after an operation completes. |
| **Promise** | An object representing the eventual fulfillment or rejection of asynchronous work. |
| **async/await** | Syntax for writing Promise-based asynchronous code in a sequential style. |
| **Exception** | An error condition raised during execution, commonly with `throw` and handled by `try`/`catch`. |
| **Unhandled rejection** | A rejected Promise with no rejection handler; it should be handled intentionally rather than ignored. |
| **Buffer** | Node's representation for raw bytes, used for binary data such as files and network payloads. |
| **Stream** | An interface for consuming or producing data incrementally instead of loading it all at once. |
| **EventEmitter** | A Node pattern for emitting named events and registering listeners. |
| **HTTP server** | A Node process that listens on a port and handles HTTP requests. |
| **Port** | A numbered endpoint on a host that a network service listens on. |
| **Runtime** | The environment that executes a program and provides APIs such as file access, networking, and timers. |
| **Blocking operation** | Work that prevents the current JavaScript execution from progressing until it finishes. Avoid long CPU-heavy work on a server's main event loop. |

### JavaScript words often seen in MERN code

These are JavaScript syntax or built-in names, not MERN-specific terms:

| Word or name | Common use |
| --- | --- |
| `const` and `let` | Declare block-scoped bindings. |
| `function` and `return` | Define a function and return a value. |
| `import` and `export` | Share bindings between ES modules. |
| `async` and `await` | Work with Promises. |
| `try`, `catch`, and `throw` | Handle and raise exceptions. |
| `class` and `new` | Define and instantiate classes. |
| `null`, `undefined`, and `typeof` | Represent or inspect values. |
| `Array`, `Promise`, and `JSON` | Standard JavaScript built-ins, not MERN packages. |

The complete JavaScript reserved-word inventory belongs in the JavaScript notes. Framework APIs such as `useState` are ordinary JavaScript function names, not language keywords.

## MongoDB

| Term | Meaning |
| --- | --- |
| **Database** | A named container for collections and related database objects. |
| **Collection** | A group of documents, often used for records of one broad domain type. |
| **Document** | A BSON record made of field-value pairs; documents in a collection may have different shapes. |
| **Field** | A named value stored in a document. |
| **BSON** | MongoDB's binary-encoded document data format, which supports types beyond JSON text. |
| **ObjectId** | A BSON identifier type commonly used for document identifiers. Treat it as an identifier, not as authorization proof. |
| **Schema flexibility** | MongoDB permits documents in a collection to vary in shape; applications should still define and validate expected data. |
| **Data model** | The way an application's entities and relationships are represented in stored documents. |
| **Embedding** | Storing related data inside a parent document; useful when data is commonly read or updated together and bounded in size. |
| **Referencing** | Storing another document's identifier and reading the related document separately or through an aggregation. |
| **Denormalization** | Duplicating selected data to make common reads simpler or faster, while accepting consistency work. |
| **CRUD operation** | A create, read, update, or delete operation on documents. |
| **Filter** | A query condition that selects which documents match an operation. |
| **Projection** | A choice of which fields to return from a query. |
| **Update operator** | A MongoDB operator that changes selected fields or array values, such as `$set`, `$inc`, or `$push`. |
| **Upsert** | An update option that inserts a new document when no document matches the filter. |
| **Cursor** | A handle for iterating through query results, often in batches. |
| **Aggregation pipeline** | A sequence of stages that transforms, groups, joins, or summarizes documents. |
| **Aggregation stage** | One pipeline operation, such as `$match`, `$project`, `$group`, or `$lookup`. |
| **Index** | A data structure that can make selected queries faster, at the cost of storage and additional work on writes. |
| **Compound index** | An index that includes multiple fields in a defined order. |
| **Unique index** | An index that rejects duplicate indexed values according to its configured rules. |
| **TTL index** | A time-to-live index that can automatically remove documents after a configured time condition. |
| **Query plan** | The database's chosen strategy for executing a query; inspect it when investigating performance. |
| **Atomicity** | A guarantee that an operation happens completely or not at all. A single-document write is atomic in MongoDB. |
| **Transaction** | A group of database operations that succeed or fail together; multi-document transactions require suitable deployment configuration and add cost. |
| **Connection string** | A URI containing connection details and options for a database deployment. Treat credentials embedded in it as secrets. |
| **Database driver** | A library that lets application code communicate with MongoDB. |
| **Connection pool** | A set of reusable database connections managed by a driver. |
| **Replica set** | A group of MongoDB servers that maintain the same dataset and provide redundancy and failover. |
| **Sharding** | Distributing a collection's data across multiple machines to scale storage and workload. |
| **Seed data** | Initial or sample records inserted to prepare a development or test database. |
| **Migration** | A controlled change to data shape or stored data over time. |
| **Backup and restore** | Creating recoverable copies of data and restoring them; a backup is useful only if restoration is planned and checked. |
| **Least privilege** | Giving an application database account only the permissions it needs. |

## Mongoose

Mongoose is an optional Object Data Modeling (ODM) library for Node.js. MERN can use the MongoDB Node.js driver directly; Mongoose is not required by the acronym.

| Term | Meaning |
| --- | --- |
| **ODM** | Object Data Modeling: a library that maps application objects and schemas to documents in a document database. |
| **Schema** | A Mongoose definition of expected fields, types, defaults, validation, and behavior for a model. |
| **Model** | A Mongoose interface for creating, querying, updating, and deleting documents in a collection. |
| **Mongoose document** | An instance created or loaded through a model, with document state and Mongoose methods. |
| **Validation** | Checks that values satisfy rules before they are stored; database and API validation may still be needed at other boundaries. |
| **Middleware or hook** | A function run before or after selected Mongoose operations or document actions. This is different from Express request middleware. |
| **Virtual** | A computed Mongoose property that is not stored as a regular document field. |
| **Populate** | Mongoose's way to replace a stored reference with data queried from a related document. |
| **Lean query** | A Mongoose query option that returns plain JavaScript objects instead of full Mongoose documents. |

## Express and REST APIs

| Term | Meaning |
| --- | --- |
| **Express application** | The configured server object that registers middleware, routes, and settings. |
| **Middleware** | A function in Express's request-response chain that can run code, change request/response values, end the response, or pass control onward. |
| **Middleware order** | The order middleware is registered; it affects which requests it sees and how errors flow. |
| **`app.use()`** | An Express method commonly used to register middleware or mount a router. |
| **`req`** | The Express request object, which contains parsed request information. |
| **`res`** | The Express response object, used to set status and headers and send a response. |
| **`next`** | A callback that passes control to later middleware; passing an error directs control to error handling. |
| **Route handler** | A function that handles a matched route and usually sends or delegates the response. |
| **Router** | A modular Express object for grouping related routes and middleware. |
| **`req.params`** | Object containing values captured from named route path segments. |
| **`req.query`** | Object containing parsed query-string values. Treat all client-provided values as untrusted. |
| **`req.body`** | Parsed request body, available only when suitable parsing middleware is configured. |
| **`express.json()`** | Built-in Express middleware for parsing supported JSON request bodies. |
| **Controller** | A layer that translates HTTP input into application actions and formats HTTP responses. |
| **Service** | A layer for application rules that should not be tied to Express request objects. |
| **Repository or data-access layer** | A layer that groups database access code behind a focused interface. It is a design pattern, not a required MERN package. |
| **Validation** | Checking that input has the expected shape, type, and allowed values before processing it. |
| **Sanitization** | Normalizing or transforming input safely for a specific use; it does not replace validation or output encoding. |
| **Error-handling middleware** | Express middleware with the error-handler signature, used to produce consistent error responses. |
| **404 handler** | A final route fallback for requests that do not match a defined route. |
| **Status mapping** | Choosing an appropriate HTTP response status for application outcomes. |
| **Static assets** | Files such as images, stylesheets, and client bundles served without running a custom API handler for each file. |
| **Multipart form data** | A request format commonly used to send files and regular form fields together. |
| **API versioning** | A strategy for evolving an API while managing compatibility for its clients. |
| **OpenAPI description** | A machine-readable description format for documenting HTTP APIs. |
| **Request logging** | Recording selected request and response metadata for debugging and operations without logging secrets. |
| **Rate limiting** | Restricting request frequency to reduce abuse and protect service capacity. |
| **Async error forwarding** | Passing rejected asynchronous work into Express error handling. Behavior and patterns differ across Express major versions; follow the version the project uses. |

## React

| Term | Meaning |
| --- | --- |
| **Component** | A reusable piece of UI with its own rendering logic; React components are commonly JavaScript functions. |
| **JSX** | A JavaScript syntax extension used to describe UI markup in component code. It is transformed by build tooling. |
| **Props** | Read-only inputs passed from a parent component to a child component. |
| **State** | Component-managed data that can change over time and cause the UI to update. |
| **Render** | Producing a description of the UI for the current props and state. |
| **Reconciliation** | React's process for comparing UI descriptions and applying needed updates. |
| **Key** | A stable identifier React uses to match items in a rendered list across updates; keys should be unique among their siblings. |
| **Fragment** | A way to group adjacent elements without adding an extra DOM element. |
| **Event handler** | A function connected to a user interaction such as a click or form submission. |
| **Controlled input** | A form field whose displayed value is driven by React state. |
| **Uncontrolled input** | A form field whose current value is kept by the DOM and read when needed, often with a ref. |
| **Lifting state** | Moving shared state to the closest common parent that needs to coordinate it. |
| **Hook** | A React function API that lets function components use state and other React features. Hooks follow rules about where they can be called. |
| **`useState`** | A Hook for storing component state. Its setter requests a render with the next state value. |
| **`useEffect`** | A Hook for synchronizing a component with an external system after rendering. It is not needed for every calculation or event. |
| **Effect cleanup** | A function returned from an Effect to undo or stop work such as a subscription, timer, or event listener. |
| **Effect dependencies** | Values listed for an Effect so React can determine when to run its setup again. Include the reactive values the Effect uses. |
| **`useRef`** | A Hook for retaining a mutable value between renders or referring to a DOM element without triggering a render when it changes. |
| **`useContext`** | A Hook for reading a value provided by a matching React context provider. |
| **Custom Hook** | A JavaScript function whose name starts with `use` and that composes built-in or other Hooks. |
| **Context** | A React mechanism for providing a value to descendant components without passing it through every intermediate prop. |
| **Client-side routing** | Changing the displayed page based on the URL in the browser without requesting a full new document for every navigation. |
| **SPA** | Single-page application: an application where navigation commonly updates the current document rather than loading a new document for each view. |
| **CSR** | Client-side rendering: creating or updating the interface in the browser using JavaScript. |
| **Loading state** | UI state shown while an asynchronous request or operation is in progress. |
| **Empty state** | UI state shown when a successful query has no items to display. |
| **Error state** | UI state shown when an operation fails, usually with a recoverable next step. |
| **Error boundary** | A React component mechanism for catching rendering errors in descendant components and showing fallback UI. |
| **Memoization** | Reusing a computed value or component result when its relevant inputs have not changed; use it when measurement shows a benefit. |
| **Accessibility** | Building interfaces that can be used by people with different abilities, including keyboard and assistive technology users. |

## Authentication and security

| Term | Meaning |
| --- | --- |
| **Authentication** | Establishing who a user or client is. |
| **Authorization** | Deciding which actions an authenticated identity may perform. |
| **Session** | Server-associated state used to recognize a client across multiple requests, commonly identified through a cookie. |
| **Cookie** | A browser-managed value sent with matching requests according to its scope and settings. |
| **HttpOnly** | A cookie setting that prevents ordinary JavaScript access to the cookie value. |
| **Secure** | A cookie setting that restricts sending the cookie to secure connections. |
| **SameSite** | A cookie setting that controls when browsers attach the cookie to cross-site requests; it is one part of CSRF defense. |
| **Password hashing** | One-way, deliberately expensive transformation used to verify passwords without storing the original password. |
| **Salt** | A unique random value used with password hashing so identical passwords do not produce identical stored hashes. |
| **JWT** | JSON Web Token: a token format for carrying claims. A signed JWT is not encrypted by default; do not put secrets in its payload. |
| **Access token** | A short-lived credential used to access protected operations. |
| **Refresh token** | A longer-lived credential used to obtain a replacement access token; protect, rotate, and revoke it carefully. |
| **CSRF** | Cross-site request forgery: causing a user's browser to send an unintended authenticated request to another site. |
| **XSS** | Cross-site scripting: injection of executable script into a page viewed by other users. |
| **Injection** | Treating untrusted input as code or query syntax; use safe query construction and validation. |
| **NoSQL injection** | Manipulating a document-database query through untrusted values or operators. |
| **IDOR or BOLA** | Insecure direct object reference or broken object-level authorization: a user accesses another user's record by changing an identifier. |
| **TLS** | Transport Layer Security, the protocol that protects HTTPS connections. |
| **Security header** | An HTTP response header that enables browser security policies. |
| **Least privilege** | Giving a user, service, or database account only the permissions required for its task. |
| **Input validation** | Verifying client-controlled values before they affect application logic or data. |
| **Output encoding** | Representing data safely for the context where it is displayed, reducing injection risks. |
| **Threat model** | A structured view of assets, trust boundaries, likely threats, and mitigations for an application. |

Authentication can use different architectures, such as server sessions or token-based designs. Choose based on the application and threat model; no single approach is best for every MERN project.

## Testing and operations

| Term | Meaning |
| --- | --- |
| **Unit test** | A focused test of one function or small unit, usually with external dependencies isolated. |
| **Integration test** | A test of multiple pieces working together, such as an API route and a test database. |
| **End-to-end test** | A test that exercises a user-visible flow across the application layers. |
| **Component test** | A test of a UI component's rendered behavior and interactions. |
| **Mock** | A test substitute that can verify calls and return configured behavior. |
| **Stub** | A test substitute that returns predefined values for a dependency. |
| **Fixture** | Reusable test input or setup data. |
| **Test coverage** | A measurement of which code was exercised by tests; high coverage alone does not prove good tests. |
| **CI** | Continuous integration: automatically checking code changes, often with linting, tests, and builds. |
| **CD** | Continuous delivery or deployment: automating preparation or release of software changes. |
| **Build** | Preparing source code and assets for execution or deployment. |
| **Development environment** | A local or shared environment intended for authoring and debugging. |
| **Production environment** | The live environment serving real users and data. |
| **Health check** | An endpoint or signal used to determine whether a service is operating and ready. |
| **Structured logging** | Logs written as consistent fields, often JSON, so systems can search and aggregate them. |
| **Metric** | A numeric measurement tracked over time, such as request rate or error count. |
| **Trace** | A record of a request's path across services and operations. |
| **Reverse proxy** | A server that receives client traffic and forwards it to application servers, often handling TLS or routing. |
| **Container** | A packaged process environment with its application and runtime dependencies; Docker is one container platform. |
| **Deployment** | Making a built application available in a target environment. |
| **Configuration separation** | Keeping environment-specific settings outside the application source and supplying them per environment. |
| **Backup restore test** | A rehearsal proving that a backup can actually recover the required data. |

## Common abbreviations

| Abbreviation | Expansion |
| --- | --- |
| **API** | Application Programming Interface |
| **BSON** | Binary JSON, MongoDB's document data format |
| **CI/CD** | Continuous Integration and Continuous Delivery or Deployment |
| **CORS** | Cross-Origin Resource Sharing |
| **CRUD** | Create, Read, Update, Delete |
| **CSR** | Client-Side Rendering |
| **CSRF** | Cross-Site Request Forgery |
| **DOM** | Document Object Model |
| **ESM** | ECMAScript Modules |
| **HTTP / HTTPS** | Hypertext Transfer Protocol / its TLS-protected form |
| **IDOR** | Insecure Direct Object Reference |
| **JSON** | JavaScript Object Notation |
| **JWT** | JSON Web Token |
| **MERN** | MongoDB, Express, React, Node.js |
| **ODM** | Object Data Modeling |
| **REST** | Representational State Transfer |
| **SPA** | Single-Page Application |
| **TLS** | Transport Layer Security |
| **TTL** | Time To Live |
| **URL / URI** | Uniform Resource Locator / Uniform Resource Identifier |
| **XSS** | Cross-Site Scripting |

## Terms that are not MERN keywords

MERN has no shared grammar that reserves words. These are technology names, concepts, or APIs rather than MERN language keywords:

- **MERN**, **MongoDB**, **Express**, **React**, and **Node.js** are technology names.
- **JSX** is syntax transformed by tooling; it is not a separate programming language.
- **Props**, **state**, **hooks**, **components**, **middleware**, **routes**, **schemas**, and **models** are concepts or framework terms.
- **`useState`**, **`useEffect`**, **`req`**, **`res`**, **`next`**, **`process.env`**, and **`express.json()`** are API names or identifiers.
- **Mongoose**, React routing libraries, test frameworks, validators, and build tools are packages or tools; they are not all required by MERN.
- A word such as `map` may be an ordinary method name in JavaScript code, not a reserved word.

See the JavaScript notes' keyword guide for JavaScript's language-level reserved words. The MERN course roadmap covers the stack concepts chapter by chapter.

## Version and compatibility notes

JavaScript, Node.js, MongoDB, Express, React, and third-party packages evolve. Check the versions used by a project before relying on a particular option or behavior. Express asynchronous error handling differs between major versions, and package APIs can change. Lessons and examples should state relevant prerequisites and versions where compatibility matters.

Do not treat a term in this glossary as proof that a package is installed or that a feature is enabled in a particular deployment. Verify the project's dependencies, configuration, and database topology.

## Continue learning

- [MERN course roadmap](README.md#course-roadmap)

---
*This glossary collects the core language, framework, database, API, security, and operations terms used throughout the MERN notes.*
