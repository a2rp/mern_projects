# 075 - Client-side routing and route layouts

Client-side routing selects a React page from the current URL and changes between pages without requesting a new HTML document for every in-app navigation. The URL remains meaningful: it can identify a page, carry search filters, and support bookmarks, sharing, and browser history.

This chapter uses React Router in declarative mode. In current React Router v7 projects, install <code>react-router</code> and import router APIs from that package. Existing React Router v6 projects commonly import the same APIs from <code>react-router-dom</code>; follow the package and API version already used by the project.

## Learning goals

After this chapter, you should be able to:

- Explain what client-side routing does and what the server still needs to do.
- Set up a browser router and declare route-to-component mappings.
- Use links for navigation and understand browser back and forward.
- Build nested routes and shared layouts with <code>Outlet</code>.
- Add index routes, dynamic path segments, query parameters, and a not-found route.
- Choose between a link and programmatic navigation.
- Keep frontend routes separate from Express API endpoints.
- Diagnose direct-load and refresh failures on a deployed single-page app.

## What routing does

A URL has several parts that can be useful to an application:

~~~text
https://example.test/courses/react?q=hooks#exercises
                       └──────┬──────┘ └─┬─┘ └───┬────┘
                         pathname     search     hash
~~~

The router matches the pathname to a route. A page can read a dynamic part such as <code>react</code>, and use the search string or hash for optional state such as a filter or an in-page section.

A client-side router listens for navigation, updates the browser's history, and renders the matching React route. When a user clicks an in-app router link, the browser does not need to download a fresh HTML document for that transition. The URL still changes, so browser back, forward, refresh, and copy-link behavior remain meaningful.

Client-side routing does not replace the web server. A direct request to <code>/courses/react</code> reaches the server before React starts. For a single-page frontend, the host must serve the app entry document for valid frontend paths. In a MERN application, keep Express API routes such as <code>/api/courses</code> distinct from frontend routes and configure deployment rewrites so API requests continue to reach the API.

## Install and choose a router mode

In a React app using the current React Router v7 package:

~~~bash
npm install react-router
~~~

The declarative mode maps URLs to components and supports navigation, active links, nested routes, and router hooks. React Router also has data and framework modes with additional route data and submission features. This chapter stays with declarative routing so the URL-to-UI model is easy to learn.

Do not add a second router around a project that already has one. Check the app entry point and dependency version first, then use the APIs that match the installed version.

## Set up the browser router

Wrap the part of the React tree that needs routing with one <code>BrowserRouter</code>, usually at the application entry point:

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

<code>BrowserRouter</code> uses the browser History API and produces ordinary path URLs such as <code>/courses</code>. Keep one router instance around the app subtree. Router hooks and links need to render beneath that router.

Some existing projects use the compatibility package and import <code>BrowserRouter</code> from <code>react-router-dom</code>. Do not mix package versions or APIs in one app; check its dependency before copying an import.

## Declare routes

<code>Routes</code> contains the route definitions. Each <code>Route</code> pairs a path pattern with an element:

~~~jsx
import { Route, Routes } from "react-router";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/courses" element={<CourseListPage />} />
      <Route path="/about" element={<AboutPage />} />
    </Routes>
  );
}
~~~

A route matches a URL path and renders the element for the best matching route branch. Paths are case-insensitive by default. React Router ranks route patterns so a more specific route can be preferred over a less specific one.

A route with <code>path="*"</code> can match a URL for which no more specific route matches. Use it for a not-found page.

## Navigate with links

Use <code>Link</code> or <code>NavLink</code> for user-initiated navigation:

~~~jsx
import { Link, NavLink } from "react-router";

function SiteNavigation() {
  return (
    <nav aria-label="Main navigation">
      <NavLink to="/" end>
        Home
      </NavLink>
      <NavLink to="/courses">
        Courses
      </NavLink>
      <Link to="/about">About</Link>
    </nav>
  );
}
~~~

