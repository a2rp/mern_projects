# 042 - Separate routes, controllers, and services

As an Express application grows, keeping every URL, input check, business rule, and response in one file becomes hard to follow. Separating those responsibilities gives each part a clear job and makes changes easier to locate.

A common request path is:

~~~text
HTTP request
    -> router matches method and path
    -> validation middleware checks HTTP input
    -> controller translates HTTP data into an application call
    -> service applies application rules
    -> repository reads or writes data
    -> controller sends the HTTP response
~~~

This is an organizational pattern, not a framework requirement. Express does not require controllers, services, or repositories. Use only as many boundaries as make the application easier to understand.

## Learning goals

By the end of this chapter, you should be able to:

- Explain the separate roles of routes, controllers, services, and repositories.
- Assemble a small Express application from modules with clear dependencies.
- Keep HTTP-specific details out of business rules.
- Pass errors to centralized error middleware.
- Recognize when a layer is useful and when extra abstraction is unnecessary.

## The responsibilities

### Routes

A route module defines the HTTP surface: method, path, middleware order, and handler. Express Router lets related routes be mounted together under a prefix.

A route should read like a request flow:

~~~js
router.get("/", controller.list);
router.get("/:productId", validateProductId, controller.getById);
router.post("/", validateCreateProduct, controller.create);
~~~

The product router can be mounted at /api/products. The route file then owns endpoint composition without owning database work or response-building details.

### Controllers

A controller adapts the HTTP request and response to application operations. It reads validated values from the request or middleware, calls a service, and chooses the HTTP response status and representation.

Controllers should stay small. They should not contain database connection setup or large business workflows. A controller may be a group of handler functions rather than a class.

### Services

A service contains application rules and workflows. It should use plain inputs and return application results or raise application errors. It should not need Express request or response objects.

For example, a product service can enforce that product names are unique. That rule applies whether a product is created through an HTTP route, a scheduled job, or another caller.

### Repositories

A repository hides how application data is stored and retrieved. It may use an in-memory collection for a small example, a database model, or another persistence system.

Repositories are useful when they isolate meaningful data operations. They should not become wrappers around every one-line query without a reason. The following chapter connects an Express app to MongoDB; this chapter keeps persistence in memory so the module boundaries stay visible.

### Application and server entry points

The application module creates middleware, wires dependencies, mounts routes, and registers not-found and error middleware. The server entry point starts listening on a port.

Keeping app creation separate from listening makes it easier to import the app in other contexts, such as a test runner or a different server bootstrap. This example will not add or run tests.

## Dependency direction

A useful direction is:

- Routes depend on controllers and HTTP middleware.
- Controllers depend on services.
- Services depend on repositories or other application interfaces.
- Repositories do not depend on Express controllers or route modules.
- The application entry point wires the concrete pieces together.

This avoids circular imports such as a service importing a router that imports the service. It also makes dependencies visible where the application is assembled.

A factory can accept a dependency and return an object of operations. This is a lightweight form of dependency injection:

~~~js
function createProductService({ productRepository }) {
  return {
    listProducts() {
      return productRepository.findAll();
    }
  };
}
~~~

The app creates the repository and passes it to the service. The service does not need to know where the repository came from.

## Keep the HTTP boundary explicit

The previous chapter covered parsing and validating path, query, and body inputs. In a layered application, route middleware can perform HTTP input validation and place normalized values in res.locals for the next handler.

For example, validate a product ID before the controller runs. The controller then receives a known number instead of parsing raw text itself. The service receives a product ID and does not care that it came from a URL.

Do not put req, res, or next into a service function merely because that is convenient. Doing so couples business rules to Express and makes them harder to reuse. Likewise, do not make the controller decide database query syntax.

## Errors and async handlers

A service can signal expected application failures with an error that carries a safe status and code, such as PRODUCT_NOT_FOUND or PRODUCT_NAME_EXISTS. The controller does not need to turn every failure into a separate response; centralized error middleware can map known errors to HTTP responses.

Express 5 forwards rejected promises and thrown errors from async route handlers to error middleware. Return or await the work in the async handler so its promise remains connected to Express. Error middleware must have four parameters and be registered after routes. If response headers have already been sent, delegate the error with next(error).

Keep expected client errors separate from unexpected failures. A duplicate product name might become 409 Conflict. An unknown database exception should not be sent back with its stack trace or internal message.

## A practical folder layout

For a small CommonJS application:

~~~text
src/
|-- app.js
|-- server.js
|-- controllers/
|   |-- product.controller.js
|-- errors/
|   |-- app-error.js
|-- middleware/
|   |-- error-handler.js
|   |-- product-validation.js
|-- repositories/
|   |-- product.repository.js
|-- routes/
|   |-- product.routes.js
|-- services/
    |-- product.service.js
~~~

Names and folder depth can vary. A small app may keep a controller and service together initially. Split a module when it has distinct responsibilities or becomes difficult to navigate; do not create files just to satisfy a template.

## Avoid common architecture traps

- **Fat controllers:** Move workflows and domain rules into services.
- **Anemic pass-through services:** A service that only renames one repository call may add no useful boundary.
- **Express inside the service:** Pass values in and return values or throw application errors.
- **Database access scattered through controllers:** Centralize persistence operations behind a repository or data-access module when that improves consistency.
- **Over-generalized repositories:** Keep operations named for the application's needs rather than building a generic framework too early.
- **Circular dependencies:** Make dependencies flow toward lower-level capabilities and assemble them in the app.
- **Hidden global state:** Prefer explicit factories or clearly scoped instances when state needs to be replaced or isolated.
- **Duplicate response handling:** Let one error middleware map errors consistently.
- **Too many layers too soon:** Start with clear boundaries and add a layer only when it solves a real change or reuse problem.

## Common mistakes

- Assuming Express requires MVC or a particular folder structure.
- Defining routes and database operations together in one large file as the app grows.
- Returning res.json() from a service or importing Express into it.
- Putting validation in the repository or response formatting in the service.
- Catching an async service error and then forgetting to pass it to Express.
- Calling next() after already sending a response.
- Registering not-found or error middleware before the routes it must handle.
- Creating a repository abstraction that merely duplicates a database driver's API.
- Using module-level mutable state without understanding its lifetime.
- Treating a folder structure as a substitute for clear responsibilities.

## Practical checklist

When adding an endpoint, ask:

- Is the HTTP method and path clearly defined in a router?
- Are input checks at the HTTP boundary?
- Does the controller translate request values and format the response?
- Are application rules in a service that does not know about Express?
- Is data access located in an appropriate repository or model?
- Are dependencies wired in one application entry point?
- Do async failures reach the central error handler?
- Are client errors safe and consistent?
- Does each layer add a useful boundary for this project?
- Can a future persistence change happen without moving HTTP behavior into the data layer?

## Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [041 - Parse path, query, and body inputs](041-parse-path-query-and-body-inputs.md) | [Q&A](../qnas/042-separate-routes-controllers-and-services.md) | [Example](../examples/042-separate-routes-controllers-and-services.md) | [043 - Connect an Express app to MongoDB](043-connect-an-express-app-to-mongodb.md) |
