# 036 - REST API design and resource modeling

An API gives the browser a stable way to work with application data without exposing database internals. Good resource design makes the available data and actions understandable, keeps URLs predictable, and gives clients consistent results when requests succeed or fail.

REST is an architectural style. In everyday web applications, “REST API” often means an HTTP API that models resources and uses HTTP methods and status codes consistently. JSON is a common representation, but the important design work is choosing resources, relationships, allowed operations, and clear contracts.

## Learning goals

By the end of this chapter, you should be able to:

- Identify resources and their relationships from product requirements.
- Design predictable collection and individual-resource URLs.
- Choose HTTP methods according to the intended operation.
- Define request and response representations without exposing MongoDB documents directly.
- Select useful status codes and consistent error responses.
- Design filtering, sorting, and pagination deliberately.
- Review an API contract for security, consistency, and future change.

## Start with the client’s needs

Begin with the actions a client needs to perform, not with the names of database collections. Ask:

1. What things does the application manage?
2. Which properties can a client read or change?
3. Which records are related, and how should clients navigate those relationships?
4. Which user may perform each action?
5. What should happen when input is invalid, a record is missing, or a request conflicts with current data?

For a project-tracking application, useful resources might include projects, tasks, comments, and users. Each resource should have a stable identity and a representation that the client can understand.

A MongoDB collection is an implementation detail. The API may combine several collections into one response, omit private fields, or rename database fields. Do not return raw database documents automatically.

## Resource URLs

A resource is a thing or collection of things that an API can identify. A common URL convention uses plural nouns for collections and an identifier for one item:

~~~text
/api/v1/projects
/api/v1/projects/prj_123
/api/v1/projects/prj_123/tasks
~~~

The collection URL represents the set of projects. The item URL identifies one project. The nested URL identifies tasks belonging to one project.

Plural nouns are a convention, not a requirement of REST. Choose a convention and apply it consistently. Keep URL paths stable and readable; use query parameters for filters, sorting, pagination, and other options that select a view of a collection.

Prefer resource-oriented paths such as:

~~~text
POST   /api/v1/projects
PATCH  /api/v1/projects/prj_123
DELETE /api/v1/projects/prj_123
~~~

Avoid encoding ordinary CRUD actions as verbs in paths, such as /createProject or /deleteProject. A domain action that is not naturally a resource update may need an explicit action endpoint, but define it consistently and document its effect.

### Model relationships without over-nesting

A nested URL can express a relationship when the child is meaningful in the context of its parent:

~~~text
GET /api/v1/projects/prj_123/tasks
~~~

Keep nesting shallow. If a task has a stable identity and clients regularly address it directly, it can also have a top-level URL:

~~~text
GET   /api/v1/tasks/task_456
PATCH /api/v1/tasks/task_456
~~~

Avoid long paths that repeat every ancestor. Decide whether the API needs both a nested collection route and an individual top-level route based on actual client use.

## Use HTTP methods consistently

Choose the method based on the operation, not on a desire to make every request look alike.

| Method | Typical resource operation | Important property |
| --- | --- | --- |
| GET | Read a collection or item | Safe: the client is not requesting a state change |
| POST | Create a resource in a collection or submit a non-idempotent operation | Repeating it can create another result |
| PUT | Replace the state of a known resource | Intended effect is idempotent |
| PATCH | Apply a partial change to a resource | Define which fields and patch semantics are supported |
| DELETE | Remove or deactivate a resource | Intended effect is idempotent |

**Safe** means the requested operation is essentially read-only. **Idempotent** means repeating the same request has the same intended effect as performing it once. The response to a repeated request may differ. For example, the first DELETE may return 204 and a later one may return 404, while the intended end state remains that the resource is absent.

Use GET for retrieval only. A GET request must not trigger a requested mutation such as deleting a record. Do not automatically retry a non-idempotent POST unless the API has an explicit way to recognize and safely deduplicate that operation.

### PUT and PATCH are different contracts

PUT usually replaces the state of the addressed resource with the supplied representation. The API must state how omitted fields are handled and whether the request may create the resource.

PATCH changes only the fields or operations defined by the API’s patch format. If a client sends only a new project name, a PATCH contract should leave unrelated fields unchanged. Never merge arbitrary request bodies into database documents; allowlist editable fields.

A simple API can choose to support only PATCH for updates. It should still document that choice and its behavior.

## Design representations

A response representation is the API’s public view of a resource. Use stable, understandable property names and define which fields clients may send versus which the server controls.

~~~json
{
  "id": "prj_123",
  "name": "Website redesign",
  "description": "Refresh the public product site.",
  "status": "active",
  "createdAt": "2026-11-22T10:15:00.000Z",
  "updatedAt": "2026-11-22T10:15:00.000Z"
}
~~~

The API uses id rather than exposing MongoDB’s _id directly. The database can still use ObjectId internally. Define a stable public identifier format and validate it when it appears in a path.

