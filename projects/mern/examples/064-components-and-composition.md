# 064 - Components and composition: example

This example builds a small course dashboard by composing a page layout, navigation, reusable panels, and lesson rows. It demonstrates component boundaries, named layout slots, <code>children</code>, file organization, and stable list keys.

The code is educational material and is not run. Place the files in the Vite React app created in the tooling chapter, then render <code>App</code> from the app entry. The example uses local data only; it does not make API or database requests.

## What the example demonstrates

- A page assembled from smaller components with clear responsibilities.
- A layout with explicit <code>header</code> and <code>sidebar</code> slots.
- A reusable panel that renders caller-provided content through <code>children</code>.
- A lesson list where each rendered row has a stable data ID as its key.
- Passing a needed identifier as a normal prop instead of expecting it from <code>key</code>.
- Keeping UI composition in the browser and database access on the server.

## Component tree

~~~text
App
└── PageLayout
    ├── SiteHeader
    ├── CourseNavigation
    └── main
        ├── Panel (overview)
        └── Panel (lessons)
            └── LessonList
                ├── LessonRow
                ├── LessonRow
                └── LessonRow
~~~

## Create the components

~~~jsx
// src/App.jsx
import "./App.css";

const course = {
    title: "MERN application fundamentals",
    learnerName: "Ashish"
};

const lessons = [
    { id: "jsx", title: "JSX and rendering values", completed: true },
    { id: "components", title: "Components and composition", completed: false },
    { id: "props", title: "Props and one-way data flow", completed: false }
];

function SiteHeader({ courseTitle, learnerName }) {
    return (
        <header className="site-header">
            <p className="eyebrow">Learning notes</p>
            <p className="site-title">{courseTitle}</p>
            <p className="learner-name">Learner: {learnerName}</p>
        </header>
    );
}

function CourseNavigation() {
    return (
        <nav aria-label="Course navigation">
            <h2>On this page</h2>
            <ul>
                <li><a href="#overview">Overview</a></li>
                <li><a href="#lessons">Lessons</a></li>
            </ul>
        </nav>
    );
}

function PageLayout({ header, sidebar, children }) {
    return (
        <>
            {header}
            <div className="page-layout">
                <aside className="sidebar">{sidebar}</aside>
                <main className="page-main">{children}</main>
            </div>
        </>
    );
}

function Panel({ title, titleId, children }) {
    return (
        <section className="panel" aria-labelledby={titleId}>
            <h2 id={titleId}>{title}</h2>
            {children}
        </section>
    );
}

function LessonRow({ lessonId, title, completed }) {
    return (
        <li
            className="lesson-row"
            id={"lesson-" + lessonId}
            data-lesson-id={lessonId}
        >
            <span>{title}</span>
            <span className={completed ? "status complete" : "status"}>
                {completed ? "Complete" : "Not started"}
            </span>
        </li>
    );
}

function LessonList({ lessons }) {
    return (
        <ul className="lesson-list">
            {lessons.map(lesson => (
                <LessonRow
                    key={lesson.id}
                    lessonId={lesson.id}
                    title={lesson.title}
                    completed={lesson.completed}
                />
            ))}
        </ul>
    );
}

function CourseOverview({ completedCount, totalCount }) {
    return (
        <Panel title="Course overview" titleId="overview-heading">
            <p>
                {completedCount} of {totalCount} lessons complete.
            </p>
            <progress
                value={completedCount}
                max={totalCount}
                aria-label="Course completion"
            />
        </Panel>
    );
}

