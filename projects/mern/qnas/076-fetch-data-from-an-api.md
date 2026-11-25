# 076 - Fetch data from an API: Q&A

These questions review the browser-to-API request cycle, Fetch behavior, JSON, HTTP status codes, React effects, CORS, and server-side validation.

## Multiple-choice questions

### 1. What does <code>fetch</code> normally return when it receives an HTTP 404 response?

- **A.** A rejected promise, always
- **B.** A fulfilled promise containing a <code>Response</code> whose status can be checked
- **C.** A MongoDB document
- **D.** A parsed React component

**Answer: B.** HTTP error statuses do not usually reject the Fetch promise. Check <code>response.ok</code> or <code>response.status</code> to decide whether the request succeeded.

### 2. What does <code>response.ok</code> indicate?

- **A.** The response status is in the successful 200–299 range
- **B.** The response body is guaranteed to be valid JSON
- **C.** The user is authorized
- **D.** The request used HTTPS

**Answer: A.** The property reflects whether the HTTP status is successful. It does not validate the response body or establish authorization.

### 3. What does <code>response.json()</code> do?

- **A.** Sends a second request to a JSON server
- **B.** Reads and parses the response body as JSON
- **C.** Converts every HTTP status to 200
- **D.** Validates data against a database schema

**Answer: B.** It asynchronously consumes the response body and parses it as JSON. Parsing can fail if the body is invalid or not JSON.

### 4. Why should a client check the status before calling <code>response.json()</code>?

- **A.** Some statuses indicate failure, and some successful responses such as 204 have no JSON body
- **B.** The browser cannot parse any response headers
- **C.** JSON is only allowed for POST
- **D.** Calling <code>response.json()</code> changes the URL

**Answer: A.** Check whether the status is appropriate for the endpoint and whether the contract expects a body. A 204 response has no content to parse.

### 5. Which header commonly tells an API that the request body is JSON?

- **A.** <code>Content-Type: application/json</code>
- **B.** <code>Accept-Language: JSON</code>
- **C.** <code>Cache-Control: database</code>
- **D.** <code>Origin: application/json</code>

**Answer: A.** A JSON request typically sets <code>Content-Type</code> to <code>application/json</code> and serializes the JavaScript value with <code>JSON.stringify</code>.

### 6. What is a common purpose of the <code>Accept: application/json</code> request header?

- **A.** It indicates the response representation the client can handle
- **B.** It changes the request method to POST
- **C.** It disables authentication
- **D.** It runs Express middleware

**Answer: A.** <code>Accept</code> communicates acceptable response media types. The server may use it when selecting a response format.

### 7. Which action should generally trigger a POST that creates a record?

- **A.** A user submits a create form
- **B.** A component renders
- **C.** A CSS media query matches
- **D.** A route parameter is read during render

**Answer: A.** A write operation should usually be initiated by the event that represents the user's action, such as submitting a form. Rendering a component is not a user confirmation.

### 8. Why can an Effect that creates a record be dangerous?

- **A.** It can run again when dependencies change or during development checks, repeating the mutation
- **B.** Effects cannot read strings
- **C.** Fetch does not support POST
- **D.** Effects always run on the server

**Answer: A.** Mutations caused by user intent belong in event handlers or an appropriate action mechanism. Effects should synchronize with external systems in response to rendering, not stand in for a user's action.

### 9. What is the purpose of aborting an obsolete GET request in an Effect cleanup?

- **A.** To stop or disregard work that no longer corresponds to the current component input
- **B.** To change the HTTP status to 200
- **C.** To delete the API record
- **D.** To bypass CORS

**Answer: A.** If an id changes or the component unmounts, the previous request may no longer be relevant. An <code>AbortController</code> can cancel the fetch and prevent stale results from being applied.

### 10. Which hook is commonly used for a GET that synchronizes with a component input such as <code>courseId</code>?

- **A.** <code>useEffect</code>
- **B.** <code>useParams</code> only
- **C.** <code>useMemo</code> only
- **D.** <code>useRef</code> only

**Answer: A.** A fetch associated with the visible resource can be synchronized in an Effect whose dependencies include the relevant id. Data routers or a cache library may be preferable in a larger application.

### 11. What should be included in an Effect dependency list when the request URL uses <code>courseId</code>?

- **A.** <code>courseId</code>
- **B.** No dependencies ever
- **C.** Only the page title
- **D.** The HTTP status code before the request exists

