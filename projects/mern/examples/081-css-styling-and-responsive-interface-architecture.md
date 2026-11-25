# 081 - CSS styling and responsive interface architecture: example

This example builds a responsive React course dashboard. It uses global design tokens, one page stylesheet, a CSS Module for a reusable course card, fluid Grid layout, a container query, and a small runtime style value for course progress.

The starting layout works in normal document flow. Wider layouts are added where the content benefits from another column. The card changes based on the space it receives, so the same component can fit in different page regions.

## What you will build

- A React dashboard with a small course list.
- Shared CSS tokens and predictable global styles.
- Page-level layout rules in a regular CSS file.
- Component-specific rules in a CSS Module.
- A fluid course grid using Grid and intrinsic sizing.
- A card layout that uses a container query.
- Accessible progress indicators and visible keyboard focus.
- Responsive and reduced-motion styles.

## File structure

~~~text
client/src/
├── components/
│   ├── CourseCard.jsx
│   └── CourseCard.module.css
├── data/
│   └── courses.js
├── pages/
│   ├── CourseDashboard.jsx
│   └── CourseDashboard.css
├── styles/
│   ├── tokens.css
│   └── global.css
├── App.jsx
└── main.jsx
~~~

This example uses Vite-style CSS Module imports and React Router. Keep the organization consistent with the build system already used by your project.

## 1. Define shared design tokens

Create <code>client/src/styles/tokens.css</code>:

~~~css
:root {
  color-scheme: light;

  --color-text: #172033;
  --color-muted: #4d5b70;
  --color-page: #f4f6fa;
  --color-surface: #fff;
  --color-surface-subtle: #eaf0f7;
  --color-border: #ccd4df;
  --color-brand: #155eef;
  --color-brand-dark: #1049bb;
  --color-success: #176b45;
  --color-track: #d9e1ec;

  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.25rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-10: 2.5rem;

  --content-width: 76rem;
  --radius-control: 0.4rem;
  --radius-card: 0.8rem;
  --shadow-card: 0 0.6rem 1.8rem rgb(23 32 51 / 7%);
}
~~~

These variables represent shared roles and spacing decisions. A one-off margin does not need a token unless the project intentionally standardizes it.

## 2. Add global styles

Create <code>client/src/styles/global.css</code>:

~~~css
*,
*::before,
*::after {
  box-sizing: border-box;
}

html {
  background: var(--color-page);
  color: var(--color-text);
  font-family: system-ui, sans-serif;
  line-height: 1.5;
}

body {
  min-width: 0;
  margin: 0;
}

img,
svg,
video {
  max-width: 100%;
}

button,
input,
select,
textarea {
  font: inherit;
}

a {
  color: var(--color-brand-dark);
  text-underline-offset: 0.16em;
}

a:hover {
  text-decoration-thickness: 0.15em;
}

:focus-visible {
  outline: 3px solid var(--color-brand);
  outline-offset: 3px;
}

.skip-link {
  position: absolute;
  inset-block-start: var(--space-2);
  inset-inline-start: var(--space-2);
  z-index: 10;
  padding: var(--space-3) var(--space-4);
  transform: translateY(-180%);
  border-radius: var(--radius-control);
  background: #14213d;
  color: #fff;
}

.skip-link:focus {
  transform: translateY(0);
}

