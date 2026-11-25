# 047 - REST status codes and consistent response shapes

An API response has a status code, headers, and sometimes a body. The status gives clients, browsers, proxies, and monitoring tools the broad outcome. Headers carry protocol details, and the body contains a representation or an explanation. These parts should agree.

A **200 OK** response containing **{ "success": false }** still tells HTTP clients that the request succeeded. For a failure, send an appropriate 4xx or 5xx status and a predictable error body.

## Learning goals

After this chapter, you should be able to:

- Choose suitable status codes for common API outcomes.
- Distinguish **201 Created**, **202 Accepted**, and **204 No Content**.
- Keep success and error response structures predictable.
- Include protocol headers required by statuses such as **201**, **401**, **405**, and **503**.
- Return safe public errors without exposing stack traces or internal details.

## Choose a status code that describes the result

These are commonly used statuses, not the entire HTTP status registry. Document your API policy and apply it consistently.

### Successful responses

| Status | Meaning | Typical use |
| --- | --- | --- |
| **200 OK** | The request succeeded and a representation is returned. | Read a resource, or update it and return the new representation. |
| **201 Created** | The request created a resource. | A successful create operation. Include a **Location** header for the new resource's canonical URL when available. |
| **202 Accepted** | The request was accepted but processing is not complete. | Start a background job and return a job identifier or status URL. Do not claim the work has already succeeded. |
| **204 No Content** | The request succeeded and has no response representation. | Delete a resource or update it when the API intentionally returns no body. |

For **201**, return the created resource when useful and identify its URL with **Location**:

~~~js
res
  .location("/api/orders/" + order.id)
  .status(201)
  .json({ data: order });
~~~

Use **202** only when work remains pending. A job identifier lets the client check its outcome later.

A **204** response has no body. End it without calling **json()**:

~~~js
res.status(204).end();
~~~

Do not send JSON with **204**. A **HEAD** response also has no body, even though its headers generally describe the corresponding **GET** response.

### Client and request errors

| Status | Meaning | Typical use |
| --- | --- | --- |
| **400 Bad Request** | The request cannot be processed as submitted. | Malformed JSON, invalid parameter syntax, or input that fails the API's validation policy. |
| **401 Unauthorized** | Authentication credentials are missing or invalid. | Missing, expired, or rejected credentials. Despite the name, this status concerns authentication. |
| **403 Forbidden** | The server refuses to authorize the request. | The caller is authenticated but lacks permission. |
| **404 Not Found** | The requested route or resource is unavailable. | Unknown route, missing record, or a deliberate policy to conceal a protected resource. |
| **405 Method Not Allowed** | The resource does not support this HTTP method. | A known path receives an unsupported method. Include an **Allow** header. |
| **409 Conflict** | The request conflicts with the resource's current state. | Duplicate operation, stale state, or an invalid state transition. |
| **413 Content Too Large** | Request content exceeds the accepted limit. | Oversized request body or upload. |
| **415 Unsupported Media Type** | The request media type is unsupported. | A JSON endpoint receives a different content type. |
| **422 Unprocessable Content** | The content is understood but its instructions cannot be processed. | An API may use this for well-formed content with semantic or field errors. |
| **429 Too Many Requests** | The client exceeded a rate limit. | Include **Retry-After** when the server can state when retrying is appropriate. |

Choose one clear validation policy. You can use **400** for all invalid input, or distinguish malformed requests (**400**) from well-formed but semantically invalid content (**422**). Do not switch between them arbitrarily.

A **401** response should include an appropriate **WWW-Authenticate** challenge when its authentication scheme requires one. A Bearer-token API, for example, can send **WWW-Authenticate: Bearer**. Do not advertise an authentication scheme the API does not support.

Use **403** when the API is willing to say access is denied. Some applications intentionally return **404** for a protected resource so they do not reveal its existence. Pick a policy and use it consistently.

When returning **405**, list the permitted methods:

~~~js
res
  .set("Allow", "GET, HEAD, PATCH, DELETE")
  .status(405)
  .json({
    error: {
      code: "METHOD_NOT_ALLOWED",
      message: "This method is not supported for this resource."
    }
  });
~~~

### Server and dependency errors

| Status | Meaning | Typical use |
| --- | --- | --- |
| **500 Internal Server Error** | An unexpected condition prevented the request from completing. | Unknown application failure after safe error mapping. |
| **502 Bad Gateway** | A gateway received an invalid upstream response. | A proxy or gateway cannot use a dependency's response. |
| **503 Service Unavailable** | The service is temporarily unable to handle the request. | Maintenance, overload, or an unavailable dependency. |
| **504 Gateway Timeout** | A gateway did not receive a timely upstream response. | An upstream service exceeded the gateway's time limit. |

