# 003 - HTTP Requests, Responses, Methods, and Status Codes: Questions and Answers

Use these questions to review HTTP messages, common methods, status-code classes, and how browser code should handle responses. Each answer includes an explanation.

Related lesson: [003 - HTTP requests, responses, methods, and status codes](../lessons/003-http-requests-responses-methods-and-status-codes.md)

## Multiple-choice questions

### 1. Which list contains common parts of an HTTP request?

- A. Method, target, headers, and optional body
- B. Status, browser window, and database
- C. React component, route, and collection
- D. Only a body

**Answer: A. Method, target, headers, and optional body.** A request communicates what the client wants and may include metadata and submitted content.

### 2. What does a Content-Type request header describe?

- A. Which response format the client prefers
- B. The media type of the content in the request body
- C. The status code
- D. The user's permission

**Answer: B.** Content-Type tells the recipient what format the message body uses, such as JSON.

### 3. What does an Accept request header communicate?

- A. Which response media types the client can handle
- B. The content type of the request body
- C. The server's database name
- D. Whether the request is authorized

**Answer: A.** Accept expresses which response formats the client is prepared to receive.

### 4. Which method is commonly used to retrieve a resource?

- A. GET
- B. POST
- C. DELETE
- D. PATCH

**Answer: A. GET.** GET asks for a current representation of a target resource and is intended to be safe.

### 5. Which statement best describes POST?

- A. It always replaces a complete resource.
- B. It always deletes a resource.
- C. It asks the target resource to process the submitted content according to its rules.
- D. It must never have a request body.

**Answer: C.** Creating a resource is a common use of POST, but the method is not limited to creation.

### 6. Which method is normally used to replace a resource representation?

- A. GET
- B. PUT
- C. HEAD
- D. OPTIONS

**Answer: B. PUT.** PUT commonly sends the complete representation that should replace the current one. Follow the API's documented contract.

### 7. Which method commonly applies a partial change to a resource?

- A. PATCH
- B. HEAD
- C. GET
- D. TRACE

**Answer: A. PATCH.** PATCH applies a partial modification whose meaning depends on the API's patch format.

### 8. What does “safe method” mean?

- A. The request cannot fail.
- B. The request is intended to retrieve information rather than ask for a state change.
- C. The server does not need to validate it.
- D. The request is encrypted automatically.

**Answer: B.** Safety describes the method's intended effect. It does not mean that the request cannot fail or that the response is always public.

### 9. What does “idempotent method” mean?

- A. It always returns the same status code.
- B. Repeating the same request has the same intended effect as applying it once.
- C. It never has a body.
- D. It works only with JSON.

**Answer: B.** Idempotence describes the intended effect on server state, not necessarily an identical response each time.

### 10. Which status code commonly indicates that a resource was created?

- A. 200
- B. 201
- C. 204
- D. 404

**Answer: B. 201 Created.** The response may identify or include the new resource.

### 11. Which status code indicates success with no response body?

- A. 201
- B. 301
- C. 204
- D. 500

**Answer: C. 204 No Content.** Do not try to parse a JSON body from a 204 response.

### 12. Which difference between 401 and 403 is most accurate?

- A. 401 is a server error; 403 is a redirect.
- B. 401 means valid authentication credentials are missing or not accepted; 403 means the server refuses the request.
- C. They always mean exactly the same thing.
- D. 401 means not found; 403 means created.

**Answer: B.** A common API convention uses 401 for missing or invalid authentication and 403 for an action the server will not permit.

### 13. What does 405 Method Not Allowed indicate?

- A. The path does not exist in every case.
- B. The method is not allowed for that resource.
- C. The browser lost its network connection.
- D. The request created a resource.

**Answer: B.** A server should indicate which methods are allowed for the target resource.

### 14. Which status-code class generally indicates a server error?

- A. 1xx
- B. 2xx
- C. 4xx
- D. 5xx

**Answer: D. 5xx.** These codes indicate that the server failed to fulfill an otherwise valid request.

### 15. What is the difference between receiving a 404 and having a network failure?

- A. A 404 is an HTTP response; a network failure may mean no HTTP response was received.
- B. They are exactly the same.
- C. A network failure is always a 404.
- D. A 404 means the browser received no response.

**Answer: A.** A 404 response includes an HTTP status and may include an error body. A network failure is a separate problem.

### 16. Does a resolved browser fetch promise guarantee a successful HTTP status?

- A. Yes, always.
- B. No. It can resolve with an HTTP error response, so the code should check the status.
- C. Yes, but only for POST.
- D. No. It always rejects on a 404.

