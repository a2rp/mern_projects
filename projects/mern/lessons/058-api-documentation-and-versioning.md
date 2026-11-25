# 058 - API documentation and versioning

An API is a contract between a server and its clients. The contract describes which requests a client may send, what those requests mean, which responses can come back, and how changes will be handled over time. Clear documentation helps people use the API correctly; a versioning policy gives deployed clients a predictable way to evolve with it.

This chapter uses an Express and MongoDB API as its setting. The same contract principles apply whether clients are a React app, a mobile app, another service, or an external developer.

## Learning goals

After this chapter, you should be able to:

- Describe an HTTP API with an OpenAPI document.
- Document operations, parameters, schemas, authentication, errors, and examples.
- Keep the documented contract aligned with actual Express behavior.
- Recognize backward-compatible and breaking API changes.
- Choose and document a versioning strategy.
- Deprecate an old contract in a way clients can act on.
- Check API descriptions as part of continuous integration.

## Document the contract clients need

A useful API description answers practical questions without requiring a client to inspect server source code:

- What is the endpoint, HTTP method, and purpose?
- Is authentication required, and what permission is needed?
- Which path, query, and header parameters are accepted? Which are required?
- What content types and request body shapes are supported?
- What does each success response contain?
- Which errors can occur, and what do their status codes mean?
- How do pagination, sorting, filtering, idempotency, and rate limits work?
- Which fields are optional, nullable, read-only, or write-only?
- Are there units, time zones, limits, or ordering rules a client must know?

Do not document only the happy path. A client needs to know how invalid input, missing authentication, missing resources, conflicts, rate limits, and unexpected server failures are represented. Keep examples synthetic and never include real access tokens, customer data, or credentials.

## OpenAPI as a machine-readable contract

The OpenAPI Specification is a language-independent format for describing HTTP APIs. An OpenAPI document can describe:

- `info`: the API's name and the version of the documented contract;
- `servers`: base URLs for development, staging, or production;
- `paths`: URL templates and HTTP operations;
- parameters and request bodies, including media types and schemas;
- responses by status code, with headers, content types, and schemas;
- reusable schemas and responses under `components`;
- authentication schemes and which operations require them;
- examples, tags, operation IDs, and deprecation status.

An OpenAPI description can feed a documentation UI, a client generator, a mock server, and contract checks. It is not the API implementation. A document that validates syntactically can still be inaccurate, insecure, or incomplete, so compare it with the running routes and intended behavior.

Use a stable `operationId` for each operation, such as `getProductById`; it helps generated clients expose predictable method names. Give schemas clear descriptions and examples. Mark required fields explicitly. Explain whether a field is omitted or set to `null`, since these have different meanings in JSON APIs.

Define authentication once as a reusable security scheme, then apply it at the API or operation level. Describe public exceptions explicitly. Never put a real API key, bearer token, internal hostname, or private deployment detail in the document. A security declaration documents an expectation; it does not configure Express authorization by itself.

## Keep examples and error shapes consistent

An example should match its schema and the actual API response. If a documented response says a price is an integer in cents, the server should not return a decimal amount in dollars. If the documented identifier is a string, clients should not have to guess whether it is a MongoDB object or an embedded document.

Define a consistent error format, for example:

~~~json
{
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "Product not found.",
    "requestId": "server-generated-id"
  }
}
~~~

The exact shape can vary, but use it consistently and avoid exposing stack traces, database details, secrets, or private records. Document which status codes can carry each error and which fields are stable for client decisions. Clients should branch on a documented code or status, not parse a human-readable sentence.

Document pagination explicitly. State whether a page uses a cursor or offset, how clients request the next page, the maximum page size, and what an empty page looks like. Document ordering and filtering rules so a client does not depend on accidental database behavior.

## Contract-first and code-first workflows

With a **contract-first** workflow, the team writes and reviews the OpenAPI description before implementing the endpoint. This makes the interface and examples available early and can support mock clients.

With a **code-first** workflow, tooling derives an API description from route definitions, schemas, or annotations. This can reduce repeated declarations, but the generated document still needs review and must describe behavior accurately.

Neither workflow removes the need to compare the contract with actual behavior. Choose one declared source of truth for each API surface; avoid manually editing generated output that will be overwritten. Treat intentional schema or response changes as reviewed interface changes, not incidental implementation details.

## Choose a versioning strategy deliberately

Common strategies include:

| Strategy | Example | Trade-off |
| --- | --- | --- |
| URI path | `/api/v1/products` | Visible, easy to route and cache; multiple paths may exist for the same resource. |
| Query parameter | `/api/products?api-version=1` | Easy to try, but can complicate cache keys and callers may omit it. |
| Request header or media type | A version header or versioned `Accept` value | Keeps the path stable but is less visible and needs client and proxy support. |

