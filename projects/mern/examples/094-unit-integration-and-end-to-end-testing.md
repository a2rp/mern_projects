# 094 - Unit, integration, and end-to-end testing: Example

This example organizes tests for a MERN course-creation feature at several boundaries. It includes a pure validation unit test, a React component test, an HTTP route test with an injected service, and a Playwright journey. The HTTP route test uses an in-memory service double, so it verifies the HTTP contract but does not claim to verify MongoDB persistence.

The examples are documentation for the course. They were not executed while writing these notes. Adapt imports and scripts to the repository's actual package layout.

## 1. Install test dependencies

~~~~text
# server development dependencies
vitest
supertest

# client development dependencies
vitest
jsdom
@testing-library/react
@testing-library/jest-dom
@testing-library/user-event
@playwright/test
~~~~

Install versions compatible with the project's Node.js and package versions. Keep the package lockfile committed so local and CI installs resolve the same dependency graph.

## 2. Configure server unit tests for Node

~~~~js
// server/vitest.config.js
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.test.js"],
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      include: ["src/**/*.js"],
      exclude: ["src/server.js"]
    }
  }
});
~~~~

This config keeps server tests out of the browser-like environment. A client Vite config can use jsdom for React component tests.

## 3. Test a pure validation function

Keep business rules in functions that do not need Express, MongoDB, or React.

~~~~js
// server/src/features/courses/course.validation.js
export function normalizeCourseTitle(value) {
  if (typeof value !== "string") {
    return { ok: false, error: "Title is required." };
  }

  const title = value.trim();

  if (title.length === 0) {
    return { ok: false, error: "Title is required." };
  }

  if (title.length > 120) {
    return { ok: false, error: "Title must be 120 characters or fewer." };
  }

  return { ok: true, value: title };
}
~~~~

~~~~js
// server/test/unit/course.validation.test.js
import { describe, expect, it } from "vitest";
import { normalizeCourseTitle } from "../../src/features/courses/course.validation.js";

describe("normalizeCourseTitle", () => {
  it("trims whitespace", () => {
    expect(normalizeCourseTitle("  MERN Basics  ")).toEqual({
      ok: true,
      value: "MERN Basics"
    });
  });

  it("rejects blank input", () => {
    expect(normalizeCourseTitle("   ")).toEqual({
      ok: false,
      error: "Title is required."
    });
  });

  it("rejects non-string input", () => {
    expect(normalizeCourseTitle(null).ok).toBe(false);
  });

  it("rejects a title longer than 120 characters", () => {
    expect(normalizeCourseTitle("x".repeat(121)).ok).toBe(false);
  });
});
~~~~

The tests assert the function's public result rather than its internal implementation.

## 4. Configure React component tests

~~~~js
// client/vite.config.js
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    include: ["test/**/*.test.{js,jsx}"],
    setupFiles: ["./test/setup.js"],
    clearMocks: true,
    restoreMocks: true
  }
});
~~~~

~~~~js
// client/test/setup.js
import "@testing-library/jest-dom/vitest";
~~~~

## 5. Test a form through its accessible interface

~~~~jsx
// client/src/features/courses/CourseForm.jsx
import { useState } from "react";

export function CourseForm({ onSave }) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      await onSave({ title: title.trim() });
      setTitle("");
      setMessage("Course saved.");
    } catch {
      setMessage("Course could not be saved.");
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="course-title">Course title</label>
      <input
        id="course-title"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
      />
      <button type="submit">Save course</button>
      <p role="status" aria-live="polite">{message}</p>
    </form>
  );
}
~~~~

~~~~jsx
// client/test/CourseForm.test.jsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { CourseForm } from "../src/features/courses/CourseForm.jsx";

it("submits a trimmed course title and announces success", async () => {
  const user = userEvent.setup();
  const onSave = vi.fn().mockResolvedValue({ id: "course-1" });

  render(<CourseForm onSave={onSave} />);

  await user.type(
    screen.getByRole("textbox", { name: "Course title" }),
    "  MERN Basics  "
  );
  await user.click(screen.getByRole("button", { name: "Save course" }));

  expect(onSave).toHaveBeenCalledWith({ title: "MERN Basics" });
  expect(await screen.findByText("Course saved.")).toBeInTheDocument();
});
~~~~

This test replaces the API callback because it focuses on the form's interaction contract. Add separate tests for rejected saves, keyboard submission, and validation feedback where those behaviors are important.

## 6. Test an HTTP route with an injected service

Dependency injection lets a route test replace the database service while still exercising Express parsing, route validation, status codes, and JSON output. This is a route integration test, not a MongoDB persistence test.

~~~~js
// server/src/features/courses/course.test-app.js
import express from "express";

export function createCourseTestApp({ courseService, requireAuth }) {
  const app = express();
  app.use(express.json({ limit: "1mb" }));

  app.post("/api/courses", requireAuth, async (req, res, next) => {
    try {
      const title =
        typeof req.body?.title === "string" ? req.body.title.trim() : "";

      if (!title || title.length > 120) {
        return res.status(400).json({
          error: { message: "Enter a course title of 1 to 120 characters." }
        });
      }

      const course = await courseService.create({
        ownerId: req.user.id,
        title
      });

      res.status(201).json({ data: course });
    } catch (error) {
      next(error);
    }
  });

  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);

    res.status(500).json({
      error: { message: "An unexpected server error occurred." }
    });
  });

  return app;
}
~~~~

~~~~js
// server/test/integration/course-route.test.js
import request from "supertest";
import { expect, it, vi } from "vitest";
import { createCourseTestApp } from "../../src/features/courses/course.test-app.js";

