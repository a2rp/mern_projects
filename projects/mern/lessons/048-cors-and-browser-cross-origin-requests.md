# 048 - CORS and browser cross-origin requests

A browser page and an API can have different **origins** even when they belong to the same project. The browser applies the same-origin policy to script-initiated requests. Cross-Origin Resource Sharing, or **CORS**, is a server opt-in that tells browsers which origins may read a response.

CORS is a browser response-sharing mechanism. It is not authentication, authorization, a firewall, or a general way to stop requests from reaching an API.

## Learning goals

After this chapter, you should be able to:

- Determine whether two URLs have the same origin.
- Explain why browser JavaScript may be blocked from reading an API response.
- Recognize when a browser sends a preflight OPTIONS request.
- Configure an explicit origin allowlist in Express.
- Understand how credentials, wildcard origins, and cache variation affect CORS.
- Debug CORS without confusing it with server reachability, authentication, or CSRF.

## What is an origin?

An origin consists of a URL's **scheme**, **host**, and **port**. The path is not part of an origin.

| URL A | URL B | Same origin? | Reason |
| --- | --- | --- | --- |
| **http://localhost:5173/page** | **http://localhost:5173/api** | Yes | Scheme, host, and port match; paths may differ. |
| **http://localhost:5173** | **http://localhost:3000** | No | The ports differ. |
| **http://localhost:5173** | **https://localhost:5173** | No | The schemes differ. |
| **https://app.example.test** | **https://api.example.test** | No | The hosts differ. |

A local React development server at **http://localhost:5173** and an Express API at **http://localhost:3000** are cross-origin, even though both use localhost.

Do not confuse **origin** with **site**. They are different browser concepts. CORS checks origins.

## What CORS does

When browser JavaScript makes a cross-origin request, the browser sends an **Origin** request header. The API can respond with CORS headers that state whether that browser origin may access the response.

For example:

~~~http
GET /api/products HTTP/1.1
Host: localhost:3000
Origin: http://localhost:5173
~~~

A response that permits this origin can include:

~~~http
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Content-Type: application/json
~~~

The browser checks the response headers before exposing the response to the calling script. If the origin is not allowed or a required CORS header is missing, browser JavaScript cannot read the response. The server may still have received and processed the request.

CORS does not stop a command-line client, server-to-server request, or other non-browser program. It is not a substitute for authentication or authorization.

## Simple requests and preflight

Some cross-origin requests can be sent without a preflight. These are often called **simple requests**. At a high level, this includes certain GET, HEAD, and POST requests with browser-safelisted request headers and content types.

Other requests are preceded by a browser-generated **preflight**. Common reasons include:

- Using a method such as PUT, PATCH, or DELETE.
- Sending a header such as Authorization.
- Sending JSON with Content-Type set to application/json.

The browser first asks the API whether the intended method and headers are permitted:

~~~http
OPTIONS /api/orders/ord_1001 HTTP/1.1
Origin: http://localhost:5173
Access-Control-Request-Method: PATCH
Access-Control-Request-Headers: content-type
~~~

A successful preflight response can look like this:

~~~http
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Methods: GET, POST, PATCH, DELETE
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Max-Age: 600
Vary: Origin
~~~

The browser sends the actual PATCH only if the preflight succeeds. The preflight is an OPTIONS request about the future request; it does not perform the future action.

A successful preflight does not guarantee the actual endpoint will succeed. The actual request still needs a valid route, valid authentication and authorization where required, and a successful application response.

## CORS response headers

| Header | Purpose |
| --- | --- |
| **Access-Control-Allow-Origin** | Names an allowed origin, or **\*** for requests that do not use credentials. |
| **Access-Control-Allow-Credentials** | Must be **true** when the browser is allowed to share a response to a credentialed request. |
| **Access-Control-Allow-Methods** | Lists methods permitted by the CORS policy for a preflighted request. |
| **Access-Control-Allow-Headers** | Lists request headers the browser may send for a preflighted request. |
| **Access-Control-Expose-Headers** | Names response headers browser JavaScript may read in addition to the CORS-safelisted response headers. |
| **Access-Control-Max-Age** | Tells browsers how long they may cache a successful preflight decision. |
| **Vary: Origin** | Helps caches keep responses separate when the allowed origin is selected dynamically. |

CORS Access-Control-Allow-Methods is part of browser permission checking. It does not replace the API's actual route or HTTP method handling.

## Credentials and wildcard origins

A browser request can include credentials such as cookies when its Fetch credentials mode is **include**. Cross-origin cookies also depend on cookie attributes and browser privacy rules; CORS headers alone do not override those rules.

When allowing credentialed responses:

- Return the specific allowed origin, such as **http://localhost:5173**.
- Include **Access-Control-Allow-Credentials: true**.
- Do not combine credentials with **Access-Control-Allow-Origin: \***.
- Allow only the origins that actually need access.

