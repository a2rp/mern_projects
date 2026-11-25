# 077 - Loading, error, empty, and success states: example

This example builds a course page that displays the full request lifecycle. It distinguishes an initial load, a failed request, a successful empty response, loaded results, and a refresh that keeps the previous results visible.

It uses the <code>GET /api/courses</code> response shape from the previous chapter:

~~~json
{
  "courses": [
    {
      "slug": "react",
      "title": "React fundamentals",
      "description": "Build interfaces from reusable components and state.",
      "level": "Intermediate"
    }
  ]
}
~~~

## File structure

~~~text
client/
├── .env.local
└── src/
    ├── hooks/
    │   └── useCourses.js
    ├── CoursesPage.jsx
    └── CoursesPage.css
~~~

If you do not already have a React client, create one using the Vite React template and install its dependencies. Keep your existing project setup if you already have a client.

## 1. Configure the API address

Create <code>client/.env.local</code>:

~~~text
VITE_API_BASE_URL=http://localhost:3000
~~~

For a same-origin deployment or a development proxy, the base URL can be empty. This value is public frontend configuration; never place a database password or private server secret in it. Restart Vite after editing environment variables.

## 2. Create a request hook with explicit states

Create <code>client/src/hooks/useCourses.js</code>:

~~~js
import { useEffect, useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

async function fetchCourses(signal) {
  let response;

  try {
    response = await fetch(API_BASE_URL + "/api/courses", {
      headers: {
        Accept: "application/json",
      },
      signal,
    });
  } catch (error) {
    if (error.name === "AbortError") {
      throw error;
    }

    throw new Error("Could not reach the server. Check your connection and try again.");
  }

  const contentType = response.headers.get("content-type") ?? "";
  let payload = null;

  if (contentType.includes("application/json")) {
    try {
      payload = await response.json();
    } catch {
      if (response.ok) {
        throw new Error("The server returned invalid JSON.");
      }
    }
  }

  if (!response.ok) {
    throw new Error(
      (payload && payload.message) ||
        "The course request failed with status " + response.status + "."
    );
  }

  if (!payload || !Array.isArray(payload.courses)) {
    throw new Error("The API response did not contain a course list.");
  }

  return payload.courses;
}

function hasCourses(state) {
  return Object.prototype.hasOwnProperty.call(state, "courses");
}

export function useCourses() {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    let ignoreResult = false;

    setState((currentState) => {
      if (hasCourses(currentState)) {
        return {
          status: "refreshing",
          courses: currentState.courses,
        };
      }

      return { status: "loading" };
    });

    async function load() {
      try {
        const courses = await fetchCourses(controller.signal);

        if (!ignoreResult) {
          setState({
            status: "success",
            courses,
          });
        }
      } catch (error) {
        if (ignoreResult || error.name === "AbortError") {
          return;
        }

        setState((currentState) => {
          if (hasCourses(currentState)) {
            return {
              status: "refresh-error",
              courses: currentState.courses,
              message: error.message || "Could not refresh courses.",
            };
          }

          return {
            status: "error",
            message: error.message || "Could not load courses.",
          };
        });
      }
    }

    load();

    return () => {
      ignoreResult = true;
      controller.abort();
    };
  }, [attempt]);

  function reload() {
    setAttempt((currentAttempt) => currentAttempt + 1);
  }

  return { state, reload };
}
~~~

The state objects use a <code>status</code> field to describe what the UI can render:

- <code>loading</code> and <code>error</code> have no previous result.
- <code>success</code> contains the latest response, including an empty array.
- <code>refreshing</code> and <code>refresh-error</code> preserve the existing course list.

A successful empty array is still <code>success</code>; the page decides whether that means an empty state. During a refresh, the previous array remains available. The hook aborts a request during cleanup and ignores its result, so an obsolete request does not update the current view.

## 3. Render each state

Create <code>client/src/CoursesPage.jsx</code>:

~~~jsx
import { useCourses } from "./hooks/useCourses.js";
import "./CoursesPage.css";

function CourseList({ courses }) {
  return (
    <ul className="course-list">
      {courses.map((course) => (
        <li className="course-card" key={course.slug}>
          <p className="course-level">{course.level}</p>
          <h2>{course.title}</h2>
          <p>{course.description}</p>
        </li>
      ))}
    </ul>
  );
}

function CourseResults({ state, onReload }) {
  if (state.status === "loading") {
    return (
      <section className="request-panel" aria-busy="true">
        <progress aria-label="Loading courses" />
        <p role="status">Loading courses…</p>
      </section>
    );
  }

  if (state.status === "error") {
    return (
      <section className="request-panel error-panel">
        <h2>Courses could not be loaded</h2>
        <p role="alert">{state.message}</p>
        <button type="button" onClick={onReload}>
          Try again
        </button>
      </section>
    );
  }

  if (state.status === "success" && state.courses.length === 0) {
    return (
      <section className="request-panel empty-panel">
        <h2>No courses yet</h2>
        <p>There are no courses available right now. Check again later.</p>
        <button type="button" onClick={onReload}>
          Check again
        </button>
      </section>
    );
  }

  if (state.status === "refreshing") {
    return (
      <section className="results-panel" aria-busy="true">
        <div className="results-toolbar">
          <p role="status">Refreshing courses…</p>
          <button type="button" onClick={onReload} disabled>
            Refreshing…
          </button>
        </div>
        <CourseList courses={state.courses} />
      </section>
    );
  }

  if (state.status === "refresh-error") {
    return (
      <section className="results-panel">
        <div className="refresh-warning">
          <p role="status">
            Could not refresh. Showing the previously loaded course list.
          </p>
          <button type="button" onClick={onReload}>
            Try again
          </button>
        </div>
        <CourseList courses={state.courses} />
      </section>
    );
  }

  return (
    <section className="results-panel">
      <div className="results-toolbar">
        <p>{state.courses.length} courses available</p>
        <button type="button" onClick={onReload}>
          Refresh courses
        </button>
      </div>
      <CourseList courses={state.courses} />
    </section>
  );
}

