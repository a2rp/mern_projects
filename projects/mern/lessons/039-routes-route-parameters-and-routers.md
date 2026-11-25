# 039 - Routes, route parameters, and routers

A route connects an HTTP method and a URL path to the code that handles a request. Route parameters let a path identify a particular resource, and routers let an application group related routes into reusable modules.

This chapter uses Express 5 routing syntax. Route path patterns changed between Express 4 and Express 5, so avoid copying older optional-parameter and wildcard patterns into a new Express 5 application.

## Learning goals

By the end of this chapter, you should be able to:

- Explain how the HTTP method and route path select a handler.
- Register fixed routes, parameterized routes, and routes with multiple handlers.
- Read named route parameters from req.params and validate them.
- Explain the difference between route parameters, query parameters, and request bodies.
- Use Express 5 optional path segments and named wildcards.
- Group related routes with express.Router().
- Mount a router at a path prefix and understand how mounted paths combine.
- Preserve parent parameters for a nested router with mergeParams.
- Keep route declarations readable and avoid common matching mistakes.

## What a route describes

A route usually combines:

1. An HTTP method, such as GET, POST, PATCH, or DELETE.
2. A path pattern, such as /api/projects/:projectId.
3. One or more callbacks that handle the matching request.

For example:

~~~javascript
app.get("/api/projects/:projectId", (req, res) => {
  res.json({
    projectId: req.params.projectId
  });
});
~~~

A GET request to /api/projects/101 matches this route. Express places the captured path value in req.params.projectId. The value is text, even if it looks like a number.

A route does not include a query string. /api/projects/101?view=compact still matches /api/projects/:projectId; the query string is available through req.query and does not change the route path.

## Route matching uses both method and path

A route matches only when its method and path pattern match the request.

~~~javascript
app.get("/api/projects", listProjects);
app.post("/api/projects", createProject);
app.get("/api/projects/:projectId", getProject);
app.patch("/api/projects/:projectId", updateProject);
app.delete("/api/projects/:projectId", deleteProject);
~~~

These routes share path shapes but represent different operations. A POST does not automatically match a GET route. Express moves through registered middleware and routes in order; a handler that sends a response ends the normal path, while a handler can call next() to continue.

Use the HTTP method that describes the operation. A GET handler should retrieve information and should not perform an action that changes persistent state. A DELETE route should still verify authorization and resource rules before removing anything.

## Fixed paths and parameterized paths

A fixed path names a specific endpoint:

~~~javascript
app.get("/api/projects", listProjects);
app.get("/api/projects/new", showProjectCreationHelp);
~~~

A named parameter starts with a colon and captures one path segment:

~~~javascript
app.get("/api/projects/:projectId", (req, res) => {
  res.json({ projectId: req.params.projectId });
});
~~~

For /api/projects/101, the captured value is 101. A parameter does not consume a slash, so /api/projects/101/tasks does not match that one-segment route.

Declare fixed routes before a dynamic route when their shapes could overlap. For example, define /api/projects/new before /api/projects/:projectId. Otherwise, the word new can be captured as projectId and handled as though it were an identifier.

Route parameter names must be valid JavaScript identifiers. Hyphens and dots are literal separators, so patterns such as /flights/:from-:to and /plants/:genus.:species can capture multiple named values.

~~~javascript
app.get("/flights/:from-:to", (req, res) => {
  res.json({
    from: req.params.from,
    to: req.params.to
  });
});
~~~

For /flights/LAX-SFO, Express captures LAX as from and SFO as to.

## Read and validate route parameters

Route parameters are input from the client. Treat them as untrusted text. Validate the shape before using a parameter to query data, construct a file path, or authorize an operation.

~~~javascript
app.get("/api/projects/:projectId", (req, res) => {
  const projectId = req.params.projectId;

  if (!/^[0-9]+$/.test(projectId)) {
    return res.status(400).json({
      error: "projectId must contain digits only."
    });
  }

  return res.json({
    projectId
  });
});
~~~

Checking that an identifier contains digits is only a format check. The application must still check whether the project exists and whether the current user may access it.

Do not assume that a parameter is a number just because its characters look numeric. Convert it explicitly when numeric behavior is needed, then check that the conversion is safe and within the application's allowed range.

~~~javascript
const projectId = Number(req.params.projectId);

if (!Number.isSafeInteger(projectId) || projectId < 1) {
  return res.status(400).json({
    error: "projectId is invalid."
  });
}
~~~

