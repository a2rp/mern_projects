# 059 - Test Express routes and services

Reliable backend tests check observable behavior at useful boundaries. A service test can verify business rules without starting Express or connecting to MongoDB. A route test can send an HTTP request through the real Express middleware stack while replacing the service with a controlled fake. A smaller number of integration tests can verify that the real repository and database work together.

This chapter focuses on tests that are fast, repeatable, isolated, and clear about the behavior they protect.

## Learning goals

By the end of this chapter, you should be able to:

- Choose between unit, route, integration, and end-to-end tests.
- Structure an Express application so importing it does not start a network listener.
- Inject a service or repository dependency instead of coupling every test to MongoDB.
- Test status codes, response bodies, validation, authentication, and error handling.
- Keep database integration tests isolated from development and production data.
- Run Node.js tests locally and in continuous integration.

## Test the behavior clients and maintainers depend on

A test is useful when it protects a contract or rule that could otherwise regress. For an API, that usually means checking the HTTP status, stable response shape, headers when important, and whether the requested behavior occurred.

A route test should not need to know which private helper the route calls or how many times an internal function is invoked. Those details may change without changing the API. Test them only when the call itself is a meaningful boundary, such as ensuring invalid input never reaches a service.

## Choose the right test level

### Unit tests

Unit tests exercise one small unit such as a service function. Replace collaborators such as repositories with simple fakes so the test can focus on business rules.

Good candidates include:

- Mapping a database record into a public response object.
- Applying a domain rule before saving.
- Returning a not-found result when a repository lookup returns no record.
- Rejecting an invalid state transition.

A unit test should not need an HTTP server, network connection, or database.

### Route tests

Route tests exercise the Express request pipeline from URL and middleware through the response. They are often called API or integration tests even when the database service is replaced with a fake.

They can verify:

- Route matching and parameter validation.
- Authentication and authorization middleware.
- Status codes and response JSON.
- Middleware order and error handling.
- That malformed input does not call downstream business logic.

A request-testing library can send requests directly to an Express application. The test does not need to choose a TCP port or call `listen()`.

### Database integration tests

Database integration tests use the real repository and a real database service. They verify queries, schema behavior, indexes, and persistence details that a fake cannot prove.

Give each run a dedicated test database or isolated namespace. Use known fixtures, clean up records created by a test, and never point test configuration at production. Keep these tests fewer and more deliberate than fast unit and route tests.

### End-to-end tests

End-to-end tests exercise a deployed-like system across multiple components, often including a browser or a separately running client. They are valuable for a few critical user journeys, but slower and more operationally complex. They do not replace focused service and route tests.

## Separate app construction from starting the server

Keep application construction in a module that exports an app factory. Start listening only in the process entry point.

```js
// create-app.js
const express = require("express");

function createApp({ productService, requireAuth }) {
    const app = express();

    app.use(express.json({ limit: "20kb" }));

    app.get(
        "/api/v1/products/:id",
        requireAuth,
        async (req, res, next) => {
            try {
                if (!/^[a-f0-9]{24}$/i.test(req.params.id)) {
                    return res.status(400).json({
                        error: {
                            code: "INVALID_PRODUCT_ID",
                            message: "Product ID must be a 24-character hexadecimal ID."
                        }
                    });
                }

                const product = await productService.getById(req.params.id);

                if (!product) {
                    return res.status(404).json({
                        error: {
                            code: "PRODUCT_NOT_FOUND",
                            message: "Product not found."
                        }
                    });
                }

                return res.status(200).json({ data: product });
            } catch (error) {
                return next(error);
            }
        }
    );

    app.use((error, req, res, next) => {
        if (res.headersSent) {
            return next(error);
        }

        // Use the application's logger for the internal error.
        // Do not expose stack traces, database messages, or secrets to clients.
        return res.status(500).json({
            error: {
                code: "INTERNAL_SERVER_ERROR",
                message: "An unexpected error occurred."
            }
        });
    });

    return app;
}

module.exports = { createApp };
```

The process entry point supplies real dependencies and owns the listener:

```js
// server.js
const { createApp } = require("./create-app");
const { productService } = require("./services");

const app = createApp({
    productService,
    requireAuth
});

const port = Number(process.env.PORT) || 3000;

app.listen(port, () => {
    console.log(`API listening on port ${port}`);
});
```

The test imports `createApp`, not `server.js`. Importing the test subject therefore does not bind a port or open a real database connection. In a real project, `requireAuth` is the production authentication middleware; tests can inject a controlled alternative to exercise the unauthorized path.

The route above uses `try/catch` and `next(error)` so rejected asynchronous work reaches the final error middleware. Express 5 forwards rejected promises from async handlers automatically. The explicit pattern also works in Express 4. If a project uses a shared async-handler wrapper, test routes through that same wrapper.

## Inject collaborators at meaningful boundaries

A service can depend on a repository interface without knowing how the database connection was configured:

