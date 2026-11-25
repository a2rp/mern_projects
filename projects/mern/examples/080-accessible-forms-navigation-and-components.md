# 080 - Accessible forms, navigation, and components: example

This example builds a small React course-edit page. It combines a skip link, a keyboard-operable disclosure navigation, current-page links, route focus handling, reusable form fields, grouped radio controls, inline validation, and an error summary.

The save request is supplied as a prop so the interface can connect to the API used by the project. The example keeps the server authoritative: the API must validate and authorize the update too.

## What you will build

- A skip link and named primary navigation landmark.
- A disclosure button with synchronized <code>aria-expanded</code> and Escape handling.
- Active route links using React Router’s <code>NavLink</code>.
- A focus target after client-side page navigation.
- Reusable text and textarea fields with unique ids, labels, hints, and errors.
- A labeled radio group and explicit button types.
- Inline errors, a linked error summary, and save status announcements.
- A responsive layout with a visible keyboard focus indicator.

## File structure

~~~text
client/src/
├── components/
│   ├── Button.jsx
│   ├── PrimaryNavigation.jsx
│   ├── TextField.jsx
│   └── TextAreaField.jsx
├── pages/
│   ├── CourseEditor.jsx
│   └── CoursesPage.jsx
├── App.jsx
└── accessible-interface.css
~~~

Install React Router if the project does not already use it.

## 1. Create reusable fields

Create <code>client/src/components/TextField.jsx</code>:

~~~jsx
import { useId } from "react";

export function TextField({
  id: providedId,
  label,
  hint,
  error,
  required = false,
  ...inputProps
}) {
  const generatedId = useId().replaceAll(":", "");
  const id = providedId ?? generatedId;
  const hintId = id + "-hint";
  const errorId = id + "-error";
  const descriptionIds = [
    hint ? hintId : null,
    error ? errorId : null,
  ].filter(Boolean);

  return (
    <div className="form-field">
      <label htmlFor={id}>
        {label}
        {required && <span> (required)</span>}
      </label>

      {hint && <p id={hintId} className="field-hint">{hint}</p>}

      <input
        {...inputProps}
        id={id}
        required={required}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={descriptionIds.length ? descriptionIds.join(" ") : undefined}
      />

      {error && <p id={errorId} className="field-error">{error}</p>}
    </div>
  );
}
~~~

Create <code>client/src/components/TextAreaField.jsx</code>:

~~~jsx
import { useId } from "react";

export function TextAreaField({
  id: providedId,
  label,
  hint,
  error,
  required = false,
  ...textareaProps
}) {
  const generatedId = useId().replaceAll(":", "");
  const id = providedId ?? generatedId;
  const hintId = id + "-hint";
  const errorId = id + "-error";
  const descriptionIds = [
    hint ? hintId : null,
    error ? errorId : null,
  ].filter(Boolean);

  return (
    <div className="form-field">
      <label htmlFor={id}>
        {label}
        {required && <span> (required)</span>}
      </label>

      {hint && <p id={hintId} className="field-hint">{hint}</p>}

      <textarea
        {...textareaProps}
        id={id}
        required={required}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={descriptionIds.length ? descriptionIds.join(" ") : undefined}
      />

      {error && <p id={errorId} className="field-error">{error}</p>}
    </div>
  );
}
~~~

These components provide visible labels and connect optional help and error text to the control. Caller-supplied attributes such as <code>name</code>, <code>value</code>, <code>onChange</code>, and <code>disabled</code> are forwarded. Keep ids unique when callers provide them.

Create <code>client/src/components/Button.jsx</code>:

~~~jsx
export function Button({ type = "button", children, ...buttonProps }) {
  return (
    <button type={type} {...buttonProps}>
      {children}
    </button>
  );
}
~~~

Defaulting to <code>type="button"</code> prevents an action button from accidentally submitting a form. A form explicitly opts in with <code>type="submit"</code>.

## 2. Add a disclosure navigation

Create <code>client/src/components/PrimaryNavigation.jsx</code>:

