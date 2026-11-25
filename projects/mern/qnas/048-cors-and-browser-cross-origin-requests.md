# 048 - CORS and browser cross-origin requests: Q&A

Use these questions to review browser origins, CORS response sharing, preflight behavior, Express configuration, and security boundaries.

## Multiple-choice questions

### 1. Which URL components define an origin?

- A. Scheme, host, and port
- B. Scheme, path, and query string
- C. Host, path, and fragment
- D. Port, query string, and fragment

**Answer: A.** An origin is the tuple of scheme, host, and port. The path, query, and fragment do not make two URLs different origins.

### 2. Are these URLs same-origin: http://localhost:5173/page and http://localhost:5173/api?

- A. No, because the paths differ
- B. Yes, because scheme, host, and port match
- C. No, because localhost cannot be same-origin
- D. Yes, only if both return JSON

**Answer: B.** Paths are not part of an origin. The scheme, host, and port are identical in these URLs.

### 3. What does CORS primarily control?

- A. Whether an API request is authenticated
- B. Whether browser JavaScript may read a cross-origin response
- C. Whether a server accepts TCP connections
- D. Whether a database accepts a query

**Answer: B.** CORS is a browser-enforced response-sharing mechanism. It does not authenticate users or secure the API route by itself.

### 4. What does a browser commonly send to identify the requesting page's origin?

- A. Access-Control-Allow-Origin
- B. Origin
- C. Allow
- D. Referer-Policy

**Answer: B.** The browser sends an Origin request header for CORS requests. The server uses its own policy to decide whether to include permission headers in the response.

### 5. Does CORS prevent curl or a server-to-server client from sending a request?

- A. Yes, CORS blocks every HTTP client
- B. Yes, unless the client uses JSON
- C. No, those clients do not enforce browser CORS rules
- D. Only if the server uses Express

**Answer: C.** CORS is enforced by browsers. Non-browser clients can send requests without following the browser's response-sharing checks.

### 6. Which HTTP method does a browser use for a CORS preflight?

- A. GET
- B. HEAD
- C. OPTIONS
- D. TRACE

**Answer: C.** A preflight uses OPTIONS and asks whether the intended future method and headers are allowed.

### 7. Which request commonly triggers a preflight?

- A. A simple GET with browser-safelisted headers
- B. A PATCH request
- C. A same-origin image request
- D. A normal same-origin navigation

**Answer: B.** PATCH is not one of the CORS-safelisted methods, so the browser normally preflights it. Custom request headers and JSON content type can also require preflight.

### 8. Which header in a preflight request names the intended future method?

- A. Access-Control-Allow-Methods
- B. Access-Control-Request-Method
- C. Allow
- D. Access-Control-Expose-Headers

**Answer: B.** Access-Control-Request-Method is sent by the browser to ask about the method it plans to use. Access-Control-Allow-Methods is a response header.

### 9. Which response header tells the browser which origin may read the response?

- A. Access-Control-Allow-Origin
- B. Access-Control-Allow-Headers
- C. Access-Control-Request-Headers
- D. Origin

**Answer: A.** Access-Control-Allow-Origin contains the permitted origin or, for non-credentialed requests, a wildcard. The browser checks it before exposing the response.

### 10. Can Access-Control-Allow-Origin be * for a request whose credentials mode is include?

- A. Yes, wildcard always permits credentials
- B. Yes, if the response is JSON
- C. No, the server must return the specific allowed origin
- D. No, credentialed cross-origin requests are never possible

**Answer: C.** Credentialed response sharing requires a specific origin and Access-Control-Allow-Credentials: true. A wildcard origin is not valid for this case.

### 11. What value must Access-Control-Allow-Credentials use to permit credentialed response sharing?

- A. true
- B. yes
- C. 1
- D. include

**Answer: A.** The header's value is the literal, case-sensitive string true. The server also has to return an explicit allowed origin.

### 12. Does a browser's CORS preflight request include the user's cookies?

- A. Yes, preflight always includes cookies
- B. No, the preflight itself is sent without credentials
- C. Only if Access-Control-Allow-Credentials was sent earlier
- D. It depends on the HTTP method

**Answer: B.** The browser preflight itself does not include credentials. The server's preflight response still needs to indicate credential support when the later actual request will include credentials.

