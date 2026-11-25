# 065 - Props and one-way data flow: example

This example creates an interactive course lesson browser. The page owns the selected filter and lesson; child components receive those values as props and call callbacks to request changes.

The code is educational material and is not run. Place the files in the Vite React app created in the tooling chapter, then render <code>App</code> from the app entry. The example uses local data only; it does not make API or database requests.

## What the example demonstrates

- Passing strings, arrays, objects, booleans, and callbacks through props.
- Reading props by destructuring component parameters.
- Keeping filter and selected lesson values in the page that coordinates them.
- Passing the controlled filter value down and reporting a user's choice through a callback.
- Passing lesson data and selection callbacks through a component tree.
- Deriving visible lessons and the selected lesson from current data rather than keeping duplicate copies.
- Keeping the lesson row from mutating the lesson object.

## Data-flow diagram

~~~text
App owns filter and selectedLessonId
           |
           | values and callbacks as props
           v
LessonBrowser
     |                    |
     v                    v
FilterSelect          LessonList
value + callback       lesson data + callback
                            |
                            v
                       LessonRow
                    lesson + selected
                    callback onSelect
~~~

A child invokes a callback to communicate an event or intent. The owner changes its state and renders again with the current value passed down.

## Create the components

~~~jsx
// src/App.jsx
import { useState } from "react";
import "./App.css";

const courseLessons = [
    {
        id: "components",
        title: "Components and composition",
        category: "react",
        durationMinutes: 22,
        completed: true
    },
    {
        id: "props",
        title: "Props and one-way data flow",
        category: "react",
        durationMinutes: 26,
        completed: false
    },
    {
        id: "events",
        title: "Events and state updates",
        category: "react",
        durationMinutes: 30,
        completed: false
    },
    {
        id: "express",
        title: "Build an Express API",
        category: "server",
        durationMinutes: 34,
        completed: false
    }
];

function FilterSelect({ value, onValueChange }) {
    return (
        <label className="filter-control">
            <span>Show lessons</span>
            <select
                value={value}
                onChange={event => onValueChange(event.target.value)}
            >
                <option value="all">All lessons</option>
                <option value="react">React lessons</option>
                <option value="server">Server lessons</option>
            </select>
        </label>
    );
}

function LessonRow({ lesson, isSelected, onSelect }) {
    return (
        <li className="lesson-list-item">
            <button
                className={isSelected ? "lesson-button selected" : "lesson-button"}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onSelect(lesson.id)}
            >
                <span className="lesson-title">{lesson.title}</span>
                <span className="lesson-meta">
                    {lesson.durationMinutes} minutes
                    {lesson.completed ? " · Complete" : " · Not complete"}
                </span>
            </button>
        </li>
    );
}

function LessonList({ lessons, selectedLessonId, onLessonSelect }) {
    if (lessons.length === 0) {
        return <p role="status">No lessons match this filter.</p>;
    }

    return (
        <ul className="lesson-list">
            {lessons.map(lesson => (
                <LessonRow
                    key={lesson.id}
                    lesson={lesson}
                    isSelected={lesson.id === selectedLessonId}
                    onSelect={onLessonSelect}
                />
            ))}
        </ul>
    );
}

function LessonDetails({ lesson }) {
    if (!lesson) {
        return (
            <section className="details-panel" aria-live="polite">
                <h2>Lesson details</h2>
                <p>Select a lesson to see its details.</p>
            </section>
        );
    }

    return (
        <section className="details-panel" aria-live="polite">
            <p className="eyebrow">Selected lesson</p>
            <h2>{lesson.title}</h2>
            <dl>
                <div>
                    <dt>Category</dt>
                    <dd>{lesson.category}</dd>
                </div>
                <div>
                    <dt>Duration</dt>
                    <dd>{lesson.durationMinutes} minutes</dd>
                </div>
                <div>
                    <dt>Status</dt>
                    <dd>{lesson.completed ? "Complete" : "Not complete"}</dd>
                </div>
            </dl>
        </section>
    );
}

function LessonBrowser({
    filter,
    onFilterChange,
    lessons,
    selectedLessonId,
    onLessonSelect,
    selectedLesson
}) {
    return (
        <main className="lesson-browser">
            <header className="page-heading">
                <p className="eyebrow">MERN learning notes</p>
                <h1>Course lessons</h1>
                <p>Choose a filter, then select a lesson to inspect it.</p>
            </header>

            <FilterSelect
                value={filter}
                onValueChange={onFilterChange}
            />

            <div className="browser-layout">
                <section aria-labelledby="lessons-heading">
                    <h2 id="lessons-heading">Available lessons</h2>
                    <p className="result-count">
                        {lessons.length} lessons shown
                    </p>
                    <LessonList
                        lessons={lessons}
                        selectedLessonId={selectedLessonId}
                        onLessonSelect={onLessonSelect}
                    />
                </section>

                <LessonDetails lesson={selectedLesson} />
            </div>
        </main>
    );
}

