# 047 - REST status codes and consistent response shapes: example

This example is a small Express 5 API that demonstrates accurate status codes and predictable JSON envelopes. It uses an in-memory array so the response behavior is easy to follow. Data resets whenever the server restarts; this is not a database implementation.

The example code is provided for study and is not executed as part of this lesson.

## What the example demonstrates

- **200 OK** for successful reads and updates that return a representation.
- **201 Created** plus **Location** when creating an order.
- **204 No Content** for deletion without a response body.
- **400**, **404**, **405**, **409**, **413**, **415**, and **500** responses.
- A shared success shape with **data** and optional **meta**.
- A shared error shape with a stable **code** and safe **message**.
- The **Allow** header for **405 Method Not Allowed**.
- Central handling for malformed or oversized JSON.
- No stack traces or internal exception messages in public responses.

## Project setup

Create a small Node.js project and install Express 5:

~~~bash
mkdir rest-status-example
cd rest-status-example
npm init -y
npm install express@5
~~~

Save the following as **server.js**:

~~~js
const express = require("express");

const app = express();
const port = process.env.PORT || 3000;

const orders = [
  {
    id: "ord_1001",
    customer: "Asha",
    status: "pending",
    total: 1250
  },
  {
    id: "ord_1002",
    customer: "Ravi",
    status: "shipped",
    total: 2400
  }
];

let nextOrderNumber = 1003;

function sendError(res, status, code, message, fields) {
  const error = { code, message };

  if (fields && fields.length > 0) {
    error.fields = fields;
  }

  return res.status(status).json({ error });
}

function sendMethodNotAllowed(res, allowedMethods) {
  res.set("Allow", allowedMethods);

  return sendError(
    res,
    405,
    "METHOD_NOT_ALLOWED",
    "This method is not supported for this resource."
  );
}

app.use(express.json({ limit: "16kb" }));

app.get("/api/orders", (req, res) => {
  const page = req.query.page === undefined ? 1 : Number(req.query.page);
  const limit = req.query.limit === undefined ? 20 : Number(req.query.limit);

  if (
    !Number.isSafeInteger(page) ||
    page < 1 ||
    !Number.isSafeInteger(limit) ||
    limit < 1 ||
    limit > 100
  ) {
    return sendError(
      res,
      400,
      "INVALID_PAGINATION",
      "Page must be positive and limit must be between 1 and 100."
    );
  }

  const start = (page - 1) * limit;
  const data = orders.slice(start, start + limit);

  return res.status(200).json({
    data,
    meta: {
      page,
      limit,
      total: orders.length
    }
  });
});

app.post("/api/orders", (req, res) => {
  if (!req.is("application/json")) {
    return sendError(
      res,
      415,
      "UNSUPPORTED_MEDIA_TYPE",
      "Send this request with Content-Type application/json."
    );
  }

  if (
    req.body === null ||
    typeof req.body !== "object" ||
    Array.isArray(req.body)
  ) {
    return sendError(
      res,
      400,
      "INVALID_BODY",
      "The request body must be a JSON object."
    );
  }

  const allowedFields = new Set(["customer", "total"]);
  const unknownFields = Object.keys(req.body).filter(
    (field) => !allowedFields.has(field)
  );

  if (unknownFields.length > 0) {
    return sendError(
      res,
      400,
      "UNKNOWN_FIELDS",
      "The request contains fields this operation does not accept.",
      unknownFields.map((field) => ({
        field,
        message: "This field is not allowed."
      }))
    );
  }

  const fields = [];

  if (
    typeof req.body.customer !== "string" ||
    req.body.customer.trim().length === 0 ||
    req.body.customer.trim().length > 100
  ) {
    fields.push({
      field: "customer",
      message: "Provide a name between 1 and 100 characters."
    });
  }

  if (
    typeof req.body.total !== "number" ||
    !Number.isFinite(req.body.total) ||
    req.body.total <= 0
  ) {
    fields.push({
      field: "total",
      message: "Total must be a positive number."
    });
  }

  if (fields.length > 0) {
    return sendError(
      res,
      400,
      "VALIDATION_FAILED",
      "Review the supplied fields.",
      fields
    );
  }

  const order = {
    id: "ord_" + nextOrderNumber,
    customer: req.body.customer.trim(),
    status: "pending",
    total: req.body.total
  };

  nextOrderNumber += 1;
  orders.push(order);

  return res
    .location("/api/orders/" + order.id)
    .status(201)
    .json({ data: order });
});