Choose one explicit strategy and use it consistently. URI versioning is often straightforward for public REST APIs and beginner projects. Header or media-type versioning can fit systems that already negotiate representations. The design should account for client tooling, caches, gateways, and how versions will be supported.

A path such as `/api/v1` identifies the major API contract a client uses. The OpenAPI `info.version` identifies the version of the description or contract revision. A package version for the server code is another thing again. Do not assume these numbers have identical meanings.

A version number does not itself make a change safe. Keep compatible behavior within a version and publish a new API version when an intentional change would break existing clients. Avoid sending a mobile application that is already deployed into an unexpected contract change just because the server was updated.

## Plan for compatibility

Changes that are often compatible include adding an optional response property that clients are expected to ignore, adding a new endpoint, or adding an optional query parameter with a safe default. Compatibility depends on how clients and validators behave; an exhaustive client switch over a field's possible values may break when a new enum value appears.

Changes that commonly break clients include:

- removing or renaming a field, endpoint, or enum value;
- changing a field's type, meaning, unit, or nullability;
- making an optional request field required;
- changing authentication requirements or permission semantics;
- changing response structure, status behavior, pagination order, or error codes;
- rejecting input that was previously valid without a migration path.

Review changes from the client's perspective. Do not expose Mongoose documents as the public response model; map database data to explicit API schemas. Internal storage can evolve independently when the external contract remains stable.

## Deprecate and retire versions responsibly

When an operation or version must be retired:

1. Mark it as deprecated in the OpenAPI description and communicate the replacement.
2. Provide a migration guide with concrete before-and-after requests and responses.
3. State the support window or retirement date and how clients can request help.
4. Measure usage by version or operation without collecting unnecessary personal data.
5. Notify affected consumers and give them time to migrate.
6. Remove the old route only after the published policy and product commitments allow it.

Deprecation is a communication and migration process; adding a label alone does not move a client. Keep one source of truth for the retirement timeline and make sure support, docs, and server behavior agree.

## Validate documentation in CI

Treat the API description like source code. A useful automated workflow can:

- parse and lint the OpenAPI document;
- validate examples against their schemas;
- check references and required operation fields;
- compare a proposed document with the previous released contract;
- require review when a change is breaking or deprecates an operation;
- publish the same reviewed document that describes the deployed API.

A linter catches structural issues and style rules, not all semantic mismatches. Add route or contract tests in the test chapter and keep the API document in the same review workflow as implementation changes. Use a lockfile and a pinned tool dependency in a real project rather than downloading an unreviewed “latest” tool during every build.

## Common mistakes

- Treating a Swagger UI page as a substitute for a machine-readable OpenAPI contract.
- Documenting only successful responses and leaving clients to guess error formats.
- Using examples that do not match the schemas or live response.
- Putting a real token or private deployment URL in the document.
- Assuming an OpenAPI security declaration enforces authentication in Express.
- Mixing API path versions with OpenAPI `info.version` or server package versions.
- Changing an endpoint's meaning without changing its version or migration plan.
- Assuming every additive field is safe for every client.
- Exposing MongoDB documents directly as stable public response schemas.
- Marking an old API deprecated without communicating a timeline or replacement.
- Generating documentation in CI without checking that it matches actual behavior.
- Using unpinned tooling and mutable dependencies in automated builds.

## API contract review checklist

Before publishing a new or changed API, confirm that:

- Every operation has a purpose, stable operation ID, parameters, schemas, examples, and response codes.
- Authentication and authorization requirements are described per operation.
- Error formats, pagination, units, nullability, and limits are explicit.
- The public schema is independent of internal MongoDB storage details.
- The API versioning approach is clear and breaking-change rules are documented.
- Deprecations include a replacement, migration guidance, and support timeline.
- The OpenAPI description is linted and reviewed with the implementation.
- Examples contain synthetic data and no secrets.

## Summary

Document the HTTP contract with explicit operations, schemas, examples, security requirements, and error responses. Keep the description aligned with Express behavior and make versioning decisions based on client compatibility. Prefer compatible additions, plan breaking changes and deprecations, and validate the contract in CI as part of every API change.

## Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [057 - Logging and request tracing](057-logging-and-request-tracing.md) | [Q&A](../qnas/058-api-documentation-and-versioning.md) | [Example](../examples/058-api-documentation-and-versioning.md) | [059 - Test Express routes and services](059-test-express-routes-and-services.md) |
