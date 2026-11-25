# 041 - Parse path, query, and body inputs

A route tells Express which request handler should run. That handler still needs to interpret values supplied by the client. A product ID in a URL, a page number in a query string, and a JSON object in a request body are all input. They arrive in different places and have different parsing rules, but none should be trusted merely because Express exposed it as a JavaScript value.

This chapter builds a consistent way to parse, validate, and normalize those values before application code uses them. It focuses on request inputs. Splitting handlers into route, controller, and service files is the next chapter.

## Learning goals

By the end of this chapter, you should be able to:

- Locate path parameters, query parameters, and body fields in an Express request.
- Explain the difference between parsing, validation, normalization, and authorization.
- Configure JSON and URL-encoded body parsers before routes.
- Validate strings, integers, ranges, object shapes, and allowed fields.
- Return consistent client errors for invalid input and malformed payloads.
- Avoid using untrusted input as a database query, operator, regular expression, or object key.

## Three common input locations

Express makes request data available through separate properties:

| Input source | Express property | Typical purpose | Example |
| --- | --- | --- | --- |
| Route path | req.params | Identify a resource or route segment | /api/products/42 |
| Query string | req.query | Optional filters, sorting, and pagination | /api/products?page=2&limit=10 |
| Request body | req.body | Data submitted to create or update a resource | JSON product fields |

For a route such as /api/products/:productId, the string captured for productId is available as req.params.productId. A query such as ?page=2 is available through req.query.page. JSON or form fields are available through req.body only when the matching parser middleware has run.

Keep the source explicit. Express 5 removed the older req.param(name) helper because combining several sources made it unclear where a value came from. Read from req.params, req.query, or req.body according to the endpoint contract.

## Parsing is not validation

These steps solve different problems:

1. **Parsing** turns bytes or text into a JavaScript representation. For example, express.json() parses a JSON request body.
2. **Validation** checks whether a value has the type, shape, format, and range the endpoint accepts.
3. **Normalization** converts an already valid value into the form the application wants, such as trimming a name or converting a decimal string to an integer.
4. **Authorization** decides whether this authenticated caller may perform the requested action on the resource.

A parsed body can still contain invalid data. A syntactically valid JSON document might contain a negative quantity, an unknown field, or a value with the wrong type. Likewise, validation does not prove that the caller is allowed to access the requested product.

## Path parameters

Route parameters are strings, even when they look numeric. Express decodes captured route parameters, so malformed percent-encoding can cause a request parsing error before the handler runs.

Do not assume that a parameter exists, has the expected format, or fits in a JavaScript integer. Define an endpoint-specific parser:

~~~js
function parsePositiveInteger(value) {
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) {
    return null;
  }

  const number = Number(value);

  if (!Number.isSafeInteger(number)) {
    return null;
  }

  return number;
}
~~~

This parser rejects empty strings, signs, decimals, whitespace, zero, and values outside JavaScript's safe integer range. Whether zero or negative numbers are valid depends on the domain; choose the rule deliberately.

Use it at the route boundary:

~~~js
app.get("/api/products/:productId", (req, res) => {
  const productId = parsePositiveInteger(req.params.productId);

  if (productId === null) {
    return res.status(400).json({
      error: {
        code: "INVALID_PRODUCT_ID",
        message: "productId must be a positive integer."
      }
    });
  }

  return res.json({ productId });
});
~~~

Some APIs use UUIDs, slugs, or opaque IDs instead. Validate those against the precise format your application issues. Do not convert an identifier to a number unless numeric identity is part of the data model.

## Query parameters

Query values begin as URL text. For example, page=2 is not automatically the number 2. With Express 5, the default query parser is simple. Repeated keys may produce arrays, so code must not blindly call string methods or numeric conversion on a query value.

Treat even a single query field as untrusted:

~~~js
function readSingleString(value) {
  return typeof value === "string" ? value : null;
}

function parseBoundedInteger(value, fallback, maximum) {
  if (value === undefined) {
    return fallback;
  }

  if (typeof value !== "string" || !/^(0|[1-9]\d*)$/.test(value)) {
    return null;
  }

  const number = Number(value);

  if (!Number.isSafeInteger(number) || number > maximum) {
    return null;
  }

  return number;
}
~~~

Choose an explicit policy for repeated query keys such as ?page=1&page=2. A simple API can reject the array by requiring a string. If an endpoint intentionally supports repeated values, validate every array item and document its meaning.

Pagination should have sensible defaults and upper bounds. Without a maximum, a caller may request an unexpectedly large page size and consume excessive database, memory, or network resources. Whether invalid input is rejected or clamped is an API design choice; apply it consistently and tell clients which behavior to expect.

Search terms also need type and length limits. Do not assume that a query string is safe to insert into a regular expression or database filter. Escape or avoid regular-expression construction, and pass validated values through an allow-listed database query.

Express 5 exposes req.query as a getter, not an assignable property. Do not attempt to add defaults by mutating req.query. Parse values into local variables or a separate normalized object instead.

## Request bodies and parser middleware

Express does not parse every body automatically. Install the parser that matches the endpoint's accepted media type, and install it before the routes that use the resulting req.body:

~~~js
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: false, limit: "16kb" }));
~~~

The JSON parser handles requests with an appropriate JSON Content-Type. The URL-encoded parser handles form submissions. The parser must run before the route; otherwise req.body can be undefined. In Express 5, an unparsed body is undefined rather than an empty object.

The Content-Type header determines how a body is interpreted; it does not prove the body fields are valid. A request with JSON Content-Type can still contain a structurally wrong object. Body size limits help prevent a client from sending an unnecessarily large payload, but they do not replace validation or request-rate controls.

For URL-encoded forms, extended: false makes the intended simple key/value parsing behavior explicit. Do not enable nested object parsing unless the endpoint needs it and the accepted shape and parser limits are understood.

## Validate object shape and fields

Before reading fields, confirm the body has the structure expected by the endpoint. A safe JSON-object check can reject null and arrays:

~~~js
function isPlainRecord(value) {
  return value !== null &&
    typeof value === "object" &&
    !Array.isArray(value);
}
~~~

Then validate each allowed field and reject unexpected fields when the API contract is closed:

~~~js
function validateCreateProduct(body) {
  if (!isPlainRecord(body)) {
    return { error: "The request body must be a JSON object." };
  }

  const allowedKeys = new Set(["name", "price", "inStock"]);
  const unknownKeys = Object.keys(body).filter(
    (key) => !allowedKeys.has(key)
  );

  if (unknownKeys.length > 0) {
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
~~~

The normalized value is a new object containing only validated fields. This is safer than copying every submitted property into a database document. In particular, never accept client-provided database operators or use arbitrary object keys to construct a MongoDB filter or update.

This small function is useful for learning. Larger applications often use a dedicated schema-validation library, but the important boundary remains the same: validate the untrusted request before passing typed, normalized values to application logic.

## Error responses

Use a consistent error shape so clients can handle failures predictably. A 400 Bad Request is appropriate when the request is syntactically understood but contains invalid values. A malformed JSON body is also a client error. A body exceeding the configured parser limit should be reported as too large, commonly with 413. An unsupported request media type can be reported as 415.

Error middleware belongs after the routes. It should not expose stack traces, raw parser messages, database internals, or submitted secret values. Preserve known safe HTTP status codes from parser errors, but map internal failures to a generic 500 response.

~~~js
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

  if (error instanceof SyntaxError && error.status === 400) {
    return res.status(400).json({
      error: {
        code: "INVALID_JSON",
        message: "The request body contains invalid JSON."
      }
    });
  }

  return res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "An unexpected server error occurred."
    }
  });
});
~~~

The parser's errors can vary by parser and version. If you build specific error mapping, verify it against the exact middleware used by the application and avoid depending on unstable message text. Do not label every SyntaxError in an application as bad client JSON unless you can identify that it came from body parsing.

A route can enforce a required content type before using a body. For example, an endpoint that accepts only JSON can check req.is("application/json") and return 415 when it does not match. Decide how the endpoint treats an absent body separately from a malformed body.

## Security and data handling

Request input can affect database filters, update operators, filesystem paths, command arguments, and HTML output. Keep the following rules at the boundary:

- Validate against an allow-list of fields and values.
- Do not spread the complete req.body into a database update.
- Do not accept a caller-supplied MongoDB operator as an instruction.
- Use parameterized APIs for database operations.
- Limit string lengths, list lengths, numeric ranges, and body size.
- Escape user-provided text when rendering it as HTML.
- Validate authorization independently after parsing the resource identifier.
- Avoid merging arbitrary request objects into configuration or privileged objects.

A well-formed value can still be unsafe for a particular operation. Validation is contextual: a string allowed as a display name is not automatically safe as a file path, query expression, or HTML fragment.

## Common mistakes

- Treating route and query values as numbers without parsing them.
- Assuming every query parameter is one string.
- Calling trim, toString, or array methods before checking the value's type.
- Expecting req.body to exist without the matching parser.
- Registering body-parser middleware after routes.
- Assuming Content-Type validation checks the fields in the body.
- Accepting arbitrary body keys and copying them into a database document.
- Using a query value directly to build a database filter or regular expression.
- Treating parsing or validation as authorization.
- Returning parser internals or stack traces to clients.
- Forgetting body-size and pagination limits.
- Mutating req.query to insert defaults in Express 5.

## Practical checklist

Before using a request value, ask:

- Did it come from params, query, or body, and does the endpoint expect it there?
- Was it parsed by the matching middleware?
- Have I checked its type, format, range, and size?
- Do repeated query keys or unknown body keys have a defined policy?
- Am I constructing a new object from allowed fields?
- Are database filters and updates built from trusted structure?
- Have I handled invalid input with a consistent client error?
- Is authorization checked separately?
- Are parser and payload errors safe to return?
- Does the endpoint enforce sensible request-size and pagination limits?

## Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [040 - Requests, responses, and content types](040-requests-responses-and-content-types.md) | [Q&A](../qnas/041-parse-path-query-and-body-inputs.md) | [Example](../examples/041-parse-path-query-and-body-inputs.md) | [042 - Separate routes, controllers, and services](042-separate-routes-controllers-and-services.md) |
