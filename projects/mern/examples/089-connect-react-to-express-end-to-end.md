# 089 - Connect React to Express end to end: Examples

This example implements a small course list. React loads the list from Express and creates a course by sending JSON. Express parses the request, validates the accepted fields, writes a MongoDB document, and returns a deliberate JSON representation.

The snippets use ES modules. Install the dependencies in the package that imports them and connect the server to a local or hosted MongoDB database before starting the API.

## 1. Follow the request contract

Read all courses:

~~~~http
GET /api/courses
~~~~

~~~~json
{
  "data": [
    {
      "id": "665000000000000000000001",
      "title": "HTML fundamentals",
      "description": "A practical introduction."
    }
  ]
}
~~~~

Create a course:

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

The API responds with status 201 and the created representation:

~~~~json
{
  "data": {
    "id": "665000000000000000000002",
    "title": "JavaScript basics",
    "description": "An introductory course."
  }
}
~~~~

The client sends a known shape; the server validates it and does not trust extra fields.

## 2. Server: define the MongoDB model

~~~~js
// server/src/features/courses/course.model.js
import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: ""
    }
  },
  { timestamps: true }
);

export const Course = mongoose.model("Course", courseSchema);
~~~~

## 3. Server: validate and map feature data

~~~~js
// server/src/features/courses/course.service.js
import { Course } from "./course.model.js";

function toCourseDto(course) {
  return {
    id: String(course._id),
    title: course.title,
    description: course.description
  };
}

export async function listCourses() {
  const courses = await Course.find()
    .select("title description")
    .sort({ createdAt: -1 })
    .lean();

  return courses.map(toCourseDto);
}

export async function createCourse(input) {
  const title =
    typeof input?.title === "string" ? input.title.trim() : "";

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

  const course = await Course.create({ title, description });
  return toCourseDto(course);
}
~~~~

The DTO exposes only fields required by the client. A submitted field such as <code>isAdmin</code> or <code>createdAt</code> is never copied into the model.

## 4. Server: add controller and routes

~~~~js
// server/src/features/courses/course.controller.js
import {
  createCourse,
  listCourses
} from "./course.service.js";

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

~~~~js
// server/src/features/courses/course.routes.js
import { Router } from "express";
import {
  getCourses,
  postCourse
} from "./course.controller.js";

export const courseRouter = Router();

courseRouter.get("/", getCourses);
courseRouter.post("/", postCourse);
~~~~

## 5. Server: assemble middleware before routes

~~~~js
// server/src/app.js
import express from "express";
import cors from "cors";
import { courseRouter } from "./features/courses/course.routes.js";

export function createApp(config) {
  const app = express();

  app.use(cors({ origin: config.clientOrigin }));
  app.use(express.json({ limit: "1mb" }));

  app.get("/api/health", (req, res) => {
    res.status(200).json({ status: "ok" });
  });

  app.use("/api/courses", courseRouter);

  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);

    const status = Number.isInteger(error.status) ? error.status : 500;
    const message =
      status < 500 ? error.message : "An unexpected server error occurred.";

    if (status >= 500) console.error(error);

    res.status(status).json({ error: { message } });
  });

  return app;
}
~~~~

JSON parsing runs before the course routes so the controller can read <code>req.body</code>. The error handler is after the routes and returns a consistent JSON error.

Connect MongoDB before accepting requests:

~~~~js
// server/src/server.js
import mongoose from "mongoose";
import { createApp } from "./app.js";

const port = Number(process.env.PORT ?? 4000);
const mongoUri = process.env.MONGODB_URI;
const clientOrigin =
  process.env.CLIENT_ORIGIN ?? "http://localhost:5173";

if (!mongoUri) {
  throw new Error("MONGODB_URI is required.");
}

await mongoose.connect(mongoUri);

const app = createApp({ clientOrigin });

app.listen(port, () => {
  console.log("API listening on port " + port);
});
~~~~

Keep the real database URI in server-only environment configuration. Never prefix it with <code>VITE_</code>.

## 6. Client: centralize the API request

~~~~text
# client/.env.development
VITE_API_BASE_URL=http://localhost:4000
~~~~

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
    throw new Error(payload?.error?.message ?? "The request failed.");
  }

  return payload;
}
~~~~

The helper checks <code>response.ok</code> because Fetch does not reject solely when the server sends an HTTP error status.

## 7. Client: expose feature-specific functions

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

## 8. Client: display data and submit a form

~~~~jsx
// client/src/features/courses/CoursePage.jsx
import { useEffect, useState } from "react";
import {
  createCourse,
  getCourses
} from "./courseApi.js";

export function CoursePage() {
  const [courses, setCourses] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
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

  return (
    <main>
      <h1>Courses</h1>

      <form onSubmit={handleSubmit}>
        <label htmlFor="course-title">Title</label>
        <input
          id="course-title"
          name="title"
          value={title}
          maxLength={160}
          onChange={(event) => setTitle(event.target.value)}
          required
        />

        <label htmlFor="course-description">Description</label>
        <textarea
          id="course-description"
          name="description"
          value={description}
          maxLength={2000}
          onChange={(event) => setDescription(event.target.value)}
        />

        <button disabled={status === "saving"} type="submit">
          {status === "saving" ? "Saving…" : "Add course"}
        </button>
      </form>

      {error && <p role="alert">{error}</p>}
      {status === "loading" && <p>Loading courses…</p>}

      {status !== "loading" && courses.length === 0 && (
        <p>No courses yet.</p>
      )}

      <ul>
        {courses.map((course) => (
          <li key={course.id}>
            <h2>{course.title}</h2>
            {course.description && <p>{course.description}</p>}
          </li>
        ))}
      </ul>
    </main>
  );
}
~~~~

A real application may represent loading, saving, and list loading with separate state values. They are shown together here to keep the end-to-end path easy to follow.

## 9. Run the request path locally

1. Create local server environment values for port 4000, client origin port 5173, and the MongoDB URI.
2. Start the Express process after the database is available.
3. Start the Vite client.
4. Open the page and inspect the GET request in the browser Network panel.
5. Submit a valid course and inspect the JSON POST payload and 201 response.
6. Submit an invalid payload directly to the API and confirm the server returns a 400 JSON error.
7. Stop the API and observe how the client communicates a network failure.
8. Check the API logs when a server-side error occurs.

The browser UI provides client feedback, but the API remains responsible for validating every request.

## What to inspect when it fails

| Symptom | First things to check |
| --- | --- |
| Request does not appear | Form handler, event default, browser console |
| Network connection fails | API process, API URL, port, host, TLS |
| Browser reports CORS | Origin, preflight, server CORS settings, proxy |
| API returns 404 | Method, path, mount prefix, base URL |
| API returns 400 | JSON body, field names, server validation |
| API returns 500 | Server logs, database connection, unexpected error |
| UI stays loading | Fetch completion, state transitions, response parsing |
| UI shows empty after error | Keep error and empty states distinct |

## Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Next chapter |
| --- | --- | --- | --- |
| [088 - Configure frontend and backend origins](../lessons/088-configure-frontend-and-backend-origins.md) | [Lesson](../lessons/089-connect-react-to-express-end-to-end.md) | [Q&A](../qnas/089-connect-react-to-express-end-to-end.md) | [090 - Build a CRUD feature across UI, API, and database](../lessons/090-build-a-crud-feature-across-ui-api-and-database.md) |
