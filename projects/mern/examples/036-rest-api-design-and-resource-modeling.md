# 036 - REST API design and resource modeling â€” complete example

This worked example designs a small projects API before its Express implementation. It defines resource URLs, fields, methods, permissions, status codes, and example HTTP exchanges. The exchanges describe the expected contract; this repository does not run them.

## Question

How should a browser create, find, update, list, and delete projects through a predictable API without depending on MongoDB's internal document shape?

## What this example demonstrates

- Modeling a Project as a public API resource.
- Defining collection, item, and related-task URLs.
- Using HTTP methods for their intended effects.
- Separating client-editable fields from server-controlled fields.
- Returning consistent status codes, headers, representations, and errors.
- Adding validated filters, sorting, and pagination to a collection request.
- Scoping operations to the authenticated owner.

## Requirements and assumptions

- The API is served beneath /api/v1.
- The examples use JSON request and response bodies.
- Project routes require an authenticated user.
- Each user can read and change only projects they own.
- The server gets the owner identity from the authenticated session or token. The client cannot choose it in a request body. Unknown request fields are rejected.
- The API returns public IDs such as prj_7f3a. MongoDB may use ObjectId internally.
- Project names contain 1â€“120 characters. Descriptions are optional and have a maximum of 2,000 characters.
- The server controls id, createdAt, and updatedAt.
- A successful DELETE makes the project unavailable through ordinary project routes. Whether storage uses a soft delete or physical delete is an internal implementation choice.

## Resource representation

A single project response has this public shape:

~~~json
{
  "id": "prj_7f3a",
  "name": "Website redesign",
  "description": "Refresh the public product site.",
  "status": "active",
  "createdAt": "2026-11-22T10:15:00.000Z",
  "updatedAt": "2026-11-22T10:15:00.000Z"
}
~~~

The client may submit name and description when creating a project. It may update name, description, or status when the operation is permitted. The server assigns the ID, owner, and timestamps. Only documented status values are accepted: draft, active, and archived.

## Endpoint contract

| Method | URL | Purpose | Success response |
| --- | --- | --- | --- |
| GET | /api/v1/projects | List the authenticated user's projects | 200 with a collection and pagination metadata |
| POST | /api/v1/projects | Create a project for the authenticated user | 201 with the project and a Location header |
| GET | /api/v1/projects/:projectId | Read one owned project | 200 with the project |
| PATCH | /api/v1/projects/:projectId | Change allowed fields on one owned project | 200 with the updated project |
| DELETE | /api/v1/projects/:projectId | Remove one owned project from normal access | 204 with no body |
| GET | /api/v1/projects/:projectId/tasks | List tasks belonging to one owned project | 200 with the task collection |

A project can also be identified directly by its item URL. The nested tasks route expresses the parent relationship and should first verify that the caller can access that project. If tasks need to be addressed independently, a separate top-level task route can be added when the client use case requires it.

## Example 1: List a filtered page

Request:

~~~http
GET /api/v1/projects?status=active&page=1&limit=2&sort=-updatedAt HTTP/1.1
Host: api.example.test
Accept: application/json
Authorization: Bearer <access-token>
~~~

Expected response:

~~~http
HTTP/1.1 200 OK
Content-Type: application/json
~~~