app.get("/api/orders/:id", (req, res) => {
  const order = orders.find((item) => item.id === req.params.id);

  if (!order) {
    return sendError(
      res,
      404,
      "ORDER_NOT_FOUND",
      "The requested order was not found."
    );
  }

  return res.status(200).json({ data: order });
});

app.patch("/api/orders/:id/cancel", (req, res) => {
  const order = orders.find((item) => item.id === req.params.id);

  if (!order) {
    return sendError(
      res,
      404,
      "ORDER_NOT_FOUND",
      "The requested order was not found."
    );
  }

  if (order.status === "shipped") {
    return sendError(
      res,
      409,
      "ORDER_STATE_CONFLICT",
      "A shipped order cannot be cancelled."
    );
  }

  order.status = "cancelled";

  return res.status(200).json({ data: order });
});

app.delete("/api/orders/:id", (req, res) => {
  const index = orders.findIndex((item) => item.id === req.params.id);

  if (index === -1) {
    return sendError(
      res,
      404,
      "ORDER_NOT_FOUND",
      "The requested order was not found."
    );
  }

  orders.splice(index, 1);

  return res.status(204).end();
});

app.all("/api/orders", (req, res) => {
  return sendMethodNotAllowed(res, "GET, HEAD, POST");
});

app.all("/api/orders/:id/cancel", (req, res) => {
  return sendMethodNotAllowed(res, "PATCH");
});

app.all("/api/orders/:id", (req, res) => {
  return sendMethodNotAllowed(res, "GET, HEAD, DELETE");
});

app.use((req, res) => {
  return sendError(
    res,
    404,
    "ROUTE_NOT_FOUND",
    "The requested route was not found."
  );
});

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  if (error.type === "entity.too.large") {
    return sendError(
      res,
      413,
      "REQUEST_TOO_LARGE",
      "The request body exceeds the allowed size."
    );
  }

  if (error.type === "entity.parse.failed") {
    return sendError(
      res,
      400,
      "MALFORMED_JSON",
      "The request body is not valid JSON."
    );
  }

  // Keep internal exception details in server logs, not in the response.
  console.error("Unhandled request error:", error);

  return sendError(
    res,
    500,
    "INTERNAL_ERROR",
    "An unexpected error occurred."
  );
});

app.listen(port, () => {
  console.log("API listening on http://localhost:" + port);
});
~~~

Run it in your own practice environment with:

~~~bash
node server.js
~~~

The server uses sample data in memory. Restarting it restores the two original orders.

## Try the endpoints

Use a second terminal. The commands use **curl.exe** so they work in Windows PowerShell as well as many other terminals.

### List orders

~~~powershell
curl.exe -i http://localhost:3000/api/orders
~~~

The response uses **200 OK** and puts the collection under **data**. Pagination values and total count appear under **meta**:

~~~http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{"data":[{"id":"ord_1001","customer":"Asha","status":"pending","total":1250},{"id":"ord_1002","customer":"Ravi","status":"shipped","total":2400}],"meta":{"page":1,"limit":20,"total":2}}
~~~

### Create an order

~~~powershell
curl.exe -i -X POST http://localhost:3000/api/orders -H "Content-Type: application/json" -d '{"customer":"Mira","total":899}'
~~~

The response is **201 Created**. **Location** identifies the new order, and the response body contains its representation:

~~~http
HTTP/1.1 201 Created
Location: /api/orders/ord_1003
Content-Type: application/json; charset=utf-8

{"data":{"id":"ord_1003","customer":"Mira","status":"pending","total":899}}
~~~

### Send invalid fields

~~~powershell
curl.exe -i -X POST http://localhost:3000/api/orders -H "Content-Type: application/json" -d '{"customer":"","total":0}'
~~~

This request receives **400 Bad Request** and a predictable field-error shape:

~~~http
HTTP/1.1 400 Bad Request
Content-Type: application/json; charset=utf-8

