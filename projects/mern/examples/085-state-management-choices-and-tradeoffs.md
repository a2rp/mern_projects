# 085 - State management choices and tradeoffs: example

This example builds a course browser where two components share search and category filters. A reducer owns related filter transitions, Context makes the value and dispatch function available within one feature, and the visible courses are derived from the source list.

The selected course and its detail panel live in the same feature workspace. The example does not add a global store or a second copy of the course data because neither is needed for this small feature.

## What you will build

- A feature-scoped reducer for search and category filters.
- Separate Context values for filter state and dispatch.
- Controlled search and category inputs.
- A course list that derives visible results from source data.
- A local selection value for the detail panel.
- A reset action and visible empty state.

## File structure

~~~text
src/
  data/
    courses.js
  features/
    course-browser/
      CourseFilterContext.jsx
      CourseFilterControls.jsx
      CourseList.jsx
      CourseWorkspace.jsx
      CoursePage.jsx
  App.jsx
~~~

## 1. Define sample course data

Create <code>src/data/courses.js</code>:

~~~js
export const courses = [
  {
    id: 'html-basics',
    title: 'HTML fundamentals',
    category: 'frontend',
    summary: 'Build a well-structured page with semantic HTML.'
  },
  {
    id: 'react-ui',
    title: 'React interfaces',
    category: 'frontend',
    summary: 'Compose an interactive interface from components.'
  },
  {
    id: 'node-api',
    title: 'Node.js APIs',
    category: 'backend',
    summary: 'Build an HTTP API with routes and request handling.'
  },
  {
    id: 'mongodb-data',
    title: 'MongoDB data modeling',
    category: 'backend',
    summary: 'Organize documents and queries around application needs.'
  }
];
~~~

This is local example data. In a real application, the API or server-state layer remains the source for remote course data.

## 2. Define the reducer and feature contexts

Create <code>src/features/course-browser/CourseFilterContext.jsx</code>:

~~~jsx
import { createContext, useContext, useReducer } from 'react';

const categories = ['all', 'frontend', 'backend'];

const initialFilters = {
  search: '',
  category: 'all'
};

const FilterStateContext = createContext(null);
const FilterDispatchContext = createContext(null);

export function courseFilterReducer(state, action) {
  switch (action.type) {
    case 'searchChanged':
      return {
        ...state,
        search: action.value
      };

    case 'categoryChanged':
      return {
        ...state,
        category: categories.includes(action.value) ? action.value : 'all'
      };

    case 'reset':
      return initialFilters;

    default:
      return state;
  }
}

export function CourseFilterProvider({ children }) {
  const [filters, dispatch] = useReducer(
    courseFilterReducer,
    initialFilters
  );

  return (
    <FilterStateContext.Provider value={filters}>
      <FilterDispatchContext.Provider value={dispatch}>
        {children}
      </FilterDispatchContext.Provider>
    </FilterStateContext.Provider>
  );
}

export function useCourseFilters() {
  const filters = useContext(FilterStateContext);

  if (filters === null) {
    throw new Error('useCourseFilters must be used inside CourseFilterProvider');
  }

  return filters;
}

export function useCourseFilterDispatch() {
  const dispatch = useContext(FilterDispatchContext);

  if (dispatch === null) {
    throw new Error(
      'useCourseFilterDispatch must be used inside CourseFilterProvider'
    );
  }

  return dispatch;
}
~~~

The reducer owns only filter transitions. It does not fetch data, change the URL, or write to storage. The provider is scoped to the course-browser feature. Components outside this feature do not subscribe to these values.

The state and dispatch contexts are separate. A control that only dispatches an action can read dispatch without subscribing to the changing state value.

## 3. Build controlled filter controls

Create <code>src/features/course-browser/CourseFilterControls.jsx</code>:

~~~jsx
import {
  useCourseFilterDispatch,
  useCourseFilters
} from './CourseFilterContext.jsx';

