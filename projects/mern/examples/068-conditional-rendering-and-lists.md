# 068 - Conditional rendering and lists: example

This example builds an interactive course catalog. It demonstrates rendering a list from data, filtering that data, stable keys, conditional badges, and distinct loading, error, empty, and result states.

The code is educational material and is not run. Place the files in the Vite React app created in the tooling chapter, then render <code>App</code> from the app entry. The catalog uses local sample data. The status buttons preview UI states; a real application would set those states as its request succeeds or fails.

## What the example demonstrates

- Using <code>map()</code> to render semantic list items from an array.
- Using stable data IDs as keys on the mapped elements.
- Filtering data before mapping it.
- Showing a useful empty result when no items match.
- Using early returns for loading and error states.
- Using a ternary for a small completion-label choice.
- Using explicit booleans for conditional JSX.
- Keeping the filtered list derived instead of duplicating it in state.

## Component tree

~~~text
App owns selectedTrack and previewStatus
├── PageHeader
├── StatusPreviewControls
├── TrackFilter
└── LessonResults
    ├── Loading message, error message, or empty message
    └── ul
        └── LessonCard (one per matching lesson)
~~~

## Create the components

~~~jsx
// src/App.jsx
import { useState } from "react";
import "./App.css";

const lessons = [
    {
        id: "jsx",
        title: "JSX and rendering values",
        track: "React",
        summary: "Describe UI with JavaScript expressions and JSX.",
        completed: true,
        durationMinutes: 24
    },
    {
        id: "components",
        title: "Components and composition",
        track: "React",
        summary: "Compose a page from components with clear responsibilities.",
        completed: true,
        durationMinutes: 22
    },
    {
        id: "props",
        title: "Props and one-way data flow",
        track: "React",
        summary: "Pass data down and report child interactions with callbacks.",
        completed: false,
        durationMinutes: 26
    },
    {
        id: "state",
        title: "useState and state design",
        track: "React",
        summary: "Store changing UI facts and derive values when possible.",
        completed: false,
        durationMinutes: 28
    },
    {
        id: "express-api",
        title: "Build an Express API",
        track: "Server",
        summary: "Create a server endpoint for application data.",
        completed: false,
        durationMinutes: 34
    }
];

function PageHeader() {
    return (
        <header className="page-header">
            <p className="eyebrow">MERN learning notes</p>
            <h1>Course catalog</h1>
            <p>Choose a track to browse the lessons.</p>
        </header>
    );
}

function StatusPreviewControls({ status, onStatusChange }) {
    return (
        <section className="preview-controls" aria-labelledby="preview-heading">
            <h2 id="preview-heading">Preview a result state</h2>
            <div className="button-row">
                <button
                    type="button"
                    aria-pressed={status === "ready"}
                    onClick={() => onStatusChange("ready")}
                >
                    Show lessons
                </button>
                <button
                    type="button"
                    aria-pressed={status === "loading"}
                    onClick={() => onStatusChange("loading")}
                >
                    Preview loading
                </button>
                <button
                    type="button"
                    aria-pressed={status === "error"}
                    onClick={() => onStatusChange("error")}
                >
                    Preview error
                </button>
            </div>
        </section>
    );
}

function TrackFilter({ selectedTrack, onTrackChange }) {
    const tracks = ["All", "React", "Server"];

    return (
        <nav className="track-filter" aria-label="Filter lessons by track">
            {tracks.map(track => (
                <button
                    key={track}
                    type="button"
                    className={selectedTrack === track ? "active" : ""}
                    aria-pressed={selectedTrack === track}
                    onClick={() => onTrackChange(track)}
                >
                    {track}
                </button>
            ))}
        </nav>
    );
}

function LessonCard({ lesson }) {
    return (
        <li className="lesson-card">
            <div className="lesson-card-heading">
                <h3>{lesson.title}</h3>
                <span className={lesson.completed ? "badge complete" : "badge"}>
                    {lesson.completed ? "Complete" : "In progress"}
                </span>
            </div>
            <p>{lesson.summary}</p>
            <p className="lesson-meta">
                {lesson.track} · {lesson.durationMinutes} minutes
            </p>
        </li>
    );
}

function LessonResults({ status, error, lessons }) {
    if (status === "loading") {
        return <p className="notice" role="status">Loading lessons...</p>;
    }

    if (status === "error") {
        return <p className="notice error" role="alert">{error}</p>;
    }

    if (lessons.length === 0) {
        return (
            <p className="notice" role="status">
                No lessons match this track.
            </p>
        );
    }

    return (
        <ul className="lesson-list">
            {lessons.map(lesson => (
                <LessonCard key={lesson.id} lesson={lesson} />
            ))}
        </ul>
    );
}

