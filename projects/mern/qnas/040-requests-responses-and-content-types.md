# Chapter 040 Q&A: Requests, responses, and content types

Review HTTP request and response structure, media types, status codes, Express response methods, and content negotiation. The examples use Express 5 conventions.

## Part 1: Multiple-choice questions

### 1. What are the main parts of an HTTP response?

- **A.** A status code, headers, and usually a body.
- **B.** A database model and a CSS selector.
- **C.** A route parameter and a package lock.
- **D.** A browser event and a JavaScript module.

**Answer: A.** The status describes the outcome, headers describe response metadata, and the body carries the representation when one is allowed.

### 2. What does a request Content-Type header describe?

- **A.** The media type of the request body.
- **B.** Which response format the client wants.
- **C.** The route handler name.
- **D.** The HTTP status code.

**Answer: A.** For example, application/json says the request body is represented as JSON.

### 3. What does a request Accept header describe?

- **A.** The response media types the client is willing to receive.
- **B.** The media type of the request body.
- **C.** The server's port number.
- **D.** Whether the route has a parameter.

**Answer: A.** Accept is used for response content negotiation.

### 4. Which Express method reads a request header case-insensitively?

- **A.** req.get("Accept")
- **B.** res.type("Accept")
- **C.** req.status("Accept")
- **D.** res.body("Accept")

**Answer: A.** req.get() and its alias req.header() retrieve a request header.

### 5. Which method sets a response status and can be chained?

- **A.** res.status(code)
- **B.** req.status(code)
- **C.** res.method(code)
- **D.** req.code(status)

**Answer: A.** A common JSON API pattern is res.status(200).json(data).

### 6. Which Express method serializes a value as JSON?

- **A.** res.json(value)
- **B.** req.json(value)
- **C.** res.accept(value)
- **D.** req.send(value)

**Answer: A.** res.json() serializes the value and sets a JSON response Content-Type.

### 7. What is the usual result of res.send("Hello")?

- **A.** A string response, treated as HTML content by Express.
- **B.** A parsed JSON request body.
- **C.** A redirect to /Hello.
- **D.** A 204 response with no body.

**Answer: A.** Use res.json() for a JSON representation. Escape untrusted values before putting them into HTML.

### 8. Which status code normally indicates that a resource was created?

- **A.** 201 Created
- **B.** 204 No Content
- **C.** 304 Not Modified
- **D.** 415 Unsupported Media Type

**Answer: A.** A create response can include the new representation and a Location header.

### 9. Which status code means success with no response representation?

- **A.** 204 No Content
- **B.** 201 Created
- **C.** 400 Bad Request
- **D.** 406 Not Acceptable

**Answer: A.** A 204 response should not contain a body.

### 10. What does res.sendStatus(404) send?

- **A.** A 404 status and its registered status message as the body.
- **B.** A custom JSON object with an error field.
- **C.** A request Content-Type header.
- **D.** A router parameter.

**Answer: A.** Use res.status(404).json(...) when the API contract calls for structured JSON.

### 11. Which status commonly describes a missing resource?

- **A.** 404 Not Found
- **B.** 401 Unauthorized
- **C.** 406 Not Acceptable
- **D.** 202 Accepted

**Answer: A.** It can describe an unmatched route or a resource that is unavailable.

### 12. Which status is generally about missing or invalid authentication?

- **A.** 401 Unauthorized
- **B.** 403 Forbidden
- **C.** 409 Conflict
- **D.** 415 Unsupported Media Type

**Answer: A.** 403 usually means the caller is authenticated but is not permitted to perform the action.

### 13. Which status applies when no offered response representation is acceptable to the client?

- **A.** 406 Not Acceptable
- **B.** 415 Unsupported Media Type
- **C.** 400 Bad Request
- **D.** 204 No Content

**Answer: A.** 406 relates to response representation negotiation using Accept.

### 14. Which status applies when the endpoint does not support the request body's media type?

- **A.** 415 Unsupported Media Type
- **B.** 406 Not Acceptable
- **C.** 302 Found
- **D.** 304 Not Modified

**Answer: A.** 415 concerns the request representation identified by Content-Type.

### 15. What does res.type("text/plain") do?

- **A.** Sets the response Content-Type to text/plain.
- **B.** Parses the request body as plain text.
- **C.** Reads the request Accept header.
- **D.** Changes the route method.

**Answer: A.** res.type() sets a response media type; it does not parse the incoming body.

### 16. What does req.is("application/json") check?

- **A.** Whether the incoming request Content-Type matches the type.
- **B.** Whether the response status is 200.
- **C.** Whether the response body is JSON.
- **D.** Whether a route parameter is numeric.

**Answer: A.** It checks a media type; it is not a JSON parser or schema validator.

### 17. What does req.accepts("application/json") examine?

- **A.** The request's Accept header.
- **B.** The request's Content-Type only.
- **C.** The response Location header.
- **D.** The request body fields.

