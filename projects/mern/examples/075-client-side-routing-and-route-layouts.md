# 075 - Client-side routing and route layouts: example

This small React app demonstrates client-side routes for a learning site. It has a shared application shell, a nested course layout, a searchable course list whose filter is stored in the URL, course detail routes, and a not-found page.

The code uses React Router v7's declarative APIs from <code>react-router</code>. If your project already uses React Router v6, use the compatible imports from its installed <code>react-router-dom</code> package instead of installing a second major version.

## What you will build

- <code>/</code> renders a home page inside a shared site layout.
- <code>/courses</code> renders a searchable course catalog inside a nested course layout.
- <code>/courses/react-router</code> renders a course detail page using a dynamic route parameter.
- <code>/about</code> renders an about page.
- Unknown paths render a friendly not-found page.
- The search box updates <code>?q=...</code> so the current filter can be bookmarked or shared.

## 1. Install the router

In an existing React project:

~~~bash
npm install react-router
~~~

Keep the existing React and build-tool setup. Do not install this package if the project already has a compatible router dependency.

## 2. Wrap the app in BrowserRouter

Update <code>src/main.jsx</code>:

~~~jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
~~~

The router needs to be above every component that uses router links, route components, or router Hooks.

## 3. Add the route tree and pages

Create <code>src/App.jsx</code>:

~~~jsx
import {
  Link,
  NavLink,
  Outlet,
  Route,
  Routes,
  useParams,
  useSearchParams,
} from "react-router";
import "./App.css";

const courses = [
  {
    id: "html",
    title: "HTML foundations",
    level: "Beginner",
    lessons: 18,
    description:
      "Build a strong foundation in document structure, semantic elements, forms, and accessible markup.",
  },
  {
    id: "css",
    title: "CSS layout and styling",
    level: "Beginner",
    lessons: 24,
    description:
      "Learn selectors, the cascade, responsive layouts, and practical visual styling.",
  },
  {
    id: "javascript",
    title: "JavaScript essentials",
    level: "Beginner",
    lessons: 32,
    description:
      "Practice the language fundamentals used to build interactive browser applications.",
  },
  {
    id: "react-router",
    title: "React and client-side routing",
    level: "Intermediate",
    lessons: 16,
    description:
      "Organize a React interface into routes, nested layouts, and shareable URL state.",
  },
];

function AppLayout() {
  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="container header-content">
          <Link className="brand" to="/">
            Learning Hub
          </Link>

          <nav className="main-nav" aria-label="Main navigation">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                isActive ? "nav-link nav-link-active" : "nav-link"
              }
            >
              Home
            </NavLink>
            <NavLink
              to="/courses"
              className={({ isActive }) =>
                isActive ? "nav-link nav-link-active" : "nav-link"
              }
            >
              Courses
            </NavLink>
            <NavLink
              to="/about"
              className={({ isActive }) =>
                isActive ? "nav-link nav-link-active" : "nav-link"
              }
            >
              About
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="container main-content">
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="container">A personal place to keep learning.</div>
      </footer>
    </div>
  );
}

function HomePage() {
  return (
    <section className="hero">
      <p className="eyebrow">Learn by building</p>
      <h1>Make steady progress, one lesson at a time.</h1>
      <p className="hero-copy">
        Browse practical courses and keep the page you are viewing in a URL you
        can return to later.
      </p>
      <Link className="button-link" to="/courses">
        Explore courses
      </Link>
    </section>
  );
}

function CoursesLayout() {
  return (
    <section className="route-section">
      <div className="route-heading">
        <p className="eyebrow">Learning library</p>
        <h1>Courses</h1>
        <p>Search the catalog or open a course to see its details.</p>
      </div>

      <Outlet />
    </section>
  );
}

function CourseListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const normalizedQuery = query.trim().toLowerCase();

  const visibleCourses = courses.filter((course) =>
    course.title.toLowerCase().includes(normalizedQuery)
  );

  function handleSearchChange(event) {
    const nextParams = new URLSearchParams(searchParams);
    const nextQuery = event.target.value;

    if (nextQuery) {
      nextParams.set("q", nextQuery);
    } else {
      nextParams.delete("q");
    }

    setSearchParams(nextParams, { replace: true });
  }

  return (
    <>
      <div className="search-field">
        <label htmlFor="course-search">Search courses</label>
        <input
          id="course-search"
          name="q"
          type="search"
          value={query}
          onChange={handleSearchChange}
          placeholder="Try JavaScript"
        />
      </div>

      {visibleCourses.length > 0 ? (
        <ul className="course-grid">
          {visibleCourses.map((course) => (
            <li className="course-card" key={course.id}>
              <p className="course-level">{course.level}</p>
              <h2>
                <Link to={"/courses/" + course.id}>{course.title}</Link>
              </h2>
              <p className="course-meta">{course.lessons} lessons</p>
              <p className="course-description">{course.description}</p>
              <Link className="text-link" to={"/courses/" + course.id}>
                View course
                <span className="visually-hidden">: {course.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty-state">
          No courses match “{query}”. Try a different search.
        </p>
      )}
    </>
  );
}

function CourseDetailPage() {
  const { courseId } = useParams();
  const course = courses.find((item) => item.id === courseId);

  if (!course) {
    return (
      <div className="empty-state">
        <h2>Course not found</h2>
        <p>There is no course with that address in this catalog.</p>
        <Link className="text-link" to="/courses">
          Return to all courses
        </Link>
      </div>
    );
  }

  return (
    <article className="detail-card">
      <p className="course-level">{course.level}</p>
      <h2>{course.title}</h2>
      <p className="course-meta">{course.lessons} lessons</p>
      <p>{course.description}</p>
      <Link className="text-link" to="/courses">
        Back to all courses
      </Link>
    </article>
  );
}

function AboutPage() {
  return (
    <section className="text-page">
      <p className="eyebrow">About this demo</p>
      <h1>A small example of URL-driven UI</h1>
      <p>
        This frontend uses routes for pages, a nested layout for the course
        section, and a search parameter for the catalog filter.
      </p>
      <p>
        In a MERN application, course data would usually come from an API.
        Express still needs to validate requests and protect private resources.
      </p>
    </section>
  );
}

function NotFoundPage() {
  return (
    <section className="not-found">
      <p className="eyebrow">404</p>
      <h1>That page could not be found.</h1>
      <p>Check the address or return to the learning hub.</p>
      <Link className="button-link" to="/">
        Go to home
      </Link>
    </section>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="courses" element={<CoursesLayout />}>
          <Route index element={<CourseListPage />} />
          <Route path=":courseId" element={<CourseDetailPage />} />
        </Route>
        <Route path="about" element={<AboutPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
~~~

The pathless outer route supplies the site shell without adding a path segment. Its child routes render where <code>AppLayout</code> places <code>Outlet</code>. The course route supplies a second layout, so the catalog and course detail page share the course heading.

The catalog filter is read from the URL, and every search change updates that URL. The update uses <code>replace</code> so each typed character does not create a separate browser-history entry. The course detail page reads its id from the dynamic route segment and handles an unknown id.

## 4. Add the page styles

Create <code>src/App.css</code>:

~~~css
:root {
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
    "Segoe UI", sans-serif;
  color: #17243a;
  background: #f4f7fb;
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

a {
  color: inherit;
}

.site-shell {
  display: flex;
  min-height: 100vh;
  flex-direction: column;
}

.container {
  width: min(100% - 2rem, 1080px);
  margin-inline: auto;
}

.site-header {
  border-bottom: 1px solid #dfe6ef;
  background: #fff;
}

.header-content {
  display: flex;
  min-height: 4.5rem;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
}

.brand {
  color: #1d3b70;
  font-size: 1.1rem;
  font-weight: 800;
  text-decoration: none;
}

.main-nav {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.nav-link {
  padding: 0.55rem 0.8rem;
  border-radius: 0.55rem;
  color: #526174;
  font-size: 0.925rem;
  font-weight: 650;
  text-decoration: none;
}

.nav-link:hover,
.nav-link-active {
  background: #eaf0ff;
  color: #244fb8;
}

.main-content {
  flex: 1;
  padding-block: 3.5rem;
}

.hero,
.text-page,
.not-found {
  max-width: 760px;
  padding-block: 2rem 4rem;
}

.eyebrow {
  margin: 0 0 0.65rem;
  color: #365fd4;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

h1,
h2,
p {
  margin-top: 0;
}

h1 {
  margin-bottom: 0.9rem;
  font-size: clamp(2rem, 5vw, 3.5rem);
  letter-spacing: -0.05em;
  line-height: 1.08;
}

h2 {
  margin-bottom: 0.6rem;
  font-size: 1.35rem;
  letter-spacing: -0.025em;
}

.hero-copy,
.route-heading > p:last-child,
.text-page > p:not(.eyebrow),
.not-found > p:not(.eyebrow) {
  max-width: 42rem;
  color: #58677d;
  font-size: 1.05rem;
  line-height: 1.7;
}

.button-link {
  display: inline-flex;
  min-height: 2.8rem;
  align-items: center;
  justify-content: center;
  margin-top: 0.5rem;
  padding: 0.7rem 1rem;
  border-radius: 0.65rem;
  background: #315bcc;
  color: #fff;
  font-weight: 750;
  text-decoration: none;
}

.button-link:hover {
  background: #2449aa;
}

.route-section {
  display: grid;
  gap: 1.5rem;
}

.route-heading h1 {
  margin-bottom: 0.6rem;
  font-size: clamp(2rem, 4vw, 2.8rem);
}

.route-heading > p:last-child {
  margin-bottom: 0;
  font-size: 1rem;
}

.search-field {
  display: grid;
  max-width: 34rem;
  gap: 0.5rem;
}

.search-field label {
  font-size: 0.9rem;
  font-weight: 750;
}

.search-field input {
  width: 100%;
  min-height: 2.9rem;
  padding: 0.7rem 0.85rem;
  border: 1px solid #cbd5e3;
  border-radius: 0.6rem;
  background: #fff;
  color: #17243a;
  font: inherit;
}

.search-field input:focus-visible,
a:focus-visible {
  outline: 3px solid #8da9ff;
  outline-offset: 3px;
}

.course-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.course-card,
.detail-card {
  padding: 1.35rem;
  border: 1px solid #dfe6ef;
  border-radius: 0.9rem;
  background: #fff;
  box-shadow: 0 10px 30px rgb(35 60 95 / 5%);
}

.course-card h2 a {
  color: #1d3b70;
  text-decoration-thickness: 1px;
  text-underline-offset: 0.2em;
}

.course-level {
  margin-bottom: 0.55rem;
  color: #365fd4;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.course-meta {
  margin-bottom: 0.8rem;
  color: #66758a;
  font-size: 0.9rem;
}

.course-description,
.detail-card > p:not(.course-level, .course-meta) {
  color: #58677d;
  line-height: 1.65;
}

.text-link {
  color: #244fb8;
  font-weight: 750;
  text-underline-offset: 0.2em;
}

.empty-state {
  padding: 1.25rem;
  border: 1px dashed #cbd5e3;
  border-radius: 0.75rem;
  color: #58677d;
}

.detail-card {
  max-width: 680px;
  padding: 1.75rem;
}

.detail-card h2 {
  font-size: 1.8rem;
}

.site-footer {
  padding-block: 1.25rem;
  border-top: 1px solid #dfe6ef;
  background: #fff;
  color: #66758a;
  font-size: 0.9rem;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  clip-path: inset(50%);
}

@media (max-width: 680px) {
  .header-content {
    align-items: flex-start;
    flex-direction: column;
    justify-content: center;
    gap: 0.5rem;
    padding-block: 0.9rem;
  }

  .main-nav {
    width: 100%;
  }

  .nav-link {
    padding-inline: 0.6rem;
  }

  .main-content {
    padding-block: 2rem;
  }

  .course-grid {
    grid-template-columns: 1fr;
  }
}
~~~

## 5. Try the routes

Start the existing React development server, then try these paths:

1. Open <code>/</code> and follow **Explore courses**.
2. Open <code>/courses</code> and search for <code>JavaScript</code>. The URL should include <code>?q=JavaScript</code>.
3. Copy the filtered URL into another tab. The same search should appear.
4. Open **React and client-side routing** and check that its detail page uses the course id from the URL.
5. Change the id in the address bar to an unknown value. The course page should show its missing-record state.
6. Visit <code>/something-that-does-not-exist</code>. The shared header and footer should remain while the not-found page appears.
7. Use browser back and forward to move among visited pages.

## MERN deployment note

This example uses an in-memory list to focus on routing. In a full MERN app, the course pages can fetch data from Express endpoints. Keep the URL spaces distinct, for example:

~~~text
Frontend page: /courses/react-router
API endpoint:  /api/courses/react-router
~~~

Configure the deployed frontend host to serve the SPA entry document for frontend routes, and route <code>/api</code> requests to Express. Test direct loads and refreshes on nested frontend paths after deployment. A React wildcard route only runs after the browser has loaded the app; it does not configure the server fallback.

## Key takeaways

- A parent route can keep shared UI in place while child pages render through <code>Outlet</code>.
- Index routes render at the parent path.
- Dynamic segments identify a route value; query parameters can represent shareable filters.
- Use links for user-selected destinations and programmatic navigation for action outcomes.
- A route match is not a data-existence check or an authorization decision.
- Production must serve the app for frontend paths while preserving API routing.

## Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [074 - Context and shared application state](../lessons/074-context-and-shared-application-state.md) | [Q&A](../qnas/075-client-side-routing-and-route-layouts.md) | [Lesson](../lessons/075-client-side-routing-and-route-layouts.md) | [076 - Fetch data from an API](../lessons/076-fetch-data-from-an-api.md) |
