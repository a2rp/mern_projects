# 078 - Client-side form validation and user experience: example

This example builds a form for adding a course. It validates fields before sending a request, links errors to their controls, shows a submission summary, and keeps the entered values if the API rejects the request.

The Express endpoint validates the same important constraints on the server. The browser checks are for usability; the server remains authoritative.

## What you will build

- A controlled React form with a title, description, and level.
- Field-level validation after submission and as the user corrects an error.
- An error summary with links to invalid fields.
- Pending, API failure, and success feedback.
- A JSON POST endpoint that validates input and saves a MongoDB document.
- A safe response shape for field and form errors.

## File structure

~~~text
client/
└── src/
    ├── api/
    │   └── courses.js
    ├── CreateCourseForm.jsx
    └── CreateCourseForm.css

server/
└── routes/
    └── courseWriteRoutes.js
~~~

## 1. Add an API helper

Create <code>client/src/api/courses.js</code>:

~~~js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

export async function createCourse(values) {
  let response;

  try {
    response = await fetch(API_BASE_URL + "/api/courses", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });
  } catch {
    throw new Error("Could not reach the server. Check your connection and try again.");
  }

  let payload;

  try {
    payload = await response.json();
  } catch {
    throw new Error("The server returned an unreadable response.");
  }

  if (!response.ok) {
    const error = new Error(payload.message || "The course could not be created.");
    error.fieldErrors = payload.errors || {};
    throw error;
  }

  if (!payload.course) {
    throw new Error("The server did not return the created course.");
  }

  return payload.course;
}
~~~

The helper sends a JSON body and reads a predictable API response. It keeps server field errors separate from the general form error so the component can display them beside the relevant inputs.

## 2. Build the controlled form

Create <code>client/src/CreateCourseForm.jsx</code>:

~~~jsx
import { useRef, useState } from "react";
import { createCourse } from "./api/courses.js";
import "./CreateCourseForm.css";

const initialValues = {
  title: "",
  description: "",
  level: "",
};

const levels = ["Beginner", "Intermediate", "Advanced"];

function validateField(name, value) {
  const normalizedValue = value.trim();

  if (name === "title") {
    if (!normalizedValue) {
      return "Enter a course title.";
    }

    if (normalizedValue.length < 3) {
      return "Use at least 3 characters for the title.";
    }

    if (normalizedValue.length > 100) {
      return "Keep the title to 100 characters or fewer.";
    }
  }

  if (name === "description") {
    if (!normalizedValue) {
      return "Enter a short description.";
    }

    if (normalizedValue.length < 10) {
      return "Use at least 10 characters for the description.";
    }

    if (normalizedValue.length > 500) {
      return "Keep the description to 500 characters or fewer.";
    }
  }

  if (name === "level" && !levels.includes(value)) {
    return "Choose a course level.";
  }

  return "";
}

function validateForm(values) {
  const errors = {};

  for (const fieldName of Object.keys(initialValues)) {
    const message = validateField(fieldName, values[fieldName]);

    if (message) {
      errors[fieldName] = message;
    }
  }

  return errors;
}