**Answer: B.** Fetch normally resolves with a Response object when an HTTP response arrives, including responses with 4xx or 5xx statuses.

## Short-answer questions

### 17. What are the broad HTTP status-code classes?

**Answer:** 1xx informational, 2xx successful, 3xx redirection, 4xx client error, and 5xx server error.

**Explanation:** The first digit tells a client the general class. A specific code and response body can add detail.

### 18. Why might a GET request include a query string?

**Answer:** A query string can pass options for selecting or shaping the returned data, such as filters, sorting, or a page size.

**Explanation:** The path identifies the endpoint; query parameters refine the request. The method remains GET.

### 19. What does status 202 Accepted tell the client?

**Answer:** The request was accepted for processing, but the processing may not be complete.

**Explanation:** A client should not treat 202 as proof that a long-running task has finished.

### 20. What should a client do when a request returns status 204?

**Answer:** Treat the operation as successful without trying to parse a response body.

**Explanation:** 204 specifically means that the response has no content.

### 21. Why can automatically retrying a POST be risky?

**Answer:** If the first request succeeded but its response was lost, sending the same POST again could repeat the operation, such as creating a duplicate record.

**Explanation:** POST is not generally idempotent. Retry behavior should match the operation's actual semantics.

### 22. Is a DELETE request guaranteed to return the same status every time it is repeated?

**Answer:** No. Its intended effect is idempotent, but the status can differ. For example, the first request might return success and a later one might return not found.

**Explanation:** Idempotence concerns the intended state effect, not identical response messages.

### 23. When should a request include Content-Type?

**Answer:** When it sends a body whose format the recipient needs to interpret, such as JSON.

**Explanation:** Content-Type describes the body. It does not describe the format the client wants back.

### 24. When should a client check the response status?

**Answer:** After receiving an HTTP response and before treating the operation as successful or using its data as success data.

**Explanation:** The response body may describe a validation or server error even though the fetch call itself resolved.

## Read the exchange

### 25. What does this response tell the client?

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

**Answer:** The server reports that a resource was created and returns a JSON representation of the task.

**Explanation:** The status indicates creation, the Content-Type describes the response body, and the body contains the created task data.

### 26. What is wrong with this client logic?

~~~js
const response = await fetch("/api/tasks");
const tasks = await response.json();
showTasks(tasks);
~~~

**Answer:** It treats every HTTP response as successful without checking the status. If the server returns an error, the code may display error data as if it were the task list.

**Explanation:** Check response.ok or response.status and handle error responses before using success data.

### 27. Which status might be appropriate when a resource does not exist?

**Answer:** 404 Not Found.

**Explanation:** This status communicates that the requested resource was not found. The API can include a concise error explanation in the response body.

## Scenarios

### 28. An API receives a request with malformed JSON. What broad class of response would commonly fit?

**Answer:** A 4xx client-error response, commonly 400 Bad Request.

**Explanation:** The server cannot process the request as sent. The API should return a useful explanation without exposing internal details.

### 29. A signed-in user tries to change a record they are not allowed to edit. Would 401 or 403 commonly fit?

**Answer:** 403 Forbidden commonly fits because the server refuses an action by a user who is already authenticated.

**Explanation:** The server must check permissions. The interface hiding an edit button is not sufficient.

### 30. A client sends an unsupported media type in its request body. Which status could the API use?

**Answer:** 415 Unsupported Media Type.

**Explanation:** The server does not support the format of the submitted content. The response can explain which format is accepted.

### 31. An API route exists for GET but not POST. What status can communicate that POST is not allowed on that resource?

**Answer:** 405 Method Not Allowed.

**Explanation:** The response can include an Allow header describing supported methods.

## Review checklist

You are ready to move on when you can:

- Identify request and response fields.
- Explain the common uses of GET, POST, PUT, PATCH, and DELETE.
- Describe safe and idempotent methods without confusing them with reliability.
- Match common statuses to success, invalid input, missing resources, or server failures.
- Explain why fetch responses need a status check.
- Handle 204 without trying to parse a body.

---

### Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| :--- | --- | --- | ---: |
| [002 - How browsers, servers, and clients communicate](../lessons/002-how-browsers-servers-and-clients-communicate.md) | [Q&A](003-http-requests-responses-methods-and-status-codes.md) | [Example](../examples/003-http-requests-responses-methods-and-status-codes.md) | [004 - JSON and API data basics](../lessons/004-json-and-api-data-basics.md) |