button {
  min-height: 2.75rem;
  padding: var(--space-2) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  background: var(--color-surface);
  color: var(--color-text);
  cursor: pointer;
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
~~~

Import tokens before global styles so variables exist when the global rules are evaluated.

## 3. Add sample data

Create <code>client/src/data/courses.js</code>:

~~~js
export const courses = [
  {
    id: "react-foundations",
    title: "React foundations",
    category: "Frontend",
    description: "Build interfaces from components, props, state, and events.",
    progress: 72,
    updatedLabel: "Updated today",
  },
  {
    id: "express-apis",
    title: "Express APIs",
    category: "Backend",
    description: "Design routes, validate requests, and return useful responses.",
    progress: 38,
    updatedLabel: "Updated yesterday",
  },
  {
    id: "mongodb-modeling",
    title: "MongoDB data modeling",
    category: "Database",
    description: "Model documents and query application data safely.",
    progress: 16,
    updatedLabel: "Updated this week",
  },
  {
    id: "ship-mern-app",
    title: "Ship a MERN application",
    category: "Full stack",
    description: "Connect the client, API, database, and production workflow.",
    progress: 0,
    updatedLabel: "Not started",
  },
];
~~~

In a real dashboard, this data would come from an API. Keep presentation concerns such as progress text in the component, and keep the API’s validation and authorization on the server.

## 4. Build a reusable course card

Create <code>client/src/components/CourseCard.jsx</code>:

~~~jsx
import { Link } from "react-router-dom";
import styles from "./CourseCard.module.css";

export function CourseCard({ course }) {
  const progress = Math.min(100, Math.max(0, course.progress));

  return (
    <article className={styles.card}>
      <div className={styles.content}>
        <div className={styles.heading}>
          <p className={styles.category}>{course.category}</p>
          <h3 className={styles.title}>{course.title}</h3>
          <p className={styles.description}>{course.description}</p>
        </div>

        <div className={styles.progressGroup}>
          <div className={styles.progressLabels}>
            <span>Progress</span>
            <span>{progress}%</span>
          </div>

          <div
            className={styles.progressTrack}
            role="progressbar"
            aria-label={course.title + " progress"}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
          >
            <span
              className={styles.progressValue}
              style={{ width: progress + "%" }}
            />
          </div>
        </div>

        <div className={styles.footer}>
          <p className={styles.updated}>{course.updatedLabel}</p>
          <Link className={styles.action} to={"/courses/" + course.id}>
            Continue <span className={styles.visuallyHidden}>{course.title}</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
~~~

The percentage is a data-driven value, so it is passed as a small inline width. All layout, colors, and progress-track styles remain in the CSS Module. The semantic progressbar exposes the numeric value and a course-specific accessible name.

## 5. Style the course card with a CSS Module

Create <code>client/src/components/CourseCard.module.css</code>:

~~~css
.card {
  container: course-card / inline-size;
  min-width: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
}

.content {
  display: grid;
  gap: var(--space-5);
  min-width: 0;
  padding: var(--space-5);
}

.heading {
  min-width: 0;
}

.category {
  margin: 0 0 var(--space-2);
  color: var(--color-muted);
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.title {
  margin: 0;
  font-size: 1.25rem;
  line-height: 1.25;
  overflow-wrap: anywhere;
}

.description {
  margin: var(--space-3) 0 0;
  color: var(--color-muted);
}

.progressGroup {
  display: grid;
  gap: var(--space-2);
}

.progressLabels {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
  font-size: 0.9rem;
}

.progressTrack {
  height: 0.65rem;
  overflow: hidden;
  border-radius: 999px;
  background: var(--color-track);
}

.progressValue {
  display: block;
  width: 0;
  height: 100%;
  border-radius: inherit;
  background: var(--color-brand);
}

.footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding-block-start: var(--space-3);
  border-block-start: 1px solid var(--color-border);
}

.updated {
  margin: 0;
  color: var(--color-muted);
  font-size: 0.9rem;
}

.action {
  display: inline-flex;
  min-height: 2.75rem;
  align-items: center;
  border-radius: var(--radius-control);
  font-weight: 700;
}

.action:focus-visible {
  outline: 3px solid var(--color-brand);
  outline-offset: 3px;
}

.visuallyHidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@container course-card (min-width: 34rem) {
  .content {
    grid-template-columns: minmax(0, 1fr) minmax(9rem, 0.55fr);
    align-items: center;
    gap: var(--space-4) var(--space-6);
  }

  .heading {
    grid-row: span 2;
  }

  .progressGroup {
    align-self: end;
  }

  .footer {
    grid-column: 2;
  }
}
~~~

The default card is a single column, which works in a narrow container. When the card itself has enough inline space, its descendants use a two-column arrangement. The named container helps the rule target the intended component boundary.

## 6. Compose the dashboard page

Create <code>client/src/pages/CourseDashboard.jsx</code>:

~~~jsx
import { Link, useParams } from "react-router-dom";
import { CourseCard } from "../components/CourseCard.jsx";
import { courses } from "../data/courses.js";
import "./CourseDashboard.css";

export function CourseDashboard() {
  const activeCourses = courses.filter((course) => course.progress > 0);
  const completedCourses = courses.filter((course) => course.progress === 100);

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="site-header__inner">
          <Link className="brand" to="/">Learning dashboard</Link>
          <Link className="header-action" to="/about">About</Link>
        </div>
      </header>

      <main id="main-content" className="page-container">
        <div className="dashboard-heading">
          <div>
            <p className="eyebrow">Your learning</p>
            <h1>Courses</h1>
            <p className="intro">
              Pick up where you left off or explore a new topic.
            </p>
          </div>

          <Link className="primary-action" to="/about">
            Explore the roadmap
          </Link>
        </div>

        <div className="dashboard-layout">
          <section className="course-section" aria-labelledby="course-list-title">
            <div className="section-heading">
              <div>
                <h2 id="course-list-title">Your courses</h2>
                <p>{courses.length} courses in your library</p>
              </div>
              <label className="sort-control">
                <span>Sort</span>
                <select defaultValue="recent">
                  <option value="recent">Recently updated</option>
                  <option value="title">Title</option>
                  <option value="progress">Progress</option>
                </select>
              </label>
            </div>

            <div className="course-grid">
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          </section>

          <aside className="learning-summary" aria-labelledby="summary-title">
            <h2 id="summary-title">Learning summary</h2>

            <dl className="summary-list">
              <div>
                <dt>In progress</dt>
                <dd>{activeCourses.length}</dd>
              </div>
              <div>
                <dt>Completed</dt>
                <dd>{completedCourses.length}</dd>
              </div>
              <div>
                <dt>Available</dt>
                <dd>{courses.length}</dd>
              </div>
            </dl>

            <p className="summary-note">
              Your progress is a guide. You can revisit any course at any time.
            </p>
          </aside>
        </div>
      </main>

      <footer className="site-footer">
        <div className="page-container">
          <p>Learning dashboard demonstration</p>
        </div>
      </footer>
    </div>
  );
}

export function CourseDetailsPage() {
  const { courseId } = useParams();
  const course = courses.find((item) => item.id === courseId);

  if (!course) {
    return (
      <main id="main-content" className="page-container">
        <h1>Course not found</h1>
        <p>The requested course is not in this demonstration.</p>
        <Link to="/">Return to courses</Link>
      </main>
    );
  }

  return (
    <main id="main-content" className="page-container course-detail">
      <p className="eyebrow">{course.category}</p>
      <h1>{course.title}</h1>
      <p>{course.description}</p>
      <p>Progress: {course.progress}%</p>
      <Link to="/">Return to courses</Link>
    </main>
  );
}

export function AboutPage() {
  return (
    <main id="main-content" className="page-container course-detail">
      <p className="eyebrow">Roadmap</p>
      <h1>About the learning dashboard</h1>
      <p>
        This demonstration shows one way to organize shared, page, and component styles.
      </p>
      <Link to="/">Return to courses</Link>
    </main>
  );
}
~~~

The page owns its larger composition, while each card owns its internal design. The grid uses intrinsic sizing, so the cards adapt before the page adds its sidebar.

## 7. Style the page composition

Create <code>client/src/pages/CourseDashboard.css</code>:

~~~css
.app-shell {
  min-height: 100vh;
}

.page-container {
  width: min(100% - 2rem, var(--content-width));
  margin-inline: auto;
}

.site-header {
  border-block-end: 1px solid var(--color-border);
  background: var(--color-surface);
}

.site-header__inner {
  display: flex;
  width: min(100% - 2rem, var(--content-width));
  min-height: 4rem;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  margin-inline: auto;
}

.brand {
  color: var(--color-text);
  font-weight: 750;
  text-decoration: none;
}

.header-action {
  display: inline-flex;
  min-height: 2.75rem;
  align-items: center;
}

.dashboard-heading {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  justify-content: space-between;
  gap: var(--space-5);
  padding-block: clamp(2rem, 5vw, 3.5rem);
}

.dashboard-heading h1,
.course-detail h1 {
  margin: 0;
  font-size: clamp(2rem, 1.5rem + 2vw, 3rem);
  line-height: 1.1;
}

.eyebrow {
  margin: 0 0 var(--space-2);
  color: var(--color-brand-dark);
  font-size: 0.9rem;
  font-weight: 750;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.intro {
  max-width: 42rem;
  margin: var(--space-3) 0 0;
  color: var(--color-muted);
}

.primary-action {
  display: inline-flex;
  min-height: 2.75rem;
  align-items: center;
  justify-content: center;
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-control);
  background: var(--color-brand);
  color: #fff;
  font-weight: 700;
  text-decoration: none;
}

.primary-action:hover {
  background: var(--color-brand-dark);
}

.dashboard-layout {
  display: grid;
  gap: var(--space-8);
  padding-block-end: var(--space-10);
}

.course-section {
  min-width: 0;
}

.section-heading {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  justify-content: space-between;
  gap: var(--space-4);
  margin-block-end: var(--space-5);
}

.section-heading h2,
.learning-summary h2 {
  margin: 0;
  font-size: 1.25rem;
}

.section-heading p {
  margin: var(--space-1) 0 0;
  color: var(--color-muted);
}

.sort-control {
  display: grid;
  gap: var(--space-1);
  color: var(--color-muted);
  font-size: 0.9rem;
  font-weight: 650;
}

.sort-control select {
  min-height: 2.75rem;
  max-width: 100%;
  padding: var(--space-2) 2rem var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  background: var(--color-surface);
  color: var(--color-text);
}

.course-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 19rem), 1fr));
  align-items: stretch;
  gap: var(--space-5);
}