{"error":{"code":"VALIDATION_FAILED","message":"Review the supplied fields.","fields":[{"field":"customer","message":"Provide a name between 1 and 100 characters."},{"field":"total","message":"Total must be a positive number."}]}}
~~~

If the request omits the JSON content type, the endpoint responds with **415 Unsupported Media Type**. If the JSON is malformed, the parser error handler responds with **400 Bad Request**. A body above the configured 16 KB limit receives **413 Content Too Large**.

### Read a missing order

~~~powershell
curl.exe -i http://localhost:3000/api/orders/ord_missing
~~~

The response uses **404 Not Found** and the same error envelope:

~~~http
HTTP/1.1 404 Not Found
Content-Type: application/json; charset=utf-8

{"error":{"code":"ORDER_NOT_FOUND","message":"The requested order was not found."}}
~~~

### Attempt an invalid state transition

Order **ord_1002** is already shipped. The cancellation route returns **409 Conflict**:

~~~powershell
curl.exe -i -X PATCH http://localhost:3000/api/orders/ord_1002/cancel
~~~

~~~http
HTTP/1.1 409 Conflict
Content-Type: application/json; charset=utf-8

{"error":{"code":"ORDER_STATE_CONFLICT","message":"A shipped order cannot be cancelled."}}
~~~

### Use an unsupported method

The API allows GET, HEAD, and DELETE on an individual order. Sending POST to that path produces **405 Method Not Allowed** and an **Allow** header:

~~~powershell
curl.exe -i -X POST http://localhost:3000/api/orders/ord_1001
~~~

~~~http
HTTP/1.1 405 Method Not Allowed
Allow: GET, HEAD, DELETE
Content-Type: application/json; charset=utf-8

{"error":{"code":"METHOD_NOT_ALLOWED","message":"This method is not supported for this resource."}}
~~~

### Delete an order

~~~powershell
curl.exe -i -X DELETE http://localhost:3000/api/orders/ord_1001
~~~

The deletion succeeds with **204 No Content**. There is no JSON response body.

### Request an unknown route

~~~powershell
curl.exe -i http://localhost:3000/api/unknown
~~~

The catch-all route returns **404 Not Found** using the same error envelope:

~~~http
HTTP/1.1 404 Not Found
Content-Type: application/json; charset=utf-8

{"error":{"code":"ROUTE_NOT_FOUND","message":"The requested route was not found."}}
~~~

## What to notice

1. **Status and body agree.** Validation and missing-resource errors use 4xx statuses, state conflicts use 409, and unexpected failures use a safe 500 response.
2. **Success shapes are predictable.** Resource responses use **data**; collection pagination uses **meta**.
3. **Error shapes are predictable.** Errors use **error.code** and **error.message**, with optional field details.
4. **Protocol headers add meaning.** Creation uses **Location**, and unsupported methods use **Allow**.
5. **204 has no body.** The delete route ends the response without JSON.
6. **Internal details stay private.** The error handler logs unexpected failures but does not return the exception or stack trace.
7. **Storage is only a teaching stand-in.** A real application would use a database and add authentication, authorization, business validation, and an appropriate logging and test strategy.

## Practice variations

- Add a GET route for one order and compare it with the collection response.
- Add a route that accepts a report request and returns 202 with a job identifier.
- Add a deliberate 503 dependency failure and decide whether a Retry-After value is actually known.
- Use 422 for well-formed content with semantic field errors, then apply that policy consistently.
- Send a body larger than 16 KB and malformed JSON. Observe the status and safe error envelope.
- Add authentication and choose an accurate 401 challenge for the scheme the API supports.

## Chapter navigation

| Previous chapter | Lesson | Chapter Q&A | Next chapter |
| --- | --- | --- | --- |
| [046 - Validate and sanitize client input](../lessons/046-validate-and-sanitize-client-input.md) | [Lesson](../lessons/047-rest-status-codes-and-consistent-response-shapes.md) | [Q&A](../qnas/047-rest-status-codes-and-consistent-response-shapes.md) | [048 - CORS and browser cross-origin requests](../lessons/048-cors-and-browser-cross-origin-requests.md) |