~~~json
{
  "data": [
    {
      "id": "prj_7f3a",
      "name": "Website redesign",
      "description": "Refresh the public product site.",
      "status": "active",
      "createdAt": "2026-11-20T09:00:00.000Z",
      "updatedAt": "2026-11-22T10:15:00.000Z"
    },
    {
      "id": "prj_91bc",
      "name": "Customer portal",
      "description": "Improve account self-service.",
      "status": "active",
      "createdAt": "2026-11-19T14:30:00.000Z",
      "updatedAt": "2026-11-21T16:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 2,
    "totalItems": 3,
    "totalPages": 2,
    "hasNextPage": true
  }
}
~~~

This API defines page as one-based, defaults to page 1 and limit 20, and caps limit at 100. It accepts only documented status values and sort fields. The server scopes the query to the authenticated owner before applying filters. It does not copy arbitrary query parameters into a MongoDB filter.

## Example 2: Create a project

Request:

~~~http
POST /api/v1/projects HTTP/1.1
Host: api.example.test
Accept: application/json
Content-Type: application/json
Authorization: Bearer <access-token>

{
  "name": "Accessibility review",
  "description": "Track keyboard and screen-reader improvements."
}
~~~

Expected response:

~~~http
HTTP/1.1 201 Created
Content-Type: application/json
Location: /api/v1/projects/prj_a420
~~~

~~~json
{
  "id": "prj_a420",
  "name": "Accessibility review",
  "description": "Track keyboard and screen-reader improvements.",
  "status": "draft",
  "createdAt": "2026-11-22T11:30:00.000Z",
  "updatedAt": "2026-11-22T11:30:00.000Z"
}
~~~

The server validates the request, associates the authenticated owner, assigns an ID and timestamps, and applies the documented default status. If the body includes ownerId or another undocumented field, the API rejects the request with a validation error; it never trusts the client to assign ownership.

## Example 3: Read one project

Request:

~~~http
GET /api/v1/projects/prj_7f3a HTTP/1.1
Host: api.example.test
Accept: application/json
Authorization: Bearer <access-token>
~~~

Expected response:

~~~http
HTTP/1.1 200 OK
Content-Type: application/json
~~~

~~~json
{
  "id": "prj_7f3a",
  "name": "Website redesign",
  "description": "Refresh the public product site.",
  "status": "active",
  "createdAt": "2026-11-20T09:00:00.000Z",
  "updatedAt": "2026-11-22T10:15:00.000Z"
}
~~~

A syntactically valid ID that does not identify an accessible project returns 404. This contract intentionally does not reveal whether a project owned by someone else exists.

## Example 4: Partially update a project

Request:

~~~http
PATCH /api/v1/projects/prj_7f3a HTTP/1.1
Host: api.example.test
Accept: application/json
Content-Type: application/json
Authorization: Bearer <access-token>

{
  "status": "archived"
}
~~~

Expected response:

~~~http
HTTP/1.1 200 OK
Content-Type: application/json
~~~

~~~json
{
  "id": "prj_7f3a",
  "name": "Website redesign",
  "description": "Refresh the public product site.",
  "status": "archived",
  "createdAt": "2026-11-20T09:00:00.000Z",
  "updatedAt": "2026-11-22T11:42:00.000Z"
}
~~~

Only the supplied, allowlisted status field changes. The name and description remain the same. The server updates updatedAt. A client-supplied id, owner, createdAt, MongoDB operator, or other undocumented property is not merged into the database record.

## Example 5: Delete a project

Request:

~~~http
DELETE /api/v1/projects/prj_7f3a HTTP/1.1
Host: api.example.test
Authorization: Bearer <access-token>
~~~

Expected response:

~~~http
HTTP/1.1 204 No Content
~~~

There is no response body. After deletion, an ordinary GET for that resource returns 404 under this contract. Repeating DELETE has the same intended end state, even if a repeat returns 404 because the project is already unavailable.

## Validation and error examples

An empty project name is syntactically valid JSON but violates the resource rules. This API uses 422 for semantic validation errors:

~~~http
HTTP/1.1 422 Unprocessable Content
Content-Type: application/json
~~~

~~~json
{
  "type": "validation_error",
  "title": "Request validation failed",
  "status": 422,
  "detail": "The project name must contain between 1 and 120 characters.",
  "instance": "/api/v1/projects"
}
~~~

Other documented outcomes include:

| Situation | Status | Notes |
| --- | --- | --- |
| Malformed JSON or invalid pagination syntax | 400 Bad Request | The request cannot be parsed or its syntax is invalid |
| Missing or invalid credentials | 401 Unauthorized | The client must authenticate |
| Authenticated caller lacks permission | 403 Forbidden | Use 404 instead when the policy hides resource existence |
| Valid ID with no accessible project | 404 Not Found | Do not disclose another owner's project |
| Duplicate project key or state conflict | 409 Conflict | Explain the conflict safely |
| Valid JSON with an invalid name, status, or field | 422 Unprocessable Content | Return a stable validation error |
| Unexpected internal failure | 500 Internal Server Error | Do not return stack traces or database details |

A malformed JSON body may be rejected by the JSON parser before a route handler runs. The API still defines a safe, consistent JSON error response for it.

## How the design maps to implementation

- The collection route reads validated query parameters and constructs an owner-scoped database query.
- The item route validates projectId, loads a project that belongs to the current user, and maps it to the public representation.
- Create and update operations copy only documented editable fields.
- The database model may store ownerId and _id even though neither appears in the public response.
- Error handling converts expected failures into documented status codes and safe JSON bodies.
- Express route handlers and MongoDB access are implementation details. Clients depend on the HTTP contract above.

## Expected behavior checklist

After implementing this contract in later chapters, confirm that:

- Listing returns only the authenticated user's projects.
- Filters and sorting accept only documented fields and values.
- Page size never exceeds the configured maximum.
- Create assigns owner, ID, timestamps, and default status on the server.
- Update changes only allowlisted fields.
- Reads and writes enforce per-record authorization.
- A successful creation returns 201, a resource location, and the representation.
- A successful empty deletion returns 204 with no body.
- Errors use the documented statuses and do not reveal internal exceptions.
- The public response never leaks database-only fields or private data.

## Chapter navigation

| Previous chapter | Chapter Q&A | Next chapter |
| --- | --- | --- |
| [035 - MongoDB security, backup, and restore](../lessons/035-mongodb-security-backup-and-restore.md) | [Q&A](../qnas/036-rest-api-design-and-resource-modeling.md) | [036 - REST API design and resource modeling](../lessons/036-rest-api-design-and-resource-modeling.md) |
