# 041 - Parse path, query, and body inputs: Example

## Question

How can an Express API read a product ID from a path, pagination and search from a query string, and product fields from a JSON body while rejecting malformed or out-of-range input?

## What this example demonstrates

This small Express 5 API keeps the three input sources explicit:

- GET /api/products/:productId validates a path parameter.
- GET /api/products?page=1&limit=2&search=lamp validates pagination and a search term.
- POST /api/products parses and validates a JSON object.
- POST /api/contact parses and validates a URL-encoded form.
- Error middleware returns safe errors for malformed JSON and oversized request bodies.

The data is an in-memory array so you can focus on the request boundary. Restarting the process resets records.

## Project files

Create a folder with this structure:

~~~text
request-input-demo/
|-- app.js
|-- package.json
~~~

## Setup

Create the folder, initialize npm, and install Express 5:

~~~powershell
mkdir request-input-demo
cd request-input-demo
npm init -y
npm install express@5
~~~

Replace package.json with the following:

~~~json
{
  "name": "request-input-demo",
  "version": "1.0.0",
  "private": true,
  "description": "Express request input parsing and validation example",
  "main": "app.js",
  "scripts": {
    "start": "node app.js"
  },
  "dependencies": {
    "express": "^5.1.0"
  }
}
~~~

If you created package.json after installing Express, run npm install once more so the manifest and lock file are synchronized.

## Complete app.js

~~~js
const express = require("express");

const app = express();
const port = Number(process.env.PORT) || 3000;

// Parsers must be registered before routes that read req.body.
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: false, limit: "16kb" }));

let nextProductId = 4;

const products = [
  { id: 1, name: "Desk lamp", price: 24.5, inStock: true },
  { id: 2, name: "Reading lamp", price: 18, inStock: true },
  { id: 3, name: "Notebook", price: 5.75, inStock: false }
];

function parsePositiveInteger(value) {
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) {
    return null;
  }

  const number = Number(value);
  return Number.isSafeInteger(number) ? number : null;
}

function parseBoundedInteger(value, defaultValue, maximum) {
  if (value === undefined) {
    return defaultValue;
  }

  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) {
    return null;
  }

  const number = Number(value);

  if (!Number.isSafeInteger(number) || number > maximum) {
    return null;
  }

  return number;
}

function isPlainRecord(value) {
  return value !== null &&
    typeof value === "object" &&
    !Array.isArray(value);
}

function validateProduct(body) {
  if (!isPlainRecord(body)) {
    return { error: "The request body must be a JSON object." };
  }

  const allowedKeys = new Set(["name", "price", "inStock"]);
  const hasUnknownKey = Object.keys(body).some(
    (key) => !allowedKeys.has(key)
  );

  if (hasUnknownKey) {
    return { error: "The request contains unsupported fields." };
  }

  if (typeof body.name !== "string") {
    return { error: "name must be a string." };
  }

  const name = body.name.trim();

  if (name.length < 1 || name.length > 80) {
    return { error: "name must contain between 1 and 80 characters." };
  }

  if (typeof body.price !== "number" ||
      !Number.isFinite(body.price) ||
      body.price < 0) {
    return { error: "price must be a non-negative finite number." };
  }

  if (typeof body.inStock !== "boolean") {
    return { error: "inStock must be a boolean." };
  }

  return {
    value: {
      name,
      price: body.price,
      inStock: body.inStock
    }
  };
}

function sendInputError(res, code, message) {
  return res.status(400).json({
    error: { code, message }
  });
}

app.get("/api/products", (req, res) => {
  const page = parseBoundedInteger(req.query.page, 1, 10000);
  const limit = parseBoundedInteger(req.query.limit, 10, 50);
  const search = req.query.search;

  if (page === null) {
    return sendInputError(
      res,
      "INVALID_PAGE",
      "page must be a positive integer no greater than 10000."
    );
  }

  if (limit === null) {
    return sendInputError(
      res,
      "INVALID_LIMIT",
      "limit must be a positive integer no greater than 50."
    );
  }

  if (search !== undefined &&
      (typeof search !== "string" || search.length > 80)) {
    return sendInputError(
      res,
      "INVALID_SEARCH",
      "search must be one string no longer than 80 characters."
    );
  }

  const normalizedSearch = typeof search === "string"
    ? search.trim().toLowerCase()
    : "";

  // Use a literal string comparison; user input is not compiled as a RegExp.
  const matchingProducts = products.filter((product) =>
    product.name.toLowerCase().includes(normalizedSearch)
  );

  const start = (page - 1) * limit;
  const items = matchingProducts.slice(start, start + limit);

  return res.json({
    data: items,
    pagination: {
      page,
      limit,
      totalItems: matchingProducts.length,
      totalPages: Math.ceil(matchingProducts.length / limit)
    }
  });
});

