# 089 - Connect React to Express end to end

A React component can call an Express API with the browser Fetch API. The request travels over HTTP: the client sends a method, URL, headers, and optional body; Express matches a route, runs middleware, performs the requested work, and returns a status and response body.

This chapter builds that request path clearly. It covers a consistent JSON contract, safe input handling, loading and error states, environment configuration, and the limits of a small manual data-fetching pattern.

## Learning outcomes

After this chapter, you should be able to:

- Trace a browser request from a React feature to an Express route and back.
- Use a client API module to keep endpoint details out of components.
- Parse and validate JSON request bodies on the server.
- Return meaningful HTTP status codes and a consistent JSON shape.
- Handle loading, success, and failure states in React.
- Avoid updating a component with a stale request result.
- Diagnose a failed request using the browser Network panel.

## 1. Understand the full request path

A course-list request follows these steps:

1. A React component calls a feature API function.
2. The browser sends an HTTP GET request to an API URL.
3. Express middleware runs in registration order.
4. A router matches the method and path.
5. A controller adapts HTTP input and output.
6. A service performs the use case and reads from persistence.
7. Express returns a status and JSON response.
8. The client checks the response, parses JSON, and updates UI state.

The React app does not connect directly to MongoDB. The Express API owns database credentials, validation, authorization, and persistence.

## 2. Define the API contract first

Suppose the course endpoint is:

~~~~http
GET /api/courses
~~~~

A successful response could have this shape:

~~~~json
{
  "data": [
    {
      "id": "course-123",
      "title": "HTML fundamentals",
      "description": "A practical introduction.",
      "status": "published"
    }
  ]
}
~~~~

A create endpoint might be:

~~~~http
POST /api/courses
Content-Type: application/json
~~~~

~~~~json
{
  "title": "JavaScript basics",
  "description": "An introductory course."
}
~~~~

~~~~http
HTTP/1.1 201 Created
Content-Type: application/json
~~~~

~~~~json
{
  "data": {
    "id": "course-456",
    "title": "JavaScript basics",
    "description": "An introductory course.",
    "status": "draft"
  }
}
~~~~

A consistent contract documents where returned data lives and how failures are represented. Do not return database documents blindly if that would expose private or internal fields.

## 3. Keep the client API module separate

The client API module owns the base URL and common response handling.

~~~~js
// client/src/lib/api.js
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "";

export async function apiRequest(path, options = {}) {
  const response = await fetch(apiBaseUrl + path, {
    ...options,
    headers: {
      Accept: "application/json",
      ...options.headers
    }
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message = payload?.error?.message ?? "The request failed.";
    throw new Error(message);
  }

  return payload;
}
~~~~

Fetch rejects for some network-level failures, but an HTTP 404 or 500 still produces a Response. Check <code>response.ok</code> or the status before treating a response as success.

A feature API function defines the endpoint and request body:

~~~~js
// client/src/features/courses/courseApi.js
import { apiRequest } from "../../lib/api.js";

export async function getCourses(options = {}) {
  return apiRequest("/api/courses", {
    signal: options.signal
  });
}

export async function createCourse(input) {
  return apiRequest("/api/courses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });
}
~~~~

Components can use these functions without knowing every URL, header, or response-parsing detail.

## 4. Register JSON middleware before API routes

Express must parse JSON request bodies before a route reads <code>req.body</code>.

~~~~js
// server/src/app.js
import express from "express";
import { courseRouter } from "./features/courses/course.routes.js";
import { createErrorHandler } from "./middleware/error-handler.js";

export function createApp() {
  const app = express();

  app.use(express.json({ limit: "1mb" }));
  app.use("/api/courses", courseRouter);
  app.use(createErrorHandler());

  return app;
}
~~~~

Middleware order matters. If JSON parsing is registered after the router, the route may not receive the parsed object. A request-size limit also avoids accepting arbitrarily large JSON bodies.

## 5. Implement a route and controller

~~~~js
// server/src/features/courses/course.routes.js
import { Router } from "express";
import { getCourses, postCourse } from "./course.controller.js";

export const courseRouter = Router();

courseRouter.get("/", getCourses);
courseRouter.post("/", postCourse);
~~~~

~~~~js
// server/src/features/courses/course.controller.js
import { createCourse, listCourses } from "./course.service.js";

export async function getCourses(req, res, next) {
  try {
    const courses = await listCourses();
    res.status(200).json({ data: courses });
  } catch (error) {
    next(error);
  }
}

export async function postCourse(req, res, next) {
  try {
    const course = await createCourse(req.body);
    res.status(201).json({ data: course });
  } catch (error) {
    next(error);
  }
}
~~~~

The route maps method and path to a handler. The controller translates HTTP input into a service call and translates the result into an HTTP response.

## 6. Validate untrusted input on the server

Browser validation helps a user correct a form, but it is not a security boundary. Any client can send an HTTP request directly.

~~~~js
// server/src/features/courses/course.service.js
import { Course } from "./course.model.js";

export async function listCourses() {
  return Course.find()
    .select("title description status")
    .sort({ title: 1 })
    .lean();
}

export async function createCourse(input = {}) {
  if (typeof input.title !== "string") {
    const error = new Error("Title must be text.");
    error.status = 400;
    throw error;
  }

  const title = input.title.trim();

  if (!title) {
    const error = new Error("Title is required.");
    error.status = 400;
    throw error;
  }

  if (title.length > 160) {
    const error = new Error("Title must be 160 characters or fewer.");
    error.status = 400;
    throw error;
  }

  const description =
    typeof input.description === "string" ? input.description.trim() : "";

  if (description.length > 2000) {
    const error = new Error("Description must be 2000 characters or fewer.");
    error.status = 400;
    throw error;
  }

  return Course.create({
    title,
    description,
    status: "draft"
  });
}
~~~~

Build a new object from the fields the endpoint accepts. Avoid passing an entire request body to a model when callers should not control fields such as ownership, approval state, or timestamps.

## 7. Send one consistent error shape

~~~~js
// server/src/middleware/error-handler.js
export function createErrorHandler() {
  return (error, req, res, next) => {
    if (res.headersSent) {
      return next(error);
    }

    const status = Number.isInteger(error.status) ? error.status : 500;
    const message =
      status < 500 ? error.message : "An unexpected server error occurred.";

    if (status >= 500) {
      console.error(error);
    }

    res.status(status).json({
      error: { message }
    });
  };
}
~~~~

Expected invalid input can return a client error such as 400. Unexpected server failures should return a generic message and be logged on the server. Do not send stack traces or secrets to the browser.

## 8. Render loading, success, and error states

~~~~jsx
// client/src/features/courses/CourseList.jsx
import { useEffect, useState } from "react";
import { getCourses } from "./courseApi.js";

export function CourseList() {
  const [courses, setCourses] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    getCourses({ signal: controller.signal })
      .then((result) => {
        setCourses(result.data);
        setStatus("success");
      })
      .catch((requestError) => {
        if (requestError.name === "AbortError") return;
        setError(requestError.message);
        setStatus("error");
      });

    return () => controller.abort();
  }, []);

  if (status === "loading") return <p>Loading courses…</p>;
  if (status === "error") return <p role="alert">{error}</p>;
  if (courses.length === 0) return <p>No courses yet.</p>;

  return (
    <ul>
      {courses.map((course) => (
        <li key={course.id}>{course.title}</li>
      ))}
    </ul>
  );
}
~~~~

