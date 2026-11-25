# 040 - Requests, responses, and content types

An HTTP request carries information from a client to a server. An HTTP response carries a status, headers, and usually a representation back to the client. Express exposes the request as req and builds the response through res.

Understanding headers and content types helps an API decide how to read a request and describe what it sends back. This chapter focuses on the HTTP exchange. The next chapter explains how to parse and validate path, query, and body input in detail.

## Learning goals

By the end of this chapter, you should be able to:

- Describe the main parts of an HTTP request and response.
- Read request methods, paths, and headers through Express.
- Explain the difference between Content-Type and Accept.
- Choose useful HTTP status codes for common API outcomes.
- Return JSON, text, and HTML with an appropriate response content type.
- Set response headers before sending the response.
- Negotiate a response representation with req.accepts() or res.format().
- Explain why a response should be sent only once.
- Recognize 400, 401, 403, 404, 406, 409, 415, and 500 as distinct outcomes.

## The HTTP request and response

A request contains a method, a target URL, headers, and sometimes a body. A response contains a status code, headers, and a body when the status and operation allow one.

A typical API request might look like this:

~~~http
POST /api/messages HTTP/1.1
Host: localhost:3000
Content-Type: application/json
Accept: application/json

{"text":"Hello"}
~~~

The Content-Type header describes the representation sent in the request body. The Accept header tells the server which response media types the client can handle.

A response to that request could look like this:

~~~http
HTTP/1.1 201 Created
Content-Type: application/json; charset=utf-8
Location: /api/messages/501

{"id":"501","text":"Hello"}
~~~

The response status describes the outcome. The Content-Type describes the response body representation. Location identifies the new resource in this example.

## Express request and response objects

Express passes two objects to route handlers:

~~~javascript
app.get("/api/status", (req, res) => {
  return res.status(200).json({
    method: req.method,
    path: req.path
  });
});
~~~

The request object includes information such as:

- req.method: the HTTP method, such as GET or POST.
- req.path: the path portion of the URL, without the query string.
- req.originalUrl: the original URL, including the query string.
- req.params: values captured by route parameters.
- req.query: parsed query values.
- req.body: parsed request data when suitable parsing middleware has run.
- req.get("Accept"): a case-insensitive way to read a request header.

Treat headers and other client-provided values as input. The client can send values that are missing, malformed, or misleading.

The response object lets a handler set a status and headers, choose a representation, and end the response. Most sending methods complete the request-response cycle. Once the response is sent, do not attempt to send a second one.

## Request Content-Type and response Accept

These headers describe different directions:

| Header | Direction | Meaning |
| --- | --- | --- |
| Content-Type | Client to server | Media type of the request body, such as application/json |
| Accept | Client to server | Response media types that the client is willing to receive |
| Content-Type in response | Server to client | Media type of the response body |

For JSON requests, the client commonly sends Content-Type: application/json. The server needs a parser such as express.json() registered before the route if the route needs req.body.

A parser generally examines Content-Type and ignores bodies whose type it does not handle. A JSON-looking body with a text/plain content type is not automatically a parsed JSON object. A missing or incorrect type can therefore result in req.body being undefined.

Accept does not describe the request body. If a client says Accept: application/json, it asks for a JSON response. It does not prove that the request body is JSON.

The next chapter covers body parser configuration and input validation.

## What a media type tells you

A media type names a representation format. Common types include:

| Media type | Typical content |
| --- | --- |
| application/json | JSON data |
| text/plain | Plain text |
| text/html | HTML markup |
| application/octet-stream | Binary data without a more specific type |
| application/x-www-form-urlencoded | Form fields encoded in a request body |

A media type does not validate the content. A request labeled application/json can still contain invalid JSON or valid JSON with the wrong fields. Parse it, then validate the resulting data against the rules of the endpoint.

Content-Encoding is separate from Content-Type. Content-Encoding describes a transformation such as gzip. Do not treat a compression encoding as a data format.

## Choose a status code that describes the outcome

A status code is part of the response, not a substitute for a useful response body. Select a code that matches the result.