export default function CreateCourseForm() {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fieldRefs = useRef({});

  function focusFirstError(nextErrors) {
    const firstField = Object.keys(nextErrors)[0];

    if (firstField) {
      fieldRefs.current[firstField]?.focus();
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;
    const nextValues = {
      ...values,
      [name]: value,
    };

    setValues(nextValues);
    setSuccessMessage("");
    setSubmitError("");

    if (hasSubmitted) {
      const message = validateField(name, value);

      setErrors((currentErrors) => {
        const nextErrors = { ...currentErrors };

        if (message) {
          nextErrors[name] = message;
        } else {
          delete nextErrors[name];
        }

        return nextErrors;
      });
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setHasSubmitted(true);
    setSuccessMessage("");
    setSubmitError("");

    const clientErrors = validateForm(values);
    setErrors(clientErrors);

    if (Object.keys(clientErrors).length > 0) {
      setSubmitError("Please correct the highlighted fields.");
      focusFirstError(clientErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const createdCourse = await createCourse({
        title: values.title.trim(),
        description: values.description.trim(),
        level: values.level,
      });

      setValues(initialValues);
      setErrors({});
      setHasSubmitted(false);
      setSuccessMessage("Course “" + createdCourse.title + "” was created.");
    } catch (error) {
      const serverErrors = error.fieldErrors || {};

      setErrors(serverErrors);
      setSubmitError(error.message || "The course could not be created.");
      setHasSubmitted(true);
      focusFirstError(serverErrors);
    } finally {
      setIsSubmitting(false);
    }
  }

  const errorEntries = Object.entries(errors);

  return (
    <main className="form-page">
      <header className="form-heading">
        <p className="eyebrow">Course management</p>
        <h1>Add a course</h1>
        <p>Enter the course details and submit them to the API.</p>
      </header>

      {submitError ? (
        <section className="error-summary" role="alert" aria-labelledby="error-title">
          <h2 id="error-title">The form needs your attention</h2>
          <p>{submitError}</p>

          {errorEntries.length > 0 ? (
            <ul>
              {errorEntries.map(([field, message]) => (
                <li key={field}>
                  <a href={"#" + field}>{message}</a>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      {successMessage ? (
        <p className="success-message" role="status">
          {successMessage}
        </p>
      ) : null}

      <form className="course-form" noValidate onSubmit={handleSubmit}>
        <div className="field-group">
          <label htmlFor="title">
            Course title <span aria-hidden="true">*</span>
          </label>
          <p className="field-help" id="title-help">
            Use 3 to 100 characters.
          </p>
          <input
            ref={(node) => {
              fieldRefs.current.title = node;
            }}
            id="title"
            name="title"
            type="text"
            required
            minLength={3}
            maxLength={100}
            value={values.title}
            onChange={handleChange}
            aria-invalid={errors.title ? "true" : undefined}
            aria-describedby={
              errors.title ? "title-help title-error" : "title-help"
            }
          />
          {errors.title ? (
            <p className="field-error" id="title-error">
              {errors.title}
            </p>
          ) : null}
        </div>

        <div className="field-group">
          <label htmlFor="description">
            Description <span aria-hidden="true">*</span>
          </label>
          <p className="field-help" id="description-help">
            Use 10 to 500 characters.
          </p>
          <textarea
            ref={(node) => {
              fieldRefs.current.description = node;
            }}
            id="description"
            name="description"
            rows={5}
            required
            minLength={10}
            maxLength={500}
            value={values.description}
            onChange={handleChange}
            aria-invalid={errors.description ? "true" : undefined}
            aria-describedby={
              errors.description
                ? "description-help description-error"
                : "description-help"
            }
          />
          {errors.description ? (
            <p className="field-error" id="description-error">
              {errors.description}
            </p>
          ) : null}
        </div>

        <div className="field-group">
          <label htmlFor="level">
            Level <span aria-hidden="true">*</span>
          </label>
          <p className="field-help" id="level-help">
            Choose the expected experience level.
          </p>
          <select
            ref={(node) => {
              fieldRefs.current.level = node;
            }}
            id="level"
            name="level"
            required
            value={values.level}
            onChange={handleChange}
            aria-invalid={errors.level ? "true" : undefined}
            aria-describedby={errors.level ? "level-help level-error" : "level-help"}
          >
            <option value="" disabled>
              Choose a level
            </option>
            {levels.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
          {errors.level ? (
            <p className="field-error" id="level-error">
              {errors.level}
            </p>
          ) : null}
        </div>

        <div className="form-actions">
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Create course"}
          </button>
          {isSubmitting ? (
            <p className="pending-message" role="status">
              Saving the course…
            </p>
          ) : null}
        </div>
      </form>
    </main>
  );
}
~~~

The inputs are controlled, and their state is updated synchronously in <code>handleChange</code>. Validation runs on submit; after the first submit, a corrected field's error updates as the user edits it.

The form uses <code>noValidate</code> because this example displays its own inline validation. The HTML constraints still document the intended limits, but the JavaScript validation must run on every submit. The server validates them again.

Field errors are associated through <code>aria-describedby</code> and marked with <code>aria-invalid</code>. The summary links to each field, and the form focuses the first invalid field after submit. If the API request fails, the entered values remain in state.

## 3. Add the server-side route

Create <code>server/routes/courseWriteRoutes.js</code>:

~~~js
const express = require("express");
const Course = require("../models/Course");

const router = express.Router();
const allowedLevels = ["Beginner", "Intermediate", "Advanced"];

function validateCourseInput(body) {
  const errors = {};
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description =
    typeof body.description === "string" ? body.description.trim() : "";
  const level = typeof body.level === "string" ? body.level : "";

  if (!title) {
    errors.title = "Enter a course title.";
  } else if (title.length < 3) {
    errors.title = "Use at least 3 characters for the title.";
  } else if (title.length > 100) {
    errors.title = "Keep the title to 100 characters or fewer.";
  }

  if (!description) {
    errors.description = "Enter a short description.";
  } else if (description.length < 10) {
    errors.description = "Use at least 10 characters for the description.";
  } else if (description.length > 500) {
    errors.description = "Keep the description to 500 characters or fewer.";
  }

  if (!allowedLevels.includes(level)) {
    errors.level = "Choose a valid course level.";
  }

  return {
    errors,
    values: { title, description, level },
  };
}

function createSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

router.post("/", async (req, res, next) => {
  const { errors, values } = validateCourseInput(req.body || {});

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      message: "Please correct the highlighted fields.",
      errors,
    });
  }

  const slug = createSlug(values.title);

  if (!slug) {
    return res.status(400).json({
      message: "Use a title containing letters or numbers.",
      errors: {
        title: "Use a title containing letters or numbers.",
      },
    });
  }

  try {
    const course = await Course.create({
      slug,
      ...values,
    });

    return res.status(201).json({
      course: {
        slug: course.slug,
        title: course.title,
        description: course.description,
        level: course.level,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "A course with this title already exists.",
        errors: {
          title: "Choose a different title.",
        },
      });
    }

    return next(error);
  }
});

module.exports = router;
~~~

Mount the route in <code>server/app.js</code> after <code>express.json()</code> and before the API not-found handler:

~~~js
const courseWriteRoutes = require("./routes/courseWriteRoutes");

app.use("/api/courses", courseWriteRoutes);
~~~

This adds <code>POST /api/courses</code> alongside the GET endpoints from the previous chapter. Keep the existing JSON parser before this route so <code>req.body</code> contains parsed JSON.

The existing Mongoose schema should also enforce matching lengths and allowed values. For example:

~~~js
title: {
  type: String,
  required: true,
  trim: true,
  minlength: 3,
  maxlength: 100,
},
description: {
  type: String,
  required: true,
  trim: true,
  minlength: 10,
  maxlength: 500,
},
level: {
  type: String,
  required: true,
  enum: ["Beginner", "Intermediate", "Advanced"],
},
~~~

The route returns field errors for invalid input and a 409 conflict when a unique slug already exists. The database's unique index is still important because two requests can race between an application-level check and a write.

For a real content-management feature, protect this endpoint with authentication and an authorization rule such as an administrator role. That check belongs on the server and must run for every request.

## 4. Add styles

Create <code>client/src/CreateCourseForm.css</code>:

~~~css
:root {
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
    "Segoe UI", sans-serif;
  color: #182437;
  background: #f3f6fb;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  min-width: 320px;
  min-height: 100vh;
  margin: 0;
}

button,
input,
textarea,
select {
  font: inherit;
}

.form-page {
  width: min(100% - 2rem, 720px);
  margin-inline: auto;
  padding-block: 3rem;
}

.form-heading {
  margin-bottom: 1.5rem;
}

.eyebrow {
  margin-bottom: 0.55rem;
  color: #315bcc;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

h1,
h2,
p {
  margin-top: 0;
}

h1 {
  margin-bottom: 0.65rem;
  font-size: clamp(2rem, 5vw, 2.8rem);
  letter-spacing: -0.045em;
}

.form-heading > p:last-child {
  color: #59677a;
  line-height: 1.6;
}

.course-form,
.error-summary,
.success-message {
  padding: 1.35rem;
  border: 1px solid #dce4ef;
  border-radius: 0.9rem;
  background: #fff;
  box-shadow: 0 10px 30px rgb(32 55 90 / 5%);
}

.error-summary {
  margin-bottom: 1rem;
  border-color: #e7bcbc;
  background: #fffafa;
}

.error-summary h2 {
  margin-bottom: 0.5rem;
  color: #7c2222;
  font-size: 1.1rem;
}

.error-summary p {
  color: #633434;
}

.error-summary ul {
  margin-bottom: 0;
  padding-left: 1.25rem;
}

.error-summary a {
  color: #7c2222;
  text-underline-offset: 0.18em;
}

.success-message {
  margin-bottom: 1rem;
  border-color: #b9dcc8;
  background: #f5fff8;
  color: #1c5b36;
}

.field-group {
  display: grid;
  gap: 0.45rem;
  margin-bottom: 1.2rem;
}

.field-group label {
  font-weight: 750;
}

.field-help {
  margin: 0;
  color: #637187;
  font-size: 0.9rem;
}

.field-group input,
.field-group textarea,
.field-group select {
  width: 100%;
  min-height: 2.85rem;
  padding: 0.7rem 0.8rem;
  border: 1px solid #cbd5e3;
  border-radius: 0.6rem;
  background: #fff;
  color: #182437;
}

.field-group textarea {
  min-height: 8rem;
  resize: vertical;
}

.field-group input:focus-visible,
.field-group textarea:focus-visible,
.field-group select:focus-visible,
button:focus-visible,
a:focus-visible {
  outline: 3px solid #8da9ff;
  outline-offset: 2px;
}

.field-group [aria-invalid="true"] {
  border-color: #ad3030;
}

.field-error {
  margin: 0;
  color: #8b2424;
  font-size: 0.92rem;
}

.form-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.form-actions button {
  min-height: 2.8rem;
  padding: 0.7rem 1rem;
  border: 0;
  border-radius: 0.6rem;
  background: #315bcc;
  color: #fff;
  cursor: pointer;
  font-weight: 750;
}

.form-actions button:hover:not(:disabled) {
  background: #2449aa;
}

.form-actions button:disabled {
  cursor: wait;
  opacity: 0.7;
}

.pending-message {
  margin: 0;
  color: #59677a;
}

@media (max-width: 520px) {
  .form-page {
    padding-block: 2rem;
  }

  .course-form,
  .error-summary,
  .success-message {
    padding: 1rem;
  }
}
~~~

Render <code>CreateCourseForm</code> from your app page or route. If the existing project already defines global colors or a reset, keep those shared styles and adapt the component-specific rules rather than duplicating global CSS.

## 5. Try the form

Run the React client and Express API with MongoDB available.

1. Submit the blank form. The summary should link to each invalid field, and focus should move to the first one.
2. Enter a title shorter than 3 characters. The title error should explain the minimum.
3. Correct the title and complete the remaining fields. Errors should update as fields are corrected.
4. Submit valid data. The button should show a pending label, then the success message should confirm the created course.
5. Submit the same title again. The API should return a conflict and the title error should appear without clearing other values.
6. Stop the API and submit valid values. The form should keep the values and show a connection error.
7. Use only the keyboard to move through labels, controls, error-summary links, and the submit button.

## Key takeaways

- Native constraints are a useful first layer; custom feedback can improve consistency and clarity.
- Controlled fields need synchronous state updates.
- Associate each field error with its control and use text, not color alone.
- Preserve form values when a request fails.
- The server and database enforce validation and uniqueness independently of the client.
- Protect sensitive write endpoints with server-side authorization.

## Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [077 - Loading, error, empty, and success states](../lessons/077-loading-error-empty-and-success-states.md) | [Q&A](../qnas/078-client-side-form-validation-and-user-experience.md) | [Lesson](../lessons/078-client-side-form-validation-and-user-experience.md) | [079 - Authentication user experience](../lessons/079-authentication-user-experience.md) |
