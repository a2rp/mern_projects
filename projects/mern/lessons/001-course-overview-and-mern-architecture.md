# 001 - Course Overview and MERN Architecture

MERN is a set of technologies for building full-stack web applications with JavaScript. In this lesson, you will learn what each part does, how a browser request can travel through the stack, and how the course will help you connect the pieces into a working application.

You do not need to install the MERN stack for this lesson. The goal is to understand the architecture before studying setup and implementation in later chapters.

## What you will learn

By the end of this lesson, you should be able to:

- Expand the acronym MERN and describe each technology's main responsibility.
- Distinguish the browser, frontend, backend, and database.
- Trace a simple feature from a React interaction to MongoDB and back.
- Explain why an API connects the frontend and backend.
- Recognize that MERN is a combination of tools, not one all-in-one framework.
- Identify the main stages in this course.

## What does MERN mean?

**MERN** stands for:

| Letter | Technology | Main responsibility |
| --- | --- | --- |
| M | MongoDB | Stores application data as documents |
| E | Express | Provides routing and middleware for an HTTP server |
| R | React | Builds the interactive user interface from components |
| N | Node.js | Runs JavaScript outside the browser, including the server |

A MERN application commonly uses React in the browser, Node.js and Express on the server, and MongoDB to persist data. The browser and server communicate over HTTP, often exchanging JSON.

The acronym names these four technologies. It does not define every part of an application. A real project also uses HTML, CSS, JavaScript, package tools, configuration, testing, and a deployment environment. It may add libraries for routing, validation, authentication, or database modeling.

## The parts of a web application

A web application can be understood as several parts with different jobs:

| Part | What it does | Example |
| --- | --- | --- |
| Browser | Displays the page and sends requests | Chrome, Firefox, or another browser |
| Frontend | Presents information and handles user interaction | A React task list and create-task form |
| Backend | Applies application rules and responds to requests | An Express API running on Node.js |
| Database | Stores data so it can be retrieved later | MongoDB documents in a tasks collection |

The **frontend** runs in the user's browser. It can display data, collect input, and ask the server to perform an operation. It should not be trusted to enforce permissions or protect private information because users can inspect and change browser requests.

The **backend** runs in an environment controlled by the application owner. It receives requests, checks them, applies the application's rules, reads or changes data, and sends responses. Secrets such as database credentials belong on the server, not in browser code.

The **database** stores application data beyond the lifetime of a browser page or server request. The backend connects to it and decides what data a caller may read or change.

## What each MERN technology contributes

### MongoDB: application data

MongoDB stores records as BSON documents grouped into collections. A database can contain multiple collections. For example, a task application might have a collection of task documents:

~~~json
{
  "_id": "a unique database identifier",
  "title": "Read the first MERN lesson",
  "completed": false
}
~~~

This is an illustrative shape, not a required schema. A document database lets related values be represented together, but applications still need to decide what fields are valid, how relationships work, and which queries they must support. Those data-modeling decisions are covered in the MongoDB module.

### Express: HTTP routes and middleware

Express is a web framework for Node.js. An Express application can match a request's HTTP method and path to a route. Middleware can run during the request-response cycle to perform work such as parsing JSON, checking authentication, or recording request information.

For example, a route might handle a request to create a task. Before saving anything, the server should validate the submitted values and check that the caller is allowed to create the task.

### React: user interface

React helps you build a user interface from components. A component can display information, receive values from its parent, and keep state that changes as a person interacts with the page.

A task-list component might show tasks returned by the API. A form component might collect a title and submit it. When the server responds, React can update the interface to show the new task or explain why the request failed.

### Node.js: JavaScript outside the browser

Node.js is a JavaScript runtime. It lets JavaScript run in server-side programs and development tools. Express runs on Node.js.

JavaScript is the language; Node.js is one environment that runs it. A browser and Node.js do not expose the same built-in features. For example, browser code can interact with the page, while server code can access server-side facilities. Do not assume that browser-only features are available in the Node.js process.

## How a request travels through MERN

Imagine a signed-in person adds a task to a task list. A typical flow looks like this:

~~~text
1. The person enters a title and submits a React form.
2. React sends an HTTP request to the server.
3. Express receives the request and runs configured middleware.
4. The route validates the input and checks permission.
5. The server asks MongoDB to save the task.
6. MongoDB stores the document and returns a result.
7. Express sends an HTTP response, commonly containing JSON.
8. React reads the response and updates its state.
9. The browser renders the updated task list.
~~~

A response might contain a newly created task:

~~~json
{
  "task": {
    "id": "task-123",
    "title": "Read the first MERN lesson",
    "completed": false
  }
}
~~~

The exact response shape depends on the API design. The important idea is the direction of responsibility: React requests an operation, the backend decides whether and how to perform it, MongoDB stores or retrieves data, and the response lets React show the result.

Each boundary can fail. The browser may be offline, the request may contain invalid data, the user may not have permission, the server may encounter an error, or the database may be unavailable. A complete feature plans for success and failure states.

