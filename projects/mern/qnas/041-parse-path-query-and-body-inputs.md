# 041 - Parse path, query, and body inputs: Q&A

This Q&A reviews the three common request input sources in Express and how to parse, validate, normalize, and safely use them.

## Multiple choice

### 1. Where does Express place a named parameter from /api/products/:productId?

- A. req.query.productId
- B. req.params.productId
- C. req.body.productId
- D. res.params.productId

**Answer: B.** Named route parameters are available on req.params. The value is still client-controlled input and should be validated.

### 2. What is the usual source for ?page=3 in /api/products?page=3?

- A. req.params
- B. req.query
- C. req.body
- D. req.headers

**Answer: B.** Query-string fields are exposed through req.query. The value should be parsed from text and validated before use.

### 3. What does express.json() primarily do?

- A. It authorizes JSON requests.
- B. It validates every field in a JSON object.
- C. It parses matching JSON request bodies into req.body.
- D. It converts route parameters into numbers.

**Answer: C.** The middleware parses matching JSON request bodies. It does not validate the application's domain rules or authorize the caller.

### 4. In Express 5, what is req.body when no body parser has populated it?

- A. Always an empty object
- B. Always an array
- C. undefined
- D. A copy of req.query

**Answer: C.** Express 5 leaves req.body undefined when a parser has not populated it. Code must not assume it is an object.

### 5. Where should body-parsing middleware be registered for routes that use it?

- A. After the error handler
- B. Before those routes
- C. Only inside app.listen
- D. After the route sends its response

**Answer: B.** Middleware runs in registration order. The parser must run before a route that reads req.body.

### 6. What does a body parser's size limit help control?

- A. How many route parameters a URL may have
- B. The maximum request-body size accepted by that parser
- C. Which user is allowed to access the route
- D. The response JSON indentation

**Answer: B.** A configured parser limit bounds the body size accepted by that parser. It is one resource-protection measure, not a replacement for other controls.

### 7. Which statement about Content-Type: application/json is correct?

- A. It proves all submitted fields are valid.
- B. It identifies the request representation format, but the body still needs validation.
- C. It authenticates the sender.
- D. It guarantees req.body is an object even if no middleware runs.

**Answer: B.** Content-Type guides parsing and endpoint media-type handling. It does not guarantee a valid application-level object.

### 8. Why should code check the type of req.query.page before converting it?

- A. Query values can have unexpected shapes, including arrays for repeated keys.
- B. Express always returns a MongoDB ObjectId.
- C. Express converts every query value into a Date.
- D. Query values are trusted if they came from a browser.

**Answer: A.** Query values are user-controlled, and repeated keys may produce a non-string shape. Validate the type before string operations or conversion.

### 9. Which integer validation is safest for a positive numeric identifier?

- A. parseInt(value) and accept every result
- B. Number(value) without further checks
- C. Validate the entire string format, convert it, then check Number.isSafeInteger and the domain range
- D. Use the value directly in a database query

**Answer: C.** Strict format validation prevents partial parses and unexpected forms. Safe-integer and domain checks constrain the resulting number.

### 10. What is normalization?

- A. Confirming that the authenticated user owns a record
- B. Converting validated input into a consistent application representation
- C. Parsing raw JSON bytes
- D. Returning a 500 response

**Answer: B.** Normalization is applied after validation, for example trimming a validated name or converting a validated decimal string to a number.

### 11. What is authorization?

- A. Checking whether the body is syntactically valid JSON
- B. Deciding whether the caller may perform the requested action
- C. Converting page text to an integer
- D. Reading the query string

**Answer: B.** Authorization decides whether a caller has permission for the action or resource. A valid ID alone does not grant access.

### 12. Why might an API reject repeated page query keys?

- A. Repeated keys can produce a shape other than one string, which may not match the endpoint contract.
- B. HTTP does not allow repeated query keys.
- C. Express automatically treats them as SQL.
- D. A query string can contain only one parameter.

**Answer: A.** An endpoint should define what repeated keys mean. Requiring one string and rejecting other shapes is a simple, explicit policy.

### 13. In Express 5, which statement about req.query is correct?

- A. It is writable and should be changed to add defaults.
- B. It is a getter; parse defaults into local variables or a separate object.
- C. It always contains a body copy.
- D. It can only contain integer values.

**Answer: B.** Express 5 changed req.query to a getter. Build a separate normalized object rather than mutating it.

### 14. What does express.urlencoded({ extended: false }) handle?

- A. JSON request bodies
- B. URL-encoded form bodies using simple key/value parsing
- C. Multipart file uploads
- D. Route path segments

**Answer: B.** The URL-encoded parser handles form submissions with the matching media type. It is separate from the JSON parser.

### 15. Why should an API limit pagination size?

- A. To prevent query parameters from appearing in logs
- B. To bound work and resource use for a single request
- C. To make all responses status 204
- D. To ensure the user is authenticated

**Answer: B.** A maximum page size prevents a caller from requesting an excessive amount of data in one response.

### 16. What is a safe policy for a create endpoint that accepts only name, price, and inStock?

- A. Spread every property from req.body into the database record.
- B. Validate the expected fields and construct a new object containing only those fields.
- C. Ignore types because JSON has types.
- D. Convert every field to a string.

**Answer: B.** Validate allowed fields and build a new normalized object. This avoids accidentally accepting privileged or unsupported fields.

### 17. Which status is commonly appropriate when a request body exceeds a configured parser limit?

- A. 101
- B. 204
- C. 413
- D. 503

**Answer: C.** 413 Payload Too Large is commonly used when the request body exceeds the configured limit.