export function CourseFilterControls() {
  const filters = useCourseFilters();
  const dispatch = useCourseFilterDispatch();

  const hasActiveFilters =
    filters.search !== '' || filters.category !== 'all';

  return (
    <section aria-labelledby="filter-heading">
      <h2 id="filter-heading">Filter courses</h2>

      <label htmlFor="course-search">Search courses</label>
      <input
        id="course-search"
        type="search"
        value={filters.search}
        onChange={(event) => {
          dispatch({
            type: 'searchChanged',
            value: event.target.value
          });
        }}
      />

      <label htmlFor="course-category">Category</label>
      <select
        id="course-category"
        value={filters.category}
        onChange={(event) => {
          dispatch({
            type: 'categoryChanged',
            value: event.target.value
          });
        }}
      >
        <option value="all">All categories</option>
        <option value="frontend">Frontend</option>
        <option value="backend">Backend</option>
      </select>

      <button
        type="button"
        disabled={!hasActiveFilters}
        onClick={() => dispatch({ type: 'reset' })}
      >
        Clear filters
      </button>
    </section>
  );
}
~~~

The inputs are controlled by the shared filter state, so the controls and list stay coordinated. The reset button is disabled when there is nothing to clear.

## 4. Derive and display the visible list

Create <code>src/features/course-browser/CourseList.jsx</code>:

~~~jsx
import { useCourseFilters } from './CourseFilterContext.jsx';