.learning-summary {
  align-self: start;
  padding: var(--space-5);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  background: var(--color-surface);
}

.summary-list {
  display: grid;
  gap: var(--space-3);
  margin: var(--space-4) 0;
}

.summary-list div {
  display: flex;
  justify-content: space-between;
  gap: var(--space-4);
  padding-block-end: var(--space-3);
  border-block-end: 1px solid var(--color-border);
}

.summary-list dt {
  color: var(--color-muted);
}

.summary-list dd {
  margin: 0;
  font-weight: 750;
}

.summary-note {
  margin: 0;
  color: var(--color-muted);
  font-size: 0.95rem;
}

.site-footer {
  padding-block: var(--space-5);
  border-block-start: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-muted);
}

.site-footer p {
  margin: 0;
}

.course-detail {
  padding-block: var(--space-10);
}

.course-detail > * + * {
  margin-block-start: var(--space-4);
}

@media (min-width: 62rem) {
  .dashboard-layout {
    grid-template-columns: minmax(0, 1fr) 18rem;
    align-items: start;
  }
}

@media (max-width: 34rem) {
  .section-heading {
    align-items: stretch;
  }

  .sort-control,
  .sort-control select {
    width: 100%;
  }

  .primary-action {
    width: 100%;
  }
}
~~~