```js
// services/create-product-service.js
function createProductService({ productRepository }) {
    return {
        async getById(id) {
            const record = await productRepository.findById(id);

            if (!record) {
                return null;
            }

            // Return the public service shape, not a raw Mongoose document.
            return {
                id: String(record._id),
                name: record.name,
                priceCents: record.priceCents,
                currency: record.currency
            };
        }
    };
}

module.exports = { createProductService };
```

A unit test can pass a fake repository that returns a plain object. A route test can pass a fake service with predictable results. This makes tests independent of network timing and database state while keeping the production route and service code under test.

Use a fake for a small, explicit interface. Avoid building a complicated mock framework that imitates all of Mongoose. When persistence behavior matters, use a real isolated test database in a separate integration test.

## Assert public outcomes

For a route, assert only the contract relevant to the case:

- A successful lookup returns `200` and the documented JSON shape.
- A malformed identifier returns `400` and does not call the service.
- A valid but unknown identifier returns `404`.
- An unauthenticated request returns `401` (or the status your API contract defines).
- An unexpected service failure returns a safe `500` response without internal error details.

Prefer a few focused tests with descriptive names. A test failure should make it clear which user-visible behavior broke.

## Keep test data isolated and predictable

Tests should not depend on execution order or on records left behind by earlier runs.

- Build the minimum fixture each test needs.
- Use stable IDs and values when the assertion depends on them.
- Do not use real credentials, customer data, or production URLs.
- Avoid shared mutable fixtures across concurrently running tests.
- If a test creates database records, remove only the records it created.
- Use a dedicated test database configured explicitly for the test process.
- Restore environment variables, timers, spies, and mock state after use.
- Keep time-dependent behavior deterministic by injecting a clock where that boundary is part of the design.

If a test can run against a fake repository, do not connect to MongoDB just to test a route response.

## Test validation and failures at the right boundary

Validation belongs near the boundary that has enough context to explain the problem:

- Request-shape validation should produce a client error before business logic runs.
- Domain rules should be enforced in the service so another route or job cannot bypass them.
- Persistence constraints should also be represented by the database schema where appropriate.
- A duplicate-key or validation failure from MongoDB should be translated into a stable public response rather than leaking driver details.

Test the translation from known failures to public status codes. Keep stack traces and raw exception messages in protected server-side logs, not in response JSON.

## Use the built-in Node.js test runner

Node.js includes a test runner and assertion library. A project can use them without adding a separate runner dependency:

```sh
node --test
```

The test runner discovers supported test files and reports failures with a nonzero exit status. A project may narrow discovery or define an npm script such as `"test": "node --test"` in its own package manifest. Do not add a package manifest just for a notes example; follow the actual application setup.

A request-testing package such as Supertest is an additional development dependency for HTTP-level tests. It can exercise an Express app without the test opening its own fixed port. See the accompanying example for a complete small test suite.

## Keep continuous integration safe

A useful CI test job should:

1. Install the lockfile-pinned dependencies.
2. Set a test-only environment and database URL if integration tests need one.
3. Run unit and route tests on every change.
4. Run database integration tests only when their isolated service is available.
5. Fail the job when a test fails; do not hide failures with a successful shell fallback.
6. Avoid printing secrets or connecting to production services.

Coverage reports can show which code was not exercised, but a high percentage does not prove that assertions protect meaningful behavior. Review tests for valuable cases and clear expectations.

## Common testing mistakes

- Importing a module that starts the server or database connection as a side effect.
- Testing route logic only by calling internal functions and never checking the HTTP response.
- Using the real development or production database in an automated test.
- Asserting exact stack traces, timestamps, or unrelated fields that change frequently.
- Mocking framework internals instead of injecting an application-owned service or repository.
- Returning a generic success response in a test even when the real API has a different contract.
- Leaving listeners, database connections, timers, or test records open after completion.
- Treating code coverage as a substitute for useful assertions.
- Returning internal exceptions to clients to make a failing test easier to diagnose.

## Review checklist

Before merging backend tests, confirm:

- [ ] The test describes a user-visible behavior or a meaningful module boundary.
- [ ] The app factory can be imported without opening a listener.
- [ ] Route tests assert status and response shape.
- [ ] Invalid input is rejected before reaching the service.
- [ ] Authentication and authorization outcomes are covered.
- [ ] Expected service and persistence failures map to the public error contract.
- [ ] Database integration tests use an isolated test database.
- [ ] Test data, environment changes, and resources are cleaned up.
- [ ] No secrets, personal data, or production URLs appear in fixtures or output.
- [ ] The same test command is used locally and in CI.

## Summary

Keep application construction separate from startup, inject collaborators at clear boundaries, and test the behavior that clients and maintainers rely on. Use fast unit and route tests for most cases, then isolated database and end-to-end tests where real integration behavior matters. Make failures safe for clients, descriptive for maintainers, and repeatable across local runs and CI.

## Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [058 - API documentation and versioning](058-api-documentation-and-versioning.md) | [Q&A](../qnas/059-test-express-routes-and-services.md) | [Example](../examples/059-test-express-routes-and-services.md) | [060 - Search, filtering, sorting, and pagination APIs](060-search-filtering-sorting-and-pagination-apis.md) |
