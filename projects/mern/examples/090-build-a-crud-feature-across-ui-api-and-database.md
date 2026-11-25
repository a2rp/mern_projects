# 090 - Build a CRUD feature across UI, API, and database: Examples

This example builds a small course manager across React, Express, and MongoDB. Users can read a list, create a course, edit accepted fields, and delete a course. The server validates all input and returns a deliberate JSON representation.

The code is organized as feature modules and uses ES modules. Install React and Vite in the client package; install Express, Mongoose, and CORS in the server package. Supply the server's MongoDB URI through a private server environment file.

## 1. Define the HTTP contract

| Operation | Request | Success |
| --- | --- | --- |
| List | <code>GET /api/courses</code> | 200 and <code>{ "data": [...] }</code> |
| One item | <code>GET /api/courses/:id</code> | 200 and <code>{ "data": {...} }</code> |
| Create | <code>POST /api/courses</code> | 201 and the created resource |
| Partial update | <code>PATCH /api/courses/:id</code> | 200 and the updated resource |
| Delete | <code>DELETE /api/courses/:id</code> | 204 with no body |

The public representation uses <code>id</code>. The MongoDB model can keep its internal <code>_id</code> field without coupling every client component to database details.

## 2. Create the model

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
    },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft"
    }
  },
  { timestamps: true }
);

export const Course = mongoose.model("Course", courseSchema);
~~~~

## 3. Validate requests and implement database operations

~~~~js
// server/src/features/courses/course.service.js
import { Course } from "./course.model.js";

function toCourseDto(course) {
  return {
    id: String(course._id),
    title: course.title,
    description: course.description,
    status: course.status
  };
}

function makeError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function validateId(id) {
  if (typeof id !== "string" || !/^[a-f0-9]{24}$/i.test(id)) {
    throw makeError("Course id is invalid.", 400);
  }
}

function validateInput(input, partial = false) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw makeError("Request body must be a JSON object.", 400);
  }

  const allowedFields = new Set(["title", "description"]);
  const keys = Object.keys(input);

  if (keys.some((key) => !allowedFields.has(key))) {
    throw makeError("Request contains an unsupported field.", 400);
  }

  if (partial && keys.length === 0) {
    throw makeError("Provide at least one field to update.", 400);
  }

  const data = {};

  if (!partial || Object.hasOwn(input, "title")) {
    if (typeof input.title !== "string" || !input.title.trim()) {
      throw makeError("Title is required.", 400);
    }

    data.title = input.title.trim();
    if (data.title.length > 160) {
      throw makeError("Title must be 160 characters or fewer.", 400);
    }
  }

  if (Object.hasOwn(input, "description")) {
    if (typeof input.description !== "string") {
      throw makeError("Description must be text.", 400);
    }

    data.description = input.description.trim();
    if (data.description.length > 2000) {
      throw makeError("Description must be 2000 characters or fewer.", 400);
    }
  } else if (!partial) {
    data.description = "";
  }

  return data;
}

export async function listCourses() {
  const documents = await Course.find()
    .select("title description status")
    .sort({ createdAt: -1 })
    .lean();

  return documents.map(toCourseDto);
}

export async function getCourse(id) {
  validateId(id);

  const course = await Course.findById(id).select("title description status");
  if (!course) throw makeError("Course was not found.", 404);

  return toCourseDto(course);
}

export async function createCourse(input) {
  const data = validateInput(input);
  const course = await Course.create(data);
  return toCourseDto(course);
}

export async function updateCourse(id, input) {
  validateId(id);
  const data = validateInput(input, true);

  const course = await Course.findById(id);
  if (!course) throw makeError("Course was not found.", 404);

  Object.assign(course, data);
  await course.save();

  return toCourseDto(course);
}

export async function deleteCourse(id) {
  validateId(id);

  const course = await Course.findByIdAndDelete(id);
  if (!course) throw makeError("Course was not found.", 404);
}
~~~~