These components render anchor elements and preserve useful browser behaviors such as keyboard activation, opening in a new tab, and copying the destination. <code>NavLink</code> also exposes whether its target is active, which is useful for navigation styling:

~~~jsx
<NavLink
  to="/courses"
  className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
>
  Courses
</NavLink>
~~~

The <code>end</code> prop requests an exact end match for a link such as the home link, so it does not remain active on every path below <code>/</code>.

A normal <code>&lt;a href&gt;</code> is still appropriate for an external site, a file download, or a navigation that should load a new document. For an in-app destination handled by the router, use a router link.

## Nested routes and shared layouts

Many pages share a header, navigation, footer, or feature shell. Put the shared UI in a parent route and render the selected child route with <code>Outlet</code>:

~~~jsx
import { Link, Outlet } from "react-router";

function AppLayout() {
  return (
    <>
      <header>
        <Link to="/">Learning Hub</Link>
        <nav aria-label="Main navigation">
          <Link to="/courses">Courses</Link>
          <Link to="/about">About</Link>
        </nav>
      </header>

      <main>
        <Outlet />
      </main>

      <footer>Personal learning workspace</footer>
    </>
  );
}
~~~

~~~jsx
<Routes>
  <Route element={<AppLayout />}>
    <Route index element={<HomePage />} />
    <Route path="courses" element={<CourseLayout />}>
      <Route index element={<CourseListPage />} />
      <Route path=":courseId" element={<CourseDetailPage />} />
    </Route>
    <Route path="about" element={<AboutPage />} />
    <Route path="*" element={<NotFoundPage />} />
  </Route>
</Routes>
~~~

Child paths are relative to their parent route. The route tree above matches <code>/</code>, <code>/courses</code>, <code>/courses/:courseId</code>, and <code>/about</code>. A child route renders inside the nearest parent route's <code>Outlet</code>. If a layout forgets to render an <code>Outlet</code>, its child route has nowhere to appear.

A pathless route can provide a layout without adding a URL segment. An index route uses its parent's path and acts as the default child for that path. An index route has no path of its own and cannot contain child routes.

## Dynamic path segments

Use a colon-prefixed segment for a value that varies by URL:

~~~jsx
<Route path="courses/:courseId" element={<CourseDetailPage />} />
~~~

Read the matched value with <code>useParams</code>:

~~~jsx
import { useParams } from "react-router";

function CourseDetailPage() {
  const { courseId } = useParams();

  return <h1>Course: {courseId}</h1>;
}
~~~

Route parameters are strings and can be absent depending on the route and component typing. Validate or look up a parameter before using it as a database identifier. A route match does not prove that a record exists or that the current user may access it.

A browser route parameter is not an authorization check. The Express API must validate the requested resource and the user's permissions independently.

## Query parameters

Use query parameters for shareable, optional view state such as search text, sort order, or a selected tab:

~~~text
/courses?q=react&sort=title
~~~

Read and update the query string with <code>useSearchParams</code>:

~~~jsx
import { useSearchParams } from "react-router";

function CourseListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") ?? "";

  function handleQueryChange(event) {
    const nextParams = new URLSearchParams(searchParams);
    const nextQuery = event.target.value;

    if (nextQuery) {
      nextParams.set("q", nextQuery);
    } else {
      nextParams.delete("q");
    }

    setSearchParams(nextParams);
  }

  return (
    <label>
      Search courses
      <input value={query} onChange={handleQueryChange} />
    </label>
  );
}
~~~

Updating the search parameters performs a navigation and changes the URL. This makes the filter bookmarkable and shareable. Avoid changing the returned <code>URLSearchParams</code> object without calling the setter; the URL and rendered UI should stay in sync.

Do not put secrets or sensitive personal data in a URL. URLs can appear in browser history, logs, screenshots, and shared links.

## Programmatic navigation

Most navigation should use a visible link. Use <code>useNavigate</code> when navigation follows an action or a decision rather than a user selecting a destination link:

~~~jsx
import { useNavigate } from "react-router";

