# 001 - Course Overview and MERN Architecture: Questions and Answers

Use these questions to review the first lesson. Answers include explanations so you can check not only what you remember, but why each part of the stack has its role.

Related lesson: [001 - Course Overview and MERN Architecture](../lessons/001-course-overview-and-mern-architecture.md)

## Multiple-choice questions

### 1. What does MERN stand for?

- A. MySQL, Express, Ruby, and Next.js
- B. MongoDB, Express, React, and Node.js
- C. MongoDB, Ember, Redux, and npm
- D. Markdown, Express, React, and Network

**Answer: B. MongoDB, Express, React, and Node.js.** MERN names a document database, a server framework, a UI library, and a JavaScript runtime.

### 2. Which technology is primarily used to build the user interface in a MERN application?

- A. MongoDB
- B. Express
- C. React
- D. Node.js

**Answer: C. React.** React is used to compose the browser-facing interface from components and represent changing interface state.

### 3. What is Node.js?

- A. A database query language
- B. A runtime that executes JavaScript outside a browser
- C. A replacement for JavaScript
- D. A React component

**Answer: B. A runtime that executes JavaScript outside a browser.** Node.js provides an environment for server-side JavaScript and development tools. It is not a separate programming language.

### 4. What is Express mainly used for in this stack?

- A. Storing application documents
- B. Styling React components
- C. Defining HTTP routes and middleware on a Node.js server
- D. Replacing the browser

**Answer: C. Defining HTTP routes and middleware on a Node.js server.** Express helps an application match requests to handlers and run middleware during request processing.

### 5. How does MongoDB organize its typical application data?

- A. Documents grouped into collections
- B. React components grouped into pages
- C. Routes grouped into CSS files
- D. Browser tabs grouped into sessions

**Answer: A. Documents grouped into collections.** MongoDB stores BSON documents in collections. A database contains collections.

### 6. What is the API's role in a typical MERN application?

- A. It is the visual design of the page.
- B. It defines how the frontend and backend communicate.
- C. It is another name for the database.
- D. It prevents all network failures.

**Answer: B. It defines how the frontend and backend communicate.** A web API commonly describes HTTP endpoints, accepted data, responses, and status codes.

### 7. Which sequence best describes creating a record in a typical MERN application?

- A. MongoDB updates React, then the browser creates Express.
- B. React sends a request, Express handles it, the server accesses MongoDB, and a response returns to React.
- C. The browser connects directly to MongoDB and changes the document.
- D. Express sends a request to React, which writes to the database.

**Answer: B.** The browser-facing interface requests an operation from the backend. The server applies rules and accesses the database, then returns a result for the interface to display.

### 8. Where should a database password be kept?

- A. In a React component so it is easy to find
- B. In a browser-delivered configuration file
- C. In server-side configuration that is not committed or sent to users
- D. In the task title field

**Answer: C.** Browser-delivered code and requests can be inspected. A database credential must stay in a protected server environment.

### 9. Why must the server validate submitted data if React already validates the form?

- A. React cannot display forms.
- B. A caller can change or bypass browser code and send requests directly.
- C. MongoDB refuses all data automatically.
- D. HTTP requests cannot contain invalid data.

**Answer: B.** Client-side checks improve feedback, but they are under the user's control. The backend must validate incoming requests before applying them.

### 10. Which statement about JavaScript and Node.js is accurate?

- A. They are two names for the same programming language.
- B. JavaScript is the language; Node.js is a runtime that can execute it.
- C. Node.js is a React feature.
- D. JavaScript only runs in browsers.

**Answer: B.** The language can run in different environments. A browser and Node.js provide different built-in APIs.

### 11. Does MongoDB's flexible document model mean an application needs no data validation?

- A. Yes. Every possible document shape is safe.
- B. No. Applications still need to define and validate the data they expect.
- C. Yes, but only when using Express.
- D. No, because MongoDB cannot store documents.

**Answer: B.** Flexibility does not remove the need for consistent application rules, validation, and deliberate data modeling.

### 12. Is MERN a single all-in-one framework with one required project structure?

- A. Yes. Every MERN app must have the same folders and extra libraries.
- B. No. It is a combination of technologies; projects make additional choices.
- C. Yes. MongoDB generates the other three technologies.
- D. No. It means the application does not need a frontend.

**Answer: B.** MERN identifies four technologies but does not prescribe every library, folder, authentication strategy, or deployment choice.

## Short-answer questions

### 13. What is the difference between a frontend and a backend?