app.get("/api/products/:productId", (req, res) => {
  const productId = parsePositiveInteger(req.params.productId);

  if (productId === null) {
    return sendInputError(
      res,
      "INVALID_PRODUCT_ID",
      "productId must be a canonical positive integer."
    );
  }

  const product = products.find((item) => item.id === productId);

  if (!product) {
    return res.status(404).json({
      error: {
        code: "PRODUCT_NOT_FOUND",
        message: "The requested product was not found."
      }
    });
  }

  return res.json({ data: product });
});

app.post("/api/products", (req, res) => {
  if (!req.is("application/json")) {
    return res.status(415).json({
      error: {
        code: "UNSUPPORTED_MEDIA_TYPE",
        message: "Send this request with Content-Type application/json."
      }
    });
  }

  const result = validateProduct(req.body);

  if (result.error) {
    return sendInputError(res, "INVALID_PRODUCT", result.error);
  }

  const product = {
    id: nextProductId++,
    ...result.value
  };

  products.push(product);

  return res.status(201).json({ data: product });
});

app.post("/api/contact", (req, res) => {
  if (!req.is("application/x-www-form-urlencoded")) {
    return res.status(415).json({
      error: {
        code: "UNSUPPORTED_MEDIA_TYPE",
        message: "Send this request as a URL-encoded form."
      }
    });
  }

  const body = req.body;

  if (!isPlainRecord(body)) {
    return sendInputError(
      res,
      "INVALID_FORM",
      "The form body must contain name and message fields."
    );
  }

  const allowedKeys = new Set(["name", "message"]);
  const hasUnknownKey = Object.keys(body).some(
    (key) => !allowedKeys.has(key)
  );

  if (hasUnknownKey ||
      typeof body.name !== "string" ||
      typeof body.message !== "string") {
    return sendInputError(
      res,
      "INVALID_FORM",
      "Only string name and message fields are accepted."
    );
  }

  const name = body.name.trim();
  const message = body.message.trim();

  if (name.length < 1 || name.length > 80 ||
      message.length < 1 || message.length > 500) {
    return sendInputError(
      res,
      "INVALID_FORM",
      "name must be 1-80 characters and message 1-500 characters."
    );
  }

  // A real application would pass this validated value to its service layer.
  return res.status(201).json({
    data: {
      received: true,
      name,
      messageLength: message.length
    }
  });
});

app.use((req, res) => {
  return res.status(404).json({
    error: {
      code: "ROUTE_NOT_FOUND",
      message: "The requested route was not found."
    }
  });
});

// Error middleware comes after routes and has four parameters.
app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  if (error && error.type === "entity.too.large") {
    return res.status(413).json({
      error: {
        code: "BODY_TOO_LARGE",
        message: "The request body is too large."
      }
    });
  }

  if (error && error.type === "entity.parse.failed") {
    return res.status(400).json({
      error: {
        code: "INVALID_JSON",
        message: "The request body contains invalid JSON."
      }
    });
  }

  console.error(error);

  return res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "An unexpected server error occurred."
    }
  });
});

app.listen(port, () => {
  console.log("Request input demo listening on port " + port);
});
~~~

Start the server:

~~~powershell
npm start
~~~

## Try the requests

### 1. Read one product by path ID

~~~powershell
curl.exe -i http://localhost:3000/api/products/1
~~~

Expected response:

~~~http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{
  "data": {
    "id": 1,
    "name": "Desk lamp",
    "price": 24.5,
    "inStock": true
  }
}
~~~

A non-canonical ID such as /api/products/01 receives a 400 response. A well-formed ID that does not exist, such as /api/products/99, receives a 404 response.

### 2. Filter and paginate with query values

~~~powershell
curl.exe -i "http://localhost:3000/api/products?page=1&limit=1&search=lamp"
~~~