### 18. Which status is commonly appropriate when an endpoint does not accept the request's media type?

- A. 415
- B. 301
- C. 401
- D. 304

**Answer: A.** 415 Unsupported Media Type communicates that the endpoint does not accept the submitted representation format.

### 19. Why is copying all of req.body into a MongoDB update risky?

- A. It can allow unexpected fields or client-controlled update structure to influence stored data.
- B. MongoDB accepts only strings.
- C. Express prevents req.body from being an object.
- D. It disables route matching.

**Answer: A.** Build a controlled update from validated, allowed fields. Do not let arbitrary input define database operators or update structure.

### 20. What should an error response generally avoid exposing?

- A. A stable client-facing error code
- B. A concise safe message
- C. Stack traces, internal parser details, or database internals
- D. The HTTP status

**Answer: C.** Internal diagnostics can reveal implementation details. Log suitable details privately and send a safe response to the client.

## Short answers

### 21. Name the three common Express request input locations and their properties.

**Answer:** Route parameters are in req.params, query-string values are in req.query, and parsed request-body fields are in req.body.

### 22. Explain parsing versus validation.

**Answer:** Parsing turns incoming bytes or text into a JavaScript representation. Validation checks whether that value's type, shape, format, and range meet the endpoint's contract.

### 23. Why should code avoid assuming req.params.productId is a number?

**Answer:** Route parameter values are strings captured from the URL. The handler must validate the expected format and deliberately convert the value if the domain uses a number.

### 24. What is the difference between validation and normalization?

**Answer:** Validation decides whether the input is acceptable. Normalization converts acceptable input into the consistent representation the application wants to use.

### 25. Give one reason to reject unknown fields in a request body.

**Answer:** Rejecting unknown fields makes the API contract explicit and helps prevent unintended properties from being copied into stored records or update operations.

### 26. Why does a parser need to match the request's Content-Type?

**Answer:** The media type identifies the representation format the parser is designed to read. A JSON parser and a URL-encoded parser handle different body formats.

### 27. Give two useful limits for a paginated search endpoint.

**Answer:** Set a maximum page number or offset and a maximum page size. Also consider a maximum search-string length and database query time/resource constraints.

### 28. Why should repeated query parameters have a documented policy?

**Answer:** A repeated key may be represented as an array rather than a single string. The endpoint should say whether it rejects repeats, accepts a list, or applies another defined rule.

### 29. Why does validating an identifier not prove that the caller may access its record?

**Answer:** Format validation only establishes that the identifier follows an accepted shape. Authorization separately checks the caller's identity, permissions, and relationship to the resource.

### 30. What should an Express error handler do if res.headersSent is already true?

**Answer:** It should delegate the error with next(error), allowing Express's default handling, rather than trying to send a second response after headers have been sent.

## Application questions

### 31. A request arrives at /api/products/0007. Your ID policy accepts only canonical positive integers without leading zeroes. What should the route do?

**Answer:** Reject it with a client error because the string does not match the endpoint's canonical format. Avoid silently changing the identifier unless normalization of leading zeroes is explicitly part of the API contract.

### 32. A client sends ?page=2&page=3, and your endpoint allows one page value only. How should it behave?

**Answer:** Detect that the parsed value is not a single string and return a 400 response describing the invalid page parameter. Do not let implicit coercion choose one value.

### 33. A JSON endpoint receives a valid JSON array, but expects an object with a name field. What should happen?

**Answer:** Reject the body with a 400 response after checking that it is a non-array object. Valid JSON syntax does not mean the value has the required application shape.

### 34. A form route reads req.body but the application only registered express.json(). What is the likely issue and correction?

**Answer:** A URL-encoded form may not be parsed by the JSON parser, leaving req.body undefined. Register express.urlencoded with the intended options before that route.

### 35. An API accepts a sort query parameter. How can it avoid allowing arbitrary database field selection?

**Answer:** Validate the value against a small allow-list such as name or price, map each accepted public value to a known database field, and reject any other value.

### 36. A create endpoint receives { "name": "  Lamp  ", "price": 12.5, "inStock": true }. What should a validation boundary return to application logic?

**Answer:** It should return a newly constructed normalized value with the trimmed name and validated price and boolean fields, for example { name: "Lamp", price: 12.5, inStock: true }.

### 37. A malformed JSON request causes a parser error. What should the client receive?

**Answer:** A safe 400 response with a stable code such as INVALID_JSON and a concise message. Do not expose the stack trace or raw parser internals.

### 38. A body parser rejects a very large payload. What should the error handling policy do?

**Answer:** Return a safe 413 response indicating the body is too large. Keep the parser limit configured and avoid returning internal error details.

### 39. A request contains a valid product ID, but the signed-in user does not own the product. Which layer of decision is needed?

**Answer:** Authorization. Parsing and validation establish that the identifier is well-formed; the application must still check whether this user may perform the requested action.

### 40. A route receives an optional filter and a page value. Outline a safe processing order.

**Answer:** Read each value from req.query, check its shape and type, validate formats and bounds, apply documented defaults, normalize into a new local object, then build a database query from trusted structure and allow-listed filters. Enforce authorization where required and return a consistent client error for invalid input.

## Chapter navigation

| Previous chapter | Lesson | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [040 - Requests, responses, and content types](../lessons/040-requests-responses-and-content-types.md) | [Lesson](../lessons/041-parse-path-query-and-body-inputs.md) | [Example](../examples/041-parse-path-query-and-body-inputs.md) | [042 - Separate routes, controllers, and services](../lessons/042-separate-routes-controllers-and-services.md) |
