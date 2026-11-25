# Chapter 039 Q&A: Routes, route parameters, and routers

Review Express route matching, request parameters, Express 5 path syntax, and modular routers. The examples in this Q&A use Express 5 conventions.

## Part 1: Multiple-choice questions

### 1. What does an Express route normally combine?

- **A.** An HTTP method, a path pattern, and one or more handlers.
- **B.** A database table and a CSS selector.
- **C.** A package version and an environment variable.
- **D.** A request body and a browser event.

**Answer: A.** Express selects route handlers based on the request method and matching path.

### 2. Which route matches a GET request to /api/projects/101?

- **A.** app.get("/api/projects/:projectId", handler)
- **B.** app.post("/api/projects/:projectId", handler)
- **C.** app.get("/api/projects", handler)
- **D.** app.delete("/api/projects", handler)

**Answer: A.** The named parameter captures the one path segment after /api/projects.

### 3. Where does Express put a captured named path parameter?

- **A.** req.params
- **B.** req.body
- **C.** res.locals only
- **D.** process.env

**Answer: A.** A route parameter such as :projectId is read as req.params.projectId.

### 4. What type should an application initially assume for req.params.projectId?

- **A.** A string supplied by the request.
- **B.** A trusted integer.
- **C.** A MongoDB document.
- **D.** A boolean.

**Answer: A.** Convert and validate it explicitly if the application needs a numeric value.

### 5. Does a query string usually affect which route path matches?

- **A.** No. Query values are separate from the route path.
- **B.** Yes. Every query key becomes a route parameter.
- **C.** Only for POST requests.
- **D.** Only when express.Router() is used.

**Answer: A.** /api/projects/101?view=full still matches /api/projects/:projectId. The query value is available through req.query.

### 6. What is a common purpose for a query parameter?

- **A.** Filtering, sorting, or paginating a collection.
- **B.** Declaring a router mount prefix.
- **C.** Replacing the HTTP method.
- **D.** Defining server middleware order.

**Answer: A.** Query parameters commonly express optional collection controls.

### 7. Which value does a named route parameter capture?

- **A.** Usually one path segment, not a slash-separated remainder.
- **B.** The entire request body.
- **C.** Every query parameter.
- **D.** Only an HTTP method.

**Answer: A.** A colon parameter captures one segment; use a named wildcard when multiple segments are intended.

### 8. Why should a fixed route such as /api/projects/new often be registered before /api/projects/:projectId?

- **A.** So the fixed word new is not handled as a projectId.
- **B.** So Express can parse JSON.
- **C.** So the URL has no query string.
- **D.** So the route becomes a POST request.

**Answer: A.** Express checks matching layers in registration order, and new can match the dynamic segment.

### 9. What does the period mean in a string route such as /plants/:genus.:species?

- **A.** A literal separator between the two parameter values.
- **B.** A wildcard for any number of paths.
- **C.** The beginning of the query string.
- **D.** A request body marker.

**Answer: A.** A dot is literal in this route and separates genus from species.

### 10. In Express 5 string paths, which syntax marks an optional segment?

- **A.** Braces around the optional portion.
- **B.** A question mark after every route.
- **C.** An asterisk without a name.
- **D.** Parentheses around a number.

**Answer: A.** Express 5 uses braces for optional portions, such as /:file{.:extension}.

### 11. Which pattern is the Express 5 form of a named wildcard?

