# 060 - Search, filtering, sorting, and pagination APIs: example

This example implements a versioned product-list endpoint with a bounded name-prefix search, allowlisted category and price filters, allowlisted sorting, offset pagination, tenant scoping from authenticated server state, and a mapped response shape.

The code is educational material and is not run. It uses CommonJS, Express, and Mongoose. Integrate it with the application's existing database connection, authentication middleware, logger, and model conventions. The search shown is a case-sensitive prefix search; choose another indexed or dedicated strategy if the product needs different semantics.

## What the example demonstrates

- Parse query strings into validated options; never pass `req.query` directly to MongoDB.
- Reject unknown parameters, repeated scalar values, malformed numbers, and unsupported sort/filter values.
- Build filters with server-owned fields and operators.
- Apply tenant scope from the authenticated user.
- Use deterministic sorting with `_id` as the tie-breaker.
- Bound page size and deep offsets, and return public fields only.
- Compare offset pagination with a cursor query for large feeds.

## Dependencies and file layout

Use the application's existing package manifest and lockfile. If needed, install Express and Mongoose in the application project:

~~~sh
npm install express mongoose
~~~

~~~text
project/
├── app.js
├── models/product.js
├── routes/products.js
├── services/product-list-service.js
└── utils/
    ├── api-error.js
    └── parse-product-list-query.js
~~~

The existing server startup should connect to MongoDB, compose the real dependencies, and start listening. These modules should not open a connection or bind a port as an import side effect.

## Define safe API errors

~~~js
// utils/api-error.js
class ApiError extends Error {
    constructor(status, code, message) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.code = code;
    }
}

module.exports = { ApiError };
~~~

## Parse and validate client parameters

This parser accepts only known keys and scalar strings. Exact limits and categories are application decisions; keep them aligned with the API contract and database schema.

~~~js
// utils/parse-product-list-query.js
const { ApiError } = require("./api-error");

const ALLOWED_QUERY_KEYS = new Set([
    "q", "category", "minPriceCents", "maxPriceCents",
    "sort", "order", "page", "limit"
]);

const ALLOWED_CATEGORIES = new Set([
    "accessories", "computers", "displays"
]);

const SORT_FIELDS = {
    newest: "createdAt",
    price: "priceCents",
    name: "name"
};

const DEFAULT_ORDER = {
    newest: "desc",
    price: "asc",
    name: "asc"
};

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const MAX_OFFSET = 10000;
const MAX_SEARCH_LENGTH = 80;
const MAX_PRICE_CENTS = 100000000;

function readScalar(query, key) {
    const value = query[key];

    if (value === undefined) return undefined;

    if (typeof value !== "string") {
        throw new ApiError(
            400,
            "INVALID_QUERY_PARAMETER",
            `"${key}" must be supplied once as a scalar value.`
        );
    }

    return value;
}

function parseInteger(value, key, min, max) {
    if (!/^(0|[1-9]\d*)$/.test(value)) {
        throw new ApiError(
            400,
            "INVALID_QUERY_PARAMETER",
            `"${key}" must be a whole number between ${min} and ${max}.`
        );
    }

    const parsed = Number(value);

    if (!Number.isSafeInteger(parsed) || parsed < min || parsed > max) {
        throw new ApiError(
            400,
            "INVALID_QUERY_PARAMETER",
            `"${key}" must be a whole number between ${min} and ${max}.`
        );
    }

    return parsed;
}

