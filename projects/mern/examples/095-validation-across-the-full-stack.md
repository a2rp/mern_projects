# 095 - Validation across the full stack: Example

This example implements a course create and update flow with browser feedback, Zod request schemas, validation middleware, an authenticated service, Mongoose constraints, and a stable error envelope. The server passes only parsed request data into the service and derives the owner ID from the authenticated session.

The code uses Zod 4. Keep the installed package version aligned with the project's runtime and lockfile.

## 1. Install the server validator

~~~~text
# server dependency
zod
~~~~

The client can use the same schema package for non-security feedback if the repository has a shared package. The API must still parse the request on the server; client-side validation is never the enforcement boundary.

## 2. Define allowlisted request schemas

~~~~js
// server/src/features/courses/course.schemas.js
import * as z from "zod";

export const createCourseSchema = z.strictObject({
  title: z.string()
    .trim()
    .min(1, "Enter a course title.")
    .max(120, "Course titles must be 120 characters or fewer."),
  description: z.string()
    .trim()
    .max(2000, "Description must be 2000 characters or fewer.")
    .optional()
});

export const updateCourseSchema = z
  .strictObject({
    title: z.string()
      .trim()
      .min(1, "Enter a course title.")
      .max(120, "Course titles must be 120 characters or fewer.")
      .optional(),
    description: z.string()
      .trim()
      .max(2000, "Description must be 2000 characters or fewer.")
      .optional()
  })
  .refine(
    (value) => Object.keys(value).length > 0,
    "Provide at least one field to update."
  );

export const listCoursesQuerySchema = z.strictObject({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(100).optional()
});
~~~~

The strict schema rejects unsupported properties such as <code>ownerId</code> or <code>isAdmin</code>. The API still constructs database writes from an explicit list of fields.

## 3. Map validation errors to a stable API response

~~~~js
// server/src/middleware/validate.js
function formatIssues(issues) {
  return issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message
  }));
}

export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_FAILED",
          message: "Check the submitted fields.",
          fields: formatIssues(result.error.issues)
        }
      });
    }

    req.validatedBody = result.data;
    next();
  };
}

export function validateQuery(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_FAILED",
          message: "Check the query parameters.",
          fields: formatIssues(result.error.issues)
        }
      });
    }

    req.validatedQuery = result.data;
    next();
  };
}
~~~~

Do not return the original request or raw exception. Keep the response shape stable so the React client can map field errors.

## 4. Define persistence constraints

~~~~js
// server/src/features/courses/course.model.js
import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 120
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

courseSchema.index({ ownerId: 1, createdAt: -1 });

export const Course = mongoose.model("Course", courseSchema);
~~~~

These constraints protect documents created by other server paths too. They do not replace the API schema or authorization check.

## 5. Keep services explicit about writable fields

~~~~js
// server/src/features/courses/course.service.js
import mongoose from "mongoose";
import { Course } from "./course.model.js";

function httpError(status, code, message) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

function parseCourseId(value) {
  if (typeof value !== "string" || !/^[a-f\d]{24}$/i.test(value)) {
    throw httpError(404, "NOT_FOUND", "Course not found.");
  }

  return new mongoose.Types.ObjectId(value);
}

function toPublicCourse(course) {
  return {
    id: String(course._id),
    title: course.title,
    description: course.description,
    createdAt: course.createdAt,
    updatedAt: course.updatedAt
  };
}

export async function createCourse({ ownerId, input }) {
  const course = await Course.create({
    ownerId,
    title: input.title,
    description: input.description ?? ""
  });

  return toPublicCourse(course);
}

export async function updateCourse({ ownerId, courseId, input }) {
  const course = await Course.findOne({
    _id: parseCourseId(courseId),
    ownerId
  });

  if (!course) {
    throw httpError(404, "NOT_FOUND", "Course not found.");
  }

  if (Object.hasOwn(input, "title")) {
    course.title = input.title;
  }

  if (Object.hasOwn(input, "description")) {
    course.description = input.description;
  }

  await course.save();
  return toPublicCourse(course);
}