~~~jsx
import { useEffect, useId, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

export function PrimaryNavigation() {
  const [isOpen, setIsOpen] = useState(false);
  const generatedId = useId().replaceAll(":", "");
  const linksId = generatedId + "-primary-links";
  const buttonRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isOpen) return undefined;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <div className="primary-navigation">
      <NavLink className="site-name" to="/">Course notes</NavLink>

      <button
        ref={buttonRef}
        type="button"
        aria-expanded={isOpen}
        aria-controls={linksId}
        onClick={() => setIsOpen((open) => !open)}
      >
        {isOpen ? "Close navigation" : "Open navigation"}
      </button>

      <nav id={linksId} aria-label="Primary" hidden={!isOpen}>
        <ul>
          <li>
            <NavLink to="/" end>Home</NavLink>
          </li>
          <li>
            <NavLink to="/courses">Courses</NavLink>
          </li>
          <li>
            <NavLink to="/about">About</NavLink>
          </li>
        </ul>
      </nav>
    </div>
  );
}
~~~

This is a disclosure containing ordinary site links, not an ARIA menu widget. Tab moves between the button and links. Enter or Space activates the button. Escape closes the disclosure and returns focus to its button. The current route is marked by <code>NavLink</code>.

## 3. Focus the page heading after route changes

Client-side navigation updates the view without a full browser page load. A route focus helper can move focus to the new page heading after an actual route change.

Add this component in <code>client/src/App.jsx</code>:

~~~jsx
import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

function RouteFocusManager() {
  const location = useLocation();
  const previousPath = useRef(null);

  useEffect(() => {
    const isRouteChange =
      previousPath.current !== null &&
      previousPath.current !== location.pathname;
    previousPath.current = location.pathname;

    const heading = document.querySelector("#main-content h1");

    if (heading) {
      document.title = heading.textContent + " | Course notes";

      if (isRouteChange) {
        heading.setAttribute("tabindex", "-1");
        heading.focus();
      }
    }
  }, [location.pathname]);

  return null;
}
~~~

Set meaningful document titles for every route, including the initial route and route-specific state. Only move focus when navigation has completed; do not steal focus during ordinary state updates.

## 4. Build the accessible course editor

Create <code>client/src/pages/CourseEditor.jsx</code>:

~~~jsx
import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/Button.jsx";
import { TextAreaField } from "../components/TextAreaField.jsx";
import { TextField } from "../components/TextField.jsx";

const visibilityOptions = ["private", "public"];

function validate(values) {
  const errors = {};

  if (!values.title.trim()) {
    errors.title = "Enter a course title.";
  } else if (values.title.trim().length < 3) {
    errors.title = "Use at least 3 characters for the title.";
  } else if (values.title.trim().length > 100) {
    errors.title = "Keep the title to 100 characters or fewer.";
  }

  if (!values.description.trim()) {
    errors.description = "Enter a course description.";
  } else if (values.description.trim().length > 500) {
    errors.description = "Keep the description to 500 characters or fewer.";
  }

  if (!visibilityOptions.includes(values.visibility)) {
    errors.visibility = "Choose a visibility option.";
  }

  return errors;
}