function parseProductListQuery(query) {
    for (const key of Object.keys(query)) {
        if (!ALLOWED_QUERY_KEYS.has(key)) {
            throw new ApiError(
                400,
                "UNKNOWN_QUERY_PARAMETER",
                `"${key}" is not a supported query parameter.`
            );
        }
    }

    const rawQ = readScalar(query, "q");
    const q = rawQ === undefined ? undefined : rawQ.trim();

    if (q !== undefined && (q.length === 0 || q.length > MAX_SEARCH_LENGTH)) {
        throw new ApiError(
            400,
            "INVALID_SEARCH_TERM",
            `"q" must contain between 1 and ${MAX_SEARCH_LENGTH} characters.`
        );
    }

    const category = readScalar(query, "category");

    if (category !== undefined && !ALLOWED_CATEGORIES.has(category)) {
        throw new ApiError(
            400,
            "INVALID_CATEGORY",
            "The requested category is not supported."
        );
    }

    const rawMin = readScalar(query, "minPriceCents");
    const rawMax = readScalar(query, "maxPriceCents");
    const minPriceCents = rawMin === undefined
        ? undefined
        : parseInteger(rawMin, "minPriceCents", 0, MAX_PRICE_CENTS);
    const maxPriceCents = rawMax === undefined
        ? undefined
        : parseInteger(rawMax, "maxPriceCents", 0, MAX_PRICE_CENTS);

    if (
        minPriceCents !== undefined &&
        maxPriceCents !== undefined &&
        minPriceCents > maxPriceCents
    ) {
        throw new ApiError(
            400,
            "INVALID_PRICE_RANGE",
            '"minPriceCents" cannot be greater than "maxPriceCents".'
        );
    }

    const sort = readScalar(query, "sort") ?? "newest";

    if (!Object.hasOwn(SORT_FIELDS, sort)) {
        throw new ApiError(
            400,
            "INVALID_SORT",
            '"sort" must be one of: newest, price, name.'
        );
    }

    const order = readScalar(query, "order") ?? DEFAULT_ORDER[sort];

    if (order !== "asc" && order !== "desc") {
        throw new ApiError(
            400,
            "INVALID_SORT_ORDER",
            '"order" must be "asc" or "desc".'
        );
    }

    const rawPage = readScalar(query, "page");
    const page = rawPage === undefined
        ? DEFAULT_PAGE
        : parseInteger(rawPage, "page", 1, 100000000);
    const rawLimit = readScalar(query, "limit");
    const limit = rawLimit === undefined
        ? DEFAULT_LIMIT
        : parseInteger(rawLimit, "limit", 1, MAX_LIMIT);
    const skip = (page - 1) * limit;

    if (!Number.isSafeInteger(skip) || skip > MAX_OFFSET) {
        throw new ApiError(
            400,
            "OFFSET_TOO_DEEP",
            "This page is too deep for offset pagination; continue with a cursor."
        );
    }

    return {
        q,
        category,
        minPriceCents,
        maxPriceCents,
        sort,
        order,
        page,
        limit,
        skip
    };
}

module.exports = { parseProductListQuery, SORT_FIELDS };
~~~

Arrays and objects are rejected by `readScalar()`. Thus duplicate values such as `?limit=10&limit=20` do not silently choose one value, regardless of the query parser's array representation.

## Define the model

~~~js
// models/product.js
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
    {
        tenantId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 160
        },
        category: {
            type: String,
            required: true,
            enum: ["accessories", "computers", "displays"]
        },
        priceCents: {
            type: Number,
            required: true,
            min: 0,
            validate: Number.isSafeInteger
        },
        currency: {
            type: String,
            required: true,
            uppercase: true,
            minlength: 3,
            maxlength: 3
        },
        status: {
            type: String,
            enum: ["active", "archived"],
            default: "active"
        }
    },
    { timestamps: true }
);

// Examples only. Measure the real filter/sort combinations before adding indexes.
productSchema.index({ tenantId: 1, createdAt: -1, _id: -1 });
productSchema.index({ tenantId: 1, priceCents: 1, _id: 1 });
productSchema.index({ tenantId: 1, name: 1, _id: 1 });

module.exports = mongoose.model("Product", productSchema);
~~~

Indexes improve selected read patterns but add storage and write work. These examples do not optimize every combination of optional category, range, search, and sort filters. Use realistic data and query plans before deciding which indexes to keep.

## Build filters and the list service

The search is an escaped, case-sensitive prefix. It does not accept arbitrary client regex syntax. Case-insensitive search, ranking, tokenization, and typo tolerance need a deliberately chosen search mechanism.

~~~js
// services/product-list-service.js
const { SORT_FIELDS } = require("../utils/parse-product-list-query");

function escapeRegex(value) {
    return value
        .replace(/[.*+?^$()|[\]\\]/g, "\\$&")
        .replace(/[{}]/g, "\\$&");
}