Only fields in the allowlist can be changed by this API. In particular, callers cannot set the server-owned status through this create/edit endpoint.

## 4. Expose CRUD routes through controllers

~~~~js
// server/src/features/courses/course.controller.js
import * as service from "./course.service.js";

export async function list(req, res, next) {
  try {
    res.status(200).json({ data: await service.listCourses() });
  } catch (error) {
    next(error);
  }
}

export async function getOne(req, res, next) {
  try {
    res.status(200).json({
      data: await service.getCourse(req.params.id)
    });
  } catch (error) {
    next(error);
  }
}

export async function create(req, res, next) {
  try {
    res.status(201).json({
      data: await service.createCourse(req.body)
    });
  } catch (error) {
    next(error);
  }
}

export async function update(req, res, next) {
  try {
    res.status(200).json({
      data: await service.updateCourse(req.params.id, req.body)
    });
  } catch (error) {
    next(error);
  }
}

export async function remove(req, res, next) {
  try {
    await service.deleteCourse(req.params.id);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}
~~~~

~~~~js
// server/src/features/courses/course.routes.js
import { Router } from "express";
import * as controller from "./course.controller.js";

export const courseRouter = Router();

courseRouter.get("/", controller.list);
courseRouter.post("/", controller.create);
courseRouter.get("/:id", controller.getOne);
courseRouter.patch("/:id", controller.update);
courseRouter.delete("/:id", controller.remove);
~~~~

## 5. Configure Express middleware and startup

~~~~js
// server/src/app.js
import express from "express";
import cors from "cors";
import { courseRouter } from "./features/courses/course.routes.js";

export function createApp(config) {
  const app = express();

  app.use(cors({ origin: config.clientOrigin }));
  app.use(express.json({ limit: "1mb" }));
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

~~~~js
// server/src/server.js
import mongoose from "mongoose";
import { createApp } from "./app.js";

const port = Number(process.env.PORT ?? 4000);
const mongoUri = process.env.MONGODB_URI;
const clientOrigin =
  process.env.CLIENT_ORIGIN ?? "http://localhost:5173";

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be a valid TCP port.");
}
if (!mongoUri) {
  throw new Error("MONGODB_URI is required.");
}

await mongoose.connect(mongoUri);
const app = createApp({ clientOrigin });

app.listen(port, () => {
  console.log("API listening on port " + port);
});
~~~~

Example local server configuration:

~~~~text
# server/.env
PORT=4000
CLIENT_ORIGIN=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/mern_course
~~~~

Keep the real env file out of version control. The API should not start until its required database configuration is present and the connection succeeds.

## 6. Create a client request helper

~~~~text
# client/.env.development
VITE_API_BASE_URL=http://localhost:4000
~~~~

~~~~js
// client/src/lib/api.js
const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "";

export async function apiRequest(path, options = {}) {
  const response = await fetch(baseUrl + path, {
    ...options,
    headers: {
      Accept: "application/json",
      ...options.headers
    }
  });

  if (response.status === 204) return null;

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error?.message ?? "The request failed.");
  }

  return payload;
}
~~~~

~~~~js
// client/src/features/courses/courseApi.js
import { apiRequest } from "../../lib/api.js";

export function listCourses(options = {}) {
  return apiRequest("/api/courses", { signal: options.signal });
}

export function getCourse(id) {
  return apiRequest("/api/courses/" + encodeURIComponent(id));
}