export default function CoursesPage() {
  const { state, reload } = useCourses();

  return (
    <main className="page">
      <header className="page-heading">
        <p className="eyebrow">Course catalog</p>
        <h1>Learn something new</h1>
        <p>
          This page explains whether course data is loading, unavailable, empty,
          or ready to view.
        </p>
      </header>

      <CourseResults state={state} onReload={reload} />
    </main>
  );
}
~~~

The initial error and refresh error have different UI because the refresh error still has usable previous data. The empty branch only appears after a successful response with zero courses.

The loading message is visible and programmatically exposed as a status. The initial error uses an alert so the failure is announced; less urgent refresh feedback uses a polite status. Avoid putting every update in an assertive alert.

## 4. Add styles

Create <code>client/src/CoursesPage.css</code>:

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

button {
  min-height: 2.65rem;
  padding: 0.6rem 0.9rem;
  border: 0;
  border-radius: 0.6rem;
  background: #315bcc;
  color: #fff;
  cursor: pointer;
  font: inherit;
  font-weight: 700;
}

button:hover:not(:disabled) {
  background: #2449aa;
}

button:focus-visible {
  outline: 3px solid #87a2ff;
  outline-offset: 3px;
}

button:disabled {
  cursor: wait;
  opacity: 0.7;
}

.page {
  width: min(100% - 2rem, 900px);
  margin-inline: auto;
  padding-block: 3.5rem;
}

.page-heading {
  max-width: 680px;
  margin-bottom: 1.75rem;
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
  margin-bottom: 0.7rem;
  font-size: clamp(2rem, 5vw, 3rem);
  letter-spacing: -0.045em;
}

.page-heading > p:last-child {
  color: #59677a;
  line-height: 1.6;
}

.request-panel,
.results-panel {
  padding: 1.25rem;
  border: 1px solid #dce4ef;
  border-radius: 0.9rem;
  background: #fff;
  box-shadow: 0 10px 30px rgb(32 55 90 / 6%);
}

.request-panel h2 {
  margin-bottom: 0.6rem;
  font-size: 1.25rem;
}

.request-panel > p:last-of-type {
  color: #59677a;
  line-height: 1.6;
}

.request-panel progress {
  display: block;
  width: min(100%, 22rem);
  height: 0.7rem;
  margin-bottom: 0.85rem;
  accent-color: #315bcc;
}

.request-panel [role="status"],
.request-panel [role="alert"] {
  margin-bottom: 1rem;
}

.error-panel {
  border-color: #f0c6c6;
  background: #fffafa;
}

.error-panel [role="alert"],
.refresh-warning {
  color: #8a2525;
}

.empty-panel {
  border-style: dashed;
}

.results-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.results-toolbar p {
  margin: 0;
  color: #59677a;
}

.course-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.course-card {
  padding: 1.15rem;
  border: 1px solid #e0e7f0;
  border-radius: 0.75rem;
}

.course-card h2 {
  margin-bottom: 0.55rem;
  font-size: 1.2rem;
}

.course-card > p:last-child {
  margin-bottom: 0;
  color: #59677a;
  line-height: 1.6;
}

.course-level {
  margin-bottom: 0.5rem;
  color: #315bcc;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.refresh-warning {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
  padding: 0.9rem;
  border: 1px solid #f0d6aa;
  border-radius: 0.7rem;
  background: #fffaf0;
}

.refresh-warning p {
  margin: 0;
}

@media (max-width: 620px) {
  .page {
    padding-block: 2rem;
  }

  .course-list {
    grid-template-columns: 1fr;
  }

  .results-toolbar,
  .refresh-warning {
    align-items: flex-start;
    flex-direction: column;
  }
}
~~~

## 5. Try each state

Run the API from the previous chapter and start the React client.

- **Loading:** throttle the network in browser developer tools or temporarily delay the API response.
- **Error:** stop the API and reload the page. Select **Try again** after restarting it.
- **Empty:** remove or temporarily move the sample course records so the endpoint returns <code>{ "courses": [] }</code>.
- **Success:** restore the records and reload.
- **Refresh:** click **Refresh courses** while the page is open.
- **Refresh error:** stop the API after the course list has loaded, then click **Refresh courses**. The prior list should remain visible with a retry option.
- **Cancellation:** navigate away while the request is still pending and inspect the Network panel.

React Strict Mode can perform an extra Effect setup and cleanup cycle in development. The request is a GET, and cleanup aborts or ignores obsolete work, so that development check should not display a false error.

## State flow

~~~text
Initial request
  ├── failure ───────────> error + retry
  └── success
       ├── zero courses ─> empty
       └── courses ──────> success
                              │
                              └── refresh
                                   ├── success ─> updated success
                                   └── failure ─> old data + refresh warning
~~~

## Key takeaways

- Model request state explicitly so the UI does not confuse loading, failure, and no records.
- A successful empty list is different from an API error.
- Preserve old data during refresh only when it remains safe and useful.
- Give errors a clear next step and keep routine status updates polite.
- Abort or ignore requests that are no longer relevant.
- Test each state intentionally instead of checking only the successful response.

## Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [076 - Fetch data from an API](../lessons/076-fetch-data-from-an-api.md) | [Q&A](../qnas/077-loading-error-empty-and-success-states.md) | [Lesson](../lessons/077-loading-error-empty-and-success-states.md) | [078 - Client-side form validation and user experience](../lessons/078-client-side-form-validation-and-user-experience.md) |
