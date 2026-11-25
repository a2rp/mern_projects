# 090 - Build a CRUD feature across UI, API, and database

CRUD means create, read, update, and delete. A full-stack CRUD feature connects a user interface to HTTP endpoints and persistence while preserving one consistent resource contract. Each layer has its own responsibility: React gathers input and renders state, Express handles HTTP, the service enforces use-case rules, and MongoDB stores records.

This chapter builds a course feature from the API contract outward, then connects each operation to a client interaction. It also covers validation, missing records, error statuses, and how to avoid trusting browser input.

## Learning outcomes

After this chapter, you should be able to:

- Design collection and item endpoints for all four CRUD operations.
- Keep a stable JSON representation between React and Express.
- Validate create and update data on the server.
- Distinguish a missing resource from an unexpected server error.
- Update and delete records safely by identifier.
- Connect forms and lists to the API with clear request states.
- Keep client validation helpful while treating server validation as authoritative.

## 1. Define the resource contract

A course resource might expose these fields:

~~~~json
{
  "id": "665000000000000000000001",
  "title": "HTML fundamentals",
  "description": "A practical introduction.",
  "status": "draft"
}
~~~~

The client-visible <code>id</code> is a stable resource identifier. It does not expose every internal database field.

| Operation | HTTP request | Success response |
| --- | --- | --- |
| List courses | <code>GET /api/courses</code> | 200 with <code>{ "data": [...] }</code> |
| Read one course | <code>GET /api/courses/:id</code> | 200 with <code>{ "data": {...} }</code> |
| Create course | <code>POST /api/courses</code> | 201 with the created resource |
| Update course | <code>PATCH /api/courses/:id</code> | 200 with the updated resource |
| Delete course | <code>DELETE /api/courses/:id</code> | 204 with no response body |

A missing identifier can return 404. Invalid input can return 400 or 422 according to the API's chosen convention. An unexpected failure returns 500 with a generic message; internal details belong in server logs.

## 2. Model fields and storage rules

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

Schema validation is a useful persistence-level guard. The service still validates request shape and selects allowed fields. A database schema is not a substitute for authorization or endpoint-specific rules.

## 3. Validate input and map public data

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

function validateCourseInput(input, { partial = false } = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    const error = new Error("Request body must be a JSON object.");
    error.status = 400;
    throw error;
  }

  const allowed = new Set(["title", "description"]);
  const keys = Object.keys(input);

  if (keys.some((key) => !allowed.has(key))) {
    const error = new Error("Request contains an unsupported field.");
    error.status = 400;
    throw error;
  }

  const result = {};

  if (!partial || Object.hasOwn(input, "title")) {
    if (typeof input.title !== "string" || !input.title.trim()) {
      const error = new Error("Title is required.");
      error.status = 400;
      throw error;
    }

    result.title = input.title.trim();

    if (result.title.length > 160) {
      const error = new Error("Title must be 160 characters or fewer.");
      error.status = 400;
      throw error;
    }
  }

  if (Object.hasOwn(input, "description")) {
    if (typeof input.description !== "string") {
      const error = new Error("Description must be text.");
      error.status = 400;
      throw error;
    }

    result.description = input.description.trim();

    if (result.description.length > 2000) {
      const error = new Error("Description must be 2000 characters or fewer.");
      error.status = 400;
      throw error;
    }
  } else if (!partial) {
    result.description = "";
  }

  if (partial && keys.length === 0) {
    const error = new Error("Provide at least one field to update.");
    error.status = 400;
    throw error;
  }

  return result;
}

function invalidIdError() {
  const error = new Error("Course id is invalid.");
  error.status = 400;
  return error;
}

function notFoundError() {
  const error = new Error("Course was not found.");
  error.status = 404;
  return error;
}

export async function listCourses() {
  const courses = await Course.find()
    .select("title description status")
    .sort({ createdAt: -1 })
    .lean();

  return courses.map(toCourseDto);
}

export async function getCourse(id) {
  if (!Course.base.Types.ObjectId.isValid(id)) throw invalidIdError();

  const course = await Course.findById(id).select("title description status");
  if (!course) throw notFoundError();

  return toCourseDto(course);
}

export async function createCourse(input) {
  const data = validateCourseInput(input);
  const course = await Course.create(data);
  return toCourseDto(course);
}

export async function updateCourse(id, input) {
  if (!Course.base.Types.ObjectId.isValid(id)) throw invalidIdError();

  const data = validateCourseInput(input, { partial: true });
  const course = await Course.findById(id);

  if (!course) throw notFoundError();

  Object.assign(course, data);
  await course.save();

  return toCourseDto(course);
}

export async function deleteCourse(id) {
  if (!Course.base.Types.ObjectId.isValid(id)) throw invalidIdError();

  const course = await Course.findByIdAndDelete(id);
  if (!course) throw notFoundError();
}
~~~~

This example fetches a document before updating it and saves it through Mongoose document validation. If using an update query instead, explicitly enable update validators and understand that update validators have limitations compared with validating a full document. Never copy arbitrary request fields into a database update.

The API decides which fields callers may change. Here, the client cannot set status; publishing is a separate operation with its own authorization and rules.

## 4. Define route handlers for each operation

~~~~js
// server/src/features/courses/course.controller.js
import * as courses from "./course.service.js";

export async function list(req, res, next) {
  try {
    res.status(200).json({ data: await courses.listCourses() });
  } catch (error) {
    next(error);
  }
}

export async function getOne(req, res, next) {
  try {
    res.status(200).json({ data: await courses.getCourse(req.params.id) });
  } catch (error) {
    next(error);
  }
}

