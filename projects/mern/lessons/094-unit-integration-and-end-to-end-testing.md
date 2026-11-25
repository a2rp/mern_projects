# 094 - Unit, integration, and end-to-end testing

A MERN feature crosses several boundaries: a React form sends a request, Express authenticates and validates it, a service applies business rules, MongoDB persists data, and the browser renders the result. A useful test strategy checks each boundary at the least expensive layer that can prove the behavior, then checks a small number of complete user journeys in a real browser.

This chapter builds a testing plan for the application. It uses Vitest for JavaScript tests, React Testing Library for component behavior, Supertest for HTTP-level API checks, and Playwright for browser end-to-end flows. The examples show tests to write; they are instructional material and are not being run as part of this repository update.

## Learning outcomes

After this chapter, you should be able to:

- Distinguish unit, component, integration, contract, and end-to-end tests.
- Choose the smallest useful test boundary for a behavior.
- Test React through accessible user-visible behavior.
- Test Express routes over HTTP and verify status, headers, and response shape.
- Use an isolated test database and deterministic test data.
- Test authorization and failure paths, not only happy paths.
- Build reliable browser tests with semantic locators and retrying assertions.
- Avoid shared state, arbitrary sleeps, and brittle implementation-detail assertions.
- Interpret coverage as a signal rather than a quality guarantee.
- Run checks in a deliberate local and CI sequence.

## 1. Test observable behavior at the right boundary

A test is useful when it protects a behavior that matters to a user or system contract. Place the check at the smallest boundary that still proves that behavior:

| Test kind | Boundary | Example |
| --- | --- | --- |
| Unit | A pure function or isolated service rule | Empty course titles are rejected. |
| Component | React rendered in a simulated DOM | Submitting a form shows a server error accessibly. |
| Integration | Several real application parts connected | An Express route validates input and persists to a test database. |
| Contract | Agreement between separately developed components | The client sends the documented payload and handles the API error envelope. |
| End to end | Running application through a real browser | A user signs in, creates a course, reloads, and sees it persisted. |

Do not make every assertion an end-to-end test. Browser tests are valuable but slower and need more infrastructure. Do not mock every dependency in an integration test; that would stop the test from checking the integration.

A practical strategy has many focused unit and component checks, a smaller set of API and persistence integration checks, and a small number of high-value full journeys.

## 2. Give tests isolated data and configuration

Tests should not depend on a developer's personal database or production services. Use a separate test database and explicit test-only credentials. Never point test cleanup at a production database.

Good isolation patterns include:

- Use a dedicated database name and reset only that database.
- Give each parallel worker a distinct database or namespace.
- Use unique identifiers for test records, then delete only those records.
- Keep external email, payment, and notification providers behind adapters and replace those adapters in tests.
- Stop local servers, database clients, timers, and browser contexts during teardown.

Transactions can help when the database deployment supports them, but MongoDB transactions require a suitable replica set configuration. Do not assume a standalone local server supports every production database feature.

Test configuration should fail safely if the database name is not a known test database. Treat test environment variables as untrusted input too.

## 3. Use Vitest for JavaScript logic

Vitest fits projects that already use Vite and provides a Jest-like test API. Keep pure business rules in functions that can be tested without rendering React or starting Express.

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
  it("trims surrounding whitespace", () => {
    expect(normalizeCourseTitle("  React Basics  ")).toEqual({
      ok: true,
      value: "React Basics"
    });
  });

  it("rejects a blank title", () => {
    expect(normalizeCourseTitle("   ")).toEqual({
      ok: false,
      error: "Title is required."
    });
  });

  it("rejects non-string input", () => {
    expect(normalizeCourseTitle(null).ok).toBe(false);
  });

  it("rejects a title longer than the documented limit", () => {
    expect(normalizeCourseTitle("x".repeat(121)).ok).toBe(false);
  });
});
~~~~

Cover boundary values and meaningful branches. Avoid testing a trivial implementation detail such as a private variable name; test the function's contract instead.

## 4. Test React components the way users interact

React Testing Library encourages tests that query the rendered interface and interact with it. Prefer labels, roles, and accessible names over CSS selectors or internal state.

~~~~jsx
// client/src/features/courses/CourseForm.jsx
import { useState } from "react";