Do not use **500** for a normal client mistake such as a missing field. Do not expose database diagnostics or stack traces to clients. Log diagnostic details privately with a request identifier and return a safe public message.

A **503** may include **Retry-After** if the service knows when it may be available again. Do not promise a retry time the system cannot support. Clients should not blindly retry non-idempotent operations, because that can repeat a side effect; use an idempotency strategy where needed.

## Keep success responses consistent

A simple API can wrap successful representations in **data**:

~~~json
{
  "data": {
    "id": "ord_123",
    "status": "pending"
  }
}
~~~

For a collection, include pagination metadata in a stable place:

~~~json
{
  "data": [
    { "id": "ord_123", "status": "pending" },
    { "id": "ord_124", "status": "shipped" }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 42
  }
}
~~~

Do not sometimes return an object directly, sometimes wrap it in **data**, and sometimes use an unrelated **result** field without a documented reason. The exact envelope is a design choice; clients should be able to predict it.

## Keep error responses consistent and safe

Use a stable machine-readable code and a safe message for people:

~~~json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Review the supplied fields.",
    "fields": [
      { "field": "quantity", "message": "Must be a positive whole number." }
    ]
  }
}
~~~

The **fields** property can be omitted when it does not apply. Keep the core **error** shape stable.

- Clients should branch on **code**, not on message wording.
- Field details should help a caller fix input without echoing the full request body.
- Stack traces, file paths, database messages, secrets, and internal exception details belong in private logs, not public responses.
- A standard Problem Details format is another option for interoperable error responses. Choose one contract and use it consistently.

## Match the status and response body

The HTTP status communicates the broad outcome. The body can explain it but must not contradict it.

~~~js
// Good: invalid input is an HTTP error.
res.status(400).json({
  error: {
    code: "INVALID_PAGE",
    message: "Page must be a positive whole number."
  }
});
~~~

Avoid **200 OK** with an error body:

~~~js
// Misleading: HTTP says this request succeeded.
res.status(200).json({
  success: false,
  message: "Page must be a positive whole number."
});
~~~

The status in the HTTP response is authoritative. Do not repeat it in JSON unless a documented client contract requires that property; if repeated, it must match.

## Express response pattern

Express can set the status and send JSON directly. Keep route-specific handling aligned with the shared error handler:

~~~js
app.get("/api/orders/:id", async (req, res, next) => {
  try {
    const order = await findOrder(req.params.id);

    if (!order) {
      return res.status(404).json({
        error: {
          code: "ORDER_NOT_FOUND",
          message: "The requested order was not found."
        }
      });
    }

    return res.status(200).json({ data: order });
  } catch (error) {
    return next(error);
  }
});
~~~

A shared error handler can map known application errors to their status, stable code, and safe message. Unknown failures should become safe **500** responses. The chapter on centralized API errors covers handler ordering and implementation.

Use **res.json()** for JSON responses: Express sets the JSON content type. Keep the response **Content-Type** consistent with the representation, and avoid manually serializing JSON when the framework helper expresses the intent.

## Status-code checklist

Before sending a response, ask:

1. Did the request succeed, fail because of the client, or fail unexpectedly on the server?
2. If successful, was a resource created, was work only accepted, or is there no representation?
3. If rejected, is the issue authentication, authorization, missing resource, conflict, input, media type, size, or rate limit?
4. Does the status call for a header such as **Location**, **WWW-Authenticate**, **Allow**, or **Retry-After**?
5. Does the body follow the same success or error shape as other endpoints?
6. Does the response avoid exposing secrets and implementation details?
7. Could retrying repeat a side effect?

## Summary

Choose a status that truthfully describes the outcome, send required headers, and return a stable representation. **200** means success; **201** means created; **202** means accepted but incomplete; and **204** means success with no body. Use 4xx statuses for request or access problems and 5xx statuses for server failures. Keep machine codes stable and public messages safe.

## Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [046 - Validate and sanitize client input](046-validate-and-sanitize-client-input.md) | [Q&A](../qnas/047-rest-status-codes-and-consistent-response-shapes.md) | [Example](../examples/047-rest-status-codes-and-consistent-response-shapes.md) | [048 - CORS and browser cross-origin requests](048-cors-and-browser-cross-origin-requests.md) |
