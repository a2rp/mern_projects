# 082 - Component tests with React: example

This example configures a Vite React project for component tests and tests a searchable course list plus an asynchronous course panel. The tests use the rendered DOM, accessible names, and awaited user actions. They do not inspect React's private state.

The example uses Vitest, jsdom, React Testing Library, user-event, and jest-dom. Install versions compatible with your existing Node.js, React, and Vite project. These files belong in the frontend package of a MERN application.

## What you will build

- A Vitest setup using jsdom for DOM-based component tests.
- A search component with a visible label, a result list, and an empty state.
- An asynchronous component with loading, success, empty, and error states.
- Tests for user input, selection callbacks, and async results.
- A repeatable command for running tests once.

## 1. Install the test dependencies

From the React app folder, install the test tools:

~~~sh
npm install --save-dev vitest jsdom @testing-library/react @testing-library/dom @testing-library/user-event @testing-library/jest-dom
~~~

A Vite React app already has Vite and the React plugin. If yours does not, add the plugin that matches your Vite configuration. Do not replace an existing Vite config just to add test options.

## 2. Add package scripts

Keep the application's existing scripts and add test commands:

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

The watch command is useful during development. The run-once command is useful in automation and when you want a test process to exit after the suite completes.

## 3. Configure Vitest and shared setup

Add the test settings to the existing Vite configuration. For a minimal JavaScript project:

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

Create a shared setup file:

~~~js
// src/test/setup.js
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});
~~~

This setup adds DOM matchers such as <code>toBeInTheDocument()</code> and unmounts rendered components after each test. Keep existing plugins, aliases, and configuration fields when you extend a real project config.

## 4. Build the searchable component

Create <code>src/components/CourseSearch.jsx</code>:

~~~jsx
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

The search input is connected to a visible label. Results are real buttons, so keyboard interaction and accessible naming come from native HTML semantics.

## 5. Test filtering, empty results, and selection

Create <code>src/components/CourseSearch.test.jsx</code> next to the component:

~~~jsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CourseSearch } from './CourseSearch.jsx';

const courses = [
  { id: 'html', title: 'HTML fundamentals' },
  { id: 'react', title: 'React for beginners' },
  { id: 'mongo', title: 'MongoDB essentials' }
];

