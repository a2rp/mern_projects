# 003 - HTTP Requests, Responses, Methods, and Status Codes

HTTP is the common request-response protocol used by browsers and web APIs. This lesson explains the parts of an HTTP request, the parts of a response, what common methods mean, and how status codes summarize a result.

You will use these ideas throughout the MERN course when React sends a request to an Express API.

## What you will learn

By the end of this lesson, you should be able to:

- Identify the method, target, headers, and optional body of a request.
- Identify the status code, headers, and optional body of a response.
- Choose a suitable common HTTP method for a resource operation.
- Explain safe and idempotent methods in beginner-friendly terms.
- Recognize common success, redirection, client-error, and server-error statuses.
- Check a response correctly in browser JavaScript.

## HTTP messages

HTTP communication uses messages. A client sends a **request** and a server sends a **response**.

A request commonly includes:

1. **Method:** the kind of operation the client is asking for.
2. **Target:** the path and optional query string for the resource.
3. **Headers:** metadata about the request, such as the accepted response format.
4. **Body:** optional content sent with the request, such as JSON.

A response commonly includes:

1. **Status code:** a number describing the result at the HTTP level.
2. **Headers:** metadata about the response, such as its content type.
3. **Body:** optional response content, such as JSON or an error explanation.

A simplified request could look like this:

~~~http
POST /api/tasks HTTP/1.1
Accept: application/json
Content-Type: application/json

{
  "title": "Study HTTP"
}
~~~

A simplified response might look like this:

~~~http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "task": {
    "id": "task-42",
    "title": "Study HTTP",
    "completed": false
  }
}
~~~

These examples use the readable HTTP/1.1 message form to illustrate the meaning of the fields. HTTP versions can frame messages differently, while keeping the core semantics of methods, status codes, and metadata.

## Request targets and query strings

The **path** identifies the endpoint or resource. A query string can carry parameters that refine a request, often for filtering, sorting, or pagination.

~~~text
GET /api/tasks?completed=false&limit=10
~~~

Here, **/api/tasks** is the path. The query parameters are **completed=false** and **limit=10**. They do not change the method; the method is still GET.

In Express, an API may read information from route parameters, query parameters, and a request body. Later chapters explain how to parse, validate, and use each source safely.

## Common HTTP methods

Methods communicate the intended operation. The server still decides whether that method is supported for a particular resource and whether the caller is allowed to use it.

| Method | Common API use | Important idea |
| --- | --- | --- |
| GET | Read a list or one resource | Intended to retrieve a representation; should not request a state change |
| HEAD | Check response metadata | Like GET, but the response has no content body |
| POST | Submit data or create a resource | The server applies resource-specific processing |
| PUT | Replace a resource representation | Send the complete new representation; repeated identical requests have the same intended effect |
| PATCH | Partially modify a resource | Send only the changes defined by the API's patch format |
| DELETE | Remove a resource | Request removal; repeating the request has the same intended end state |

These are common conventions, not a complete description of every API. Follow the API contract, because the method's semantics matter.

### POST does not always mean “create”

Many APIs use POST to create a new resource, but HTTP defines POST more generally as asking the target resource to process the submitted content according to its own rules. A POST endpoint can perform another kind of operation as well.

### PUT and PATCH are different

PUT is normally used to replace the target resource representation. PATCH is used to apply a partial modification. An API should document which fields each operation accepts and what happens to fields that are not sent.

Do not assume that every API implements identical update behavior. Follow the endpoint's documented contract.

## Safe and idempotent methods

A **safe** method is intended for retrieval and does not ask the server to change application state. GET is the common safe method used in this course. A server may still record ordinary operational information, such as a request log; that does not change what the client asked GET to do.

An **idempotent** method has the same intended effect if the same request is applied once or multiple times. PUT and DELETE are idempotent by HTTP semantics, as are safe methods. The response can differ between attempts. For example, deleting an item might return success the first time and not-found the next time, even though the intended end state remains that the item is absent.

POST is not generally idempotent. Repeating a create request could create two records. A client should not blindly retry an operation that may have already succeeded.

PATCH behavior depends on the patch operation. Some patches are idempotent, while others are not. Do not assume a PATCH can always be retried safely.

## Headers describe the message

Headers carry metadata. These two commonly appear with JSON APIs:

- **Accept** tells the server which response media types the client can handle.
- **Content-Type** tells the recipient the media type of the content in the message body.

For example, a browser can send **Accept: application/json** to indicate it expects JSON. When it sends a JSON body, it should include **Content-Type: application/json**.

A response with a JSON body commonly includes **Content-Type: application/json**. The client should read the response according to its actual content type and the API contract.

Headers do not replace the body. A content type describes a body; it is not the submitted data itself.

## Status-code classes

The first digit groups status codes into broad classes:

| Class | Meaning | General interpretation |
| --- | --- | --- |
| 1xx | Informational | The request is continuing or a protocol step is in progress |
| 2xx | Successful | The request succeeded or was accepted |
| 3xx | Redirection | More action is needed to complete the request, often following a redirect |
| 4xx | Client error | The request cannot be fulfilled as sent, or access is refused |
| 5xx | Server error | The server failed to fulfill an otherwise valid request |

A client should understand the class even if it does not recognize a particular code. The specific code and response body can provide more detail.

## Common status codes