export function CourseEditor({ course, onSave }) {
  const idPrefix = useId().replaceAll(":", "");
  const titleId = idPrefix + "-title";
  const descriptionId = idPrefix + "-description";
  const visibilityId = idPrefix + "-visibility";
  const summaryRef = useRef(null);
  const shouldFocusSummary = useRef(false);
  const [values, setValues] = useState({
    title: course.title ?? "",
    description: course.description ?? "",
    visibility: course.visibility ?? "private",
  });
  const [errors, setErrors] = useState({});
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!shouldFocusSummary.current) return;

    summaryRef.current?.focus();
    shouldFocusSummary.current = false;
  }, [errors]);

  function updateField(name, value) {
    const nextValues = { ...values, [name]: value };
    setValues(nextValues);
    setMessage("");

    if (hasSubmitted) {
      const nextErrors = validate(nextValues);
      setErrors(nextErrors);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setHasSubmitted(true);
    setMessage("");

    const nextErrors = validate(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      shouldFocusSummary.current = true;
      setStatus("idle");
      return;
    }

    setStatus("saving");

    try {
      await onSave({
        title: values.title.trim(),
        description: values.description.trim(),
        visibility: values.visibility,
      });
      setStatus("success");
      setMessage("Course saved.");
    } catch (error) {
      const fieldErrors = error.fieldErrors ?? {};
      setErrors(fieldErrors);
      setStatus("error");
      setMessage(error.message || "We could not save the course. Try again.");

      if (Object.keys(fieldErrors).length > 0) {
        shouldFocusSummary.current = true;
      }
    }
  }

  const errorItems = [
    errors.title && { id: titleId, message: errors.title },
    errors.description && { id: descriptionId, message: errors.description },
    errors.visibility && { id: visibilityId, message: errors.visibility },
  ].filter(Boolean);

  return (
    <section className="course-editor" aria-labelledby="edit-course-title">
      <h1 id="edit-course-title">Edit course</h1>
      <p>Update the course details and save your changes.</p>

      {hasSubmitted && errorItems.length > 0 && (
        <div
          ref={summaryRef}
          className="error-summary"
          tabIndex="-1"
          aria-labelledby={idPrefix + "-error-title"}
        >
          <h2 id={idPrefix + "-error-title"}>
            Review {errorItems.length === 1 ? "this problem" : "these problems"}
          </h2>
          <ul>
            {errorItems.map((item) => (
              <li key={item.id}>
                <a href={"#" + item.id}>{item.message}</a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <form noValidate onSubmit={handleSubmit}>
        <TextField
          id={titleId}
          name="title"
          label="Course title"
          hint="Use a short, descriptive title."
          required
          maxLength={100}
          value={values.title}
          error={errors.title}
          onChange={(event) => updateField("title", event.target.value)}
        />

        <TextAreaField
          id={descriptionId}
          name="description"
          label="Description"
          hint="Describe what learners will be able to do."
          required
          rows={5}
          maxLength={500}
          value={values.description}
          error={errors.description}
          onChange={(event) => updateField("description", event.target.value)}
        />

        <fieldset
          id={visibilityId}
          tabIndex="-1"
          className="visibility-group"
          aria-describedby={errors.visibility ? visibilityId + "-error" : undefined}
        >
          <legend>Course visibility (required)</legend>

          <label>
            <input
              type="radio"
              name="visibility"
              value="private"
              required
              checked={values.visibility === "private"}
              aria-invalid={errors.visibility ? "true" : undefined}
              onChange={(event) => updateField("visibility", event.target.value)}
            />
            Private
          </label>

          <label>
            <input
              type="radio"
              name="visibility"
              value="public"
              required
              checked={values.visibility === "public"}
              aria-invalid={errors.visibility ? "true" : undefined}
              onChange={(event) => updateField("visibility", event.target.value)}
            />
            Public
          </label>

          {errors.visibility && (
            <p id={visibilityId + "-error"} className="field-error">
              {errors.visibility}
            </p>
          )}
        </fieldset>

        <div className="form-actions">
          <Button type="submit" disabled={status === "saving"}>
            {status === "saving" ? "Saving…" : "Save course"}
          </Button>
          <Link className="button-link" to="/courses">Cancel</Link>
        </div>
      </form>

      {message && (
        <p
          className={status === "error" ? "form-message form-message-error" : "form-message"}
          role={status === "error" ? "alert" : "status"}
        >
          {message}
        </p>
      )}
    </section>
  );
}
~~~

The error summary is rendered after an invalid submission and receives focus once. Each summary link points to the corresponding field or group. Inline errors are also associated with controls. Correcting a field updates its error without moving focus.

The editor expects an existing <code>course</code> and an <code>onSave</code> function. For example, connect it to the API helper for this project:

~~~jsx
<CourseEditor
  course={courseFromLoader}
  onSave={(values) => updateCourse(courseFromLoader.id, values)}
/>
~~~

The <code>onSave</code> promise should reject with a safe <code>message</code> and optional <code>fieldErrors</code> object when the API refuses the update. Do not put raw server exceptions in that message. The API must validate all values, confirm that the current user may edit this course, and return stable field codes or safe error messages.

## 5. Add route pages and the app shell

Create a small landing page in <code>client/src/pages/CoursesPage.jsx</code>:

~~~jsx
import { Link } from "react-router-dom";

export function CoursesPage() {
  return (
    <>
      <h1>Courses</h1>
      <p>Choose a course to view or edit.</p>
      <p>
        <Link to="/courses/course-123/edit">Edit Accessible React interfaces</Link>
      </p>
    </>
  );
}

export function AboutPage() {
  return (
    <>
      <h1>About these notes</h1>
      <p>This page explains how the course interface is organized.</p>
    </>
  );
}
~~~

Finish <code>client/src/App.jsx</code>:

~~~jsx
import { useEffect, useRef } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { PrimaryNavigation } from "./components/PrimaryNavigation.jsx";
import { AboutPage, CoursesPage } from "./pages/CoursesPage.jsx";
import { CourseEditor } from "./pages/CourseEditor.jsx";
import "./accessible-interface.css";

function RouteFocusManager() {
  const location = useLocation();
  const previousPath = useRef(null);

  useEffect(() => {
    const isRouteChange =
      previousPath.current !== null &&
      previousPath.current !== location.pathname;
    previousPath.current = location.pathname;

    const heading = document.querySelector("#main-content h1");

    if (heading) {
      document.title = heading.textContent + " | Course notes";

      if (isRouteChange) {
        heading.setAttribute("tabindex", "-1");
        heading.focus();
      }
    }
  }, [location.pathname]);

  return null;
}

function CourseEditorRoute() {
  // In a real route, load the course and pass the update API callback.
  const courseFromLoader = {
    id: "course-123",
    title: "Accessible React interfaces",
    description: "Build usable forms and navigation with semantic HTML.",
    visibility: "private",
  };

  async function updateCourse(courseId, values) {
    const response = await fetch("/api/courses/" + encodeURIComponent(courseId), {
      method: "PATCH",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });

    let payload = {};

    try {
      payload = await response.json();
    } catch {
      // Keep the UI error safe if the API response is not JSON.
    }

    if (!response.ok) {
      const error = new Error(
        payload.message || "We could not save the course. Try again."
      );
      error.fieldErrors = payload.errors || {};
      throw error;
    }
  }

  return (
    <CourseEditor
      course={courseFromLoader}
      onSave={(values) => updateCourse(courseFromLoader.id, values)}
    />
  );
}

function AppShell() {
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

      <header className="site-header">
        <PrimaryNavigation />
      </header>

      <main id="main-content" tabIndex="-1">
        <Routes>
          <Route path="/" element={<CoursesPage />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/courses/:courseId/edit" element={<CourseEditorRoute />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </main>

      <footer className="site-footer">
        <p>Course notes demonstration</p>
      </footer>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <RouteFocusManager />
      <AppShell />
    </BrowserRouter>
  );
}
~~~

The route focus manager sets the initial page title and moves focus to a new heading only after client-side navigation. In a real app, load the course from your route loader or API instead of the fixed demonstration object. Keep the API authorization on the server.

## 6. Add responsive and focus styles

Create <code>client/src/accessible-interface.css</code>:

~~~css
:root {
  color: #18212f;
  background: #f5f7fa;
  font-family: system-ui, sans-serif;
  line-height: 1.5;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  margin: 0;
}

a {
  color: #0645ad;
  text-underline-offset: 0.16em;
}

a:focus-visible,
button:focus-visible,
.button-link:focus-visible,
input:focus-visible,
textarea:focus-visible {
  outline: 3px solid #155eef;
  outline-offset: 3px;
}

.skip-link {
  position: absolute;
  inset-block-start: 0.5rem;
  inset-inline-start: 0.5rem;
  z-index: 10;
  padding: 0.75rem 1rem;
  transform: translateY(-160%);
  color: #fff;
  background: #14213d;
}

.skip-link:focus {
  transform: translateY(0);
}

.site-header,
.site-footer {
  padding: 1rem clamp(1rem, 4vw, 3rem);
  background: #e8edf4;
}

.primary-navigation {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
}

.site-name {
  margin-inline-end: auto;
  font-weight: 700;
}

.primary-navigation nav {
  flex-basis: 100%;
}

.primary-navigation nav[hidden] {
  display: none;
}

.primary-navigation ul {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.primary-navigation a[aria-current="page"] {
  font-weight: 700;
  text-decoration-thickness: 0.15em;
}

button,
input,
textarea {
  font: inherit;
}

button,
.button-link {
  min-height: 2.75rem;
  padding: 0.55rem 0.9rem;
  border: 1px solid #53657d;
  border-radius: 0.35rem;
  background: #fff;
  color: inherit;
  cursor: pointer;
}

.button-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
}

button:disabled {
  cursor: wait;
  opacity: 0.65;
}

#main-content {
  width: min(100% - 2rem, 52rem);
  min-height: 65vh;
  margin-inline: auto;
  padding-block: 2rem 4rem;
}

.course-editor {
  display: grid;
  gap: 1rem;
}

.course-editor h1,
.course-editor h2,
.course-editor p {
  margin-block: 0;
}

.course-editor form {
  display: grid;
  gap: 1.25rem;
}

.form-field {
  display: grid;
  gap: 0.4rem;
}

.form-field label,
.visibility-group legend {
  font-weight: 650;
}

.field-hint {
  color: #43536a;
  font-size: 0.95rem;
}

.form-field input,
.form-field textarea {
  width: 100%;
  min-height: 2.75rem;
  padding: 0.65rem 0.75rem;
  border: 1px solid #68788d;
  border-radius: 0.35rem;
  background: #fff;
  color: inherit;
}

.form-field textarea {
  min-height: 8rem;
  resize: vertical;
}

[aria-invalid="true"] {
  border-color: #b42318;
}

.field-error,
.form-message-error {
  color: #8a1c13;
}

.error-summary {
  padding: 1rem;
  border: 2px solid #b42318;
  background: #fff4f2;
}

.error-summary:focus {
  outline: 3px solid #155eef;
  outline-offset: 3px;
}

.error-summary ul {
  margin-block-end: 0;
}

.visibility-group {
  display: grid;
  gap: 0.6rem;
  padding: 1rem;
  border: 1px solid #68788d;
  border-radius: 0.35rem;
}

.visibility-group label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.form-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.form-message {
  padding: 0.75rem;
  border-inline-start: 0.25rem solid #26734d;
  background: #eef8f1;
}

@media (max-width: 38rem) {
  .primary-navigation nav ul {
    display: grid;
    gap: 0.75rem;
  }

  .form-actions {
    display: grid;
  }
}
~~~

Retain an obvious focus indicator. Check the contrast of focus rings, text, borders, and state colors against the actual page backgrounds. Do not rely on a red border alone to communicate an error.

## 7. Try the interface

1. Reload a route and press Tab. Confirm the skip link becomes visible and moves to the main content.
2. Use the navigation button with Enter and Space. Check its expanded state and that the links appear.
3. Open the navigation and press Escape. The panel should close and focus should return to its button.
4. Navigate between pages. Confirm the active link is announced as the current page and focus moves to the new page heading.
5. Submit the course form empty. The summary should receive focus and its links should move to the relevant fields.
6. Correct one field. Its error should clear without moving focus away from the field.
7. Submit valid data. The button should show a pending label and the result should be announced.
8. Make the API return a field error. Confirm the field error appears next to the right control and is included in its description.
9. Make the API return a network error. Confirm the form shows a safe message and does not mark an unrelated field invalid.
10. Zoom the page and use it with keyboard only. Confirm there is no lost focus or horizontal scrolling for ordinary content.
11. Review the labels, landmarks, error associations, and route changes with a screen reader.

## Key takeaways

- Semantic HTML gives controls useful roles and keyboard behavior.
- Named landmarks and a skip link make repeated page structure easier to navigate.
- Links change location; buttons perform actions.
- Form labels, legends, hints, and errors should be programmatically related.
- Reusable components must preserve native attributes and stable ids.
- Focus and live announcements should respond to meaningful state changes.
- Automated checks supplement keyboard, zoom, and screen-reader review.

## Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [079 - Authentication user experience](../lessons/079-authentication-user-experience.md) | [Lesson](../lessons/080-accessible-forms-navigation-and-components.md) | [Q&A](../qnas/080-accessible-forms-navigation-and-components.md) | [081 - CSS styling and responsive interface architecture](../lessons/081-css-styling-and-responsive-interface-architecture.md) |