export default function App() {
    const completedCount = lessons.filter(lesson => lesson.completed).length;

    return (
        <PageLayout
            header={
                <SiteHeader
                    courseTitle={course.title}
                    learnerName={course.learnerName}
                />
            }
            sidebar={<CourseNavigation />}
        >
            <div className="dashboard-content">
                <CourseOverview
                    completedCount={completedCount}
                    totalCount={lessons.length}
                />

                <Panel title="Course lessons" titleId="lessons-heading">
                    <LessonList lessons={lessons} />
                </Panel>
            </div>
        </PageLayout>
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

.site-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 2rem;
    color: #fff;
    background: #172033;
}

.eyebrow,
.site-title,
.learner-name {
    margin: 0;
}

.eyebrow {
    color: #b9c8e5;
}

.site-title {
    flex: 1;
    font-weight: 700;
}

.page-layout {
    display: grid;
    grid-template-columns: 220px minmax(0, 1fr);
    gap: 1.5rem;
    max-width: 1100px;
    margin: 2rem auto;
    padding: 0 1.25rem;
}

.sidebar,
.panel {
    padding: 1.25rem;
    border: 1px solid #d6dce7;
    border-radius: 0.75rem;
    background: #fff;
}

.sidebar h2,
.panel h2 {
    margin-top: 0;
}

.sidebar ul,
.lesson-list {
    padding-left: 1.25rem;
}

.dashboard-content {
    display: grid;
    gap: 1rem;
}

.lesson-row {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.75rem 0;
    border-bottom: 1px solid #e5e8ef;
}

.lesson-row:last-child {
    border-bottom: 0;
}

.status {
    color: #626d80;
}

.status.complete {
    color: #167345;
    font-weight: 700;
}

progress {
    width: 100%;
    height: 0.75rem;
}

@media (max-width: 640px) {
    .site-header {
        flex-wrap: wrap;
        padding: 1rem;
    }

    .page-layout {
        grid-template-columns: 1fr;
        margin-top: 1rem;
    }
}
~~~

## How composition works here

<code>App</code> owns the course data and composes the page. It passes a header element and sidebar element into the corresponding <code>PageLayout</code> slots. The main page content is nested between <code>PageLayout</code>'s tags, so the layout receives it as <code>children</code>.

<code>Panel</code> supplies the common section wrapper and heading, while its caller decides what content appears inside. The overview panel contains progress information; the lessons panel contains a <code>LessonList</code>. <code>LessonList</code> maps the data to <code>LessonRow</code> components.

In the mapping, <code>key={lesson.id}</code> helps React track the row. The row also needs that ID to create its DOM <code>id</code> and <code>data-lesson-id</code> attribute, so the caller separately supplies <code>lessonId={lesson.id}</code>. React does not forward <code>key</code> as a normal component prop.

## Expected result

The page shows a dark course header, a course navigation sidebar, a progress panel with one of three lessons complete, and a lesson panel with three rows. The layout adapts to a single column on narrow screens.

## Try these changes

1. Add a new lesson object with a unique ID and render it without changing <code>LessonList</code>.
2. Mark another lesson as complete and observe how <code>CourseOverview</code> recalculates the count.
3. Add a new named slot such as <code>actions</code> to <code>PageLayout</code>, then render it beside the header.
4. Give the new lesson a stable data ID. Do not use its current array position as the key.
5. Change the content inside one <code>Panel</code> while keeping the shared panel wrapper.

## Common mistakes to avoid

- Renaming a component to lowercase and then using it as a JSX component.
- Reading <code>props.key</code> inside <code>LessonRow</code>; pass <code>lessonId</code> separately as shown.
- Replacing stable IDs with array indexes for a list that may change.
- Putting all layout, navigation, panel, and list markup inside <code>App</code>.
- Making <code>PageLayout</code> search or rewrite arbitrary children instead of accepting explicit slots.
- Adding MongoDB credentials or database queries to this client-side component.

## Chapter navigation

| Previous chapter | Chapter Q&A | Next chapter |
| --- | --- | --- |
| [063 - JSX and rendering values](../lessons/063-jsx-and-rendering-values.md) | [Q&A](../qnas/064-components-and-composition.md) | [065 - Props and one-way data flow](../lessons/065-props-and-one-way-data-flow.md) |