export function CourseForm({ onSave }) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  async function submit(event) {
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
    <form onSubmit={submit}>
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

it("submits the trimmed title and announces success", async () => {
  const user = userEvent.setup();
  const onSave = vi.fn().mockResolvedValue({ id: "course-1" });

  render(<CourseForm onSave={onSave} />);

  await user.type(screen.getByRole("textbox", { name: "Course title" }), "  MERN  ");
  await user.click(screen.getByRole("button", { name: "Save course" }));

  expect(onSave).toHaveBeenCalledWith({ title: "MERN" });
  expect(await screen.findByRole("status")).toHaveTextContent("Course saved.");
});
~~~~

Set up a fresh <code>userEvent</code> instance in each test. Test loading, success, validation, disabled controls, error messages, and keyboard-accessible behavior where those states matter. A component test does not prove that the real API or database works.

## 5. Configure a DOM test environment

Vitest's default environment is Node. React component tests need a DOM-like environment such as jsdom. Keep the environment choice explicit and provide a test setup file for shared matchers.

~~~~js
// client/vite.config.js
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
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

Keep server unit tests in a Node environment rather than loading a browser DOM unnecessarily. A monorepo can use separate client and server Vitest configurations or Vitest projects when that fits its layout.

## 6. Test an Express API over HTTP

An API integration test should exercise the Express middleware and route contract: method, path, status, headers, request validation, authentication, response envelope, and persistence when relevant.

Supertest can make requests to an Express application without requiring a fixed public port. Export an app factory that accepts test dependencies or configuration; do not connect to production services just because a test imported the app.

~~~~js
// server/test/integration/courses.routes.test.js
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createTestContext } from "../support/test-context.js";

describe("course API", () => {
  let context;

  beforeAll(async () => {
    context = await createTestContext();
  });

  beforeEach(async () => {
    await context.reset();
  });

  afterAll(async () => {
    await context?.close();
  });

  it("rejects a create request without a session", async () => {
    const response = await request(context.app)
      .post("/api/courses")
      .send({ title: "MERN" });

    expect(response.status).toBe(401);
  });

  it("creates a course for the signed-in owner", async () => {
    const agent = request.agent(context.app);
    await context.signIn(agent, { email: "owner@example.test" });

    const response = await agent
      .post("/api/courses")
      .send({ title: "  MERN  " });

    expect(response.status).toBe(201);
    expect(response.body.data.title).toBe("MERN");
    expect(response.body.data.ownerId).toBeDefined();
    expect(response.headers["content-type"]).toMatch(/application\/json/);

    const saved = await context.Course.findById(response.body.data.id);
    expect(saved.title).toBe("MERN");
  });
});
~~~~

The <code>createTestContext</code> helper is application-specific. It should start an isolated test database, create the app with test config, provide an explicit sign-in helper, reset only test collections, and close every resource. A test fixture should never silently fall back to a developer or production database.

## 7. Cover authorization and error contracts

A route returning 200 for an authorized owner is only one case. Also check:

- No session returns 401.
- A signed-in user cannot read, update, or delete another user's resource.
- A caller without a required role cannot perform the operation.
- Invalid input returns a stable 4xx error envelope.
- A missing resource returns the documented not-found result.
- Database failures reach error middleware and produce a safe 5xx response.
- Mutating cookie-authenticated requests without a CSRF token are rejected.
- Login, logout, session expiration, and upload limits preserve their contracts.

Prefer assertions about status and safe response data. Do not assert a database's raw error message or leak a stack trace into the expected contract.

## 8. Write a browser test for one complete journey

Playwright drives a real browser and can verify that the frontend, API, cookie/session behavior, and database work together. Use a test account and isolated data. Give each test a unique record so parallel execution does not collide.

~~~~js
// client/e2e/courses.spec.js
import { expect, test } from "@playwright/test";

test("a signed-in user creates a course and sees it after reload", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("course-owner@example.test");
  await page.getByLabel("Password").fill(process.env.E2E_TEST_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page.getByRole("heading", { name: "Courses" })).toBeVisible();

  await page.getByLabel("Course title").fill("Browser-tested MERN");
  await page.getByRole("button", { name: "Save course" }).click();

  await expect(
    page.getByRole("listitem").filter({ hasText: "Browser-tested MERN" })
  ).toBeVisible();

  await page.reload();

  await expect(
    page.getByRole("listitem").filter({ hasText: "Browser-tested MERN" })
  ).toBeVisible();
});
~~~~

Provide base URLs and credentials through a dedicated E2E configuration. Never put a real user's password in the test file. Browser tests should create and clean their own data. Avoid sharing one account's mutable state across parallel tests unless the test runner isolates it.

## 9. Prefer semantic locators and retrying assertions

Use a locator that describes the accessible interface, such as a role and name, a label, or visible text. These locators are more resilient and test accessibility at the same time.

Prefer an awaited retrying assertion for asynchronous UI:

~~~~js
await expect(page.getByRole("status")).toHaveText("Course saved.");
~~~~

