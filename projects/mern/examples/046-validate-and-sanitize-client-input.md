# Example 046: Validate and sanitize client input

This example builds a small Express 5 API that validates body, query, and path input before using it. It uses express-validator 7, extracts only validated data, rejects unknown request fields, and returns safe validation and parser errors. The code is provided for study and has not been run.

## What this example demonstrates

- Apply a JSON request-size limit before field validation.
- Reject compressed JSON bodies in this demo.
- Validate field types, ranges, formats, and allowed choices.
- Normalize a product name and tags by trimming outer whitespace.
- Convert validated numeric strings to numbers.
- Reject unknown request properties.
- Use matchedData() rather than passing req.body into persistence.
- Keep validation values and raw parser input out of error responses.
- Validate query strings and route parameters separately.

## Project setup

Create a new folder and install Express 5 and express-validator 7:

~~~powershell
mkdir validate-client-input-demo
cd validate-client-input-demo
npm init -y
npm install express@5 express-validator@7
~~~

Create app.js with this complete application:

~~~js
const express = require("express");
const {
    body,
    checkExact,
    matchedData,
    param,
    query,
    validationResult
} = require("express-validator");

const app = express();
const apiRouter = express.Router();
const port = 3000;

// This API does not need compressed request bodies. The body-size limit
// is applied before field validation and database or business work.
app.use(express.json({
    limit: "16kb",
    inflate: false
}));

class ApiError extends Error {
    constructor(status, code, message, fields) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.code = code;
        this.publicMessage = message;
        this.fields = fields;
    }
}

const categories = ["books", "office", "tools"];

const products = [
    {
        id: "1001",
        name: "Notebook",
        quantity: 2,
        category: "books",
        tags: ["paper", "school"]
    },
    {
        id: "1002",
        name: "Pen",
        quantity: 5,
        category: "office",
        tags: []
    }
];

let nextProductId = 1003;

const listProductRules = [
    query("page")
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage("Page must be a whole number from 1 to 100.")
        .bail()
        .toInt(),

    query("limit")
        .optional()
        .isInt({ min: 1, max: 20 })
        .withMessage("Limit must be a whole number from 1 to 20.")
        .bail()
        .toInt(),

    checkExact([], {
        locations: ["query"],
        message: "The query contains unsupported fields."
    })
];

apiRouter.get("/products", listProductRules, (req, res, next) => {
    const result = validationResult(req);

    if (!result.isEmpty()) {
        return next(createValidationError(result.array({ onlyFirstError: true })));
    }

    const input = matchedData(req, { locations: ["query"] });
    const page = input.page ?? 1;
    const limit = input.limit ?? 10;
    const start = (page - 1) * limit;

    return res.json({
        data: products.slice(start, start + limit),
        pagination: { page, limit }
    });
});

const productIdRules = [
    param("productId")
        .isInt({ min: 1 })
        .withMessage("Product ID must be a positive whole number.")
        .bail()
        .toInt(),

    checkExact([], {
        locations: ["params"],
        message: "The route contains unsupported parameters."
    })
];

apiRouter.get("/products/:productId", productIdRules, (req, res, next) => {
    const result = validationResult(req);

    if (!result.isEmpty()) {
        return next(createValidationError(result.array({ onlyFirstError: true })));
    }

    const input = matchedData(req, { locations: ["params"] });
    const product = products.find((item) => item.id === String(input.productId));

    if (!product) {
        return next(new ApiError(
            404,
            "PRODUCT_NOT_FOUND",
            "The requested product was not found."
        ));
    }

    return res.json({ data: product });
});

const createProductRules = [
    body("name")
        .isString()
        .withMessage("Name must be text.")
        .bail()
        .trim()
        .isLength({ min: 2, max: 80 })
        .withMessage("Name must contain 2 to 80 characters."),

    body("quantity")
        .isInt({ min: 1, max: 50 })
        .withMessage("Quantity must be a whole number from 1 to 50.")
        .bail()
        .toInt(),

    body("category")
        .isIn(categories)
        .withMessage("Choose a supported category."),

    body("tags")
        .optional()
        .isArray({ max: 5 })
        .withMessage("Tags must be an array with at most 5 items."),

    body("tags.*")
        .isString()
        .withMessage("Each tag must be text.")
        .bail()
        .trim()
        .isLength({ min: 1, max: 24 })
        .withMessage("Each tag must contain 1 to 24 characters."),

    checkExact([], {
        locations: ["body"],
        message: "The request contains fields this operation does not accept."
    })
];