**Answer: A.** It checks whether a JSON response is acceptable to the client.

### 18. What does res.format() provide?

- **A.** A way to select a response handler based on acceptable media types.
- **B.** A way to parse every request body.
- **C.** A way to add route parameters.
- **D.** A way to create MongoDB collections.

**Answer: A.** It maps acceptable types to response callbacks and can use a default callback.

### 19. When should response headers be set?

- **A.** Before the response headers are sent.
- **B.** After res.end() completes.
- **C.** Only from a browser.
- **D.** After the response body has been fully transmitted.

**Answer: A.** Once headers are sent, the server cannot change them.

### 20. What is a key requirement for a 204 response?

- **A.** It has no response body.
- **B.** It must contain a JSON error object.
- **C.** It must redirect the client.
- **D.** It must include a request body.

**Answer: A.** Use res.status(204).end() when the operation succeeds without a representation.

## Part 2: Short answers

### 21. What does the response Content-Type header tell a client?

**Answer:** It identifies the representation format of the response body, such as application/json, text/plain, or text/html.

### 22. Does Content-Type validate the data it labels?

**Answer:** No. It identifies the claimed media type. The server still has to parse the body and validate its structure and values.

### 23. What is the difference between a media type and Content-Encoding?

**Answer:** A media type describes the representation format, such as JSON. Content-Encoding describes a transformation applied to the representation, such as gzip compression.

### 24. When is a Location header useful?

**Answer:** It can identify the URI of a newly created resource, commonly alongside a 201 Created response.

### 25. Why should a JSON API not use res.sendStatus() for every error?

**Answer:** res.sendStatus() sends the registered status text as its body. It does not provide the structured JSON error shape that API clients may expect.

### 26. What should an endpoint consider when it receives no request body?

**Answer:** It should decide whether the body is optional or required, check the expected media type as appropriate, and return a documented client error if required input is absent.

### 27. Does an Accept: application/json header prove the request body is JSON?

**Answer:** No. Accept describes desired response media types. Content-Type describes the request body.

### 28. What is one purpose of the Vary: Accept response header?

**Answer:** It tells caches that the selected representation can differ depending on the request's Accept header.

### 29. Why should a response branch return after sending a response?

**Answer:** Returning prevents later code from continuing and attempting to send a second response.

### 30. When should an API return 409 Conflict?

**Answer:** When a valid request conflicts with the resource's current state, such as a duplicate operation or incompatible state transition, according to the API's documented rules.

## Part 3: Apply the concepts

### 31. A client sends Content-Type: application/json and Accept: text/plain. What do the headers mean?

**Answer:** The request body is represented as JSON, and the client says it is willing to receive a plain-text response.

### 32. A server returns JSON but labels it text/html. What is wrong?

**Answer:** The response Content-Type does not describe the body representation. The server should return a JSON media type, such as application/json.

### 33. A request body is valid JSON but has an unexpected field shape. Is the request valid?

**Answer:** Not necessarily. Successful parsing only produces a JavaScript value. The endpoint still has to validate required fields, types, allowed values, and business rules.

### 34. A client only accepts application/xml, while the endpoint can send JSON and plain text. What response may be appropriate?

**Answer:** Return 406 Not Acceptable when no supported representation satisfies the client's Accept header, unless the API has a documented fallback.

### 35. A route receives application/xml, but it only accepts JSON. What response may be appropriate?

**Answer:** Return 415 Unsupported Media Type because the request representation is not supported.

### 36. A DELETE operation succeeds and has no representation to return. Which status and Express call fit?

**Answer:** Use 204 No Content and end the response, for example res.status(204).end(). Do not send a body.

### 37. A create endpoint saved a resource with ID 501. What response details could it include?

**Answer:** It can return 201 Created, include the created representation or identifier, and set Location to the new resource's URI.

### 38. The server chooses HTML or JSON based on Accept, but a cache stores the response. What header may be needed?

**Answer:** Vary: Accept, so caches distinguish representations selected for different Accept headers.

### 39. An error handler starts writing JSON and then tries to change the status. Why can this fail?

**Answer:** The headers may already be sent with the response. Set the status and headers before writing the body; when headers have been sent, delegate the error appropriately instead of sending another response.

### 40. Why can directly inserting a user-provided string into a res.send() HTML response be unsafe?

**Answer:** The value may contain markup or script. Escape it for the correct HTML context or use a rendering approach with appropriate escaping. For a JSON API, send a JSON representation instead.

## Chapter navigation

| Previous chapter | Chapter lesson | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [039 - Routes, route parameters, and routers](../lessons/039-routes-route-parameters-and-routers.md) | [Lesson](../lessons/040-requests-responses-and-content-types.md) | [Example](../examples/040-requests-responses-and-content-types.md) | [041 - Parse path, query, and body inputs](../lessons/041-parse-path-query-and-body-inputs.md) |
