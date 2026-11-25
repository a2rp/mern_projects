# 002 - How Browsers, Servers, and Clients Communicate: Questions and Answers

Use this Q&A to check your understanding of the client-server model. Each answer includes an explanation so you can review the reasoning, not just memorize terms.

Related lesson: [002 - How browsers, servers, and clients communicate](../lessons/002-how-browsers-servers-and-clients-communicate.md)

## Multiple-choice questions

### 1. In a typical web visit, which program acts as the client?

- A. The browser
- B. The database collection
- C. The HTML heading
- D. The server's hard drive

**Answer: A. The browser.** The browser initiates requests for pages, files, or data. Client describes its role in that exchange.

### 2. What is a server in the client-server model?

- A. Always a separate physical computer
- B. Software that accepts requests and sends responses
- C. A special kind of browser tab
- D. A file format for images

**Answer: B. Software that accepts requests and sends responses.** Server describes a program's role. It can run on a remote computer, on a local development machine, or in another environment.

### 3. Can one program act as both a client and a server?

- A. No, those are permanent hardware types.
- B. Yes, its role depends on the communication.
- C. Only if it uses React.
- D. Only when the database is offline.

**Answer: B.** A program can accept a request in one exchange and make a request to another service in a different exchange.

### 4. What does an HTTP request commonly contain?

- A. A method, a target, headers, and sometimes a body
- B. Only a database document
- C. Only a response status
- D. A browser screen capture

**Answer: A.** A request communicates what the client wants and can include metadata and content. The exact fields depend on the request.

### 5. What does an HTTP response commonly contain?

- A. A status code, headers, and sometimes a body
- B. Only the client's screen size
- C. A React component tree
- D. The database password

**Answer: A.** The server sends a response that describes the result and may include content such as a page, JSON, or an error message.

### 6. Which response might an API return to a React application?

- A. JSON containing task records
- B. A physical server
- C. A browser window
- D. A package lockfile

**Answer: A.** An API commonly returns data such as JSON for the frontend to interpret and display.

### 7. Why might a browser send several requests after someone opens a page?

- A. It may need the document's stylesheet, scripts, images, and other resources.
- B. Browsers always send exactly one request.
- C. Each request creates a new database.
- D. A page cannot load without sending a password.

**Answer: A.** A page may reference multiple resources, and its scripts can make later API requests.

### 8. Where does the browser usually send an application data request in a MERN app?

- A. Directly to the database collection
- B. To the backend API
- C. To the CSS file
- D. To the React state setter

**Answer: B. To the backend API.** The backend validates the request, checks permissions, and controls database access.

### 9. What should client-side JavaScript do after receiving an HTTP response?

- A. Assume it is successful because the network completed.
- B. Check the response status and handle the returned content.
- C. Send the database password to MongoDB directly.
- D. Ignore the response body.

**Answer: B.** A server can return an HTTP error response even though the browser successfully received it. The client should check the status and respond appropriately.

### 10. What is the difference between a network failure and an HTTP error response?

- A. They are always exactly the same.
- B. A network failure means no usable HTTP response was received; an HTTP error is a response with an error status.
- C. An HTTP error means the browser is broken.
- D. Network failures only happen in React.

**Answer: B.** The browser may receive a 4xx or 5xx response from the server. If it cannot reach the server or the connection fails, it may receive no HTTP response at all.

### 11. Does using the same network connection prove that two requests came from the same signed-in user?

- A. Yes, connection reuse authenticates the user.
- B. No, authentication information must be provided and checked separately.
- C. Yes, if the app uses MongoDB.
- D. No, because browsers cannot send requests.

**Answer: B.** Connection reuse is a transport detail, not proof of user identity. The server must validate the application's authentication information.

### 12. Which statement best describes HTTP's stateless design?

- A. Each request's meaning can be understood without assuming that a prior request identified the user.
- B. A server cannot store data.
- C. A browser cannot remember anything.
- D. Every request must use a different server.

**Answer: A.** HTTP does not make a reused connection equivalent to a signed-in session. Applications can send and verify cookies or tokens to provide identity context.

## Short-answer questions

### 13. Explain the difference between a client and a server.

**Answer:** A client initiates a request. A server accepts a request and sends a response.

**Explanation:** These are roles in a particular communication. They do not necessarily refer to separate physical machines.

