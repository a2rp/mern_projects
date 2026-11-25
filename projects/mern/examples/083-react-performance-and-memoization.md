# 083 - React performance and memoization: example

This example builds a small course catalog that can be searched, themed, and selected. It uses <code>useMemo</code> for a derived filter, <code>memo</code> for a row whose props can remain stable, <code>useCallback</code> for the selection handler, and <code>Profiler</code> to inspect updates.

These APIs demonstrate manual optimization for learning. Profile the real application first. If React Compiler is enabled, it may automatically memoize some of this work, so keep only the manual optimization that is useful for the project.

## What you will build

- A course list with a search field and a selected-course message.
- A theme toggle that updates the parent without changing every row's props.
- A memoized course row.
- A filter calculation that is reused when its inputs do not change.
- A Profiler callback for observing update duration.

## File structure

~~~text
src/
  components/
    CourseCatalog.jsx
    CourseCatalog.css
  main.jsx
~~~

## 1. Create the component and sample data

Create <code>src/components/CourseCatalog.jsx</code>:

~~~jsx
import { memo, Profiler, useCallback, useMemo, useState } from 'react';
import './CourseCatalog.css';

const courses = Array.from({ length: 120 }, (_, index) => {
  const number = index + 1;

  return {
    id: 'course-' + number,
    title: 'Course ' + number,
    category: number % 2 === 0 ? 'Frontend' : 'Backend',
    summary: 'A practical learning path for topic ' + number + '.'
  };
});

const MemoCourseRow = memo(function CourseRow({
  course,
  isSelected,
  onSelect
}) {
  return (
    <li className={isSelected ? 'course-row course-row--selected' : 'course-row'}>
      <div>
        <h2>{course.title}</h2>
        <p>{course.category}</p>
        <p>{course.summary}</p>
      </div>
      <button type="button" onClick={() => onSelect(course.id)}>
        {isSelected ? 'Selected' : 'Select'}
      </button>
    </li>
  );
});

function logProfile(id, phase, actualDuration, baseDuration) {
  console.table({ id, phase, actualDuration, baseDuration });
}

export function CourseCatalog() {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [isDark, setIsDark] = useState(false);

  const visibleCourses = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();

    return courses.filter((course) =>
      (course.title + ' ' + course.category + ' ' + course.summary)
        .toLocaleLowerCase()
        .includes(normalizedQuery)
    );
  }, [query]);

  const handleSelect = useCallback((courseId) => {
    setSelectedId(courseId);
  }, []);

  return (
    <main className={isDark ? 'catalog catalog--dark' : 'catalog'}>
      <header className="catalog__header">
        <div>
          <p className="catalog__eyebrow">Performance lab</p>
          <h1>Course catalog</h1>
        </div>
        <button
          type="button"
          aria-pressed={isDark}
          onClick={() => setIsDark((current) => !current)}
        >
          {isDark ? 'Use light theme' : 'Use dark theme'}
        </button>
      </header>

      <label htmlFor="course-query">Search courses</label>
      <input
        id="course-query"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Try Frontend or Course 20"
      />

      <p role="status" aria-live="polite">
        Showing {visibleCourses.length} of {courses.length} courses
      </p>

      {selectedId && (
        <p>
          Selected course: {courses.find((course) => course.id === selectedId)?.title}
        </p>
      )}

      {visibleCourses.length === 0 ? (
        <p>No courses match this search. Try another term.</p>
      ) : (
        <Profiler id="CourseCatalogRows" onRender={logProfile}>
          <ul className="course-list" aria-label="Courses">
            {visibleCourses.map((course) => (
              <MemoCourseRow
                key={course.id}
                course={course}
                isSelected={course.id === selectedId}
                onSelect={handleSelect}
              />
            ))}
          </ul>
        </Profiler>
      )}
    </main>
  );
}
~~~

Each course object is created once at module scope. The filter result depends only on the search query and the stable course data. The selection callback has no changing captured value, so its empty dependency list is correct.

When the theme changes, the memoized rows receive the same course object, selection boolean, and callback. When selection changes, only the previously selected row and the newly selected row receive a different <code>isSelected</code> prop. React still creates the parent list output and checks the row elements; memoization can let unchanged rows skip their component render.

## 2. Add basic styling

Create <code>src/components/CourseCatalog.css</code>:

~~~css
.catalog {
  --surface: #fff;
  --page: #f3f6fb;
  --text: #182334;
  --muted: #526175;
  --border: #d2dbe8;
  --accent: #1458c4;

  max-width: 70rem;
  margin-inline: auto;
  padding: 2rem;
  color: var(--text);
  background: var(--page);
  font-family: system-ui, sans-serif;
}

