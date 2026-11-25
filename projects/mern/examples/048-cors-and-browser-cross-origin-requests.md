# 048 - CORS and browser cross-origin requests: example

This example configures an Express API to share selected responses with two known browser origins. It demonstrates normal CORS requests, a preflight, credentials, allowed and unlisted origins, and the important distinction between browser response access and API security.

The example code is provided for study. It is not executed as part of this lesson.

## Project setup

Create a Node.js project and install Express and the Express CORS middleware:

~~~bash
mkdir cors-api-example
cd cors-api-example
npm init -y
npm install express cors
~~~

Save the following as **server.js**:

~~~js
const express = require("express");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 3000;

const allowedOrigins = new Set([
  "http://localhost:5173",
  "https://app.example.test"
]);

const products = [
  { id: "p_101", name: "Notebook", stock: 12 },
  { id: "p_102", name: "Desk lamp", stock: 5 }
];

let nextOrderNumber = 501;

const corsOptions = {
  origin(origin, callback) {
    // No Origin means CORS permission is not needed.
    // It does not identify a trusted user or client.
    if (!origin) {
      return callback(null, false);
    }

    if (allowedOrigins.has(origin)) {
      return callback(null, origin);
    }

    // Do not give browser read permission to an unlisted origin.
    return callback(null, false);
  },
  methods: ["GET", "POST", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Location"],
  credentials: true,
  maxAge: 600,
  optionsSuccessStatus: 204
};

// CORS runs before parsing, authentication, and API routes.
// The middleware handles application-level OPTIONS preflights.
app.use(cors(corsOptions));
app.use(express.json());

app.get("/api/products", (req, res) => {
  return res.status(200).json({ data: products });
});

app.patch("/api/products/:id", (req, res) => {
  const product = products.find((item) => item.id === req.params.id);

  if (!product) {
    return res.status(404).json({
      error: {
        code: "PRODUCT_NOT_FOUND",
        message: "The requested product was not found."
      }
    });
  }

  if (!Number.isSafeInteger(req.body.stock) || req.body.stock < 0) {
    return res.status(400).json({
      error: {
        code: "INVALID_STOCK",
        message: "Stock must be a non-negative whole number."
      }
    });
  }

  product.stock = req.body.stock;

  return res.status(200).json({ data: product });
});

app.post("/api/orders", (req, res) => {
  const order = {
    id: "ord_" + nextOrderNumber,
    status: "pending"
  };

  nextOrderNumber += 1;

  return res
    .location("/api/orders/" + order.id)
    .status(201)
    .json({ data: order });
});

app.listen(port, () => {
  console.log("API listening on http://localhost:" + port);
});
~~~

Start the API in your own practice environment:

~~~bash
node server.js
~~~

The sample product data is stored in memory. Restarting the server resets the stock values.

## Make a browser request

A frontend served from **http://localhost:5173** can request the API at **http://localhost:3000**. Those URLs have different origins because their ports differ.

A simple GET can be made from the frontend:

~~~js
const response = await fetch("http://localhost:3000/api/products", {
  credentials: "include"
});

const result = await response.json();
console.log(result.data);
~~~

Because this request includes credentials mode, the server returns the exact allowed origin and the credentials header. If the frontend does not need cookies or other credentials, omit the credentials option and consider disabling credentialed CORS in the server configuration.

A PATCH request with JSON and an Authorization header requires a preflight:

~~~js
const response = await fetch("http://localhost:3000/api/products/p_101", {
  method: "PATCH",
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer example-token"
  },
  body: JSON.stringify({ stock: 11 })
});

const result = await response.json();
console.log(result.data);
~~~

The CORS policy permits the method and headers so the browser can make the actual request. This example does not implement authentication: a real API must validate the token and authorize the update independently. CORS permission is not proof that the caller is trusted.

## Inspect a normal CORS response

A command-line client does not enforce CORS, but it can show the headers sent by the API:

~~~powershell
curl.exe -i http://localhost:3000/api/products -H "Origin: http://localhost:5173"
~~~

The relevant response headers should include the requesting allowlisted origin, permission for credentials, and variation by Origin:

~~~http
HTTP/1.1 200 OK
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Access-Control-Allow-Credentials: true
Access-Control-Expose-Headers: Location
Content-Type: application/json; charset=utf-8

{"data":[{"id":"p_101","name":"Notebook","stock":12},{"id":"p_102","name":"Desk lamp","stock":5}]}
~~~

Other headers such as Date or X-Powered-By may also appear; they are not part of the CORS decision shown here.

## Inspect the preflight

The browser sends an OPTIONS request before the PATCH because it uses a non-safelisted method and request headers. You can inspect the same decision with curl:

~~~powershell
curl.exe -i -X OPTIONS http://localhost:3000/api/products/p_101 -H "Origin: http://localhost:5173" -H "Access-Control-Request-Method: PATCH" -H "Access-Control-Request-Headers: content-type,authorization"
~~~

The middleware should respond successfully and permit the requested method and headers:

~~~http
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET,POST,PATCH,OPTIONS
Access-Control-Allow-Headers: Content-Type,Authorization
Access-Control-Max-Age: 600
~~~

The preflight is not the PATCH itself. It asks whether the browser may send the PATCH. After a successful preflight, the browser sends the actual request, and the route still validates input and performs its normal security checks.

## Create a resource and read Location

The API returns a **Location** header when it creates an order. Since this header is not one of the response headers browser JavaScript can read by default, the CORS configuration exposes it:

~~~powershell
curl.exe -i -X POST http://localhost:3000/api/orders -H "Origin: http://localhost:5173" -H "Content-Type: application/json" -d '{}'
~~~

The response uses **201 Created** and includes Location:

~~~http
HTTP/1.1 201 Created
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Access-Control-Allow-Credentials: true
Access-Control-Expose-Headers: Location
Location: /api/orders/ord_501
Content-Type: application/json; charset=utf-8

{"data":{"id":"ord_501","status":"pending"}}
~~~

The frontend can now read that header:

~~~js
const response = await fetch("http://localhost:3000/api/orders", {
  method: "POST",
  credentials: "include",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({})
});

console.log(response.headers.get("Location"));
~~~

Without **Access-Control-Expose-Headers: Location**, the browser may receive the header but JavaScript cannot access it.

## Try an origin that is not allowed

Use a different origin value:

~~~powershell
curl.exe -i http://localhost:3000/api/products -H "Origin: https://unlisted.example.test"
~~~

The API route may still return its normal response body, but the CORS middleware does not send **Access-Control-Allow-Origin** for that origin:

~~~http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{"data":[{"id":"p_101","name":"Notebook","stock":12},{"id":"p_102","name":"Desk lamp","stock":5}]}
~~~

Curl displays the response because it does not apply browser CORS checks. Browser JavaScript at the unlisted origin cannot read this response. The request may still reach and be processed by the server, especially for simple requests, so route-level authentication and authorization remain necessary.

## Understand the credential rule

This configuration uses **credentials: true**, so it returns an explicit origin from the allowlist. It does not return a wildcard.

The following combination is invalid for credentialed browser response sharing:

~~~http
Access-Control-Allow-Origin: *
Access-Control-Allow-Credentials: true
~~~

For credentialed requests, use the exact allowed origin and the literal credentials value **true**. Browser cookies also depend on cookie settings such as SameSite and Secure and on browser privacy policy. CORS headers alone cannot force a cookie to be sent.

For a public API that does not need credentials, a wildcard origin can be appropriate:

~~~js
app.use(cors({
  origin: "*",
  credentials: false
}));
~~~

Use a wildcard only when any website is intentionally allowed to read those public responses. Do not combine it with credentials.

## Middleware order and security boundaries

CORS middleware is installed before JSON parsing and the API routes. Application-level CORS middleware handles preflight OPTIONS requests. If authentication middleware runs before preflight handling, a browser may receive an authentication failure instead of the CORS response it needs.

For an authenticated API, keep this order in mind:

1. CORS middleware handles browser CORS headers and preflight.
2. Body parsing handles the actual request body.
3. Authentication validates the user's credentials on the actual request.
4. Authorization checks whether that user may perform the operation.
5. The route validates input and performs its operation.

CORS is not a firewall. A non-browser client can send requests without following CORS rules, and a simple browser request can reach the API even if the response is later hidden. Do not use an origin allowlist as an authentication check.

Cookie-authenticated state-changing routes also need CSRF protections. CORS does not replace CSRF defenses.

## What to notice

- The origin includes the scheme, host, and port; a different port is a different origin.
- The server selects from an exact allowlist instead of reflecting every supplied Origin.
- The API responds to preflight before route handlers need to process the future request.
- The preflight response permits only configured methods and headers.
- Credentialed responses use an explicit origin, not a wildcard.
- Location is exposed so frontend JavaScript can read it.
- A disallowed origin does not receive CORS permission, but that alone does not prove the request was blocked at the server.
- Authentication, authorization, validation, and CSRF defenses remain separate responsibilities.

## Practice variations

- Remove PATCH from the configured method list and observe the browser preflight fail.
- Remove Authorization from allowedHeaders and observe the preflight fail for the Bearer-token request.
- Disable credentials and remove credentials: "include" from the frontend calls.
- Remove Location from exposedHeaders and check what response.headers.get returns in the browser.
- Add the real authentication and authorization middleware after CORS handling.
- Compare a browser request with curl and explain why only the browser enforces CORS.

## Chapter navigation

| Previous chapter | Lesson | Chapter Q&A | Next chapter |
| --- | --- | --- | --- |
| [047 - REST status codes and consistent response shapes](../lessons/047-rest-status-codes-and-consistent-response-shapes.md) | [Lesson](../lessons/048-cors-and-browser-cross-origin-requests.md) | [Q&A](../qnas/048-cors-and-browser-cross-origin-requests.md) | [049 - Authentication concepts and threat modeling](../lessons/049-authentication-concepts-and-threat-modeling.md) |