function buildProductFilter(options, { tenantId }) {
    const filter = { tenantId, status: "active" };

    if (options.category !== undefined) {
        filter.category = options.category;
    }

    if (
        options.minPriceCents !== undefined ||
        options.maxPriceCents !== undefined
    ) {
        filter.priceCents = {};

        if (options.minPriceCents !== undefined) {
            filter.priceCents.$gte = options.minPriceCents;
        }

        if (options.maxPriceCents !== undefined) {
            filter.priceCents.$lte = options.maxPriceCents;
        }
    }

    if (options.q !== undefined) {
        filter.name = {
            $regex: `^${escapeRegex(options.q)}`
        };
    }

    return filter;
}

function toPublicProduct(record) {
    return {
        id: String(record._id),
        name: record.name,
        category: record.category,
        priceCents: record.priceCents,
        currency: record.currency,
        createdAt: record.createdAt
    };
}

function createProductListService({ Product }) {
    return {
        async list(options, { tenantId }) {
            const filter = buildProductFilter(options, { tenantId });
            const direction = options.order === "asc" ? 1 : -1;
            const field = SORT_FIELDS[options.sort];
            const sort = {
                [field]: direction,
                _id: direction
            };

            const [records, totalItems] = await Promise.all([
                Product.find(filter)
                    .select("name category priceCents currency createdAt")
                    .sort(sort)
                    .skip(options.skip)
                    .limit(options.limit)
                    .lean()
                    .exec(),
                Product.countDocuments(filter).exec()
            ]);

            const totalPages = Math.ceil(totalItems / options.limit);

            return {
                items: records.map(toPublicProduct),
                pagination: {
                    page: options.page,
                    limit: options.limit,
                    totalItems,
                    totalPages,
                    hasPreviousPage: options.page > 1,
                    hasNextPage: options.page < totalPages
                }
            };
        }
    };
}

module.exports = { createProductListService, buildProductFilter };
~~~

The client supplies values; application code supplies field names and MongoDB operators. The authenticated tenant and active-status rule are always added by the server. They cannot be removed by changing a query string.

The `find()` and `countDocuments()` operations are separate. Concurrent writes can make them observe slightly different states. If a total is not needed by the interface, omit the count and return a next-page indicator instead.

## Add the route and error handling

Authentication is part of the route chain. The route parses input before it calls the service and obtains tenant scope from the authenticated user.

~~~js
// routes/products.js
const express = require("express");
const { ApiError } = require("../utils/api-error");
const { parseProductListQuery } = require("../utils/parse-product-list-query");

function createProductsRouter({ productListService, requireAuth }) {
    const router = express.Router();

    router.get("/", requireAuth, async (req, res, next) => {
        try {
            const options = parseProductListQuery(req.query);
            const tenantId = req.user && req.user.tenantId;

            if (!tenantId) {
                throw new ApiError(
                    403,
                    "TENANT_CONTEXT_REQUIRED",
                    "The authenticated account has no tenant access."
                );
            }

            const result = await productListService.list(options, { tenantId });

            return res.status(200).json({
                data: result.items,
                pagination: result.pagination
            });
        } catch (error) {
            return next(error);
        }
    });

    return router;
}

module.exports = { createProductsRouter };
~~~

~~~js
// app.js
const express = require("express");
const { ApiError } = require("./utils/api-error");
const { createProductsRouter } = require("./routes/products");