Prefer allow-lists and explicit validation rules. Never use a client-provided route parameter directly as a filesystem path, database operator, HTML fragment, or authorization decision.

## Route parameters, query parameters, and request bodies

These inputs serve different purposes:

| Input | Example URL or request | Express location | Typical purpose |
| --- | --- | --- | --- |
| Route parameter | /api/projects/101 | req.params.projectId | Identify a resource |
| Query parameter | /api/projects?status=active | req.query.status | Filter, sort, or paginate a collection |
| Request body | JSON sent with POST or PATCH | req.body | Send data to create or update a resource |

A query value is also untrusted input and must be validated. A request body is not available as parsed data unless suitable body-parsing middleware is mounted before the route.

Do not move a resource identifier into the query string merely because the route parameter is unfamiliar. Use a clear URL design, and keep filters in the query string.

## Express 5 optional path segments

In Express 5 string route paths, braces mark an optional segment. The older question-mark syntax for optional parameters is not supported.

~~~javascript
app.get("/api/files/:file{.:extension}", (req, res) => {
  res.json({
    file: req.params.file,
    extension: req.params.extension ?? null
  });
});
~~~

This route can match /api/files/report and /api/files/report.json. If the optional extension is absent, its parameter is omitted from req.params.

Braces can also make an entire path segment optional:

~~~javascript
app.get("/users{/:userId}", handler);
~~~

Optional patterns should be used only when both forms have a clear meaning. Separate routes can be easier to read and validate when the behavior differs substantially.

## Express 5 named wildcards

A wildcard captures multiple path segments. In Express 5, the wildcard must have a name, and the captured value is an array of path segments.

~~~javascript
app.get("/api/files/*filepath", (req, res) => {
  res.json({
    pathSegments: req.params.filepath
  });
});
~~~