### 14. What might a web server return when the browser requests a page?

**Answer:** It may return an HTML document. The browser can then request related assets such as CSS, JavaScript, images, or fonts.

**Explanation:** The page and its resources may be delivered in multiple responses.

### 15. What might an API return instead of a complete page?

**Answer:** It may return structured data, commonly JSON, that a frontend such as React can use to update the interface.

**Explanation:** The API and the browser agree on an endpoint and a response format.

### 16. Why is an HTTP method useful?

**Answer:** It communicates the kind of operation a client is requesting, such as reading or creating a resource.

**Explanation:** Methods have defined semantics. The next lesson studies common methods and their intended use in more detail.

### 17. Why are headers different from a request body?

**Answer:** Headers carry metadata about the request, such as the type of content. The body carries submitted content when the request includes one.

**Explanation:** A request can have headers without a body. The meaning of the body depends on the endpoint and request.

### 18. What is one job a backend can perform before accessing MongoDB?

**Answer:** It can validate submitted values and check whether the caller is allowed to perform the requested action.

**Explanation:** The browser is controlled by the user; important data and permission checks belong on the server.

### 19. Why might an API request fail even though a page loaded correctly?

**Answer:** The page files and API are separate requests. The API may be unavailable, reject the input, deny access, or encounter a server or database problem.

**Explanation:** A successful page load does not guarantee that every later request will succeed.

### 20. What happens in local development if the browser and Express server run on one computer?

**Answer:** They still communicate as separate client and server programs through a local network address and HTTP request-response messages.

**Explanation:** Sharing a computer does not remove the communication boundary.

## Trace the communication

### 21. Put these steps in a sensible order for reading a task list:

- React displays the task data.
- The browser sends a request to the API.
- MongoDB provides the matching records to the backend.
- Express handles the request and asks the backend data layer for the records.
- The backend sends an HTTP response.

**Answer:**

1. The browser sends a request to the API.
2. Express handles the request and asks the backend data layer for the records.
3. MongoDB provides the matching records to the backend.
4. The backend sends an HTTP response.
5. React displays the task data.

**Explanation:** The data travels back from the database through the backend and response before React can display it.

### 22. A server returns a 404 response with a JSON error message. Did the browser necessarily have a network failure?

**Answer:** No. If the browser received the HTTP response, the network exchange completed sufficiently to receive a server response. The status indicates that the requested resource was not found.

**Explanation:** Network errors and HTTP status errors should be handled as separate cases.

### 23. The frontend and backend run on different local ports. Are they still separate programs?

**Answer:** Yes. Each program has its own process and address. The browser sends requests from the frontend context to the backend API address.

**Explanation:** Development tools may serve frontend files while a separate Express process handles API routes.

## Scenarios

### 24. A page loads, but the task list says “Could not load tasks.” Which part may have failed?

**Answer:** The later API request may have failed even though the initial page request succeeded. The API could be unreachable or could return an error.

**Explanation:** A web application can make multiple requests for different resources and operations.

### 25. A user changes a task ID in browser tools and submits an update request. What should the server do?

**Answer:** The server should validate the request and check that the signed-in user is permitted to update that specific task before changing it.

**Explanation:** The browser cannot enforce authorization. A client can send a request that does not come from the visible UI.

### 26. A developer says, “The user is safe because their request used HTTPS.” What is missing from that statement?

**Answer:** HTTPS protects communication in transit and helps the browser communicate with the intended server, but the application still needs authentication, authorization, input validation, and safe data handling.

**Explanation:** Secure transport does not by itself decide whether a user may perform a particular action.

## Review checklist

You are ready to move on when you can:

- Explain client and server as communication roles.
- Identify the common parts of an HTTP request and response.
- Describe why loading a page can involve several requests.
- Trace a React API request through Express and back.
- Distinguish a network failure from an HTTP error response.
- Explain why a connection alone does not authenticate a user.

---

### Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| :--- | --- | --- | ---: |
| [001 - Course overview and MERN architecture](../lessons/001-course-overview-and-mern-architecture.md) | [Q&A](002-how-browsers-servers-and-clients-communicate.md) | [Example](../examples/002-how-browsers-servers-and-clients-communicate.md) | [003 - HTTP requests, responses, methods, and status codes](../lessons/003-http-requests-responses-methods-and-status-codes.md) |
