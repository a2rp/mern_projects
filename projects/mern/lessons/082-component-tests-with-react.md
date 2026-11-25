# 082 - Component tests with React

A component test checks React output and behavior through the DOM a user interacts with. A good test asks whether the user can find a control, use it, and observe the right result. It does not depend on private component state, hook call counts, or the exact internal tree.

This chapter uses Vitest, jsdom, and React Testing Library as one example toolchain for a Vite-based React app. The ideas also apply when a project uses another test runner. Keep versions compatible with the Node.js and React versions already used by your project.

## Learning goals

After this chapter, you should be able to:

- Explain what a component test covers and how it differs from a unit or end-to-end test.
- Set up a DOM-like test environment for React components.
- Query rendered content by accessible role and name.
- Simulate user interactions and assert their visible outcomes.
- Test loading, empty, success, and error states.
- Test asynchronous UI without arbitrary delays.
- Mock a dependency at a clear boundary without mocking React itself.
- Keep tests reliable, readable, and useful during refactoring.

## What a component test proves

A component receives props and context, renders DOM, and may respond to user actions. A component test renders it in a simulated DOM and checks outcomes that matter to a user.

For a course search component, useful questions include:

- Is the search field labelled?
- Does typing filter the visible courses?
- Can a user activate a course?
- Does the selection callback receive the selected course identifier?
- Does the empty state appear when no courses match?

These checks describe the contract of the component. A test that asserts a particular hook was called or that a specific child component exists describes implementation details. Such tests often break during a harmless refactor.

A DOM test environment is not a full browser. It is useful for rendered structure, accessible names, events, and state changes. It does not prove real layout, CSS rendering, browser navigation, or every browser API. Use a browser-level end-to-end test for those behaviors.

## Choose the right test level

Keep each test at the smallest level that gives meaningful confidence:

- A pure utility test checks a deterministic function without rendering React.
- A component test renders a focused UI and exercises its public behavior.
- An integration test combines components and real application boundaries, such as a form with a router or data provider.
- An end-to-end test drives the application in a real browser and checks a complete user journey.

Do not test every combination at every level. Test important rules close to where they are implemented, then add a small number of broader journeys for critical flows.

## Set up a DOM test environment

In an existing Vite app, install development dependencies compatible with the project:

~~~sh
npm install --save-dev vitest jsdom @testing-library/react @testing-library/dom @testing-library/user-event @testing-library/jest-dom
~~~

Add a test command to the client package scripts:

~~~json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "test": "vitest",
    "test:run": "vitest run"
  }
}
~~~

A minimal Vitest configuration can use jsdom and a shared setup file:

~~~js
// vite.config.js
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    clearMocks: true,
    restoreMocks: true
  }
});
~~~

If the project already has a Vite configuration, add the test settings to it instead of replacing existing plugins or aliases.

~~~js
// src/test/setup.js
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});
~~~

The jest-dom matchers add readable assertions such as <code>toBeInTheDocument()</code> and <code>toBeDisabled()</code>. Vitest's <code>clearMocks</code> and <code>restoreMocks</code> settings keep mock state from leaking between tests. If your configuration differs, make the cleanup behavior explicit.

Use the installed project scripts to run one test file or the complete suite:

~~~sh
npm run test -- src/components/CourseSearch.test.jsx
npm run test:run
~~~

The exact script syntax can vary by package manager and project configuration. Keep the command in the package that owns the React app.

## Write components with observable behavior

Consider a searchable list:

~~~jsx
// src/components/CourseSearch.jsx
import { useState } from 'react';