it("returns the created course in the API envelope", async () => {
  const courseService = {
    create: vi.fn().mockResolvedValue({
      id: "course-1",
      ownerId: "user-1",
      title: "MERN Basics"
    })
  };
  const requireAuth = (req, res, next) => {
    req.user = { id: "user-1" };
    next();
  };
  const app = createCourseTestApp({ courseService, requireAuth });

  const response = await request(app)
    .post("/api/courses")
    .send({ title: "  MERN Basics  " });

  expect(response.status).toBe(201);
  expect(response.body.data).toEqual({
    id: "course-1",
    ownerId: "user-1",
    title: "MERN Basics"
  });
  expect(courseService.create).toHaveBeenCalledWith({
    ownerId: "user-1",
    title: "MERN Basics"
  });
});

it("rejects invalid input before calling the service", async () => {
  const courseService = { create: vi.fn() };
  const requireAuth = (req, res, next) => {
    req.user = { id: "user-1" };
    next();
  };
  const app = createCourseTestApp({ courseService, requireAuth });

  const response = await request(app)
    .post("/api/courses")
    .send({ title: "   " });

  expect(response.status).toBe(400);
  expect(courseService.create).not.toHaveBeenCalled();
});
~~~~

The test authentication middleware is deliberately a test double. It verifies that the route passes the authenticated identity to the service. It does not test the real session cookie, login, CSRF token, or database.

## 7. Add a real database integration test separately

To prove persistence, use the real course service and a dedicated test database. Keep the test setup explicit:

~~~~text
MONGODB_TEST_URI=mongodb://127.0.0.1:27017/mern_test
~~~~

A project test fixture should:

1. Refuse to start if <code>MONGODB_TEST_URI</code> is missing or does not identify a test database.
2. Create a unique test database or namespace for each parallel worker.
3. Connect the Mongoose models and session store to that isolated test database.
4. Build the normal Express app using test configuration.
5. Clear only test collections before each test.
6. Sign in using a disposable test user and obtain a fresh CSRF token.
7. Close database and session-store connections after the suite.
8. Never import production credentials as a fallback.

Then assert both the HTTP response and the document read back from the test database. Use a replica-set test environment if the behavior depends on MongoDB transactions.

## 8. Test authorization as a separate integration behavior

For each private resource, create two test users and test ownership from both sides:

~~~~js
it("does not return another user's course", async () => {
  const owner = await context.createSignedInAgent("owner@example.test");
  const otherUser = await context.createSignedInAgent("other@example.test");
  const course = await context.createCourse(owner, { title: "Private course" });

  const response = await otherUser.get("/api/courses/" + course.id);

  expect(response.status).toBe(404);
});
~~~~

The helper must use the actual login and cookie middleware with the test database. Do not set <code>req.user</code> directly in a test that claims to verify session authentication. Include matching tests for update and delete, not only read.

## 9. Configure browser tests with a dedicated base URL

~~~~js
// client/playwright.config.js
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://127.0.0.1:4173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure"
  },
  reporter: "list"
});
~~~~

The app server and API should be started with test configuration and test database settings before the browser suite runs. Never connect browser tests to the production URL.

## 10. Write a complete browser journey

~~~~js
// client/e2e/course-creation.spec.js
import { expect, test } from "@playwright/test";

test("a signed-in user creates a course that survives reload", async ({ page }) => {
  await page.goto("/login");

  await page.getByLabel("Email").fill(process.env.E2E_TEST_EMAIL);
  await page.getByLabel("Password").fill(process.env.E2E_TEST_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(
    page.getByRole("heading", { name: "Courses" })
  ).toBeVisible();

  await page.getByLabel("Course title").fill("Browser-tested MERN");
  await page.getByRole("button", { name: "Save course" }).click();

  const createdCourse = page
    .getByRole("listitem")
    .filter({ hasText: "Browser-tested MERN" });

  await expect(createdCourse).toBeVisible();

  await page.reload();
  await expect(createdCourse).toBeVisible();
});
~~~~

The test account must be a disposable account created for E2E. Use a unique title or a setup API to isolate each run, and clean it up afterward. If the test is parallel, make its record unique per test instead of sharing a mutable record.

## 11. Add package scripts

~~~~json
{
  "scripts": {
    "test:unit": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test"
  }
}
~~~~

Place scripts in the relevant client or server package. A monorepo root can coordinate them only after each package has a safe, explicit test environment.

## 12. Run the intended sequence

From each package, run unit and component tests first, then API tests against the isolated test database, then the browser journey against the test stack:

~~~~text
npm run test:unit
npm run test:coverage
npm run test:e2e
~~~~

Do not use test execution as a substitute for reading a failure. A failing check can indicate an application regression, a test fixture problem, incorrect environment configuration, or an expectation that no longer matches the product contract.

This example describes test code and commands; these tests were not run while preparing the notes.

## Common mistakes

- Calling an HTTP test with a fake service a persistence test.
- Using a real user, production database, or production API for tests.
- Resetting shared database collections while parallel tests are running.
- Testing only a route's 201 response and not its authorization or errors.
- Mocking the behavior that the test says it proves.
- Using CSS selectors that depend on private markup structure.
- Querying a status message without waiting for asynchronous UI state.
- Using fixed sleeps instead of retrying assertions.
- Leaving connections or timers open.
- Putting E2E credentials into the test source.
- Treating a coverage number as proof that the application is correct.

## Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- | --- |
| [093 - Production configuration, CORS, and secure cookies](../lessons/093-production-configuration-cors-and-secure-cookies.md) | [Lesson](../lessons/094-unit-integration-and-end-to-end-testing.md) | [Q&A](../qnas/094-unit-integration-and-end-to-end-testing.md) | [Example](094-unit-integration-and-end-to-end-testing.md) | [095 - Validation across the full stack](../lessons/095-validation-across-the-full-stack.md) |