**Answer:** The frontend is the user-facing part of the application, commonly running in the browser. The backend runs on the server, applies application rules, accesses protected resources such as a database, and returns responses.

**Explanation:** They can be deployed together or separately, but they have different trust and execution environments.

### 14. What does HTTP do in a MERN application?

**Answer:** HTTP carries requests and responses between a client, often a browser, and a web server.

**Explanation:** The request identifies what the client wants to do and may include data. The response communicates a status and may include data such as JSON.

### 15. What is JSON commonly used for?

**Answer:** JSON is a text format for representing and exchanging structured data between programs.

**Explanation:** An API may receive a JSON request body and return a JSON response. JSON is a data format; it is not a database or a programming language.

### 16. What is middleware in the context of Express?

**Answer:** Middleware is code that can run during an HTTP request-response cycle.

**Explanation:** Middleware can inspect or modify request and response information, pass control to the next middleware, or finish the response. Examples include JSON parsing and authentication checks.

### 17. What should happen if MongoDB is temporarily unavailable when a user submits a form?

**Answer:** The backend should handle the failure safely, avoid pretending the write succeeded, and return an appropriate error response. The frontend should tell the user the operation did not complete and offer a suitable next action.

**Explanation:** A full-stack feature handles failure at each boundary, not only the success path.

### 18. Why is hiding an edit button not sufficient authorization?

**Answer:** A user can still attempt to call the API directly. The backend must check whether that user is allowed to edit the specific record.

**Explanation:** The interface improves the user experience; the server enforces access control.

### 19. Does MERN eliminate the need for HTML and CSS?

**Answer:** No. HTML concepts still matter for document meaning and accessibility, and CSS is used for presentation. React commonly uses JSX to describe interface structure.

**Explanation:** MERN names selected technologies in an application stack, not every technology used to build a web page.

### 20. Why can browser code not be treated as secret?

**Answer:** Browser-delivered code and network requests are available to the user through browser tools. Anything included there can be inspected.

**Explanation:** Keep credentials and private server configuration in a protected server environment.

## Trace the request

### 21. A user creates a task. What work belongs to each part of the stack?

**Answer:**

1. **React:** collects the title, sends the request, and represents loading, success, or failure in the interface.
2. **HTTP API:** carries the request and response between browser and server.
3. **Express:** matches the route and runs middleware and the request handler.
4. **Backend application logic:** validates the title and checks the user's permission.
5. **MongoDB:** stores the task document.
6. **React again:** reads the response and renders the saved task.

**Explanation:** The database does not directly update the React interface. Information returns through the API response.

### 22. Which parts should never trust the browser to enforce?

**Answer:** Input validation, authentication, authorization, ownership checks, and protection of private credentials must be enforced on the server. The browser can provide helpful validation, but the backend must repeat relevant checks.

**Explanation:** A user can modify a page or create a request without using the intended interface.

### 23. If a person can see a task list but is not allowed to delete a task, where must the permission be checked?

**Answer:** In the backend endpoint that processes the delete request, before the data is changed.

**Explanation:** Hiding a delete button in React is useful interface behavior, but it does not secure the operation.

## Check your understanding

For each statement, decide whether it is true or false.

### 24. “Node.js is the same thing as JavaScript.”

**Answer: False.** JavaScript is the language. Node.js is one runtime that executes JavaScript.

### 25. “A React page can safely connect directly to MongoDB if the connection string is hidden in the component.”

**Answer: False.** A browser component is delivered to the user's device, and its requests can be inspected. The backend should mediate database access and keep credentials server-side.

### 26. “The API can return an error even when the browser successfully sent the request.”

**Answer: True.** Network delivery and application success are different. The server may reject invalid input, deny access, or report an internal or database failure.

### 27. “A MERN project can choose different optional tools and folder layouts.”

**Answer: True.** MERN does not prescribe every library or project structure. Choices should follow the application's needs and be explained.

## Review checklist

You are ready to move on when you can explain, without looking at the lesson:

- What each letter in MERN means.
- What React, Express, Node.js, and MongoDB each do.
- How a request moves from a browser action to stored data and back.
- Why the backend validates input and checks permissions.
- Why database secrets stay on the server.
- Why MERN is a technology stack rather than a complete application framework.

---

### Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| :--- | --- | --- | ---: |
|  | [Q&A](001-course-overview-and-mern-architecture.md) | [Example](../examples/001-course-overview-and-mern-architecture.md) | [002 - How browsers, servers, and clients communicate](../lessons/002-how-browsers-servers-and-clients-communicate.md) |