The main grid begins as one column and adds a summary sidebar when there is enough room. The card list uses <code>auto-fit</code> and a minimum card size, so it chooses a number of columns that fits its own container.

## 8. Add the application entry points

Create <code>client/src/App.jsx</code>:

~~~jsx
import { BrowserRouter, Route, Routes } from "react-router-dom";
import {
  AboutPage,
  CourseDashboard,
  CourseDetailsPage,
} from "./pages/CourseDashboard.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <>
        <a className="skip-link" href="#main-content">
          Skip to main content
        </a>

        <Routes>
          <Route path="/" element={<CourseDashboard />} />
          <Route path="/courses" element={<CourseDashboard />} />
          <Route path="/courses/:courseId" element={<CourseDetailsPage />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </>
    </BrowserRouter>
  );
}
~~~

Create <code>client/src/main.jsx</code>:

~~~jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles/tokens.css";
import "./styles/global.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
~~~

The HTML entry document should include a root element and the viewport declaration:

~~~html
<meta name="viewport" content="width=device-width, initial-scale=1" />
<div id="root"></div>
~~~

A production document also needs its usual character encoding, document title, and other metadata.

## 9. Review the layout at different sizes

1. View the dashboard at a narrow width such as 320px. The page should remain readable without horizontal scrolling.
2. Increase the viewport width gradually. The card grid should add columns when each card still has enough room.
3. Resize a card’s parent without resizing the viewport. Its internal layout should respond to the container query.
4. Zoom to 200%. Confirm that text wraps and controls remain usable.
5. Replace the sample text with a very long course title and description. Confirm that neither breaks the card layout.
6. Tab through links and the sort control. Confirm that the focus outline remains visible.
7. Enable reduced motion in the operating system and confirm non-essential animation is removed or minimized.
8. Temporarily disable the container query in developer tools. The default single-column card should remain understandable.
9. Check the page at a wide viewport. The content should stay constrained and the summary should not become excessively wide.

## Key takeaways

- Design tokens hold shared decisions; component and page files hold styles they own.
- React applies CSS classes with <code>className</code>.
- Grid, Flexbox, and fluid sizing adapt before extra breakpoints are needed.
- Viewport media queries suit page-level changes; container queries suit components.
- Use inline style values only when they are driven by runtime data.
- Keep keyboard focus visible and respect reduced-motion preferences.
- Test long content, zoom, narrow layouts, wide layouts, and component reuse.

## Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [080 - Accessible forms, navigation, and components](../lessons/080-accessible-forms-navigation-and-components.md) | [Lesson](../lessons/081-css-styling-and-responsive-interface-architecture.md) | [Q&A](../qnas/081-css-styling-and-responsive-interface-architecture.md) | [082 - Component tests with React](../lessons/082-component-tests-with-react.md) |