- **A.** /files/*filepath
- **B.** /files/*
- **C.** /files/:?
- **D.** /files/{}

**Answer: A.** Express 5 requires the wildcard to have a name.

### 12. What shape does an Express 5 named wildcard capture?

- **A.** An array of path segments.
- **B.** Always a number.
- **C.** A response object.
- **D.** A function.

**Answer: A.** A wildcard such as *filepath captures segments as an array.

### 13. What does express.Router() create?

- **A.** A mountable collection of middleware and routes.
- **B.** A MongoDB database.
- **C.** A web browser.
- **D.** An HTTP response body.

**Answer: A.** A router can organize related endpoints and then be attached with app.use().

### 14. If a router defines /:projectId and is mounted at /api/projects, what is the combined path?

- **A.** /api/projects/:projectId
- **B.** /:projectId/api/projects
- **C.** /api/:projectId
- **D.** /projects/:projectId/api

**Answer: A.** Express combines the mount prefix with the router's local path.

### 15. How can a child router access parameters from its parent router?

- **A.** Create it with mergeParams: true.
- **B.** Call res.json() first.
- **C.** Use a query string instead of a path.
- **D.** Rename every route to GET.

**Answer: A.** Parent parameters are not merged into a child router by default.

### 16. What does router.route("/:projectId") help organize?

- **A.** Multiple HTTP methods that share one route path.
- **B.** Database indexes for every collection.
- **C.** Static image files only.
- **D.** Environment variables.

**Answer: A.** The same path can be grouped with chained get(), patch(), and delete() handlers.

### 17. What is one reasonable use of router.param("projectId", callback)?

- **A.** Load or validate a project when a matching route includes projectId.
- **B.** Automatically authorize every user for every action.
- **C.** Change all GET requests into POST requests.
- **D.** Parse JSON bodies without middleware.

**Answer: A.** A parameter callback can centralize a shared lookup, but authorization still needs explicit policy checks.

### 18. Which Express 5 statement about string route paths is correct?

- **A.** Regular-expression syntax inside a string path is not a general way to constrain a named parameter.
- **B.** A query string is included in the route pattern.
- **C.** An unnamed asterisk matches every path.
- **D.** Route parameters are automatically authorized.

**Answer: A.** Validate captured values in application code or use an appropriate RegExp or explicit path array where needed.

### 19. Which property keeps the original request URL, including its query string, when a router is mounted?

- **A.** req.originalUrl
- **B.** req.body
- **C.** res.statusCode
- **D.** req.project

**Answer: A.** req.originalUrl retains the original URL. req.url can represent the remaining URL within a mounted router.

### 20. Does a nested URL by itself prove that a task belongs to a project?

- **A.** No. The application must verify that relationship.
- **B.** Yes, because URL segments are trusted.
- **C.** Yes, if the route uses GET.
- **D.** Only when the task ID contains digits.

**Answer: A.** Load the task through the selected project or verify the relationship explicitly.

## Part 2: Short answers

### 21. What is a route parameter?

**Answer:** A named value captured from a path segment, such as projectId in /api/projects/:projectId. Express exposes it through req.params.

### 22. What is the difference between req.params.projectId and req.query.status?

**Answer:** The route parameter identifies a resource in the path. The query parameter is an optional value after the question mark, often used to filter or paginate. Both are client input and need validation.

### 23. Why should a route parameter not be trusted just because it is named projectId?

**Answer:** The name does not validate its value, prove the record exists, or grant permission. Validate its format, load the resource, and check the authenticated user's access.

### 24. How do route paths combine with a router mount prefix?

**Answer:** Express joins the app.use() mount path with the router's local path. Mounting a router at /api/projects and defining /:projectId produces /api/projects/:projectId.

### 25. What is the benefit of using separate routers for projects and users?

**Answer:** Each router can own related paths and middleware, which makes larger route sets easier to navigate, maintain, and review.

### 26. What does mergeParams do?

**Answer:** It preserves parent router parameters in the child router's req.params. It is disabled by default.

### 27. When is router.param() useful?

**Answer:** It is useful when multiple routes need the same parameter lookup or validation. Keep the callback focused and apply authorization separately for each operation.

### 28. Why can a wildcard route be risky when it reads files?

**Answer:** A wildcard can capture many client-controlled path segments. Using those values directly as a filesystem path can expose files outside the intended directory. Validate segments and constrain resolved paths.

### 29. What is the difference between req.originalUrl and req.url inside a mounted router?

**Answer:** req.originalUrl retains the original URL. req.url can be the remaining path within the current mount context after Express strips the mount prefix.

### 30. What should a route do after sending a response?

**Answer:** It should finish that path and not call next() to trigger another response. Continuing after sending can cause duplicate-response errors.

## Part 3: Apply the concepts

### 31. A route is declared as app.get("/users/:userId", handler). What does GET /users/25?view=short put in req.params.userId?

**Answer:** The string "25". The query value view=short is separate and can be read from req.query.view.

### 32. A static /projects/new route is handled by /projects/:projectId. What should you change?

**Answer:** Register /projects/new before the dynamic /projects/:projectId route, or otherwise make the route design unambiguous.

### 33. An endpoint needs to match /files/a/b/c.txt. Why does /files/:file not capture the whole remainder?

**Answer:** A named colon parameter captures one segment. An Express 5 named wildcard such as /files/*filepath captures multiple segments as an array.

### 34. An Express 4 route uses /:file.:extension?. What should be reviewed before upgrading?

**Answer:** Express 5 uses braces for optional portions, for example /:file{.:extension}. Review the route syntax and how omitted parameters appear in req.params.

### 35. A handler uses Number(req.params.projectId) without checking the result. What can go wrong?

**Answer:** Non-numeric input may become NaN, and unsafe or out-of-range numbers may be accepted accidentally. Validate the text and then check that the converted number is a safe, allowed integer.

### 36. A child tasks router sees taskId but not projectId. What configuration is probably missing?

**Answer:** Create the child router with express.Router({ mergeParams: true }) so it receives the parent route parameter.

### 37. A request to /api/projects/101/tasks/2 returns a task with ID 2, but the task belongs to project 202. What is the bug?

**Answer:** The handler checked the task ID without verifying its relationship to project 101. Load the task through the selected project or verify the parent-child relationship.

### 38. A router has authentication middleware registered after its routes. What is the consequence?

**Answer:** Those routes may handle requests before the authentication middleware runs. Register router middleware before the routes it must protect.

### 39. A handler uses req.params.projectId directly as a MongoDB query object. Is that safe?

**Answer:** No. Treat it as an untrusted string, validate its format, and construct the database query using a known field and validated value. Do not allow user input to define query operators.

### 40. A route returns 404 for both an invalidly formatted ID and a well-formed ID that does not exist. Is that always the clearest behavior?

**Answer:** Not necessarily. A common design returns 400 for malformed input and 404 for a valid identifier with no matching resource. Choose and document consistent API semantics without exposing sensitive information.

## Chapter navigation

| Previous chapter | Chapter lesson | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [038 - Middleware order and request lifecycle](../lessons/038-middleware-order-and-request-lifecycle.md) | [Lesson](../lessons/039-routes-route-parameters-and-routers.md) | [Example](../examples/039-routes-route-parameters-and-routers.md) | [040 - Requests, responses, and content types](../lessons/040-requests-responses-and-content-types.md) |