## A simple architecture view

~~~text
┌────────────────────────────────────────────┐
│ Browser                                    │
│ React components, forms, and interface state│
└─────────────────────┬──────────────────────┘
                      │ HTTP request / response
                      ▼
┌────────────────────────────────────────────┐
│ Node.js server                              │
│ Express middleware, routes, and app rules  │
└─────────────────────┬──────────────────────┘
                      │ database operations
                      ▼
┌────────────────────────────────────────────┐
│ MongoDB                                     │
│ Databases, collections, and documents       │
└────────────────────────────────────────────┘
~~~

This diagram is a learning model. A project can use more services or deploy these parts in different places. The browser does not normally connect directly to the database; the backend is the controlled boundary for data access.

## MERN is a stack, not a complete application

MERN gives you a foundation, but you still make design choices:

- How the project folders are organized.
- Whether to use MongoDB's official Node.js driver or an object-document mapper.
- How the frontend maps URLs to screens.
- How the server validates incoming data.
- How users sign in and how permissions are checked.
- How the application is tested, configured, and deployed.

Do not add a library just because many projects use it. First understand the problem it solves, then decide whether the project needs it. This course introduces optional tools as choices and explains their purpose.

MERN also does not mean that the project has no HTML or CSS. React commonly describes interface structure with JSX, which is transformed by the project's tools and rendered by the browser. HTML concepts still matter for meaningful, accessible interfaces, and CSS is used for presentation.

## How this course is organized

The course roadmap has 104 chapters grouped into seven learning stages:

1. **Foundations:** browser-server communication, HTTP, JSON, Git, and JavaScript refreshers.
2. **Node.js and project setup:** runtime basics, npm, modules, configuration, and secrets.
3. **MongoDB and data modeling:** documents, CRUD, queries, relationships, validation, indexes, and database operations.
4. **Express and API development:** routes, middleware, validation, errors, authentication, security, and API testing.
5. **React and user interfaces:** components, props, state, forms, routing, API requests, accessibility, and interface testing.
6. **Full-stack integration and delivery:** connect the UI, API, and database into complete features.
7. **Production practice and capstone:** monitoring, backups, releases, deployment, and a complete application.

Read the [course roadmap](../README.md#course-roadmap) to open any lesson. Each planned chapter has a matching Q&A and example file.

## Key terms

- **Client:** a program that makes a request to a service. In this course, the browser is usually the client.
- **Server:** a program that receives requests and sends responses.
- **Frontend:** the user-facing part of an application, commonly running in the browser.
- **Backend:** server-side code that applies application rules and accesses protected resources.
- **API:** a defined way for programs to communicate. A web API commonly uses HTTP requests and responses.
- **HTTP:** the request-response protocol commonly used between browsers and web servers.
- **JSON:** a text format commonly used to exchange structured data.
- **Runtime:** the environment that executes a program. A browser and Node.js are different JavaScript runtimes.
- **Document:** a record stored by MongoDB, represented using BSON.
- **Middleware:** a function that can participate in Express's request-response processing.

## Common misunderstandings

- **MERN is one framework.** It is a combination of four technologies with different roles.
- **React is the whole frontend.** React builds the interface, while the browser and the rest of the frontend project provide the surrounding environment.
- **Node.js is another programming language.** Node.js runs JavaScript; it is not a replacement language for JavaScript.
- **The browser should connect directly to MongoDB.** The backend normally mediates access so it can validate requests and enforce permissions.
- **A hidden button secures an operation.** The server must check permissions even if the UI hides the button.
- **MongoDB means there is no data structure to plan.** Applications still need consistent document shapes, validation, and query-aware data models.
- **Every MERN project must use the same libraries and folder layout.** The stack leaves many choices to the project.

## Try it yourself

1. Write out what each letter in MERN stands for.
2. In one sentence each, describe the jobs of React, Express, Node.js, and MongoDB.
3. Trace what happens after someone submits a form that creates a record.
4. Name two reasons the server must validate a request even if React already checked the form.
5. Identify one thing MongoDB stores and one thing React displays.
6. Explain why database credentials should not be included in frontend code.
7. Pick a web application you use and identify a possible frontend action, API request, backend rule, and database operation.

## Key points

- MERN means MongoDB, Express, React, and Node.js.
- React builds the interface; Express handles HTTP routing and middleware; Node.js runs the server-side JavaScript; MongoDB stores documents.
- The browser talks to the backend through an API, usually over HTTP.
- The server validates input, checks permissions, and mediates database access.
- A full-stack feature needs success, failure, and loading behavior across the request flow.
- MERN is a technology stack with choices around its edges, not a complete application template.

---

### Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| :--- | --- | --- | ---: |
|  | [Q&A](../qnas/001-course-overview-and-mern-architecture.md) | [Example](../examples/001-course-overview-and-mern-architecture.md) | [002 - How browsers, servers, and clients communicate](002-how-browsers-servers-and-clients-communicate.md) |