.catalog--dark {
  color-scheme: dark;
  --surface: #182334;
  --page: #101722;
  --text: #edf2fa;
  --muted: #b9c5d6;
  --border: #344358;
  --accent: #9fc1ff;
}

.catalog__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-block-end: 1.5rem;
}

.catalog__eyebrow {
  color: var(--muted);
  font-size: 0.875rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.catalog h1,
.catalog h2,
.catalog p {
  margin-block: 0 0.5rem;
}

.catalog input {
  display: block;
  width: min(100%, 32rem);
  margin-block: 0.5rem 1rem;
  padding: 0.75rem;
  border: 1px solid var(--border);
  border-radius: 0.4rem;
  color: var(--text);
  background: var(--surface);
  font: inherit;
}

.catalog button {
  padding: 0.65rem 0.9rem;
  border: 1px solid var(--accent);
  border-radius: 0.4rem;
  color: var(--accent);
  background: var(--surface);
  font: inherit;
  cursor: pointer;
}

.catalog button:focus-visible,
.catalog input:focus-visible {
  outline: 3px solid var(--accent);
  outline-offset: 3px;
}

.course-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 19rem), 1fr));
  gap: 1rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.course-row {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid var(--border);
  border-radius: 0.65rem;
  background: var(--surface);
}

.course-row p {
  color: var(--muted);
}

.course-row--selected {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent) 25%, transparent);
}

@media (max-width: 34rem) {
  .catalog {
    padding: 1rem;
  }

  .catalog__header,
  .course-row {
    align-items: stretch;
    flex-direction: column;
  }
}
~~~

The styles keep the demo usable across narrow and wide screens. A component test would not prove these layouts render correctly; review them in a browser.

## 3. Render the catalog

Use the component in <code>src/App.jsx</code>:

~~~jsx
import { CourseCatalog } from './components/CourseCatalog.jsx';

export default function App() {
  return <CourseCatalog />;
}
~~~

If the project already has an application root, add the component to an appropriate route rather than replacing the app.

## 4. Inspect the interaction

Run the app using its existing development command and open the catalog.

1. Open the React DevTools Profiler and record a baseline.
2. Toggle the theme. The parent updates, but the memoized rows have unchanged props.
3. Select a course. Only rows whose selection state changes need a different row prop.
4. Type a search term. The filtered array changes because the query changed, so the visible list updates.
5. Clear the search and test another term.
6. Compare the Profiler readings for the same interactions before and after changing the optimization.
7. Check browser performance tools as well; React render duration is not the entire interaction duration.

The number of rows here makes identity behavior easier to inspect. It is sample data, not a claim that memoizing every row is the best production strategy.

## 5. Compare with a direct calculation

To compare, temporarily calculate the result directly:

~~~jsx
const normalizedQuery = query.trim().toLocaleLowerCase();
const visibleCourses = courses.filter((course) =>
  (course.title + ' ' + course.category + ' ' + course.summary)
    .toLocaleLowerCase()
    .includes(normalizedQuery)
);
~~~

The direct version is simpler. Keep it if filtering is already fast enough. The memoized version can help when filtering is costly or the stable result lets a memoized consumer skip meaningful work. Measure both versions under the same conditions.

## What the example demonstrates

- <code>useMemo</code> caches a derived list for the same query.
- <code>memo</code> can skip a child render when its props remain equal.
- <code>useCallback</code> keeps the callback prop stable for the memoized row.
- A new search query invalidates the filtered list calculation.
- A theme update does not change the row props.
- A selected row and the newly selected row receive changed selection props.
- Profiler values describe React rendering, not all browser work.
- These caches are optimization details; the UI should remain correct if React renders again.

## Important limits

- The example does not show list virtualization. For a very large collection, render only the visible range or paginate.
- The measured component cost changes with hardware, data, browser, and development or production mode.
- React Compiler may perform automatic memoization if enabled in the project.
- A stable function does not make an expensive function body faster when it is actually called.
- The filter still has to run when its query changes.
- Use the Profiler to guide an optimization; do not use a particular millisecond value as a universal threshold.

## Key takeaways

- Measure a real interaction before adding optimization code.
- Keep state local and remove unnecessary update chains.
- Use memoization for measured repeated work with stable inputs.
- Keep dependency lists complete and calculations pure.
- Prefer a clear direct implementation when it performs well.
- Re-measure after each change and review production-like behavior.

## Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Next chapter |
| --- | --- | --- | --- |
| [082 - Component tests with React](../lessons/082-component-tests-with-react.md) | [Lesson](../lessons/083-react-performance-and-memoization.md) | [Q&A](../qnas/083-react-performance-and-memoization.md) | [084 - Error boundaries and recovery](../lessons/084-error-boundaries-and-recovery.md) |