function SaveCourseButton({ courseId }) {
  const navigate = useNavigate();

  async function handleSave() {
    await saveCourse(courseId);
    navigate("/courses/" + courseId);
  }

  return <button onClick={handleSave}>Save course</button>;
}
~~~

Programmatic navigation is appropriate after a successful form submission, after completing a workflow step, or when handling a conditional redirect in component code. Avoid using it as a substitute for ordinary links because links provide destination affordances and native browser behavior.

Navigation normally adds a history entry. Pass <code>{ replace: true }</code> as the second argument to replace the current entry when that better matches the workflow, such as redirecting after an authentication transition. Do not assume browser history is a secure or persistent application database.

## Not-found pages and route errors

Include an explicit not-found route so an unknown frontend URL gets a helpful page:

~~~jsx
<Route path="*" element={<NotFoundPage />} />
~~~

A route can also match a parameterized path while the corresponding data record does not exist. The page must handle that case too, such as displaying “Course not found” when lookup by <code>courseId</code> fails.

In declarative mode, handle expected loading, empty, and failure states in the page components that fetch or derive the data. Data and framework modes provide additional route error-boundary APIs; use those when the project has adopted those modes.

## Frontend routes and MERN API routes

The browser router and the Express server answer different kinds of requests:

- <code>/courses/react</code> is a frontend route. The React app decides which page to render.
- <code>/api/courses/react</code> is an API route. Express should return data or an API error.
- <code>/api/auth/session</code> is also an API route, even if it relates to a page.

For an SPA deployment, configure the frontend host to return the app entry document for frontend paths. Configure Express or the reverse proxy to send API paths to the backend. Ensure the frontend fallback does not turn a missing API endpoint into an HTML document.

When frontend and API are served from different origins, also account for the API's CORS and authentication configuration. Client-side routing does not configure those server policies.

## Direct loads, refreshes, and deployment

In development, the build tool commonly serves the app entry point for unknown paths. Production static hosts may need an explicit rewrite or fallback rule. Without one, in-app navigation can work while refreshing <code>/courses/react</code> returns a server 404.

A deployment checklist:

- Verify that the frontend build is served for valid frontend route paths.
- Keep API prefixes such as <code>/api</code> routed to the backend.
- Test loading a nested route directly in a new tab.
- Test refreshing that nested route.
- Test browser back and forward.
- Test a genuinely unknown path and a valid path with a missing record.
- Use a hash-based strategy only when the hosting environment cannot be configured for path fallbacks and the URL trade-off is acceptable.

## Common mistakes

- Rendering a router link outside a router provider.
- Nesting multiple browser routers around one app tree.
- Using a plain anchor for every internal page link and causing full document reloads.
- Using a router link for an external destination.
- Forgetting <code>Outlet</code> in a parent layout.
- Giving a nested child a path that repeats the parent's prefix unnecessarily.
- Treating <code>index</code> as a path string or giving it child routes.
- Assuming a route parameter proves that a database record exists or is authorized.
- Storing sensitive data in the URL.
- Expecting React Router to replace Express API routing or server authorization.
- Forgetting the production frontend fallback, so refreshes on nested routes fail.
- Letting an SPA fallback serve <code>index.html</code> for API paths.

## Chapter checklist

Before shipping client-side routes:

- Choose the router package and APIs that match the installed version.
- Wrap the routed UI in one browser router.
- Keep route paths and nested layouts easy to scan.
- Render child pages through <code>Outlet</code>.
- Use links for user choices and programmatic navigation for action outcomes.
- Validate path parameters and keep API authorization on the server.
- Keep bookmarkable filters in search parameters when useful.
- Add not-found and missing-record states.
- Configure and test production fallback behavior without swallowing API routes.

## Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [074 - Context and shared application state](074-context-and-shared-application-state.md) | [Q&A](../qnas/075-client-side-routing-and-route-layouts.md) | [Example](../examples/075-client-side-routing-and-route-layouts.md) | [076 - Fetch data from an API](076-fetch-data-from-an-api.md) |