Avoid arbitrary pauses such as <code>waitForTimeout(2000)</code>. They make a test slower when the system is fast and flaky when it is slower than expected. Wait for the relevant UI state, API response, or navigation.

Use test IDs only when the interface has no meaningful semantic locator. Do not use deeply nested CSS selectors to reach implementation details that users do not observe.

## 10. Manage mocks, timers, and external services carefully

Mock a dependency when it is an external boundary or when a component test should isolate one feature. Do not mock the exact behavior the test claims to prove.

- A unit test can mock a clock or external provider.
- A component test can mock the API client and assert visible loading and error states.
- An API integration test should generally use the real route, validation, and test database.
- An end-to-end test should use the real app stack and a controlled test environment.
- Reset mocks and fake timers after each test.
- Do not call real email, payment, analytics, or production object-storage services.
- Do not replace every MongoDB query with a mock and then call the result a persistence integration test.

If time affects behavior, inject a clock or use controlled fake timers. Restore real timers after the test so one test does not leak state into another.

## 11. Make asynchronous tests deterministic

An asynchronous operation needs to be awaited at the right boundary. Common causes of flaky tests include:

- Starting a promise but not awaiting it.
- Reusing a shared database record across tests.
- Running destructive cleanup while another test uses the same collection.
- Depending on test execution order.
- Using a wall-clock sleep instead of waiting for a state.
- Leaving an HTTP server, database connection, timer, or browser open.
- Sharing one mutable login session across parallel browser tests.

Use setup and teardown hooks deliberately. If parallel workers share a database, use unique worker-scoped names or another isolation strategy. Give long-running tests appropriate timeouts only after investigating why the operation takes that long.

## 12. Use coverage as a map, not a goal

Coverage reports show which lines or branches ran during a test suite. High coverage does not prove that assertions are meaningful, security boundaries are correct, or behavior works in a real browser.

Prioritize risk and user impact:

1. Authentication and authorization boundaries.
2. Data creation, update, deletion, and ownership.
3. Validation and error handling.
4. Important keyboard and accessibility behavior.
5. High-value user journeys.
6. Rare edge cases whose failure would be expensive.

A test that executes code but asserts nothing useful adds little confidence. Do not write brittle tests only to reach a percentage.

## 13. Run a local and CI test sequence

Scripts can make the intended checks explicit:

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

A typical local sequence is:

~~~~text
# From the client package
npm run test:unit

# From the server package with a dedicated test database
npm run test:unit

# From the client package after starting the isolated full stack
npm run test:e2e
~~~~

CI should install from the lockfile, start an isolated test database and application, run deterministic checks, retain failure diagnostics safely, and fail the build when a required check fails. Do not let tests or cleanup run with production credentials.

This chapter documents a testing approach and includes sample test code. Tests were not executed while writing these notes.

## Common mistakes

- Using browser tests for every tiny pure function.
- Calling a component test an API integration test.
- Mocking MongoDB in a test that claims to prove persistence.
- Using a real production service or production database from tests.
- Sharing mutable accounts or records across parallel tests.
- Depending on a test running before another one.
- Using arbitrary sleep calls instead of waiting for user-visible state.
- Selecting UI elements only by brittle CSS selectors.
- Asserting implementation details instead of the user-visible contract.
- Reaching a coverage percentage with empty or weak assertions.
- Forgetting server cleanup, test database cleanup, or mock restoration.
- Storing real credentials in the browser-test source.

## Manually inspect the test plan

1. Confirm unit tests run without connecting to MongoDB or a live browser.
2. Confirm component tests use a DOM environment and query controls by labels or roles.
3. Confirm API integration tests point only to an isolated test database.
4. Confirm the test context closes its database and other resources.
5. Confirm unauthenticated, cross-owner, invalid-input, and failure responses are asserted.
6. Confirm browser tests use isolated accounts and unique test records.
7. Confirm asynchronous browser assertions wait for actual UI state.
8. Confirm cleanup never targets a production database or storage bucket.
9. Confirm CI uses a lockfile and contains no production secrets.
10. Confirm test failures retain useful diagnostics without leaking credentials or private user data.

## Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- | --- |
| [093 - Production configuration, CORS, and secure cookies](093-production-configuration-cors-and-secure-cookies.md) | [Lesson](094-unit-integration-and-end-to-end-testing.md) | [Q&A](../qnas/094-unit-integration-and-end-to-end-testing.md) | [Example](../examples/094-unit-integration-and-end-to-end-testing.md) | [095 - Validation across the full stack](095-validation-across-the-full-stack.md) |