apiRouter.post("/products", createProductRules, (req, res, next) => {
    const result = validationResult(req);

    if (!result.isEmpty()) {
        return next(createValidationError(result.array({ onlyFirstError: true })));
    }

    // Only fields covered by the validation chains are extracted.
    const input = matchedData(req, { locations: ["body"] });

    const product = {
        id: String(nextProductId++),
        name: input.name,
        quantity: input.quantity,
        category: input.category,
        tags: input.tags ?? []
    };

    products.push(product);
    return res.status(201).json({ data: product });
});

function createValidationError(errors) {
    const fields = errors.flatMap((error) => {
        if (error.type === "field") {
            return [{
                field: error.path,
                message: error.msg
            }];
        }

        if (error.type === "unknown_fields") {
            return [{
                message: "The request contains fields this operation does not accept."
            }];
        }

        return [{
            message: "The request contains invalid fields."
        }];
    });

    return new ApiError(
        400,
        "VALIDATION_FAILED",
        "Check the request fields and try again.",
        fields
    );
}

apiRouter.get("/demo-failure", (req, res) => {
    throw new Error("Internal details must not be returned to the client.");
});

app.use("/api", apiRouter);

// The route fallback follows the API router.
app.use("/api", (req, res, next) => {
    return next(new ApiError(
        404,
        "ROUTE_NOT_FOUND",
        "The requested API route was not found."
    ));
});

// Keep the centralized error handler last.
app.use((error, req, res, next) => {
    if (res.headersSent) {
        return next(error);
    }

    // Convert known JSON parser errors without returning their raw body.
    const parserErrors = {
        "entity.parse.failed": {
            status: 400,
            code: "INVALID_JSON",
            message: "The request body is not valid JSON."
        },
        "entity.too.large": {
            status: 413,
            code: "REQUEST_TOO_LARGE",
            message: "The request body is too large."
        },
        "encoding.unsupported": {
            status: 415,
            code: "UNSUPPORTED_CONTENT_ENCODING",
            message: "The request content encoding is not supported."
        }
    };

    const parserError = parserErrors[error.type];
    const knownError = error instanceof ApiError
        ? error
        : parserError
            ? new ApiError(
                parserError.status,
                parserError.code,
                parserError.message
            )
            : null;

    const status = knownError ? knownError.status : 500;
    const code = knownError ? knownError.code : "INTERNAL_SERVER_ERROR";
    const message = knownError
        ? knownError.publicMessage
        : "An unexpected error occurred.";

    if (status >= 500) {
        console.error({
            method: req.method,
            errorName: error.name,
            stack: error.stack
        });
    }

    const responseError = { code, message };
    if (knownError && knownError.fields) {
        responseError.fields = knownError.fields;
    }

    return res.status(status).json({ error: responseError });
});

app.listen(port, () => {
    console.log("Validation demo listening on http://localhost:" + port);
});
~~~

## Start the server

~~~powershell
node app.js
~~~

Expected terminal message:

~~~text
Validation demo listening on http://localhost:3000
~~~

Keep the server running. Use another PowerShell terminal for the requests below.

## Submit a valid product

~~~powershell
curl.exe -i -X POST http://localhost:3000/api/products -H "Content-Type: application/json" -d '{"name":"  Sketchbook  ","quantity":2,"category":"books","tags":[" art ","paper"]}'
~~~

Expected response:

~~~http
HTTP/1.1 201 Created
Content-Type: application/json; charset=utf-8

{"data":{"id":"1003","name":"Sketchbook","quantity":2,"category":"books","tags":["art","paper"]}}
~~~

The name and tags have only their outer whitespace trimmed. Quantity is validated before it is converted to a number. The route creates the product from matched fields, not from the full request body.

## Reject invalid fields and extras

~~~powershell
curl.exe -i -X POST http://localhost:3000/api/products -H "Content-Type: application/json" -d '{"name":"X","quantity":0,"category":"unknown","isAdmin":true}'
~~~

Expected status:

~~~http
HTTP/1.1 400 Bad Request
Content-Type: application/json; charset=utf-8
~~~

The JSON body has this general shape:

~~~json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Check the request fields and try again.",
    "fields": [
      { "field": "name", "message": "Name must contain 2 to 80 characters." },
      { "field": "quantity", "message": "Quantity must be a whole number from 1 to 50." },
      { "field": "category", "message": "Choose a supported category." },
      { "message": "The request contains fields this operation does not accept." }
    ]
  }
}
~~~

The route does not write a product. The response includes safe field guidance but does not echo the submitted values.

## Validate query parameters

~~~powershell
curl.exe -i "http://localhost:3000/api/products?page=1&limit=2"
~~~

Expected response:

~~~json
{"data":[{"id":"1001","name":"Notebook","quantity":2,"category":"books","tags":["paper","school"]},{"id":"1002","name":"Pen","quantity":5,"category":"office","tags":[]}],"pagination":{"page":1,"limit":2}}
~~~

The query values arrive as text, are checked against integer ranges, and are converted only after validation. A query such as page=1abc or limit=500 fails validation.

An unrecognized query key such as sortBy=price is rejected by checkExact() in this route.

## Validate route parameters

~~~powershell
curl.exe -i http://localhost:3000/api/products/not-a-number
~~~

Expected response body:

~~~json
{"error":{"code":"VALIDATION_FAILED","message":"Check the request fields and try again.","fields":[{"field":"productId","message":"Product ID must be a positive whole number."}]}}
~~~

A valid positive ID that does not exist receives a different error:

~~~powershell
curl.exe -i http://localhost:3000/api/products/9999
~~~

Expected response body:

~~~json
{"error":{"code":"PRODUCT_NOT_FOUND","message":"The requested product was not found."}}
~~~

The route parameter is syntactically valid, but no resource has that ID. This is a resource lookup result, not a validation failure.

## Handle malformed or oversized JSON

Malformed JSON is rejected by the parser before the route's validation chains run:

~~~powershell
curl.exe -i -X POST http://localhost:3000/api/products -H "Content-Type: application/json" -d '{"name":}'
~~~

Expected response body:

~~~json
{"error":{"code":"INVALID_JSON","message":"The request body is not valid JSON."}}
~~~

A body larger than the configured 16 KB limit returns 413 with code REQUEST_TOO_LARGE. The handler does not include the parser's raw body in the response.

This demo sets inflate to false because it does not need compressed request bodies. If compressed bodies are needed, keep the body-parser dependency updated and configure request parsing deliberately.

## Reject an unknown API route

~~~powershell
curl.exe -i http://localhost:3000/api/producst
~~~

Expected response body:

~~~json
{"error":{"code":"ROUTE_NOT_FOUND","message":"The requested API route was not found."}}
~~~

The API router had no matching route, so the route fallback forwards a typed 404 error to the same response handler.

## Keep unexpected failures private

~~~powershell
curl.exe -i http://localhost:3000/api/demo-failure
~~~

Expected response body:

~~~json
{"error":{"code":"INTERNAL_SERVER_ERROR","message":"An unexpected error occurred."}}
~~~

The server logs the unexpected error for diagnosis. The client does not receive its internal message or stack.

## Trace the processing order

~~~text
request
  -> JSON parser with size and encoding policy
  -> route-specific validators and sanitizers
  -> validationResult()
       -> invalid: centralized 400 response, no database write
       -> valid: matchedData() allowlist
  -> business checks and authorization
  -> database operation
  -> API route fallback, if no route matched
  -> centralized error handler
~~~

Validation does not prove that the caller is allowed to access a resource. In a real application, add authorization separately before performing protected reads or writes. Use safe query construction and encode data for the context in which it is rendered.

## Chapter navigation

| Previous chapter | Lesson | Chapter Q&A | Next chapter |
| --- | --- | --- | --- |
| [045 - Centralized API errors and not-found handling](../lessons/045-centralized-api-errors-and-not-found-handling.md) | [Lesson](../lessons/046-validate-and-sanitize-client-input.md) | [Q&A](../qnas/046-validate-and-sanitize-client-input.md) | [047 - REST status codes and consistent response shapes](../lessons/047-rest-status-codes-and-consistent-response-shapes.md) |