**Answer: A.** The Effect depends on values it uses to decide which external resource to synchronize with. Including <code>courseId</code> makes the request follow changes to that id.

### 12. What does CORS do in a browser application?

- **A.** Lets the server declare which browser origins may read cross-origin responses
- **B.** Authenticates all API users
- **C.** Encrypts a JSON body
- **D.** Replaces HTTPS

**Answer: A.** CORS response headers inform browsers whether JavaScript from a requesting origin may access a cross-origin response. CORS is not authentication or authorization.

### 13. What is a CORS preflight request?

- **A.** An OPTIONS request the browser may send to check whether a cross-origin request is permitted
- **B.** A database backup
- **C.** A React render before the first route
- **D.** A request that always includes a password

**Answer: A.** Some cross-origin requests require a preflight OPTIONS request so the browser can check server permissions before sending the actual request.

### 14. Why is <code>mode: "no-cors"</code> not a fix for a JSON API request?

- **A.** It produces an opaque response that JavaScript cannot inspect normally
- **B.** It automatically enables every server origin
- **C.** It changes the response into a MongoDB object
- **D.** It enables credentials on all requests

**Answer: A.** A no-cors response hides status, headers, and body from the calling JavaScript. Configure CORS on the server or use a development proxy.

### 15. What should happen before Express code reads a JSON request body from <code>req.body</code>?

- **A.** JSON parsing middleware such as <code>express.json()</code> should be installed before the route
- **B.** The React app should decode it with CSS
- **C.** The server must run <code>response.json()</code>
- **D.** CORS should be removed

**Answer: A.** Express needs JSON parsing middleware before routes that consume JSON request bodies.

### 16. What does a 201 status commonly communicate?

- **A.** A resource was created successfully
- **B.** The user is forbidden
- **C.** The server crashed
- **D.** The response has no body in every API

**Answer: A.** 201 Created is commonly used when a request successfully creates a resource. The API contract determines the response body.

### 17. What should a server do with client-submitted values?

- **A.** Validate them and enforce authorization on the server
- **B.** Trust them because React checked them first
- **C.** Store all values without inspection
- **D.** Use CORS instead of validation

**Answer: A.** The client can be bypassed. Validate data and authorize each protected operation at the server/API boundary.

### 18. Which statement about a frontend environment variable is correct?

- **A.** A value bundled into client code can be inspected by users
- **B.** It is always encrypted after compilation
- **C.** It is a secure place for a database password
- **D.** It cannot contain an API base URL

**Answer: A.** Frontend build variables are configuration, not secrets. A public API base URL is generally fine; private credentials belong on the server.

### 19. Which HTTP status best fits a successfully created resource?

- **A.** 201
- **B.** 401
- **C.** 404
- **D.** 500

**Answer: A.** 201 Created is the conventional response for successful creation. The API may return the new resource in its body.

### 20. Which statement about a 204 response is correct?

- **A.** It indicates success with no response content
- **B.** It always includes JSON
- **C.** It means the request is unauthorized
- **D.** It means the browser could not reach the network

**Answer: A.** A 204 No Content response should not be parsed as JSON because it has no response body.

## Short-answer questions

### 21. Describe the main steps from a React request to an API response.

**Answer:** The frontend sends an HTTP request, Express matches the route and runs middleware, the server validates input and access, it performs the necessary work, and it sends a status and response body. The frontend checks the status, parses the expected body, and updates its UI.

### 22. What is the difference between a network failure and an HTTP error status for <code>fetch</code>?

**Answer:** A network or transport failure generally rejects the Fetch promise. An HTTP error such as 404 generally resolves to a <code>Response</code>; the client must inspect <code>ok</code> or <code>status</code> and decide how to handle it.

### 23. Why can <code>response.json()</code> fail even when the server returned a response?

**Answer:** The body may be malformed JSON, HTML, empty when JSON was expected, or otherwise inconsistent with the API contract. Parsing the response body is a separate asynchronous step that can reject.

### 24. Why should an Effect that fetches by id include that id as a dependency?

**Answer:** The id determines which resource the Effect is synchronizing with. When it changes, the Effect should clean up the prior request and fetch the resource identified by the new value.

### 25. What does an <code>AbortController</code> do in a Fetch request?

**Answer:** Its signal can be passed to <code>fetch</code>. Calling <code>abort()</code> asks the browser to cancel that request, and the rejected operation can be recognized as an abort rather than shown as an ordinary request failure.