export default function App() {
    const [selectedTrack, setSelectedTrack] = useState("All");
    const [previewStatus, setPreviewStatus] = useState("ready");

    const visibleLessons = lessons.filter(lesson => {
        return selectedTrack === "All" || lesson.track === selectedTrack;
    });

    const errorMessage = "The lesson catalog could not be loaded.";

    return (
        <main className="catalog">
            <PageHeader />

            <StatusPreviewControls
                status={previewStatus}
                onStatusChange={setPreviewStatus}
            />

            <section className="catalog-section" aria-labelledby="lessons-heading">
                <div className="catalog-heading">
                    <div>
                        <h2 id="lessons-heading">Lessons</h2>
                        {previewStatus === "ready" && visibleLessons.length > 0 && (
                            <p>{visibleLessons.length} lessons shown</p>
                        )}
                    </div>
                    <TrackFilter
                        selectedTrack={selectedTrack}
                        onTrackChange={setSelectedTrack}
                    />
                </div>

                <LessonResults
                    status={previewStatus}
                    error={errorMessage}
                    lessons={visibleLessons}
                />
            </section>
        </main>
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

button {
    font: inherit;
    cursor: pointer;
}

.catalog {
    max-width: 900px;
    margin: 0 auto;
    padding: 2rem 1.25rem;
}

.page-header {
    margin-bottom: 1.5rem;
}

.page-header h1,
.page-header p {
    margin: 0.35rem 0;
}

.eyebrow {
    color: #53627a;
    font-size: 0.875rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
}

.preview-controls,
.catalog-section {
    padding: 1.25rem;
    border: 1px solid #d6dce7;
    border-radius: 0.75rem;
    background: #fff;
}

.preview-controls {
    margin-bottom: 1rem;
}

.preview-controls h2,
.catalog-section h2 {
    margin-top: 0;
}

.button-row,
.track-filter {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.button-row button,
.track-filter button {
    padding: 0.55rem 0.8rem;
    border: 1px solid #aab4c3;
    border-radius: 0.4rem;
    background: #fff;
}

.track-filter button.active {
    border-color: #2457ad;
    color: #fff;
    background: #2457ad;
}

.catalog-heading {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
}

.catalog-heading h2,
.catalog-heading p {
    margin-bottom: 0.3rem;
}

.catalog-heading p,
.lesson-meta {
    color: #53627a;
}

.lesson-list {
    display: grid;
    gap: 0.75rem;
    margin: 0;
    padding: 0;
    list-style: none;
}

.lesson-card {
    padding: 1rem;
    border: 1px solid #e0e5ed;
    border-radius: 0.6rem;
}

.lesson-card h3,
.lesson-card p {
    margin: 0.25rem 0;
}

.lesson-card-heading {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 0.75rem;
}

.badge {
    flex: 0 0 auto;
    padding: 0.25rem 0.5rem;
    border-radius: 999px;
    color: #465267;
    background: #e9edf3;
    font-size: 0.8rem;
}

.badge.complete {
    color: #145c39;
    background: #d8f2e3;
}

.lesson-meta {
    font-size: 0.9rem;
}

.notice {
    padding: 1rem;
    border: 1px dashed #aab4c3;
    border-radius: 0.5rem;
}

.notice.error {
    border-color: #c86c76;
    color: #7e202c;
    background: #fff3f4;
}

@media (max-width: 620px) {
    .catalog-heading {
        align-items: stretch;
        flex-direction: column;
    }

    .lesson-card-heading {
        flex-direction: column;
    }
}
~~~

## How the conditions and list work

<code>App</code> stores the selected track and the preview status. It derives <code>visibleLessons</code> by filtering the source array. When the track changes, React renders again and the filtered data is recalculated.

<code>LessonResults</code> checks the status before rendering the list. It returns a loading message, error message, empty result message, or the successful list. The order makes these states mutually clear. In a real app, the server request would determine whether the status is loading, error, or ready; the preview buttons only make the branches easy to inspect.

When status is ready, each lesson is rendered as a <code>LessonCard</code>. The <code>key</code> uses the stable lesson ID and appears on the component returned directly by <code>map()</code>. The card uses a ternary for its short completion label.

The result count uses an explicit <code>visibleLessons.length &gt; 0</code> boolean condition. If the filter produces no matches, <code>LessonResults</code> displays the empty state instead of rendering a numeric zero.

## Expected result

The page initially shows five lessons and reports five results. Select React or Server to filter the list. The loading and error preview buttons display those branches. Select Show lessons to return to the filtered list. The active filter remains selected when previewing another status.

## Try these changes

1. Add a lesson with a unique ID and observe how it appears in the list.
2. Add a completion filter and derive the matching array before rendering.
3. Change a lesson's completion state and observe its conditional badge.
4. Make an empty search query produce the empty state.
5. Render a heading and description for each lesson using a keyed <code>Fragment</code> instead of a single card wrapper.

## Common mistakes to avoid

- Using a numeric value directly on the left side of <code>&amp;&amp;</code> when it may be zero.
- Putting a nested set of loading, error, empty, and ready ternaries in one expression.
- Returning a block-bodied map callback without JSX.
- Generating keys from indexes or random numbers during render.
- Putting the list key on the filter buttons or outer section instead of the mapped lesson card.
- Expecting <code>lesson.id</code> to be available as <code>props.key</code>.
- Forgetting to show feedback when a filter returns an empty array.
- Storing <code>visibleLessons</code> as separate state even though it is derived from the selected track.
- Using list item elements without a semantic list parent.

## Chapter navigation

| Previous chapter | Chapter Q&A | Next chapter |
| --- | --- | --- |
| [067 - useState and state design](../lessons/067-usestate-and-state-design.md) | [Q&A](../qnas/068-conditional-rendering-and-lists.md) | [069 - Forms and controlled inputs](../lessons/069-forms-and-controlled-inputs.md) |