| Code | Meaning | Common API use |
| --- | --- | --- |
| 200 OK | The request succeeded | Return a retrieved resource or a successful result |
| 201 Created | The request created a resource | Return the new resource and often its Location |
| 202 Accepted | Processing was accepted but is not complete | Queue a longer-running operation |
| 204 No Content | The request succeeded with no response body | Successful deletion or an update with no representation |
| 301 or 302 | A redirect response | Direct a client to another location when redirect semantics are intended |
| 304 Not Modified | A cached representation remains current | Conditional request handling |
| 400 Bad Request | The request is malformed or invalid | Invalid syntax or a failed input rule |
| 401 Unauthorized | Authentication is required or failed | Missing or invalid credentials |
| 403 Forbidden | The server refuses the operation | The caller is authenticated but lacks permission |
| 404 Not Found | The resource or route is unavailable | Unknown resource identifier or unmatched route |
| 406 Not Acceptable | No supported response representation meets Accept | The client rejects all formats the server can provide |
| 409 Conflict | The request conflicts with current resource state | Duplicate or incompatible state transition |
| 415 Unsupported Media Type | The request representation is not supported | A body media type the endpoint does not accept |
| 500 Internal Server Error | An unexpected server failure occurred | Unhandled application or infrastructure failure |

Status choices are part of the API contract. Keep them consistent and do not use a success code for a failed operation just to simplify client handling.

A 401 response is about authentication; a 403 response is about permission. A 406 concerns the response format requested through Accept. A 415 concerns the request representation identified by Content-Type.

## Set the status and send JSON

For a JSON API, return a status and a JSON value:

~~~javascript
app.get("/api/messages/:messageId", (req, res) => {
  const message = findMessage(req.params.messageId);

  if (!message) {
    return res.status(404).json({
      error: "Message not found."
    });
  }

  return res.status(200).json({
    message
  });
});
~~~

res.status(code) sets the HTTP status and is chainable. res.json(value) serializes the value as JSON and sets the JSON response Content-Type.

Prefer res.status(...).json(...) when an API's response contract is JSON. Do not use res.sendStatus(404) when the client expects a structured JSON error: sendStatus sends the status and its registered status message as the response body.

Use 204 only when there is no response representation to send:

~~~javascript
app.delete("/api/messages/:messageId", (req, res) => {
  removeMessage(req.params.messageId);
  return res.status(204).end();
});
~~~

A 204 response must not contain a response body. Use res.end() when an operation ends without a representation.

## Send text, HTML, and binary data

res.send() supports several types of bodies. Strings are sent as HTML, objects and arrays as JSON, and Buffers as binary data. Be deliberate about which representation you send.

~~~javascript
app.get("/health-text", (req, res) => {
  return res.type("text/plain").status(200).send("ok");
});

app.get("/status-page", (req, res) => {
  return res.type("html").status(200).send("<main><h1>Service status</h1></main>");
});
~~~

If content contains user-provided text, do not interpolate it into HTML without context-appropriate escaping. For JSON APIs, res.json() avoids treating a string as an HTML document.

Set an explicit type when the body type might be unclear:

~~~javascript
res.type("text/plain").send("Saved");
res.type("application/octet-stream").send(binaryBuffer);
~~~

res.type() accepts a MIME type or a known extension that resolves to one. res.set() can set a header directly:

~~~javascript
res.set("Cache-Control", "no-store");
res.set("X-Request-Id", requestId);
return res.status(200).json({ ready: true });
~~~

Set headers before sending or ending the response. After the response headers have been sent, they cannot be changed.

## Create a resource response

When a request creates a resource, 201 Created communicates that result. A Location header can identify the new resource:

~~~javascript
app.post("/api/messages", (req, res) => {
  const message = createMessage(req.body);

  return res
    .location("/api/messages/" + encodeURIComponent(message.id))
    .status(201)
    .json({ message });
});
~~~

The example assumes a validated request body and an application function that creates the resource. Do not treat the body as validated just because a JSON parser produced an object.

A response body can include the created resource, its identifier, or other documented details. Decide what clients need and keep the format consistent.