export function CourseList({ courses, selectedId, onSelect }) {
  const filters = useCourseFilters();
  const normalizedSearch = filters.search.trim().toLocaleLowerCase();

  const visibleCourses = courses.filter((course) => {
    const matchesCategory =
      filters.category === 'all' || course.category === filters.category;
    const matchesSearch =
      course.title.toLocaleLowerCase().includes(normalizedSearch) ||
      course.summary.toLocaleLowerCase().includes(normalizedSearch);

    return matchesCategory && matchesSearch;
  });

  return (
    <section aria-labelledby="course-list-heading">
      <h2 id="course-list-heading">Courses</h2>
      <p role="status" aria-live="polite">
        Showing {visibleCourses.length} of {courses.length} courses
      </p>

      {visibleCourses.length === 0 ? (
        <p>No courses match these filters. Change or clear a filter.</p>
      ) : (
        <ul aria-label="Course results">
          {visibleCourses.map((course) => (
            <li key={course.id}>
              <article>
                <h3>{course.title}</h3>
                <p>{course.summary}</p>
                <p>Category: {course.category}</p>
                <button
                  type="button"
                  aria-pressed={selectedId === course.id}
                  onClick={() => onSelect(course.id)}
                >
                  {selectedId === course.id ? 'Selected' : 'View details'}
                </button>
              </article>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
~~~

The filtered list and result count are derived from <code>courses</code> and <code>filters</code>. They are not stored as another state variable, so there is no effect that needs to synchronize a second copy.

## 5. Keep selection local to the workspace

Create <code>src/features/course-browser/CourseWorkspace.jsx</code>:

~~~jsx
import { useState } from 'react';
import { courses } from '../../data/courses.js';
import { CourseFilterControls } from './CourseFilterControls.jsx';
import { CourseList } from './CourseList.jsx';
import { CourseFilterProvider } from './CourseFilterContext.jsx';

function CourseWorkspace() {
  const [selectedId, setSelectedId] = useState(courses[0]?.id ?? null);
  const selectedCourse = courses.find((course) => course.id === selectedId);

  return (
    <main>
      <h1>Course browser</h1>
      <p>
        Search the course list and select an item to see its details.
      </p>

      <CourseFilterControls />
      <CourseList
        courses={courses}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />

      <section aria-labelledby="course-details-heading">
        <h2 id="course-details-heading">Selected course</h2>
        {selectedCourse ? (
          <>
            <h3>{selectedCourse.title}</h3>
            <p>{selectedCourse.summary}</p>
          </>
        ) : (
          <p>Select a course to see its details.</p>
        )}
      </section>
    </main>
  );
}

export function CourseWorkspaceWithState() {
  return (
    <CourseFilterProvider>
      <CourseWorkspace />
    </CourseFilterProvider>
  );
}
~~~

Selection is shared by the list and detail panel, so <code>CourseWorkspace</code> owns it and passes it to both. Filters are used in separate descendants, so the feature-scoped provider supplies them. The two state values have different scopes and do not need to live in the same store.

## 6. Render the feature

Create or update <code>src/features/course-browser/CoursePage.jsx</code>:

~~~jsx
import { CourseWorkspaceWithState } from './CourseWorkspace.jsx';

export default function CoursePage() {
  return <CourseWorkspaceWithState />;
}
~~~

Then render the page from <code>src/App.jsx</code> or place it in an existing route:

~~~jsx
import CoursePage from './features/course-browser/CoursePage.jsx';

export default function App() {
  return <CoursePage />;
}
~~~

## 7. Explore the state transitions

1. The page starts with all categories and an empty search.
2. Type “react.” The reducer updates the shared search value and the list derives matching results.
3. Change the category to “backend.” The list applies both the search and category values.
4. Select a course. The local workspace state updates the selected item and its detail panel.
5. Clear the filters. The reducer returns the initial filter state.
6. Inspect the tree: the workspace owns selection; the provider owns filters; the course array remains the source data.

The reset action returns a known initial state. Reducers should not mutate the current state object.

## 8. Decide where other state would go

For this small example:

- Search and category filters are shared by the filter controls and results, so they are in the feature provider.
- The selected course is used by the list and details panel, so it is lifted to their workspace.
- The course records are static sample data; remote records would remain server-owned.
- The result count and filtered list are derived, not stored.
- A theme used across routes could use an app-level provider.
- A bookmarkable applied category could move into the route query string.
- A complex cross-route workflow could justify a dedicated client store after its requirements are clear.

The goal is not to force all of these values into this example. They illustrate how to choose a state owner based on scope and lifecycle.

## Expected behavior

- Search and category controls remain in sync with the visible course list.
- Changing either filter updates the result count.
- Clearing filters restores the complete list.
- Selecting a course updates the detail panel.
- No effect copies filters into a second list state.
- Components outside this feature are not wrapped in the filter provider.

## Try these changes

- Add a “difficulty” filter action and control.
- Add a reset-to-default category action separate from clearing the search.
- Move selected-course state into the provider only if other distant components need it.
- Put applied filters into the route query string if users need to share them.
- Replace static course data with a server-state query and preserve request loading and error states.
- Add a separate app-level theme context and confirm course filters do not depend on it.

## Common mistakes

- Copying the filtered list into state and synchronizing it with an effect.
- Putting search input, selected course, theme, and remote data in one global object without a shared scope.
- Duplicating the course response in both a query cache and Context.
- Expanding a feature provider to wrap the whole app when only one route needs it.
- Performing network or storage side effects inside <code>courseFilterReducer</code>.
- Adding Context for data that one component can receive as a prop.
- Forgetting that Context consumers re-render when their provided value changes.
- Treating local storage as a secure credential store.

## Key takeaways

- Choose state ownership from the value's scope, source, and lifecycle.
- Use a common parent when nearby components must coordinate.
- Use a reducer when related transitions belong together.
- Use Context for feature-scoped access, not as an automatic replacement for every state tool.
- Keep server data, URL state, local UI state, and persisted preferences distinct.
- Derive display values from their source instead of duplicating them.

## Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Next chapter |
| --- | --- | --- | --- |
| [084 - Error boundaries and recovery](../lessons/084-error-boundaries-and-recovery.md) | [Lesson](../lessons/085-state-management-choices-and-tradeoffs.md) | [Q&A](../qnas/085-state-management-choices-and-tradeoffs.md) | [086 - Build a reusable component system](../lessons/086-build-a-reusable-component-system.md) |