A Fetch call that uses cookies can set **credentials: "include"**. The server must explicitly permit the exact origin and credentials for browser JavaScript to read the response.

The browser's preflight request itself does not include credentials. The response still needs to indicate that credentialed access is supported for the subsequent actual request.

A Bearer token placed in an Authorization header also causes a preflight because that header is not safelisted. Allowing the header in CORS does not validate the token; the API must authenticate it separately.

## CORS is not request protection

CORS controls whether browser scripts can read a response. It does not reliably prevent requests from being sent:

- A simple cross-origin request may reach the server even if the browser later hides its response.
- A non-browser client can send a request without following CORS rules.
- An allowed origin is not proof of a trusted user; origins can be spoofed outside a browser.
- CORS does not replace authentication, authorization, input validation, or rate limiting.
- CORS does not replace CSRF defenses for cookie-authenticated state-changing actions.

A browser can prevent a preflighted actual request when the preflight is denied. That behavior is useful, but it does not make CORS an access-control system for the API. Enforce user permissions on every protected route.

Avoid **mode: "no-cors"** as a workaround. It produces an opaque response that JavaScript cannot inspect, and it does not make a normal API response readable.

## Configure CORS in Express

The Express **cors** middleware sets CORS headers and handles application-level preflight requests when installed before the routes. Install the package in the API project:

~~~bash
npm install cors
~~~

Use an exact origin allowlist. The following example supports a browser frontend on the local development origin and a deployed frontend origin:

~~~js
const express = require("express");
const cors = require("cors");

const app = express();

const allowedOrigins = new Set([
  "http://localhost:5173",
  "https://app.example.test"
]);

const corsOptions = {
  origin(origin, callback) {
    // A missing Origin needs no CORS permission; it is not a user identity.
    // They can still reach the routes and need normal server-side controls.
    if (!origin) {
      return callback(null, false);
    }

    if (allowedOrigins.has(origin)) {
      return callback(null, origin);
    }

    // Do not add CORS permission for an unlisted browser origin.
    return callback(null, false);
  },
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Location"],
  credentials: true,
  maxAge: 600,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.use(express.json());

// Define API routes after CORS middleware.
app.get("/api/products", (req, res) => {
  res.json({
    data: [
      { id: "p_101", name: "Notebook" },
      { id: "p_102", name: "Desk lamp" }
    ]
  });
});
~~~

When the frontend does not use cookies or other included credentials, set **credentials: false** or omit the option. A Bearer token in an Authorization header still needs to be listed in **allowedHeaders**.

Install CORS middleware before authentication and routes that may handle browser requests. This allows preflight OPTIONS requests to receive CORS headers before route-specific authentication runs. The actual request must still pass authentication and authorization.

If the CORS policy reflects one of several configured origins, responses should vary by the Origin request header so caches do not serve a response authorized for one origin to another. The middleware handles this for origin reflection.

## Avoid unsafe origin matching

Do not accept every origin merely because its text contains a trusted domain. A check such as **origin.endsWith("example.test")** can accept a lookalike or attacker-controlled host if written carelessly. Compare exact origins against a deliberate allowlist or use a carefully designed parser and domain policy.

Treat the incoming Origin value as untrusted input. Avoid allowing the literal **null** origin unless there is a specific, reviewed use case. Sandboxed documents and some local contexts can produce it.

Do not copy a request's Origin into Access-Control-Allow-Origin without checking it against the allowlist. Reflecting arbitrary origins effectively grants every website permission to read responses.

## Debugging checklist

If a browser reports a CORS error:

1. Read the browser console's origin, URL, and missing or invalid header details.
2. Check the Network panel for both the OPTIONS preflight and the actual request.
3. Confirm that the API is reachable and that the server responds to OPTIONS before protected route handlers.
4. Compare the request's Origin exactly, including scheme and port, with the allowlist.
5. Check whether the request uses a non-safelisted method, JSON content type, or custom header.
6. Confirm the response allows the requested method and headers.
7. If credentials are included, confirm the response uses an explicit allowed origin and **Access-Control-Allow-Credentials: true**, never a wildcard origin.
8. Check whether a redirect, proxy, load balancer, or error handler is dropping CORS headers.
9. Test server reachability separately with a command-line client, remembering that command-line tools do not enforce CORS.
10. Keep authentication and authorization checks in place even after the browser CORS error is fixed.

## Summary

CORS is a browser-enforced response-sharing policy based on origins. Configure an explicit allowlist, handle preflight requests, and match methods, headers, and credentials to the frontend's needs. Do not use CORS as authentication or as a replacement for CSRF defenses; secure the API routes independently.

## Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [047 - REST status codes and consistent response shapes](047-rest-status-codes-and-consistent-response-shapes.md) | [Q&A](../qnas/048-cors-and-browser-cross-origin-requests.md) | [Example](../examples/048-cors-and-browser-cross-origin-requests.md) | [049 - Authentication concepts and threat modeling](049-authentication-concepts-and-threat-modeling.md) |