| Status | Name | Common meaning |
| --- | --- | --- |
| 200 | OK | The request succeeded; the response often includes the requested data |
| 201 | Created | A resource was created; the response often identifies or represents it |
| 202 | Accepted | The request was accepted for processing, but processing may not be complete |
| 204 | No Content | The request succeeded and there is no response body |
| 301 / 302 | Redirect statuses | The client is directed to another location; exact behavior depends on the code and request |
| 304 | Not Modified | A conditional request can use a cached representation |
| 400 | Bad Request | The server cannot or will not process the request as sent, often because it is malformed |
| 401 | Unauthorized | The request lacks valid authentication credentials for the resource |
| 403 | Forbidden | The server understood the request but refuses to fulfill it |
| 404 | Not Found | The requested resource was not found |
| 405 | Method Not Allowed | The method is known but not allowed for this resource; the server should indicate allowed methods |
| 409 | Conflict | The request conflicts with the current state of the resource |
| 415 | Unsupported Media Type | The server does not support the request content format |
| 422 | Unprocessable Content | The request content is understood but its instructions cannot be processed |
| 429 | Too Many Requests | The client has sent too many requests in a period of time |
| 500 | Internal Server Error | An unexpected server failure occurred |
| 502 | Bad Gateway | A gateway or proxy received an invalid response from an upstream server |
| 503 | Service Unavailable | The server is temporarily unable to handle the request |

Use the most precise code that fits the API's contract. A status code is not a substitute for a helpful response body, and the body should not reveal private implementation details.

### 401 and 403

These are easy to confuse:

- **401** means valid authentication credentials are missing or were not accepted.
- **403** means the server understood the request but refuses to fulfill it.

In everyday API designs, a 401 commonly means “sign in or provide valid credentials,” while a 403 commonly means “you are signed in, but this action is not allowed.” The server remains responsible for the actual authentication and authorization checks.

### 201 and 204

- Use **201 Created** when the request created a resource. The response can include the new resource or a location identifying it.
- Use **204 No Content** when the operation succeeded and there is no response body.

Do not try to parse JSON from a 204 response because there is no response content to parse.

## An HTTP error is still a response

An HTTP status in the 4xx or 5xx range is still a response from the server. In browser JavaScript, fetch normally resolves with a Response object for such an HTTP response; the code must inspect its status.

A network failure is different: the browser may not receive an HTTP response at all, and the fetch promise may reject. A robust interface should handle both conditions.

~~~js
async function loadTasks() {
  const response = await fetch("/api/tasks", {
    headers: {
      Accept: "application/json"
    }
  });

  const body = await response.json();

  if (!response.ok) {
    throw new Error(body.error || "The server could not load tasks.");
  }

  return body.tasks;
}
~~~

This function expects the API to return JSON, including for errors. If an endpoint returns 204, the client must not call response.json(); handle that operation separately.

## A simple decision process

Before making an API request, ask:

1. **Which resource?** Choose the target path.
2. **What operation?** Choose a method whose meaning fits the action.
3. **What data?** Place filters in the query string and submitted content in the body as defined by the API.
4. **What format?** Set request headers such as Content-Type when sending a body and Accept when a response format is expected.
5. **What result?** Check the status code and handle the response body according to its content type.
6. **What if it fails?** Distinguish an HTTP error response from a network failure and show a useful state.

## Common misunderstandings

- **GET is a way to create records.** GET is intended for retrieval; use an operation with semantics suited to the requested change.
- **POST always means create.** POST asks the target resource to process the submitted content; creating a resource is a common use.
- **PUT and PATCH mean the same thing.** PUT normally replaces a representation; PATCH applies a partial modification.
- **A 404 response means the browser could not connect.** A 404 is an HTTP response; a connection failure is different.
- **Any 2xx code means a JSON body exists.** 204 explicitly has no response body.
- **A fetch promise resolving means the request succeeded.** It may have resolved with a 4xx or 5xx response; check response.ok or the status.
- **401 and 403 are interchangeable.** They communicate different authentication and refusal conditions.
- **Repeating a request is always safe.** Repeating a non-idempotent request can repeat its effect.

## Try it yourself

1. Choose a method for reading a list of products and explain why.
2. Choose a method for asking an API to create a new product.
3. Explain the difference between replacing a resource and partially updating it.
4. What does a server communicate with status 201?
5. Why should a client not try to parse JSON from a 204 response?
6. A request receives 403. What does that tell you, and what does it not tell you?
7. The browser cannot connect to the API. Is that the same as receiving status 500?
8. Why can blindly retrying a POST request create duplicate records?
9. What does an Accept header describe? What does Content-Type describe?
10. Which class of status code generally represents a server-side failure?

## Key points

- An HTTP request has a method, target, headers, and sometimes a body.
- An HTTP response has a status code, headers, and sometimes a body.
- Choose methods according to their defined semantics and the API's contract.
- Safe methods are intended for retrieval; idempotent methods have the same intended effect when repeated.
- Status-code classes give a broad result, while individual codes provide more detail.
- A 204 response has no body; 201 commonly signals that a resource was created.
- HTTP error responses are different from network failures.
- Check the response status before treating a fetch result as successful.

---

### Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| :--- | --- | --- | ---: |
| [002 - How browsers, servers, and clients communicate](002-how-browsers-servers-and-clients-communicate.md) | [Q&A](../qnas/003-http-requests-responses-methods-and-status-codes.md) | [Example](../examples/003-http-requests-responses-methods-and-status-codes.md) | [004 - JSON and API data basics](004-json-and-api-data-basics.md) |