The cleanup aborts the request when the component unmounts. For requests that may change based on props or user selection, cancellation or a stale-result guard prevents an older response from replacing newer data.

A form can submit data through the same feature API:

~~~~jsx
// Simplified submit handler
async function handleSubmit(event) {
  event.preventDefault();
  setStatus("saving");
  setError("");

  try {
    const result = await createCourse({ title, description });
    setCourses((current) => [result.data, ...current]);
    setTitle("");
    setDescription("");
    setStatus("success");
  } catch (requestError) {
    setError(requestError.message);
    setStatus("error");
  }
}
~~~~

The interface should communicate saving and failure states. Disable duplicate submission while saving when that matches the intended interaction.

## 9. Use stable identifiers for React list keys

Database-backed records often have an identifier. Return a deliberate public identifier such as <code>id</code> in the API representation and use it as the React key.

~~~~jsx
{courses.map((course) => (
  <CourseCard key={course.id} course={course} />
))}
~~~~

If the server exposes MongoDB's <code>_id</code>, the client can use it consistently, but a response mapper can keep the public API independent of database-specific field naming.

## 10. Debug the full path

When data does not appear:

1. Check the browser Network panel for the request URL, method, status, request payload, and response body.
2. Confirm the frontend API base URL and environment were loaded.
3. Confirm the API process is listening on the expected host and port.
4. Check whether a preflight request failed before the actual request.
5. Check Express middleware order, route prefix, and route method.
6. Inspect server logs for parsing, validation, database, or runtime errors.
7. Compare the API response shape with the fields the component reads.

A request can fail at DNS, connection, CORS, HTTP, JSON parsing, validation, or database layers. Identify the layer from the evidence before changing code.

## Notes on manual fetching

Fetching from an Effect can be suitable for a small client-rendered example. Larger applications may benefit from a router or data-fetching library that adds caching, deduplication, preloading, and request-state management. Choose a tool based on real application needs; the HTTP contract and server boundaries remain the same.

## Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- | --- |
| [088 - Configure frontend and backend origins](088-configure-frontend-and-backend-origins.md) | [Lesson](089-connect-react-to-express-end-to-end.md) | [Q&A](../qnas/089-connect-react-to-express-end-to-end.md) | [Example](../examples/089-connect-react-to-express-end-to-end.md) | [090 - Build a CRUD feature across UI, API, and database](090-build-a-crud-feature-across-ui-api-and-database.md) |