export async function create(req, res, next) {
  try {
    res.status(201).json({ data: await courses.createCourse(req.body) });
  } catch (error) {
    next(error);
  }
}

export async function update(req, res, next) {
  try {
    res.status(200).json({
      data: await courses.updateCourse(req.params.id, req.body)
    });
  } catch (error) {
    next(error);
  }
}

export async function remove(req, res, next) {
  try {
    await courses.deleteCourse(req.params.id);
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

A 204 response has no body. The client should not call <code>response.json()</code> for that response.

## 5. Assemble middleware and a JSON error boundary

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

The JSON parser must run before the routes. The error handler runs after routes and converts expected service errors to a stable API shape without exposing unexpected error details.

## 6. Build a client helper for JSON and empty responses

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

export async function listCourses() {
  return apiRequest("/api/courses");
}

export async function getCourse(id) {
  return apiRequest("/api/courses/" + encodeURIComponent(id));
}

export async function createCourse(input) {
  return apiRequest("/api/courses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
}

export async function updateCourse(id, input) {
  return apiRequest("/api/courses/" + encodeURIComponent(id), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
}

export async function deleteCourse(id) {
  return apiRequest("/api/courses/" + encodeURIComponent(id), {
    method: "DELETE"
  });
}
~~~~

Encoding the identifier protects URL construction from characters that have special meaning in a path segment.

## 7. Connect the four operations to React

A feature page can load the collection, create a record, edit a record, and remove a record. This compact example keeps the list state in one component; larger interfaces may split forms and rows into components or use a data cache.

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
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  async function refreshCourses() {
    setStatus("loading");
    setError("");

    try {
      const result = await listCourses();
      setCourses(result.data);
      setStatus("success");
    } catch (requestError) {
      setError(requestError.message);
      setStatus("error");
    }
  }

  useEffect(() => {
    refreshCourses();
  }, []);

  function beginEdit(course) {
    setEditingId(course.id);
    setTitle(course.title);
    setDescription(course.description);
  }

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setDescription("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus("saving");
    setError("");

    const input = { title, description };

    try {
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

      resetForm();
      setStatus("success");
    } catch (requestError) {
      setError(requestError.message);
      setStatus("error");
    }
  }

  async function handleDelete(id) {
    setError("");

    try {
      await deleteCourse(id);
      setCourses((current) => current.filter((course) => course.id !== id));
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <main>
      <h1>Courses</h1>

      <form onSubmit={handleSubmit}>
        <label htmlFor="course-title">Title</label>
        <input
          id="course-title"
          value={title}
          maxLength={160}
          onChange={(event) => setTitle(event.target.value)}
          required
        />

        <label htmlFor="course-description">Description</label>
        <textarea
          id="course-description"
          value={description}
          maxLength={2000}
          onChange={(event) => setDescription(event.target.value)}
        />

        <button disabled={status === "saving"} type="submit">
          {editingId ? "Save changes" : "Create course"}
        </button>

        {editingId && (
          <button type="button" onClick={resetForm}>
            Cancel edit
          </button>
        )}
      </form>

      {error && <p role="alert">{error}</p>}
      {status === "loading" && <p>Loading courses…</p>}
      {status === "error" && (
        <button type="button" onClick={refreshCourses}>
          Try again
        </button>
      )}

      {status !== "loading" && courses.length === 0 && (
        <p>No courses yet.</p>
      )}

      <ul>
        {courses.map((course) => (
          <li key={course.id}>
            <h2>{course.title}</h2>
            <p>{course.description}</p>
            <button type="button" onClick={() => beginEdit(course)}>
              Edit
            </button>
            <button type="button" onClick={() => handleDelete(course.id)}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
~~~~

The browser constraints improve the form experience, but the service remains authoritative. A production interface should also confirm destructive actions when appropriate and disable duplicate actions while a mutation is pending.

## 8. Keep the collection view in sync

The example updates local React state after the API confirms a create, update, or delete. This is a simple form of server-confirmed state:

- Create adds the response resource after receiving 201.
- Update replaces the matching item with the returned resource.
- Delete removes the item after receiving 204.
- A failure leaves the previous collection visible and reports the error.

An optimistic UI can update before the server responds, but it needs a rollback or reconciliation plan if the request fails.

## 9. Manually inspect the full CRUD flow

1. Start the database, API, and frontend.
2. Load the page and inspect the list GET request.
3. Create a course and inspect the JSON body and 201 response.
4. Edit the title and verify the PATCH path and returned representation.
5. Try an invalid or empty title and confirm server validation returns an error.
6. Delete a record and confirm the API returns 204 with no JSON body.
7. Reload the page to confirm data persists in MongoDB.
8. Request a nonexistent identifier and confirm the API returns 404.

## Common mistakes

- Trusting client-side validation without checking on the server.
- Updating every database field from the request body.
- Treating PATCH as if omitted fields should be cleared.
- Forgetting update validators when using update queries.
- Returning a JSON body with 204 and then trying to parse it.
- Returning 500 for a normal missing record.
- Using unstable array indexes for record keys.
- Removing an item from the UI before the server confirms deletion without rollback.
- Returning raw database documents with fields the client should not see.
- Testing only the React screen without inspecting HTTP status and response shape.

## Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- | --- |
| [089 - Connect React to Express end to end](089-connect-react-to-express-end-to-end.md) | [Lesson](090-build-a-crud-feature-across-ui-api-and-database.md) | [Q&A](../qnas/090-build-a-crud-feature-across-ui-api-and-database.md) | [Example](../examples/090-build-a-crud-feature-across-ui-api-and-database.md) | [091 - Authentication end to end](091-authentication-end-to-end.md) |