### 26. Why should a create or delete request usually be started from an event handler?

**Answer:** The mutation is caused by explicit user intent, such as submitting a form or selecting Delete. A rendering Effect may run again because the component remounted or dependencies changed, causing an unintended repeated write.

### 27. Explain why CORS does not protect an API from unauthorized users.

**Answer:** CORS controls whether browser JavaScript from an origin may read a response. It does not authenticate the caller and does not prevent command-line clients or servers from sending requests. The API still needs authentication and authorization.

### 28. When might a browser send a CORS preflight?

**Answer:** For some cross-origin requests that use non-simple methods, headers, or content types, the browser first sends an OPTIONS request to ask whether the actual request is permitted.

### 29. What is the difference between <code>Accept</code> and <code>Content-Type</code>?

**Answer:** <code>Accept</code> describes response media types the client can handle. <code>Content-Type</code> describes the media type of the request body being sent, such as JSON.

### 30. What kinds of work can a data-fetching library or router data API add beyond a basic Effect?

**Answer:** It can provide caching, request deduplication, revalidation, preloading, and coordinated loading behavior. A basic Effect is useful for learning and simple cases but does not provide those features automatically.

## Applied questions

### 31. A Fetch request returns a 404 response, but the UI treats it as success. What change is needed?

**Answer:** Check <code>response.ok</code> before processing the body as a successful result. For example:

~~~js
const response = await fetch("/api/courses/missing");

if (!response.ok) {
  throw new Error("Request failed with status " + response.status);
}

const course = await response.json();
~~~

Then handle the error in the page's request state.

### 32. A server successfully deletes a course and responds with 204. The client throws while parsing JSON. Why?

**Answer:** The client called <code>response.json()</code> even though 204 has no body. Treat a 204 as success without parsing JSON, or change the API contract to return a body and an appropriate status.

### 33. A POST request sends <code>{ title: "React" }</code> directly as <code>body</code>. What should be corrected?

**Answer:** Serialize the object and declare the JSON media type:

~~~js
fetch("/api/courses", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ title: "React" }),
});
~~~

The server should parse and validate the body.

### 34. A page starts requests for course ids A and then B. B returns first, then A returns and replaces it. What is the bug and one fix?

**Answer:** This is a stale-response race. Clean up the request when the id changes, for example with an <code>AbortController</code>, or ignore results from obsolete requests so A cannot overwrite B.

### 35. A developer sends a POST from <code>useEffect</code> when a checkout page renders. How should it change?

**Answer:** Trigger the POST from the explicit purchase or checkout submission event, not from rendering. The server should also protect the operation against accidental duplicate submissions when the domain requires that protection.

### 36. A frontend on <code>http://localhost:5173</code> requests an API on <code>http://localhost:3000</code> and the browser blocks reading the response. What should be checked?

**Answer:** They are different origins because their ports differ. Configure the API's CORS middleware to allow the intended frontend origin and required methods and headers, or configure the development server to proxy the API path.

### 37. A developer sets <code>mode: "no-cors"</code> so the request stops showing a CORS error, but cannot read the JSON. Explain and fix.

**Answer:** No-cors produces an opaque response that JavaScript cannot inspect normally. Remove it and configure the API's CORS headers or use a same-origin development proxy.

### 38. The browser API returns 400 for a request, but the server accepts an invalid value when called directly from another client. What needs changing?

**Answer:** Validation exists only in the frontend. Add server-side input validation to the Express endpoint and return an appropriate error status and safe message for invalid input.

### 39. A React app's production bundle includes a MongoDB password in a frontend environment variable. What should be done?

**Answer:** Remove the secret from frontend configuration and rotate it if it was exposed. Keep database credentials in server-only environment configuration; expose only public frontend configuration such as a non-secret API base URL.

### 40. A user can access a protected resource by calling its API URL directly even though the React page hides the link. What is missing?

**Answer:** The API route lacks server-side authentication or authorization enforcement. Check the user's identity and permission on every protected request; hiding a UI link does not secure the endpoint.

## Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [075 - Client-side routing and route layouts](../lessons/075-client-side-routing-and-route-layouts.md) | [Lesson](../lessons/076-fetch-data-from-an-api.md) | [Example](../examples/076-fetch-data-from-an-api.md) | [077 - Loading, error, empty, and success states](../lessons/077-loading-error-empty-and-success-states.md) |