export default function App() {
    const [filter, setFilter] = useState("all");
    const [selectedLessonId, setSelectedLessonId] = useState(null);

    const visibleLessons = courseLessons.filter(lesson => {
        return filter === "all" || lesson.category === filter;
    });

    const selectedLesson =
        visibleLessons.find(lesson => lesson.id === selectedLessonId) ?? null;

    function handleLessonSelect(lessonId) {
        setSelectedLessonId(lessonId);
    }

    return (
        <LessonBrowser
            filter={filter}
            onFilterChange={setFilter}
            lessons={visibleLessons}
            selectedLessonId={selectedLessonId}
            onLessonSelect={handleLessonSelect}
            selectedLesson={selectedLesson}
        />
    );
}
~~~

## Add basic styling

~~~css
/* src/App.css */
:root {
    font-family: system-ui, sans-serif;
    color: #172033;
    background: #f3f5f8;
}

* {
    box-sizing: border-box;
}

body {
    margin: 0;
}

button,
select {
    font: inherit;
}

.lesson-browser {
    max-width: 1100px;
    margin: 0 auto;
    padding: 2rem 1.25rem;
}

.page-heading {
    margin-bottom: 1.5rem;
}

.page-heading h1,
.page-heading p {
    margin: 0.35rem 0;
}

.eyebrow {
    color: #53627a;
    font-size: 0.875rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
}

.filter-control {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
    font-weight: 700;
}

.filter-control select {
    min-width: 180px;
    padding: 0.55rem 0.75rem;
    border: 1px solid #aab4c3;
    border-radius: 0.4rem;
    background: #fff;
}

.browser-layout {
    display: grid;
    grid-template-columns: minmax(0, 1.2fr) minmax(260px, 0.8fr);
    gap: 1.25rem;
    align-items: start;
}

.browser-layout > section,
.details-panel {
    padding: 1.25rem;
    border: 1px solid #d6dce7;
    border-radius: 0.75rem;
    background: #fff;
}

.browser-layout h2 {
    margin-top: 0;
}

.result-count,
.lesson-meta {
    color: #53627a;
    font-size: 0.9rem;
}

.lesson-list {
    display: grid;
    gap: 0.6rem;
    margin: 0;
    padding: 0;
    list-style: none;
}

.lesson-button {
    display: grid;
    gap: 0.3rem;
    width: 100%;
    padding: 0.85rem;
    border: 1px solid #d6dce7;
    border-radius: 0.5rem;
    background: #fff;
    text-align: left;
    cursor: pointer;
}

.lesson-button:hover,
.lesson-button:focus-visible {
    border-color: #315fbd;
}

.lesson-button.selected {
    border-color: #315fbd;
    background: #edf3ff;
}

.lesson-title {
    font-weight: 700;
}

.details-panel dl {
    display: grid;
    gap: 0.75rem;
}

.details-panel dl div {
    display: grid;
    grid-template-columns: 100px 1fr;
    gap: 0.75rem;
}

.details-panel dt {
    font-weight: 700;
}

.details-panel dd {
    margin: 0;
}

@media (max-width: 700px) {
    .browser-layout {
        grid-template-columns: 1fr;
    }

    .filter-control {
        align-items: flex-start;
        flex-direction: column;
    }
}
~~~

## How the props move

<code>App</code> owns <code>filter</code> and <code>selectedLessonId</code>. It derives the visible lesson array from the filter, then passes the current values and callback functions to <code>LessonBrowser</code>.

<code>LessonBrowser</code> passes the filter value and callback to <code>FilterSelect</code>. When the user changes the select, <code>FilterSelect</code> calls <code>onValueChange</code>. That callback is <code>setFilter</code>, supplied by the owner. React renders again with the new filter.

The lesson list receives the filtered data, current selected ID, and a callback. Each <code>LessonRow</code> receives one lesson object and its selected status. When a row is clicked, it calls <code>onSelect</code> with the lesson ID. That function eventually calls <code>setSelectedLessonId</code> in <code>App</code>. The owner then passes the updated selected ID and matching lesson back down.

The child components do not edit <code>courseLessons</code>, change props, or reach into <code>App</code>'s state. They render from the inputs they receive and report user choices through callbacks.

## Expected result

The page initially shows four lessons. The filter can narrow the visible list to React lessons or server lessons. Selecting a visible row marks it as selected and shows its category, duration, and completion status in the details panel.

If a filter hides the selected lesson, the detail panel returns to its prompt because the selected lesson is derived from the currently visible list. The selected ID remains owned by the page; choosing a visible lesson updates it.

## Try these changes

1. Add a course lesson with a new ID and category.
2. Add a filter option for the new category.
3. Add a new detail field and pass it through the existing lesson object.
4. Add a clear-selection button in the parent and pass a callback to a child that needs it.
5. Move the completed-count calculation into the parent and pass the count to a small summary component.

## Common mistakes to avoid

- Mutating a lesson object received through a prop.
- Making a row set its own copy of the selected lesson while the page also stores a selected ID.
- Passing the current filter without a callback when the child needs to report a changed selection.
- Expecting <code>onValueChange</code> to execute just because it was passed.
- Copying <code>lessons.length</code> into state even though it can be derived from props.
- Using broad spread syntax to forward every component prop to a DOM element.
- Putting database credentials or direct MongoDB access in this browser-side example.

## Chapter navigation

| Previous chapter | Chapter Q&A | Next chapter |
| --- | --- | --- |
| [064 - Components and composition](../lessons/064-components-and-composition.md) | [Q&A](../qnas/065-props-and-one-way-data-flow.md) | [066 - Events and state updates](../lessons/066-events-and-state-updates.md) |