export async function listCourses({ ownerId, query }) {
  const filter = { ownerId };

  if (query.search) {
    const escapedSearch = escapeRegex(query.search);
    filter.title = { $regex: escapedSearch, $options: "i" };
  }

  const skip = (query.page - 1) * query.limit;
  const [items, total] = await Promise.all([
    Course.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(query.limit),
    Course.countDocuments(filter)
  ]);

  return {
    items: items.map(toPublicCourse),
    page: query.page,
    limit: query.limit,
    total
  };
}

function escapeRegex(value) {
  const metaCharacters = new Set([
    ".", "*", "+", "?", "^", "$", "{", "}", "(", ")", "|", "[", "]", "\\"
  ]);

  return Array.from(value, (character) =>
    metaCharacters.has(character) ? "\\" + character : character
  ).join("");
}
~~~~

The search query escapes user text before using it as a regular expression. Never treat a request object as a MongoDB filter. For large collections, choose an indexed search strategy rather than relying on an unbounded regular expression.

## 6. Connect schemas, authentication, and controllers

~~~~js
// server/src/features/courses/course.controller.js
import * as courseService from "./course.service.js";

export async function create(req, res, next) {
  try {
    const data = await courseService.createCourse({
      ownerId: req.user.id,
      input: req.validatedBody
    });

    res.status(201).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function update(req, res, next) {
  try {
    const data = await courseService.updateCourse({
      ownerId: req.user.id,
      courseId: req.params.courseId,
      input: req.validatedBody
    });

    res.json({ data });
  } catch (error) {
    next(error);
  }
}

export async function list(req, res, next) {
  try {
    const data = await courseService.listCourses({
      ownerId: req.user.id,
      query: req.validatedQuery
    });

    res.json({ data });
  } catch (error) {
    next(error);
  }
}
~~~~

~~~~js
// server/src/features/courses/course.routes.js
import { Router } from "express";
import { requireAuth } from "../auth/require-auth.js";
import { validateBody, validateQuery } from "../../middleware/validate.js";
import {
  createCourseSchema,
  listCoursesQuerySchema,
  updateCourseSchema
} from "./course.schemas.js";
import * as controller from "./course.controller.js";

export const courseRouter = Router();

courseRouter.get(
  "/",
  requireAuth,
  validateQuery(listCoursesQuerySchema),
  controller.list
);

courseRouter.post(
  "/",
  requireAuth,
  validateBody(createCourseSchema),
  controller.create
);

courseRouter.patch(
  "/:courseId",
  requireAuth,
  validateBody(updateCourseSchema),
  controller.update
);
~~~~

The owner is provided by <code>requireAuth</code>, not the request body. Cookie-authenticated POST and PATCH requests also pass through the application's CSRF middleware.

## 7. Normalize persistence errors centrally

~~~~js
// server/src/middleware/error-handler.js
export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  if (error?.code === 11000) {
    return res.status(409).json({
      error: {
        code: "CONFLICT",
        message: "A record with those details already exists."
      }
    });
  }

  if (error?.name === "ValidationError") {
    return res.status(400).json({
      error: {
        code: "VALIDATION_FAILED",
        message: "The saved data did not meet the required constraints."
      }
    });
  }

  const status = Number.isInteger(error.status) ? error.status : 500;
  const safeMessage =
    status < 500 ? error.message : "An unexpected server error occurred.";

  if (status >= 500) {
    console.error("Request failed", {
      requestId: req.id,
      code: error.code ?? "UNEXPECTED_ERROR"
    });
  }

  res.status(status).json({
    error: {
      code: error.code ?? "REQUEST_FAILED",
      message: safeMessage
    }
  });
}
~~~~

Register this after routes. Avoid returning raw Mongoose messages: they may contain internal path names or values. Keep logs useful without including credentials or full request bodies.

## 8. Add browser constraints and server field errors

~~~~jsx
// client/src/features/courses/CourseForm.jsx
import { useState } from "react";
import { createCourse } from "./course.api.js";

export function CourseForm({ csrfToken }) {
  const [title, setTitle] = useState("");
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  async function submit(event) {
    event.preventDefault();
    setErrors({});
    setMessage("");
    setStatus("saving");

    try {
      await createCourse({ title }, csrfToken);
      setTitle("");
      setStatus("idle");
      setMessage("Course saved.");
    } catch (error) {
      const nextErrors = {};

      for (const issue of error.fields ?? []) {
        if (issue.path) nextErrors[issue.path] = issue.message;
      }

      setErrors(nextErrors);
      setStatus("error");
      setMessage(error.message);
    }
  }

  return (
    <form onSubmit={submit}>
      <label htmlFor="course-title">Course title</label>
      <input
        id="course-title"
        name="title"
        required
        maxLength={120}
        value={title}
        onChange={(event) => {
          setTitle(event.target.value);
          setErrors((current) => ({ ...current, title: undefined }));
        }}
        aria-invalid={Boolean(errors.title)}
        aria-describedby={errors.title ? "course-title-error" : undefined}
      />
      {errors.title && (
        <p id="course-title-error" role="alert">{errors.title}</p>
      )}

      <button type="submit" disabled={status === "saving"}>
        {status === "saving" ? "Saving…" : "Save course"}
      </button>
      {message && <p role="status" aria-live="polite">{message}</p>}
    </form>
  );
}
~~~~

The browser keeps the submitted value after an API error and gives the user a chance to correct it. A client-side length check is optional feedback; the server schema remains authoritative.

## 9. Parse the API response in the client

~~~~js
// client/src/features/courses/course.api.js
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "";

async function readJson(response) {
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(
      payload?.error?.message ?? "The request failed."
    );
    error.status = response.status;
    error.code = payload?.error?.code;
    error.fields = payload?.error?.fields ?? [];
    throw error;
  }

  return payload.data;
}