Expected response:

~~~http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{
  "data": [
    {
      "id": 1,
      "name": "Desk lamp",
      "price": 24.5,
      "inStock": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 1,
    "totalItems": 2,
    "totalPages": 2
  }
}
~~~

Try invalid input:

~~~powershell
curl.exe -i "http://localhost:3000/api/products?page=0"
curl.exe -i "http://localhost:3000/api/products?limit=500"
curl.exe -i "http://localhost:3000/api/products?page=1&page=2"
~~~

Each request receives 400 because the value is outside the allowed range or is not a single string.

### 3. Create a product with JSON

~~~powershell
curl.exe -i -X POST http://localhost:3000/api/products -H "Content-Type: application/json" -d '{"name":"  Travel mug  ","price":12.5,"inStock":true}'
~~~

These are PowerShell commands. The JSON payload is enclosed in single quotes so PowerShell passes it to curl.exe as one argument.

Expected response:

~~~http
HTTP/1.1 201 Created
Content-Type: application/json; charset=utf-8

{
  "data": {
    "id": 4,
    "name": "Travel mug",
    "price": 12.5,
    "inStock": true
  }
}
~~~

The name was trimmed after validation. The response includes only fields the endpoint chose to create. Extra request fields are rejected.

Try a body with an unknown property:

~~~powershell
curl.exe -i -X POST http://localhost:3000/api/products -H "Content-Type: application/json" -d '{"name":"Travel mug","price":12.5,"inStock":true,"role":"admin"}'
~~~

Expected status: 400 Bad Request, with code INVALID_PRODUCT.

### 4. Submit a URL-encoded form

~~~powershell
curl.exe -i -X POST http://localhost:3000/api/contact -H "Content-Type: application/x-www-form-urlencoded" --data-urlencode "name=Ashish" --data-urlencode "message=Hello from the form"
~~~

Expected response:

~~~http
HTTP/1.1 201 Created
Content-Type: application/json; charset=utf-8

{
  "data": {
    "received": true,
    "name": "Ashish",
    "messageLength": 21
  }
}
~~~

The form parser creates string values. The route checks the fields, trims them, enforces length bounds, and returns only a controlled result.

### 5. Check parser errors and media types

Malformed JSON:

~~~powershell
curl.exe -i -X POST http://localhost:3000/api/products -H "Content-Type: application/json" -d '{'
~~~

Expected status: 400 Bad Request, with code INVALID_JSON.

Unsupported media type:

~~~powershell
curl.exe -i -X POST http://localhost:3000/api/products -H "Content-Type: text/plain" --data "name=Travel%20mug"
~~~

Expected status: 415 Unsupported Media Type.

Body larger than the configured 16 KB limit receives 413 Payload Too Large.

## What to notice

- The route reads its identifier from req.params and validates it before lookup.
- Query values are checked as strings before parsing, and a repeated page key is rejected.
- Pagination has defaults and an upper bound.
- Search input is compared as a literal string, not compiled into a regular expression.
- Parser middleware is mounted before routes.
- The JSON route checks media type and validates the body shape and every accepted field.
- The form route uses the URL-encoded parser and validates its own shape.
- The application builds new controlled values instead of copying arbitrary client fields.
- Validation does not replace authorization. A real application must still decide whether the current user can read or change a product.

## Common mistakes

- Removing the parser middleware and expecting req.body to remain populated.
- Assuming page and limit are numbers because they look numeric in the URL.
- Accepting repeated query parameters without defining their meaning.
- Using Number alone without checking the full input format, safe integer, and bounds.
- Spreading req.body into a database update.
- Treating JSON parsing as field validation.
- Compiling an untrusted search string into a regular expression.
- Returning raw parser error messages or stack traces.
- Forgetting that a valid product ID does not establish access permission.

## Chapter navigation

| Previous chapter | Chapter Q&A | Lesson | Next chapter |
| --- | --- | --- | --- |
| [040 - Requests, responses, and content types](../lessons/040-requests-responses-and-content-types.md) | [Q&A](../qnas/041-parse-path-query-and-body-inputs.md) | [Lesson](../lessons/041-parse-path-query-and-body-inputs.md) | [042 - Separate routes, controllers, and services](../lessons/042-separate-routes-controllers-and-services.md) |