export function createCourse(input) {
  return apiRequest("/api/courses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
}

export function updateCourse(id, input) {
  return apiRequest("/api/courses/" + encodeURIComponent(id), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
}

export function deleteCourse(id) {
  return apiRequest("/api/courses/" + encodeURIComponent(id), {
    method: "DELETE"
  });
}
~~~~

## 7. Connect the React form and list

~~~~jsx
// client/src/features/courses/CoursePage.jsx
import { useEffect, useState } from "react";
import {
  createCourse,
  deleteCourse,
  listCourses,
  updateCourse
} from "./courseApi.js";

export function CoursePage() {
  const [courses, setCourses] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    listCourses({ signal: controller.signal })
      .then((result) => setCourses(result.data))
      .catch((requestError) => {
        if (requestError.name !== "AbortError") {
          setError(requestError.message);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  function edit(course) {
    setEditingId(course.id);
    setTitle(course.title);
    setDescription(course.description);
    setError("");
  }

  function clearForm() {
    setEditingId(null);
    setTitle("");
    setDescription("");
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const input = { title, description };

      if (editingId) {
        const result = await updateCourse(editingId, input);
        setCourses((current) =>
          current.map((course) =>
            course.id === editingId ? result.data : course
          )
        );
      } else {
        const result = await createCourse(input);
        setCourses((current) => [result.data, ...current]);
      }

      clearForm();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(id) {
    setError("");

    try {
      await deleteCourse(id);
      setCourses((current) => current.filter((course) => course.id !== id));

      if (editingId === id) clearForm();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <main>
      <h1>Courses</h1>

      <form onSubmit={submit}>
        <label htmlFor="course-title">Title</label>
        <input
          id="course-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={160}
          required
        />

        <label htmlFor="course-description">Description</label>
        <textarea
          id="course-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={2000}
        />

        <button disabled={saving} type="submit">
          {saving
            ? "Saving…"
            : editingId
              ? "Save changes"
              : "Create course"}
        </button>

        {editingId && (
          <button disabled={saving} onClick={clearForm} type="button">
            Cancel edit
          </button>
        )}
      </form>

      {error && <p role="alert">{error}</p>}
      {loading && <p>Loading courses…</p>}

      {!loading && courses.length === 0 && <p>No courses yet.</p>}

      <ul>
        {courses.map((course) => (
          <li key={course.id}>
            <h2>{course.title}</h2>
            <p>{course.description || "No description."}</p>
            <button type="button" onClick={() => edit(course)}>
              Edit
            </button>
            <button type="button" onClick={() => remove(course.id)}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
~~~~

The UI uses the response from the server for create and update. The delete request returns no body, so the client removes the item from local state only after the server confirms success. If a request fails, the previous data remains and the error is shown.

A production interface should prevent overlapping mutations on the same record and may ask the user to confirm deletion. For larger collections, use pagination and avoid loading every record at once.

## 8. Walk through each operation

- **Create:** Submit the form. The browser sends JSON. Express parses it, the service validates allowed fields, Mongoose saves it, and the API returns 201 with the new resource.
- **Read:** The first render fetches the collection. Each record uses its stable public ID as the React key.
- **Update:** Select Edit, change a field, and submit. PATCH includes the fields to change. The service preserves omitted fields and returns the updated representation.
- **Delete:** Select Delete. The server removes the record and returns 204. The client does not attempt to parse a JSON body.

## 9. Verify behavior manually

1. Start MongoDB, the Express API, and the React development server.
2. Load the page and inspect GET /api/courses in the browser Network panel.
3. Create a course and confirm a 201 response and the returned ID.
4. Edit one field and confirm PATCH changes only the provided fields.
5. Send an empty title or an unsupported field and confirm a 400 JSON error.
6. Delete a course and confirm a 204 response without a body.
7. Reload and check that the database state matches the UI.
8. Try an invalid and a nonexistent ID and confirm the API distinguishes them.

## Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Next chapter |
| --- | --- | --- | --- |
| [089 - Connect React to Express end to end](../lessons/089-connect-react-to-express-end-to-end.md) | [Lesson](../lessons/090-build-a-crud-feature-across-ui-api-and-database.md) | [Q&A](../qnas/090-build-a-crud-feature-across-ui-api-and-database.md) | [091 - Authentication end to end](../lessons/091-authentication-end-to-end.md) |
