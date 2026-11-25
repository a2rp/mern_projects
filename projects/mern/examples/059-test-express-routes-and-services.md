# 059 - Test Express routes and services: example

This example builds a small Express app that can be tested without opening a fixed port or connecting to MongoDB. A service receives a repository, the app receives a service and authentication middleware, and Node's built-in test runner checks service and HTTP behavior.

The code is educational material and is not run. It uses CommonJS and the Node.js built-in `node:test` runner. Install Express in the application and Supertest as a development dependency, or adapt the snippets to the project's existing dependency versions and module format.

## What the example demonstrates

- Keep app construction separate from process startup.
- Inject a repository into a service and a service into the Express app.
- Unit-test service mapping with a small fake repository.
- Test HTTP status and response bodies through the real Express middleware stack.
- Check invalid IDs, not-found behavior, authentication, and unexpected errors.
- Avoid a live database for unit and route tests.

## Install the dependencies

In the application project, install Express if it is not already present and add Supertest for development:

~~~sh
npm install express
npm install --save-dev supertest
~~~

The test runner and assertion library come with Node.js. A project can expose the command through its package scripts:

~~~json
{
  "scripts": {
    "start": "node server.js",
    "test": "node --test"
  }
}
~~~

Merge these entries into the existing `package.json`; do not replace the project's other scripts or dependencies. Commit the lockfile changes with application code when installing dependencies in a real project.

## Suggested file layout

~~~text
project/
├── create-app.js
├── server.js
├── services/
│   └── create-product-service.js
└── test/
    └── products.test.js
~~~

## Create the service

The service depends on a small repository interface. It turns the persistence record into a plain public object instead of returning a Mongoose document directly.