### 13. What does Access-Control-Allow-Headers describe?

- A. Which response headers JavaScript can read
- B. Which request headers the browser may send after preflight
- C. Which routes exist on the server
- D. Which HTTP status codes are successful

**Answer: B.** It lists request headers permitted by the CORS policy, such as Content-Type and Authorization. It does not make those headers trustworthy or validate their values.

### 14. What does Access-Control-Expose-Headers do?

- A. Makes named response headers readable to browser JavaScript
- B. Lets the browser send any request header
- C. Prevents caching
- D. Allows the server to use a new HTTP method

**Answer: A.** Browser scripts can read only safelisted response headers and additional headers explicitly exposed by the server. Expose-Headers names those additional response headers.

### 15. When is Vary: Origin useful?

- A. When the server selects a response permission based on the request origin
- B. Whenever a request uses POST
- C. Only for same-origin requests
- D. To replace Access-Control-Allow-Origin

**Answer: A.** Vary: Origin tells caches that the response may differ according to the Origin request header. This helps avoid reusing one origin's response for another origin.

### 16. What is a likely result of setting Fetch mode to no-cors as a workaround?

- A. JavaScript can read any response
- B. The browser automatically adds credentials
- C. JavaScript receives an opaque response it cannot inspect normally
- D. The server disables its same-origin policy

**Answer: C.** no-cors does not grant ordinary response access. It produces an opaque response and is not a general fix for a missing CORS policy.

### 17. When application-level Express cors middleware is installed before the routes, what does it do for preflight requests?

- A. It automatically handles preflight requests for routes
- B. It authenticates every browser user
- C. It stores requests in MongoDB
- D. It changes the browser's origin

**Answer: A.** Application-level cors middleware handles preflight OPTIONS requests. Route-specific CORS middleware may require explicit OPTIONS handling.

### 18. If cors middleware does not add permission headers for an unlisted origin, does that prove the server did not process the request?

- A. Yes, CORS is a server firewall
- B. Yes, the browser never sends simple requests
- C. No, the request may still reach and be processed by the server
- D. Only when the request is POST

**Answer: C.** CORS mainly controls browser access to the response. Simple requests may still be sent, and non-browser clients do not enforce CORS at all.

### 19. Which security control must protect a cookie-authenticated state-changing route in addition to CORS?

- A. CSRF defenses
- B. Access-Control-Max-Age
- C. A wider origin wildcard
- D. The browser console

**Answer: A.** CORS is not a replacement for CSRF protections. Cookie-authenticated state-changing actions need appropriate server-side CSRF defenses.

### 20. Which origin-validation approach is safest for a small application with two known frontends?

- A. Allow every origin containing the product name
- B. Reflect every incoming Origin header
- C. Compare the complete origin against an explicit allowlist
- D. Allow any origin that uses HTTPS

**Answer: C.** Exact allowlist comparison avoids accidental permission for lookalike or attacker-controlled origins. Origins include scheme, host, and port.

## Short-answer questions

### 21. Why are localhost ports 5173 and 3000 different origins?

**Answer:** The port is part of the origin tuple. Even though both URLs use the same scheme and host, different ports mean different origins.

### 22. What does a CORS preflight request ask the server?

**Answer:** It asks whether the future cross-origin request is permitted, including its intended method and any non-safelisted request headers. It uses OPTIONS and does not perform the future operation.

### 23. What is the difference between Access-Control-Allow-Methods and the HTTP Allow header?

**Answer:** Access-Control-Allow-Methods is used by the browser's CORS check for a preflighted request. Allow describes methods supported by an HTTP resource, commonly alongside 405. Neither header replaces the server's actual route and method handling.

### 24. Why might a simple cross-origin request reach an API even when browser JavaScript later reports a CORS error?

**Answer:** The browser may send the request and then refuse to expose the response because the response lacks valid CORS headers. Therefore, CORS does not guarantee that the server never processes a request.

### 25. Why should dynamic origin selection use Vary: Origin?

**Answer:** Caches need to know that the response can vary with the Origin request header. Vary helps prevent a response prepared for one requesting origin from being reused for another.

### 26. What does an Origin header missing from a request tell the server?

**Answer:** It means the request does not need CORS response permission for browser script access. It does not identify a trusted user or prove that the request came from a safe client.

