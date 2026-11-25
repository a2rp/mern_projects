# 074 - Context and shared application state: example

This example builds a small course progress dashboard. The provider owns the course list, a reducer handles completion updates, and separate contexts expose the changing state and the dispatch function.

The example uses the broadly supported <code>Context.Provider</code> syntax, so it works with React versions before React 19 as well.

## What you will build

The dashboard has:

- A progress summary that reads the shared course state.
- A course list that reads and displays the same state.
- Course cards that dispatch completion actions without receiving the dispatch function through props.
- A provider that scopes this state to the dashboard subtree.

The course list passes each course record to its card as a prop. The card reads only the dispatch context, which illustrates that context and props can work together.

## File structure

~~~text
src/
├── contexts/
│   └── ReadingContext.jsx
├── App.jsx
└── App.css
~~~

## 1. Create the reading context and provider

Create <code>src/contexts/ReadingContext.jsx</code>:

~~~jsx
import { createContext, useContext, useReducer } from "react";

const ReadingStateContext = createContext(null);
const ReadingDispatchContext = createContext(null);

const initialCourses = [
  {
    id: "html",
    title: "HTML foundations",
    duration: "6 lessons",
    completed: true,
  },
  {
    id: "css",
    title: "CSS layout and styling",
    duration: "8 lessons",
    completed: false,
  },
  {
    id: "javascript",
    title: "JavaScript essentials",
    duration: "12 lessons",
    completed: false,
  },
];

function readingReducer(courses, action) {
  switch (action.type) {
    case "course/toggled":
      return courses.map((course) =>
        course.id === action.courseId
          ? { ...course, completed: !course.completed }
          : course
      );

    default:
      throw new Error("Unknown reading action: " + action.type);
  }
}

export function ReadingProvider({ children }) {
  const [courses, dispatch] = useReducer(readingReducer, initialCourses);

  return (
    <ReadingStateContext.Provider value={courses}>
      <ReadingDispatchContext.Provider value={dispatch}>
        {children}
      </ReadingDispatchContext.Provider>
    </ReadingStateContext.Provider>
  );
}

export function useReadingState() {
  const courses = useContext(ReadingStateContext);

  if (courses === null) {
    throw new Error("useReadingState must be used inside ReadingProvider");
  }

  return courses;
}

export function useReadingDispatch() {
  const dispatch = useContext(ReadingDispatchContext);

  if (dispatch === null) {
    throw new Error("useReadingDispatch must be used inside ReadingProvider");
  }

  return dispatch;
}
~~~

The two contexts have different responsibilities:

- <code>ReadingStateContext</code> holds the current array of courses.
- <code>ReadingDispatchContext</code> holds the reducer's dispatch function.

The provider owns both values for its subtree. When a consumer uses one of the exported Hooks outside the provider, the Hook throws a message that points to the missing provider.

The reducer returns a new array and a new course object for the changed course. It does not mutate the previous state. Unknown actions fail loudly, which helps catch misspelled action types during development.

## 2. Build the dashboard components

Create <code>src/App.jsx</code>:

~~~jsx
import {
  ReadingProvider,
  useReadingDispatch,
  useReadingState,
} from "./contexts/ReadingContext.jsx";
import "./App.css";

function ProgressSummary() {
  const courses = useReadingState();
  const completedCount = courses.filter((course) => course.completed).length;
  const totalCount = courses.length;
  const percentage =
    totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  return (
    <section className="progress-panel" aria-labelledby="progress-heading">
      <div className="progress-copy">
        <div>
          <p className="eyebrow">Your learning plan</p>
          <h2 id="progress-heading">Overall progress</h2>
        </div>
        <p className="progress-count">
          <strong>{completedCount}</strong> of {totalCount} courses complete
        </p>
      </div>

      <progress
        className="progress-bar"
        value={completedCount}
        max={totalCount || 1}
        aria-label="Completed courses"
      />

      <p className="progress-percentage">{percentage}% complete</p>
    </section>
  );
}

function CourseList() {
  const courses = useReadingState();

  if (courses.length === 0) {
    return <p className="empty-state">No courses are in this learning plan.</p>;
  }

  return (
    <ul className="course-list">
      {courses.map((course) => (
        <CourseCard key={course.id} course={course} />
      ))}
    </ul>
  );
}

function CourseCard({ course }) {
  const dispatch = useReadingDispatch();

  function handleChange() {
    dispatch({ type: "course/toggled", courseId: course.id });
  }

  return (
    <li className="course-card">
      <label className="course-choice">
        <input
          type="checkbox"
          checked={course.completed}
          onChange={handleChange}
        />
        <span className="course-title">{course.title}</span>
      </label>

      <span className="course-duration">{course.duration}</span>
    </li>
  );
}

function Dashboard() {
  return (
    <main className="dashboard">
      <header className="page-heading">
        <p className="eyebrow">MERN learning workspace</p>
        <h1>My learning plan</h1>
        <p className="page-intro">
          Track the courses you have finished and see your overall progress.
        </p>
      </header>

      <ProgressSummary />

      <section className="courses-section" aria-labelledby="courses-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Study list</p>
            <h2 id="courses-heading">Courses</h2>
          </div>
          <span className="section-note">Select a course to update it</span>
        </div>

        <CourseList />
      </section>
    </main>
  );
}

export default function App() {
  return (
    <ReadingProvider>
      <Dashboard />
    </ReadingProvider>
  );
}
~~~