A request to /api/files/manuals/setup/intro.md captures an array similar to ["manuals", "setup", "intro.md"]. A wildcard written as /*filepath does not match the root path by itself. Wrap it in braces when the root path must also match:

~~~javascript
app.get("/{*filepath}", handler);
~~~

A wildcard is not permission to access arbitrary files. Validate every segment and resolve file access within an approved directory. For APIs, prefer a resource identifier and an explicit lookup over using a wildcard as a filesystem path.

## Route path syntax and compatibility

Express 5 uses the current route path syntax supplied by its router. In string paths:

- A colon introduces a named parameter.
- Braces describe optional portions.
- A named wildcard captures multiple path segments.
- A dot or hyphen is literal and can separate parameters.
- Query strings are not part of the route path.
- Regular-expression characters inside string paths are not a way to add parameter constraints.

For a pattern that genuinely needs regular-expression matching, pass a RegExp route path or an array of explicit paths. Keep such patterns readable and test their intended matches. Do not use older Express 4 patterns such as /files/* or /:file.:ext? in an Express 5 application.

When upgrading an existing app, review each route pattern instead of assuming that the old path string has the same meaning. Express 5 also represents wildcard parameter values as arrays; code that previously expected one string needs an update.

## Group related routes with express.Router()

A router is a mountable set of middleware and routes. It has route methods such as get(), post(), and route(), and it can be mounted into an Express app or another router.

~~~javascript
import express from "express";

const projectRouter = express.Router();

projectRouter.get("/", listProjects);
projectRouter.get("/:projectId", getProject);

app.use("/api/projects", projectRouter);
~~~

The router's local paths are combined with its mount prefix:

| Router path | Mount prefix | Resulting path |
| --- | --- | --- |
| / | /api/projects | /api/projects |
| /:projectId | /api/projects | /api/projects/:projectId |
| /:projectId/tasks | /api/projects | /api/projects/:projectId/tasks |

Keeping the prefix in app.js and resource-specific paths in a router makes route ownership easier to understand.

Routers can also have middleware that applies to all requests reaching that router:

~~~javascript
projectRouter.use(requireAuthentication);
projectRouter.get("/", listProjects);
~~~

Register router middleware before the routes it should affect. A router only handles requests that reach its mounted path; unrelated paths continue through the application stack.

## Group methods for one resource with route()

When several methods share one path, route() keeps them together:

~~~javascript
projectRouter
  .route("/:projectId")
  .get(getProject)
  .patch(updateProject)
  .delete(deleteProject);
~~~

The shared path is visible once, while each method keeps its own handler. This does not replace validation, authentication, or authorization; each operation still needs the checks appropriate to it.

## Nested routers and parent parameters

A nested router can organize a subresource such as tasks belonging to a project:

~~~javascript
const taskRouter = express.Router({
  mergeParams: true
});

projectRouter.use("/:projectId/tasks", taskRouter);
taskRouter.get("/", listProjectTasks);
taskRouter.get("/:taskId", getProjectTask);
~~~

A router does not inherit parent route parameters by default. Setting mergeParams: true preserves the parent router's parameter values in the child router. If parent and child parameter names collide, the child value takes precedence.

Use this option when the child handlers need the parent identifier. A nested URL alone does not prove that the child resource belongs to that parent: look up the task through the loaded project or verify the relationship explicitly.

## router.param() for shared parameter loading

router.param() registers a callback that runs when a named parameter is present in one of that router's route paths. It can centralize a shared lookup or format check:

~~~javascript
projectRouter.param("projectId", (req, res, next, projectId) => {
  const project = findProject(projectId);

  if (!project) {
    return res.status(404).json({
      error: "Project not found."
    });
  }

  req.project = project;
  return next();
});
~~~

Keep parameter callbacks focused on loading or validating the resource. They should either send a response or continue, and they should forward unexpected errors to error handling. A parameter callback is not an authorization policy: access rules still depend on the authenticated user and requested action.

For a small application, explicit validation in route handlers can be clearer. Use router.param() when several routes genuinely share the same lookup behavior.

## Mounted routers and request path properties

When a router is mounted, Express exposes related path values for different purposes:

- req.originalUrl retains the original request URL, including the query string.
- req.baseUrl contains the path pattern through which the router was mounted.
- req.url is the remaining URL within the current mount context.
- req.params contains parameters captured by the currently matched route, with parent values available in a child router only when merged.

For a request to /api/projects/101/tasks/2?view=full, a child router mounted at /api/projects/:projectId/tasks can use the merged projectId and its own taskId. Do not build a canonical public URL from an internal req.url value after middleware has mounted or rewritten paths.

## Router options and defaults

express.Router() accepts options. The most useful option for nested parameters is mergeParams. The caseSensitive option controls case-sensitive matching, and strict controls whether a trailing slash changes a match.

Express defaults are generally forgiving about letter case and a trailing slash. If an application changes those settings, document the choice and use it consistently. Avoid depending on an accidental capitalization or slash difference for security or authorization.

## Route ordering and fall-through

Express checks registered middleware and routes in order. Keep routes easy to scan:

1. Application-wide middleware.
2. Resource routers.
3. More specific fixed routes before overlapping dynamic routes.
4. A not-found handler after all routes.
5. Error-handling middleware after ordinary middleware and routes.

A route can have multiple callbacks. Each callback must either send a response, pass control with next(), skip the remaining callbacks for the current route with next("route"), or forward an error with next(error). Do not send a response and then continue as if the response were still open.

## Common mistakes

- Treating the HTTP method as though it were part of the route path.
- Expecting query strings to change which route path matches.
- Putting /:projectId before a fixed route such as /new.
- Assuming req.params values are already numbers.
- Trusting route parameters without validation and authorization.
- Assuming a named parameter matches more than one path segment.
- Using Express 4 optional or unnamed wildcard syntax in Express 5.
- Expecting Express 5 wildcard values to be a single string.
- Assuming a child router can read parent parameters without mergeParams.
- Assuming nested URLs automatically prove a resource relationship.
- Registering router middleware after routes that should use it.
- Using a wildcard as an unrestricted filesystem path.
- Returning internal lookup errors or stack traces to clients.
- Forgetting that a router is not mounted until app.use() attaches it.

## Practical checklist

Before adding a route or router, ask:

- Is the HTTP method correct for the operation?
- Does the path identify one resource clearly?
- Are fixed routes registered before overlapping parameter routes?
- Are all params, query values, and request-body fields validated?
- Does this handler check authentication and authorization where required?
- Does the route send one response or continue exactly once?
- Does a nested router need mergeParams?
- Is the child resource verified as belonging to its parent?
- Are the 400 and 404 cases distinct and intentional?
- Does the route syntax match the installed Express major version?

## Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [038 - Middleware order and request lifecycle](038-middleware-order-and-request-lifecycle.md) | [Q&A](../qnas/039-routes-route-parameters-and-routers.md) | [Example](../examples/039-routes-route-parameters-and-routers.md) | [040 - Requests, responses, and content types](040-requests-responses-and-content-types.md) |