function createApp({ productListService, requireAuth, logger }) {
    const app = express();

    app.use(express.json({ limit: "20kb" }));
    app.use(
        "/api/v1/products",
        createProductsRouter({ productListService, requireAuth })
    );

    app.use((req, res) => {
        return res.status(404).json({
            error: {
                code: "ROUTE_NOT_FOUND",
                message: "The requested route was not found."
            }
        });
    });

    app.use((error, req, res, next) => {
        if (res.headersSent) return next(error);

        if (error instanceof ApiError) {
            return res.status(error.status).json({
                error: {
                    code: error.code,
                    message: error.message
                }
            });
        }

        // Record internal details only in protected server-side logs.
        logger.error({ err: error, requestId: req.id }, "Product list request failed");

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

The existing server entry point should connect to MongoDB, create the list service with the real `Product` model, supply auth middleware and a logger, and start listening. Keep those startup side effects out of the app factory.

## Example requests and output

Default request:

~~~http
GET /api/v1/products
~~~

A successful response contains the first 20 active products for the authenticated tenant, newest first:

~~~json
{
  "data": [
    {
      "id": "507f1f77bcf86cd799439011",
      "name": "Keyboard",
      "category": "accessories",
      "priceCents": 2499,
      "currency": "USD",
      "createdAt": "2026-11-22T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalItems": 1,
    "totalPages": 1,
    "hasPreviousPage": false,
    "hasNextPage": false
  }
}
~~~

Filtered, sorted, second page:

~~~http
GET /api/v1/products?q=key&category=accessories&minPriceCents=500&maxPriceCents=5000&sort=price&order=asc&page=2&limit=20
~~~

This means: match active products for the authenticated tenant whose names start with `key`, whose category is `accessories`, and whose price is between 500 and 5000 cents inclusive. Sort by price and then `_id`, both ascending, skip the first 20 matches, and return up to 20.

Invalid range:

~~~http
GET /api/v1/products?minPriceCents=5000&maxPriceCents=500
~~~

~~~http
HTTP/1.1 400 Bad Request
Content-Type: application/json
~~~

~~~json
{
  "error": {
    "code": "INVALID_PRICE_RANGE",
    "message": "\"minPriceCents\" cannot be greater than \"maxPriceCents\"."
  }
}
~~~

Unknown keys, duplicate scalar keys, malformed integers, unsupported categories, invalid sort values, excessive limits, and deep offsets also receive a safe 400 response. Authentication failures are handled before the service is called.

## Use cursor pagination for a large sequential feed

The example endpoint uses offset pagination because numbered pages can be useful for a catalog. For a large feed, a cursor based on the last item's complete sort boundary avoids repeatedly skipping earlier matches.

For descending `createdAt` and `_id`, the next-page filter is:

~~~js
function buildNextPageFilter(tenantId, cursor) {
    const filter = { tenantId, status: "active" };

    if (!cursor) return filter;

    return {
        ...filter,
        $or: [
            { createdAt: { $lt: cursor.createdAt } },
            {
                createdAt: cursor.createdAt,
                _id: { $lt: cursor.id }
            }
        ]
    };
}

const rows = await Product.find(buildNextPageFilter(tenantId, cursor))
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit + 1)
    .select("name category priceCents currency createdAt")
    .lean()
    .exec();

const hasNextPage = rows.length > limit;
const items = hasNextPage ? rows.slice(0, limit) : rows;
const lastItem = items.at(-1);
~~~

Return a cursor built from `lastItem`, not the extra row. Validate decoded cursor fields and bind the cursor to the relevant filters and sort. Sign it if tampering must be detected; base64 encoding is not encryption. Never trust cursor-provided tenant or authorization values.

## Operational notes

- Test parser boundaries and route behavior; use an isolated database for important query-plan checks.
- Measure filter-and-sort patterns before adding compound indexes.
- Use a maximum limit, bounded offset, request rate limits, and query time bounds where appropriate.
- Omit an exact total if the client only needs to know whether another cursor page exists.
- Log slow-query details safely on the server, never in client responses.

## Expected behavior

- Defaults return active products for the authenticated tenant, newest first.
- Supported category, price, and prefix parameters narrow those results.
- Sort options are allowlisted and use `_id` as a deterministic tie-breaker.
- Limits are capped and overly deep offsets are rejected.
- Invalid, duplicate, unknown, or contradictory query parameters return a safe 400 response.
- The response exposes only public product fields and documented pagination metadata.
- Cursor pagination, when used, carries a validated sort boundary and retains server-side authorization scope.

## Chapter navigation

| Previous chapter | Chapter Q&A | Next chapter |
| --- | --- | --- |
| [059 - Test Express routes and services](../lessons/059-test-express-routes-and-services.md) | [Q&A](../qnas/060-search-filtering-sorting-and-pagination-apis.md) | [061 - React mental model and declarative UI](../lessons/061-react-mental-model-and-declarative-ui.md) |