describe('CourseSearch', () => {
  it('filters results as the user types', async () => {
    const user = userEvent.setup();

    render(<CourseSearch courses={courses} onSelect={() => {}} />);

    await user.type(
      screen.getByRole('searchbox', { name: 'Search courses' }),
      'react'
    );

    const list = screen.getByRole('list', { name: 'Matching courses' });
    expect(
      within(list).getByRole('button', { name: 'React for beginners' })
    ).toBeInTheDocument();
    expect(
      within(list).queryByRole('button', { name: 'HTML fundamentals' })
    ).not.toBeInTheDocument();
  });

  it('shows a helpful message when there are no matches', async () => {
    const user = userEvent.setup();

    render(<CourseSearch courses={courses} onSelect={() => {}} />);

    await user.type(
      screen.getByRole('searchbox', { name: 'Search courses' }),
      'database'
    );

    expect(screen.getByRole('status'))
      .toHaveTextContent('No courses match this search.');
  });

  it('calls the selection callback with the chosen course id', async () => {
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

The test queries by roles and accessible names. The mock callback records the component's public behavior: which course it asks the parent to select.

## 6. Add an asynchronous loading component

Create <code>src/components/CourseResults.jsx</code>:

~~~jsx
import { useEffect, useState } from 'react';

export function CourseResults({ loadCourses }) {
  const [state, setState] = useState({ status: 'loading', courses: [] });

  useEffect(() => {
    let isCurrent = true;

    setState({ status: 'loading', courses: [] });

    Promise.resolve()
      .then(() => loadCourses())
      .then((courses) => {
        if (isCurrent) {
          setState({ status: 'success', courses });
        }
      })
      .catch(() => {
        if (isCurrent) {
          setState({ status: 'error', courses: [] });
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [loadCourses]);

  if (state.status === 'loading') {
    return <p role="status">Loading courses...</p>;
  }

  if (state.status === 'error') {
    return <p role="alert">Courses could not be loaded. Try again later.</p>;
  }

  if (state.courses.length === 0) {
    return <p>No courses are available yet.</p>;
  }

  return (
    <section aria-labelledby="your-courses-heading">
      <h2 id="your-courses-heading">Your courses</h2>
      <ul>
        {state.courses.map((course) => (
          <li key={course.id}>{course.title}</li>
        ))}
      </ul>
    </section>
  );
}
~~~

The request function is passed as a prop, so the component is not coupled to a particular HTTP library. In a real app, a stable service function can call the API. The cleanup flag prevents a stale promise from updating an unmounted component. For overlapping requests, use an abort signal or request identifier so an older response cannot replace newer results.

## 7. Test loading, success, empty, and failure

Create <code>src/components/CourseResults.test.jsx</code>:

~~~jsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CourseResults } from './CourseResults.jsx';

const sampleCourses = [
  { id: 'react', title: 'React for beginners' },
  { id: 'mongo', title: 'MongoDB essentials' }
];

describe('CourseResults', () => {
  it('shows loading and then the returned courses', async () => {
    const loadCourses = vi.fn().mockResolvedValue(sampleCourses);

    render(<CourseResults loadCourses={loadCourses} />);

    expect(screen.getByRole('status'))
      .toHaveTextContent('Loading courses...');

    expect(
      await screen.findByRole('heading', { name: 'Your courses' })
    ).toBeInTheDocument();
    expect(
      screen.getByText('React for beginners')
    ).toBeInTheDocument();
    expect(loadCourses).toHaveBeenCalledOnce();
  });

  it('shows an empty state when the request returns no courses', async () => {
    const loadCourses = vi.fn().mockResolvedValue([]);

    render(<CourseResults loadCourses={loadCourses} />);

    expect(
      await screen.findByText('No courses are available yet.')
    ).toBeInTheDocument();
  });

  it('shows a safe error message when the request fails', async () => {
    const loadCourses = vi.fn().mockRejectedValue(new Error('database secret'));

    render(<CourseResults loadCourses={loadCourses} />);

    expect(
      await screen.findByRole('alert')
    ).toHaveTextContent('Courses could not be loaded. Try again later.');
    expect(screen.queryByText('database secret')).not.toBeInTheDocument();
  });
});
~~~

The failure assertion checks the message a learner can act on and confirms that internal error details are not rendered. It does not require a fixed sleep: <code>findByRole</code> waits for the error state to appear.

## 8. Run the example

From the frontend folder:

~~~sh
npm run test:run
~~~

To focus on one component file during development:

~~~sh
npm run test -- src/components/CourseSearch.test.jsx
~~~

Use the test command configured by your package manager. Do not commit a test result as proof that deployment, visual layout, or browser-only behavior has been checked.

## Expected behavior

- The search field has the accessible name “Search courses.”
- Typing “react” leaves the React course visible and removes other results.
- Searching for an absent course displays a status message.
- Activating a course button calls the parent callback with its id.
- The async panel announces loading before its request finishes.
- A successful request shows the returned courses.
- An empty response shows an empty state.
- A rejected request shows a safe alert without exposing its raw error.

## Adapt the example to the application

- If the app already has an API service, pass its stable function to <code>CourseResults</code> rather than creating another request layer.
- If the component needs a router or context provider, render it with the smallest realistic provider wrapper.
- If a test depends on network parsing, write an integration test that exercises the real service and controls HTTP at a boundary.
- If CSS, viewport size, or browser APIs affect the behavior, add a browser-level test for that behavior.
- Keep the loading and error messages aligned with the product's actual retry and recovery controls.

## Troubleshooting

### The test runner says <code>document</code> is undefined

Confirm that the test environment is set to jsdom and that jsdom is installed in the frontend package.

### The jest-dom matcher is unknown

Confirm the setup file imports <code>@testing-library/jest-dom/vitest</code> and that Vitest loads the configured setup file.

### The label query cannot find the textbox

Ensure the <code>label</code> uses <code>htmlFor</code> that matches the input's <code>id</code>, or place the input inside its label.

### The test sees stale results

Await the user interaction and use an async query for the changed result. Avoid fixed sleeps and check whether a request or debounce is still pending.

### A mocked request leaks between tests

Keep each mock local to the test or reset and restore mocks in shared configuration. Do not let one test depend on another test's mock setup.

### An async update happens after unmount

Cancel the request with an <code>AbortController</code> where possible or ignore stale results in the component cleanup. A test should not suppress warnings globally to hide this issue.

## Key takeaways

- Test the DOM behavior users rely on, not the component's private implementation.
- Prefer roles and accessible names, and await user interactions.
- Use <code>findBy...</code> for asynchronous appearance instead of arbitrary delays.
- Control API behavior at a service or HTTP boundary.
- Cover meaningful loading, success, empty, and error outcomes.
- Use a real browser test for layout and browser-specific behavior.

## Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Next chapter |
| --- | --- | --- | --- |
| [081 - CSS styling and responsive interface architecture](../lessons/081-css-styling-and-responsive-interface-architecture.md) | [Lesson](../lessons/082-component-tests-with-react.md) | [Q&A](../qnas/082-component-tests-with-react.md) | [083 - React performance and memoization](../lessons/083-react-performance-and-memoization.md) |