export async function createCourse(input, csrfToken) {
  const response = await fetch(apiBaseUrl + "/api/courses", {
    method: "POST",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-CSRF-Token": csrfToken
    },
    body: JSON.stringify(input)
  });

  return readJson(response);
}
~~~~

In a real app, obtain <code>csrfToken</code> from the authentication state or shared API client. Keep this example focused on the response contract: the client extracts safe field issues while server policy remains on the API.

## 10. Keep the browser schema as a convenience

If the client shares a schema package, it may use the same title rules to show errors before submission. A shared package should contain only common validation logic and types; it must not contain secrets or server-only authorization rules.

Even if both sides share a schema, the server must run it independently. The browser bundle can be edited, disabled, or bypassed.

## Manual walkthrough

1. Submit an empty title through the UI and confirm the browser provides immediate feedback.
2. Submit the same invalid body directly to the API and confirm the server returns a validation error.
3. Include an unexpected <code>ownerId</code> key and confirm the strict schema rejects it.
4. Send a title at 120 characters, then one at 121 characters.
5. Send an empty query page and an excessive limit; confirm the API rejects invalid bounds.
6. Update only the title and verify the existing description remains unchanged.
7. Attempt to update a course owned by another user and confirm the result is not exposed.
8. Cause a Mongoose validation error and confirm it maps to a safe response.
9. Confirm duplicate-key errors return a conflict without exposing raw database details.
10. Inspect the React field markup and confirm error association and screen-reader announcement.

## Common mistakes

- Validating only in React.
- Trusting the client's owner ID or role.
- Passing all of <code>req.body</code> into a model.
- Returning raw Zod or Mongoose errors.
- Forgetting body-size, list-size, and nested-array limits.
- Using loose coercion without understanding its conversions.
- Treating a syntactically valid ID as permission.
- Depending on a pre-query uniqueness check without a unique index.
- Forgetting <code>runValidators</code> on query update operations.
- Using user text as a database operator or regex without a safe query design.
- Stripping data and assuming that prevents output injection.
- Clearing useful form input after a validation error.

## Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- | --- |
| [094 - Unit, integration, and end-to-end testing](../lessons/094-unit-integration-and-end-to-end-testing.md) | [Lesson](../lessons/095-validation-across-the-full-stack.md) | [Q&A](../qnas/095-validation-across-the-full-stack.md) | [Example](095-validation-across-the-full-stack.md) | [096 - Profile MongoDB queries and improve indexes](096-profile-mongodb-queries-and-improve-indexes.md) |