~~~js
// services/create-product-service.js
function createProductService({ productRepository }) {
    if (!productRepository || typeof productRepository.findById !== "function") {
        throw new TypeError("productRepository.findById is required.");
    }

    return {
        async getById(id) {
            const record = await productRepository.findById(id);

            if (!record) {
                return null;
            }

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
~~~

In the real application, the repository can use a Mongoose model. For a service unit test, a plain fake object is enough because the test is about service behavior, not MongoDB query semantics.

## Build an app that accepts dependencies

The factory registers the JSON parser, route, and final error middleware. It does not call `listen()`, so a request test can import it safely.

~~~js
// create-app.js
const express = require("express");

function createApp({ productService, requireAuth }) {
    if (!productService || typeof productService.getById !== "function") {
        throw new TypeError("productService.getById is required.");
    }

    if (typeof requireAuth !== "function") {
        throw new TypeError("requireAuth middleware is required.");
    }

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

        // Send details to the application's protected logger in production.
        // Never expose the exception, stack, or database message to the client.
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
~~~

The explicit `try/catch` forwards rejected work to Express error middleware in both Express 4 and Express 5. Express 5 also forwards rejected promises returned by async handlers; keep error propagation consistent with the version and conventions used by the application.

The authentication dependency here is middleware, so production can pass its real authentication middleware and tests can pass a deterministic one. Authentication is still in the request path during route tests.

## Start the server only in the entry point

The process entry point wires production dependencies and opens the listener. Tests should import `create-app.js`, not this startup file.

~~~js
// server.js
const { createApp } = require("./create-app");
const { productService } = require("./services");
const { requireAuth } = require("./middleware/require-auth");

const app = createApp({ productService, requireAuth });
const port = Number(process.env.PORT) || 3000;

app.listen(port, () => {
    console.log(`API listening on port ${port}`);
});
~~~

Keep the database connection setup in the application's existing startup flow. Do not make test imports connect to MongoDB as a side effect.

## Write the service and route tests

This single test file demonstrates a unit boundary and an HTTP boundary. Every route test gets its own app and fake service.

~~~js
// test/products.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

const { createApp } = require("../create-app");
const { createProductService } = require("../services/create-product-service");

const productId = "507f1f77bcf86cd799439011";

const databaseRecord = {
    _id: productId,
    name: "Notebook",
    priceCents: 1299,
    currency: "USD",
    internalCostCents: 500
};

const publicProduct = {
    id: productId,
    name: "Notebook",
    priceCents: 1299,
    currency: "USD"
};

function allowAuth(req, res, next) {
    req.user = { id: "user-test-1" };
    return next();
}

function createTestApp(productService, requireAuth = allowAuth) {
    return createApp({ productService, requireAuth });
}

test("service maps a database record to the public product shape", async () => {
    const requestedIds = [];
    const service = createProductService({
        productRepository: {
            async findById(id) {
                requestedIds.push(id);
                return databaseRecord;
            }
        }
    });

    const result = await service.getById(productId);

    assert.deepEqual(result, publicProduct);
    assert.deepEqual(requestedIds, [productId]);
    assert.equal("internalCostCents" in result, false);
});

test("service returns null when the repository finds no product", async () => {
    const service = createProductService({
        productRepository: {
            async findById() {
                return null;
            }
        }
    });

    assert.equal(await service.getById(productId), null);
});

test("GET product returns 200 and the public response shape", async () => {
    const productService = {
        async getById(id) {
            assert.equal(id, productId);
            return publicProduct;
        }
    };

    const response = await request(createTestApp(productService))
        .get(`/api/v1/products/${productId}`);

    assert.equal(response.status, 200);
    assert.deepEqual(response.body, { data: publicProduct });
});

test("GET product rejects a malformed ID before calling the service", async () => {
    let serviceCalls = 0;
    const productService = {
        async getById() {
            serviceCalls += 1;
            return publicProduct;
        }
    };

    const response = await request(createTestApp(productService))
        .get("/api/v1/products/not-an-object-id");

    assert.equal(response.status, 400);
    assert.equal(response.body.error.code, "INVALID_PRODUCT_ID");
    assert.equal(serviceCalls, 0);
});

test("GET product returns 404 when the service finds no product", async () => {
    const productService = {
        async getById() {
            return null;
        }
    };

    const response = await request(createTestApp(productService))
        .get(`/api/v1/products/${productId}`);

    assert.equal(response.status, 404);
    assert.equal(response.body.error.code, "PRODUCT_NOT_FOUND");
});

test("authentication middleware can reject a request before the service runs", async () => {
    let serviceCalls = 0;
    const productService = {
        async getById() {
            serviceCalls += 1;
            return publicProduct;
        }
    };

    function rejectAuth(req, res) {
        return res.status(401).json({
            error: {
                code: "UNAUTHENTICATED",
                message: "Authentication is required."
            }
        });
    }

    const response = await request(createTestApp(productService, rejectAuth))
        .get(`/api/v1/products/${productId}`);

    assert.equal(response.status, 401);
    assert.equal(response.body.error.code, "UNAUTHENTICATED");
    assert.equal(serviceCalls, 0);
});

test("unexpected service failures return a safe 500 response", async () => {
    const productService = {
        async getById() {
            throw new Error("private database connection detail");
        }
    };

    const response = await request(createTestApp(productService))
        .get(`/api/v1/products/${productId}`);

    assert.equal(response.status, 500);
    assert.deepEqual(response.body, {
        error: {
            code: "INTERNAL_SERVER_ERROR",
            message: "An unexpected error occurred."
        }
    });
    assert.equal(JSON.stringify(response.body).includes("private database"), false);
});
~~~

These tests check the public behavior and one meaningful boundary: invalid input or rejected authentication must not reach the service. The first test checks that the service does not accidentally expose an internal persistence field.

## Run the suite

From the application root, run:

~~~sh
npm test
~~~

Or invoke the built-in runner directly:

~~~sh
node --test
~~~

A successful run reports seven passing tests. The exact duration and formatting depend on the Node.js version and reporter. A failing assertion or rejected promise should produce a nonzero exit status so local scripts and CI can detect it.

## Add database integration tests only for database behavior

The example's fake repository does not validate Mongoose schemas or MongoDB query behavior. When that behavior needs coverage, create a separate integration test that:

1. Uses an explicitly configured test-only database.
2. Fails fast if the resolved database target is production or otherwise not allowed for tests.
3. Connects and prepares only the fixtures needed by the test.
4. Exercises the real repository and model.
5. Cleans up the test's own data and closes the database connection.
6. Never prints credentials or shares a database with unrelated test runs.

Keep unit and route tests independent of MongoDB so they remain fast and predictable.

## Expected behavior

- The service returns a plain public product object and omits internal persistence fields.
- A valid authenticated request returns status `200` and `{ "data": { ... } }`.
- A malformed identifier returns `400` without calling the service.
- A valid but missing product returns `404`.
- Rejected authentication returns `401` without calling the service.
- An unexpected service rejection returns a generic `500` body while diagnostic details remain server-side.

## Common mistakes to avoid

- Importing a server module that calls `listen()` in a test.
- Using a real MongoDB development or production connection for route tests.
- Returning raw Mongoose documents from service code.
- Testing only that a route handler was called, without asserting its HTTP response.
- Forgetting to assert that invalid input is rejected before business logic.
- Returning exception messages or stack traces to clients.
- Sharing mutable test state or relying on a test to run after another test.
- Adding test-only dependencies to production dependencies when they are only used during development.

## Chapter navigation

| Previous chapter | Chapter Q&A | Next chapter |
| --- | --- | --- |
| [058 - API documentation and versioning](../lessons/058-api-documentation-and-versioning.md) | [Q&A](../qnas/059-test-express-routes-and-services.md) | [060 - Search, filtering, sorting, and pagination APIs](../lessons/060-search-filtering-sorting-and-pagination-apis.md) |