export function CourseSearch({ courses, onSelect }) {
  const [query, setQuery] = useState('');
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const visibleCourses = courses.filter((course) =>
    course.title.toLocaleLowerCase().includes(normalizedQuery)
  );

  return (
    <section aria-labelledby="course-search-heading">
      <h2 id="course-search-heading">Find a course</h2>

      <label htmlFor="course-search">Search courses</label>
      <input
        id="course-search"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />

      {visibleCourses.length === 0 ? (
        <p role="status">No courses match this search.</p>
      ) : (
        <ul aria-label="Matching courses">
          {visibleCourses.map((course) => (
            <li key={course.id}>
              <button type="button" onClick={() => onSelect(course.id)}>
                {course.title}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
~~~

The component exposes a labelled search field, buttons named from course titles, and a status message for the empty result. These are useful user-facing contracts and useful query targets.

## Query the DOM the way a user would

React Testing Library renders into a DOM container and makes queries available through the returned result. The <code>screen</code> object queries the document and is convenient for most tests.

Prefer queries in this order:

1. <code>getByRole</code> with an accessible name for buttons, textboxes, headings, links, and other roles.
2. <code>getByLabelText</code> for a form control with a visible label.
3. <code>getByText</code> for visible text that has no more suitable role query.
4. <code>getByTestId</code> only when the UI has no stable user-facing query.

The query variants communicate expectation:

- <code>getBy...</code> expects exactly one matching element now and throws if absent.
- <code>queryBy...</code> returns <code>null</code> when no match exists; use it to assert absence.
- <code>findBy...</code> waits for one matching element to appear asynchronously.
- <code>getAllBy...</code>, <code>queryAllBy...</code>, and <code>findAllBy...</code> are for multiple matches.

Use an accessible name so a test also verifies that users can identify a control:

~~~js
screen.getByRole('button', { name: 'HTML fundamentals' });
screen.getByRole('searchbox', { name: 'Search courses' });
~~~

Do not select elements by internal CSS class names when a role or label describes the control more clearly.

## Simulate user actions

Use <code>userEvent</code> for ordinary interactions because it models a sequence of browser-like actions such as focus, keyboard input, and click. Create a user instance per test and await its interactions.

~~~jsx
// src/components/CourseSearch.test.jsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CourseSearch } from './CourseSearch.jsx';

const courses = [
  { id: 'html', title: 'HTML fundamentals' },
  { id: 'react', title: 'React for beginners' }
];

describe('CourseSearch', () => {
  it('filters courses as the user types', async () => {
    const user = userEvent.setup();

    render(<CourseSearch courses={courses} onSelect={() => {}} />);

    await user.type(
      screen.getByRole('searchbox', { name: 'Search courses' }),
      'react'
    );

    const list = screen.getByRole('list', { name: 'Matching courses' });
    expect(within(list).getByRole('button', { name: 'React for beginners' }))
      .toBeInTheDocument();
    expect(
      within(list).queryByRole('button', { name: 'HTML fundamentals' })
    ).not.toBeInTheDocument();
  });

  it('reports an empty result', async () => {
    const user = userEvent.setup();

    render(<CourseSearch courses={courses} onSelect={() => {}} />);

    await user.type(
      screen.getByRole('searchbox', { name: 'Search courses' }),
      'database'
    );

    expect(screen.getByRole('status'))
      .toHaveTextContent('No courses match this search.');
  });

  it('notifies the parent when a course is selected', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(<CourseSearch courses={courses} onSelect={onSelect} />);

    await user.click(
      screen.getByRole('button', { name: 'React for beginners' })
    );

    expect(onSelect).toHaveBeenCalledOnce();
    expect(onSelect).toHaveBeenCalledWith('react');
  });
});
~~~

A mock callback is appropriate here because the component's contract is to notify its parent. The test still uses the rendered button just as a user would.

## Wait for asynchronous UI

Async components often show a loading state before data arrives. A test should wait for the observable result instead of sleeping for a fixed duration.

~~~jsx
expect(await screen.findByRole('heading', { name: 'Your courses' }))
  .toBeInTheDocument();
~~~

Use <code>findBy...</code> when one element should appear. Use <code>waitFor</code> when an assertion must eventually become true but no single element query expresses it well:

~~~js
await waitFor(() => {
  expect(loadCourses).toHaveBeenCalledOnce();
});
~~~

<code>waitFor</code> retries its callback until it stops throwing or reaches its timeout. Keep the callback focused on assertions. Do not put a user interaction inside <code>waitFor</code>, because the callback can run more than once.

Avoid <code>setTimeout</code> delays in tests. Fixed delays make a suite slower and can still be too short on a busy machine.

## Test loading, success, empty, and error states

An async UI should make its states visible and understandable:

- Loading: communicate that work is in progress, for example a labelled status message.
- Success: display the returned data with useful accessible names.
- Empty: explain that no results exist and, when appropriate, how to recover.
- Error: describe the failure and provide a retry or next step if one is available.

Keep network behavior behind an API or service module. In a focused component test, pass a controlled promise or mock that boundary. In an integration test, consider intercepting HTTP at the network boundary so the real request code is exercised. Avoid mocking React hooks or replacing the component's entire implementation.

When testing a rejected request, assert the user-visible error and ensure the test does not leave a rejected promise or pending update. Do not display raw server stacks or secret values in the interface.

## Keep tests independent and deterministic

A reliable test should:

- Create its own props, user instance, and mock functions.
- Render the component fresh for each test.
- Avoid relying on execution order or data from another test.
- Reset mock state and timers when they are used.
- Control time, randomness, and network responses when those values matter.
- Clean up subscriptions, observers, and other resources in the component.
- Assert outcomes instead of exact render counts.

React Strict Mode can run development checks more than once. Tests should not assume an effect runs exactly once unless that behavior is part of the public contract.

Use fake timers only when time itself is what the test covers, such as a debounce. Restore real timers after the test and flush any scheduled work carefully. For normal async UI, use accessible queries that wait for the result.

## Test accessibility and semantics

Role-based queries require the interface to expose meaningful semantics. A clickable <code>div</code> is harder to use and harder to test accessibly than a real <code>button</code>. A form control should have a label. A navigation destination should usually be an anchor or router link with a clear name.

Tests do not prove complete accessibility. Combine them with keyboard review, screen-reader checks where appropriate, and browser testing. They can still catch missing labels, unnamed buttons, and incorrect roles early.

Avoid adding ARIA roles that conflict with native HTML semantics. Use the correct element first; add ARIA only when the native element does not express the required behavior.

## Test errors without hiding them

React reports render errors through the console while an error boundary shows its fallback. A test can render a component that deliberately throws to verify the fallback. Keep the failing component isolated to that test, and mock or silence only the expected diagnostic for that specific assertion if the test output requires it. Restore the original console method afterward.

Do not broadly suppress console errors across the suite. Unexpected warnings and errors often reveal real bugs.

## What component tests cannot prove

A jsdom test does not faithfully implement every browser behavior. It cannot confirm:

- The final visual layout or responsive CSS at multiple viewport widths.
- Real file chooser, media playback, or browser permission behavior.
- Every browser's focus handling and native validation UI.
- Server rendering, deployment configuration, or a complete database request path.
- Performance under production data volume.

Keep component tests focused. Use a browser-level test or manual browser review for behavior that depends on a real browser.

## Common mistakes

- Querying by a private class name when an accessible role and name exist.
- Using <code>getBy...</code> to assert that an element is absent instead of <code>queryBy...</code>.
- Forgetting to await <code>userEvent</code> actions.
- Using fixed timeouts instead of <code>findBy...</code> or <code>waitFor</code>.
- Testing every implementation detail and making refactors painful.
- Mocking React or the component under test instead of a boundary it depends on.
- Leaving mock state, timers, or global changes behind for the next test.
- Treating a passing jsdom test as proof that browser layout and accessibility are perfect.
- Asserting how many times React rendered rather than what a user can observe.
- Writing one giant test that covers many unrelated behaviors.

## Chapter checklist

Before considering a React component test useful:

- The component is rendered with realistic props and required providers.
- Queries use accessible roles and names where practical.
- Interactions use awaited user events.
- Assertions describe visible or accessible outcomes.
- Async behavior waits for the result without arbitrary sleeps.
- Loading, empty, success, and error states receive appropriate coverage.
- Mocks are limited to clear external boundaries.
- Tests do not depend on run order, private state, or exact render counts.
- Cleanup restores mocks, timers, and global state.
- Browser-only behavior is covered at a suitable browser test level.

## Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [081 - CSS styling and responsive interface architecture](081-css-styling-and-responsive-interface-architecture.md) | [Q&A](../qnas/082-component-tests-with-react.md) | [Example](../examples/082-component-tests-with-react.md) | [083 - React performance and memoization](083-react-performance-and-memoization.md) |