The server should control fields such as identifiers, ownership, timestamps, and audit metadata. A client should not be able to set another user’s ownerId by including it in a request body. Return only fields the caller is permitted to read.

Use a consistent JSON representation and timestamp format. For requests, accept only the documented fields and validate types, lengths, allowed values, and cross-field rules. Reject or deliberately ignore unknown fields according to a documented policy; do not silently accept arbitrary database operators.

## Define status codes as part of the contract

Status codes communicate the broad result of the request. Use a small, consistent set that clients can handle.

| Status | Common API meaning |
| --- | --- |
| 200 OK | The request succeeded and the response contains a representation |
| 201 Created | A resource was created; include its representation and a Location header when practical |
| 202 Accepted | Work was accepted but is not complete yet |
| 204 No Content | The request succeeded and there is no response body |
| 400 Bad Request | The request is malformed or has invalid request syntax |
| 401 Unauthorized | The request lacks valid authentication credentials |
| 403 Forbidden | The caller is authenticated but is not allowed to perform the operation |
| 404 Not Found | The resource does not exist or the API intentionally hides its existence |
| 409 Conflict | The request conflicts with current resource state or a uniqueness rule |
| 422 Unprocessable Content | The request is syntactically valid but its values fail the API’s validation rules |
| 429 Too Many Requests | The caller exceeded a rate limit |
| 500 Internal Server Error | An unexpected server failure occurred |

Use one consistent convention for validation errors. Some APIs use 400 for all client input errors; others use 422 for semantically invalid input. Either can work when clearly documented. Never return a success status for a failed operation.

For POST that creates a resource, return 201 and identify the created resource. For a successful DELETE with no content, return 204 and send no JSON body. For long-running work, 202 means the work is accepted, not that it has finished.

## Keep error responses predictable

Clients need a stable error shape, not a stack trace or raw database exception. A simple application-wide shape could be:

~~~json
{
  "type": "validation_error",
  "title": "Request validation failed",
  "status": 422,
  "detail": "The project name must contain between 1 and 120 characters.",
  "instance": "/api/v1/projects"
}
~~~

The API may use a standard problem-details format or a documented project-specific format. Keep error fields consistent and machine-readable. Do not send database connection strings, stack traces, secrets, or sensitive records to clients. Log the detailed diagnostic on the server with appropriate access controls.

## Collections, filters, sorting, and pagination

A collection endpoint needs defined behavior for large result sets.

~~~text
GET /api/v1/projects?status=active&page=2&limit=20&sort=-updatedAt
~~~

Document:

- Which filters are supported and their accepted values.
- Which sort fields and directions are allowed.
- The default page size and maximum page size.
- Whether page numbering starts at zero or one.
- How the response reports the current page, result count, and whether more results exist.
- Whether results remain stable while records are added or changed.

For a small learning application, page-based pagination is easy to understand. Offset-based pages can become slow or shift between requests on a large, frequently changing collection. Cursor-based pagination is often a better fit for large or changing result sets. Choose based on the data and client needs.

Build database filters from a fixed allowlist. Never pass arbitrary query parameters directly to MongoDB or use an unbounded client-supplied limit. Validate pagination numbers and cap them.

## Consistency and evolution

Consistency helps clients predict behavior:

- Use the same naming style for fields, paths, and response envelopes.
- Use the same success and error conventions across endpoints.
- Keep identifiers and timestamp formats stable.
- Document defaults and null or missing-field behavior.
- Avoid exposing internal collection names or implementation-specific errors.

Treat an API contract as something clients depend on. Adding an optional response field is usually compatible, but renaming or removing a field, changing its type, or changing the meaning of a status can break clients. Prefer additive changes and use a deliberate versioning and deprecation policy for breaking changes. A version segment such as /api/v1 is one common policy, not a substitute for managing compatibility.

## Authorization belongs to each operation

A resource URL does not grant permission. For every request, check:

- Whether the caller is authenticated when authentication is required.
- Whether the caller may perform this operation.
- Whether the caller may access this specific record.
- Whether the request is allowed to change each submitted field.
- Whether the response includes only data the caller may read.

A guessed or leaked identifier is not authorization. Enforce access on the server even if the user interface hides buttons or routes.

## Design checklist

Before implementing an endpoint, write down:

1. The resource and its stable public identifier.
2. The collection and item URLs.
3. The supported HTTP methods and their effects.
4. The accepted request fields and server-controlled fields.
5. Validation, authentication, and authorization rules.
6. Success status codes, response headers, and representations.
7. Error statuses and the common error shape.
8. Filtering, sorting, pagination, and maximum limits.
9. Compatibility expectations and how breaking changes will be handled.

A clear contract makes later Express routes, validation, controllers, and database queries easier to implement and review.

## Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [035 - MongoDB security, backup, and restore](035-mongodb-security-backup-and-restore.md) | [Q&A](../qnas/036-rest-api-design-and-resource-modeling.md) | [Example](../examples/036-rest-api-design-and-resource-modeling.md) | [037 - Create an Express app and server](037-create-an-express-app-and-server.md) |