The <code>ReadingProvider</code> wraps the dashboard, so both <code>ProgressSummary</code> and <code>CourseList</code> can read the same course state. <code>CourseCard</code> receives its course as a prop and gets the dispatch function from context. No intermediate component needs to forward dispatch.

When a checkbox changes, its card sends an action. The reducer returns the updated list, and the state consumer components render the new values. The completion count and percentage are derived from the course list instead of being stored as duplicate state.

## 3. Add styles

Create <code>src/App.css</code>:

~~~css
:root {
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
    "Segoe UI", sans-serif;
  color: #18212f;
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
input {
  font: inherit;
}

.dashboard {
  width: min(100% - 2rem, 760px);
  margin: 0 auto;
  padding: 4rem 0;
}

.page-heading {
  margin-bottom: 2rem;
}

.eyebrow {
  margin: 0 0 0.5rem;
  color: #526987;
  font-size: 0.75rem;
  font-weight: 750;
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
  font-size: clamp(2rem, 5vw, 3rem);
  letter-spacing: -0.045em;
}

h2 {
  margin-bottom: 0;
  font-size: 1.25rem;
  letter-spacing: -0.02em;
}

.page-intro {
  max-width: 42rem;
  margin-bottom: 0;
  color: #526174;
  line-height: 1.6;
}

.progress-panel,
.courses-section {
  border: 1px solid #dbe3ee;
  border-radius: 1rem;
  background: #fff;
  box-shadow: 0 12px 35px rgb(30 55 90 / 7%);
}

.progress-panel {
  padding: 1.5rem;
}

.progress-copy,
.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.progress-count {
  margin: 0;
  color: #526174;
  text-align: right;
}

.progress-count strong {
  color: #18212f;
  font-size: 1.25rem;
}

.progress-bar {
  display: block;
  width: 100%;
  height: 0.75rem;
  margin: 1.35rem 0 0.6rem;
  overflow: hidden;
  border: 0;
  border-radius: 999px;
  background: #e8edf5;
  accent-color: #365fd4;
}

.progress-bar::-webkit-progress-bar {
  border-radius: 999px;
  background: #e8edf5;
}

.progress-bar::-webkit-progress-value {
  border-radius: 999px;
  background: #365fd4;
}

.progress-bar::-moz-progress-bar {
  border-radius: 999px;
  background: #365fd4;
}

.progress-percentage {
  margin: 0;
  color: #526174;
  font-size: 0.875rem;
}

.courses-section {
  margin-top: 1.5rem;
  padding: 1.5rem;
}

.section-heading {
  margin-bottom: 1rem;
}

.section-note {
  color: #69788c;
  font-size: 0.875rem;
  text-align: right;
}

.course-list {
  display: grid;
  gap: 0.75rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.course-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid #e1e7f0;
  border-radius: 0.75rem;
}

.course-choice {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  min-width: 0;
  cursor: pointer;
}

.course-choice input {
  width: 1.1rem;
  height: 1.1rem;
  margin: 0;
  accent-color: #365fd4;
}

.course-title {
  font-weight: 650;
}

.course-choice input:checked + .course-title {
  color: #65748a;
  text-decoration: line-through;
  text-decoration-thickness: 1px;
}

.course-duration {
  flex: 0 0 auto;
  color: #69788c;
  font-size: 0.875rem;
}

.empty-state {
  margin: 0;
  padding: 1rem;
  border-radius: 0.75rem;
  background: #f3f6fb;
  color: #526174;
}

@media (max-width: 540px) {
  .dashboard {
    padding: 2rem 0;
  }

  .progress-copy,
  .section-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .progress-count {
    text-align: left;
  }

  .section-note {
    text-align: left;
  }

  .course-card {
    align-items: flex-start;
    flex-direction: column;
  }
}
~~~

## 4. Run and explore

Add these files to a React project that already has a development script, then start the project with its usual development command.

Try the following:

1. Mark **CSS layout and styling** complete. The progress count and bar should update.
2. Unmark **HTML foundations**. The count should decrease.
3. Inspect the component tree. Both the summary and course list read shared state, while the cards send actions.
4. Temporarily render <code>CourseList</code> outside <code>ReadingProvider</code>. The custom Hook should report that the provider is missing.
5. Wrap a second dashboard in its own <code>ReadingProvider</code>. Its changes should be independent of the first dashboard.

## Why this example uses two contexts

The course list and progress summary read changing state, so they use <code>ReadingStateContext</code>. Cards only need the dispatch function to request a change, so they use <code>ReadingDispatchContext</code>. This separates each component's dependency.

The split does not prevent every render. For example, a card can still render when its parent list renders and passes it updated props. It avoids subscribing the card to state context when it only needs dispatch. Keep the design simple until the app has a reason to make this distinction.

## Key takeaways

- A provider supplies its value to matching context consumers below it.
- The provider owns the reducer state; context makes that state available to descendants.
- The nearest provider determines the value for a consumer.
- State and dispatch contexts can express different dependencies.
- Course completion is updated immutably, and summary values are derived from the source state.
- Context scope follows the React tree and does not persist or synchronize the data.

## Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [073 - Custom hooks](../lessons/073-custom-hooks.md) | [Q&A](../qnas/074-context-and-shared-application-state.md) | [Lesson](../lessons/074-context-and-shared-application-state.md) | [075 - Client-side routing and route layouts](../lessons/075-client-side-routing-and-route-layouts.md) |