### 27. Why does allowing Authorization in CORS not authenticate a request?

**Answer:** CORS only allows the browser to send that header after the preflight and, if the response policy succeeds, read the response. The API still has to validate the token and authorize the requested action.

### 28. What additional conditions affect whether cross-origin cookies are sent?

**Answer:** The browser request must use credentials mode include, and cookie attributes and browser privacy rules must permit the cookie. CORS headers alone do not override SameSite, Secure, or other cookie policies.

### 29. Why should an application avoid allowing the literal null origin without a specific use case?

**Answer:** Sandboxed documents and some local or opaque-origin contexts can send a null origin. Allowing it broadly can grant access to more contexts than the application intended.

### 30. Where should Express CORS middleware generally appear in the middleware order?

**Answer:** Put it before authentication and route middleware that needs to answer browser preflight requests. The actual request must still go through normal authentication, authorization, validation, and route handling.

## Application questions

### 31. A React app at http://localhost:5173 calls an API at http://localhost:3000. The browser blocks the response because Access-Control-Allow-Origin is missing. What should you check first?

**Answer:** Confirm the exact frontend origin, including scheme and port, is in the API's allowlist. Confirm the API returns the corresponding Access-Control-Allow-Origin header and that any preflight receives the expected method and header permissions.

### 32. A PATCH request's OPTIONS preflight returns 401 because authentication middleware runs before CORS middleware. What should change?

**Answer:** Install CORS middleware before route-specific authentication so it can answer the preflight. Do not treat a successful preflight as authentication; the subsequent PATCH must still authenticate and authorize normally.

### 33. An unlisted website sends a simple GET. The API logs show it reached the route, but browser JavaScript cannot read the response. Is this expected?

**Answer:** Yes. A simple request can reach the server even when its response lacks permission headers for that origin. Keep the route's normal authorization and data-access controls in place.

### 34. A frontend uses fetch with credentials include, but the API returns Access-Control-Allow-Origin: *. Why can the browser reject the response?

**Answer:** Credentialed CORS responses cannot use the wildcard origin. The server must return the exact permitted origin and Access-Control-Allow-Credentials: true.

### 35. Postman can call the API but a browser application cannot read the response. Does that prove the API is healthy and CORS is configured correctly?

**Answer:** No. Postman does not enforce browser CORS. The server may be reachable while its response or preflight headers fail the browser's CORS check.

### 36. The OPTIONS request never reaches the API because an authentication middleware rejects it. What debugging and configuration steps are appropriate?

**Answer:** Inspect the browser Network panel to verify the failed preflight, then place CORS handling before route authentication or explicitly configure route preflight handling. Keep authentication on the actual request and do not grant access based only on Origin.

### 37. The API returns a Location header after creating a resource, but frontend JavaScript gets null when it reads that header. What CORS setting may be missing?

**Answer:** Add Location to Access-Control-Expose-Headers. CORS-safelisted response headers can be read by default, but other response headers must be exposed explicitly to browser JavaScript.

### 38. A developer proposes allowing any origin ending in example.test using a simple string suffix check. What is the risk and a safer option?

**Answer:** A careless suffix check can accept lookalike or attacker-controlled hosts. Compare the complete origin against an explicit allowlist or use a carefully designed parser and domain policy.

### 39. A developer changes fetch to mode no-cors, and the request appears to complete, but the code cannot inspect its JSON. Why, and what is the proper fix?

**Answer:** no-cors produces an opaque response that JavaScript cannot inspect normally. Configure the API's CORS policy for the intended frontend origin and request instead of hiding the response from the script.

### 40. A browser request passes CORS but receives 401 from the API. What does that indicate?

**Answer:** CORS permission succeeded enough for the browser to expose the HTTP response, but API authentication failed or credentials were not accepted. Fix the authentication flow independently; do not broaden CORS to turn a 401 into success.

## Chapter navigation

| Previous chapter | Lesson | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [047 - REST status codes and consistent response shapes](../lessons/047-rest-status-codes-and-consistent-response-shapes.md) | [Lesson](../lessons/048-cors-and-browser-cross-origin-requests.md) | [Example](../examples/048-cors-and-browser-cross-origin-requests.md) | [049 - Authentication concepts and threat modeling](../lessons/049-authentication-concepts-and-threat-modeling.md) |