## Content negotiation with Accept

A client can use Accept to express supported response types. req.accepts() checks whether a candidate type is acceptable:

~~~javascript
app.get("/api/report", (req, res) => {
  if (req.accepts("application/json")) {
    return res.status(200).json({
      report: "daily"
    });
  }

  if (req.accepts("text/plain")) {
    return res.type("text/plain").status(200).send("daily report");
  }

  return res.status(406).json({
    error: "No supported response format was requested."
  });
});
~~~

For multiple representations, res.format() can map media types to response handlers:

~~~javascript
app.get("/report", (req, res) => {
  return res.format({
    "text/plain": () => {
      res.type("text/plain").send("Daily report");
    },
    "text/html": () => {
      res.type("html").send("<h1>Daily report</h1>");
    },
    "application/json": () => {
      res.json({
        title: "Daily report"
      });
    },
    default: () => {
      res.status(406).json({
        error: "No supported response format."
      });
    }
  });
});
~~~

When the Accept header does not specify a preference, a negotiation helper may choose the first available representation. When the header excludes every supported type, return 406 or provide a documented default.

If a cache can store different representations for the same URL, include Vary: Accept so the cache knows that the response changes based on that request header.

Content negotiation does not replace authentication, authorization, or input validation. It only selects a response representation.

## Check the request media type

req.is() checks the incoming Content-Type against a media type. It can help an endpoint reject an unsupported request representation:

~~~javascript
app.post("/api/import", (req, res, next) => {
  if (req.is("application/json") === false) {
    return res.status(415).json({
      error: "Send this request as application/json."
    });
  }

  return next();
});
~~~

req.is() can return null when the request has no body, false for a non-matching type, or a matching media type. Choose how an endpoint treats an absent body separately from a mismatched type.

A media-type check is not a parser and does not validate fields. Mount the matching parser before the route and validate the parsed value.

## Response headers and completion

A response can set headers, write a body, and then end. Most Express sending methods perform those steps and finish the response for you.

~~~javascript
res.set("Cache-Control", "no-store");
res.status(200).json({ saved: true });
~~~

After a response is sent, code should not continue to another handler that also tries to send a response. Return from branches that send:

~~~javascript
if (!record) {
  return res.status(404).json({
    error: "Record not found."
  });
}

return res.status(200).json({ record });
~~~

For streaming or file responses, headers can be sent before all body bytes finish transferring. Error handling must respect res.headersSent and delegate appropriately when a response has already started.

## Common mistakes

- Confusing the request Content-Type with the response Accept header.
- Assuming Accept describes the request body.
- Assuming a JSON-looking body is parsed without the right middleware and media type.
- Treating a Content-Type header as validation of the body fields.
- Returning a response with the wrong media type.
- Sending a string with res.send() when the intended response is JSON.
- Interpolating user input into HTML without escaping it.
- Using 401 for an authorization failure or 403 for missing authentication.
- Confusing 406 Not Acceptable with 415 Unsupported Media Type.
- Using 204 and then sending a body.
- Using res.sendStatus() when the client expects a JSON error object.
- Setting headers after the response has started.
- Sending two responses because a branch did not return.
- Exposing stack traces or internal exception messages to clients.
- Forgetting Vary: Accept when cacheable output changes by requested representation.

## Practical checklist

Before sending an HTTP response, ask:

- Does the status code match the actual outcome?
- Is the response body the representation the client requested?
- Does Content-Type describe the actual response body?
- Does this endpoint accept the request Content-Type?
- Has the request body been parsed and validated separately?
- Are required headers set before the response is sent?
- Does every branch send at most one response?
- Should the response include Location, Cache-Control, or Vary?
- Does a 204 response have no body?
- Are error responses safe and consistent?

## Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [039 - Routes, route parameters, and routers](039-routes-route-parameters-and-routers.md) | [Q&A](../qnas/040-requests-responses-and-content-types.md) | [Example](../examples/040-requests-responses-and-content-types.md) | [041 - Parse path, query, and body inputs](041-parse-path-query-and-body-inputs.md) |
