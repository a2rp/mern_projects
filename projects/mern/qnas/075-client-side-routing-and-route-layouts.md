# 075 - Client-side routing and route layouts: Q&A

These questions review React Router's declarative mode, URL matching, navigation, nested layouts, route parameters, and single-page app deployment.

## Multiple-choice questions

### 1. What does client-side routing primarily do?

- **A.** Replaces the database's query planner
- **B.** Maps the current browser URL to React UI and handles in-app navigation
- **C.** Makes API authorization unnecessary
- **D.** Stores every page in local storage

**Answer: B.** A client-side router matches the browser URL to UI and updates the view during navigation. It does not replace server APIs, authorization, or persistence.

### 2. What does <code>BrowserRouter</code> use for browser navigation?

- **A.** The browser History API
- **B.** MongoDB change streams
- **C.** CSS selectors
- **D.** The Express router directly

**Answer: A.** <code>BrowserRouter</code> uses the browser History API to support path URLs and history navigation.

### 3. In current React Router v7 declarative examples, which package provides <code>BrowserRouter</code> and <code>Routes</code>?

- **A.** <code>react-router</code>
- **B.** <code>express</code>
- **C.** <code>mongodb</code>
- **D.** <code>react-dom/server</code>

**Answer: A.** Current v7 docs use <code>react-router</code>. Many v6 apps import from <code>react-router-dom</code>; use the package that matches the app's installed version.

### 4. What is the purpose of a <code>Route</code> element inside <code>Routes</code>?

- **A.** To define a path pattern and the element rendered for a match
- **B.** To define an Express middleware function
- **C.** To create a MongoDB collection
- **D.** To replace every React component

**Answer: A.** Declarative routes couple URL patterns with UI elements.

### 5. Which component should generally be used for an in-app destination handled by React Router?

- **A.** <code>Link</code>
- **B.** A button with no accessible name
- **C.** An image with an <code>onclick</code> string
- **D.** A form that always posts the full page

**Answer: A.** <code>Link</code> provides an anchor destination while letting the router handle client-side navigation.

### 6. What does <code>NavLink</code> add over <code>Link</code>?

- **A.** Automatic database access
- **B.** Active-state information useful for navigation styling
- **C.** Express authentication
- **D.** A server fallback rewrite

**Answer: B.** <code>NavLink</code> can expose whether its target is active, which is useful for selected navigation styling.

### 7. What does <code>Outlet</code> do in a parent route component?

- **A.** Renders the matched child route at that location
- **B.** Clears the browser history
- **C.** Sends a request to MongoDB
- **D.** Converts a route parameter to a number

**Answer: A.** A nested child renders through the nearest parent route's <code>Outlet</code>. Without one, the child page has no location in that layout.

### 8. What is an index route?

- **A.** A route that renders at its parent's path as the default child
- **B.** A route whose path is the word <code>index</code>
- **C.** A database index
- **D.** A route that must always be the last route

**Answer: A.** An index route has no path of its own and renders at the parent route's URL. It cannot have children.

### 9. What does a pathless parent route commonly provide?

- **A.** A shared layout without adding a URL segment
- **B.** A persistent browser cookie
- **C.** A route that matches only API calls
- **D.** A new browser tab

**Answer: A.** A route without a path can add layout nesting for its children without changing their URLs.

### 10. What does <code>:courseId</code> mean in a route path?

- **A.** A dynamic URL segment whose value can be read from route params
- **B.** A literal course id that React fills in automatically
- **C.** A query parameter
- **D.** An Express route handler

**Answer: A.** A colon-prefixed segment is dynamic. <code>useParams</code> can read the matched string value.

### 11. What is the type of a route parameter returned by <code>useParams</code> in a browser URL?

- **A.** Always a MongoDB document
- **B.** A string value, potentially absent depending on the route
- **C.** A number automatically parsed from the URL
- **D.** A React element

**Answer: B.** URL segments are strings. Validate them and look up the corresponding record; do not assume a match means a record exists.

### 12. What is a good use for query parameters such as <code>?q=react</code>?

- **A.** Shareable or bookmarkable filters and view state
- **B.** Storing passwords
- **C.** Authorizing API calls without a server
- **D.** Defining React component names

**Answer: A.** Search parameters are useful for optional view state that should be reflected in the URL. They are visible and should not contain secrets.

### 13. Which hook reads and updates search parameters in declarative React Router?

- **A.** <code>useSearchParams</code>
- **B.** <code>useReducerParams</code>
- **C.** <code>useMongoQuery</code>
- **D.** <code>useRouteCSS</code>

**Answer: A.** <code>useSearchParams</code> returns the current URL search parameters and a setter that navigates to the updated query string.

### 14. When is <code>useNavigate</code> generally a better fit than a visible link?

- **A.** When a successful action should take the user to another route
- **B.** Whenever text needs to be bold
- **C.** For every navigation item in the main menu
- **D.** To validate a MongoDB schema

**Answer: A.** Use programmatic navigation when a workflow action or conditional outcome triggers navigation. Prefer links for user-selected destinations.

### 15. What does a route with <code>path="*"</code> commonly handle?

- **A.** Frontend URLs that do not match a more specific route
- **B.** Every request sent to the Express API
- **C.** Every browser tab
- **D.** Only static images

**Answer: A.** A wildcard route is useful for a frontend not-found page. It does not configure the production web server's fallback.

### 16. Why can clicking an in-app link work while refreshing that same nested URL fails in production?

- **A.** The deployment server may not serve the SPA entry document for that path
- **B.** React automatically deletes the route after a click
- **C.** MongoDB rejects the browser's refresh
- **D.** The browser History API cannot update a URL

**Answer: A.** In-app routing can work after the app is loaded, but a direct request first reaches the server. Configure a frontend fallback for valid frontend paths.

### 17. In a MERN deployment, what should happen to a request for <code>/api/courses</code>?

- **A.** It should be handled by the API server or proxy route
- **B.** It should always return the frontend's <code>index.html</code>
- **C.** It should become a React index route
- **D.** It should be stored in the browser history only

**Answer: A.** API paths must remain routed to Express or the configured API service. The SPA fallback should not swallow API requests.

### 18. Does a route match for <code>/courses/:courseId</code> prove the user may read that course?

- **A.** Yes, a matching URL is authorization
- **B.** No; the API must validate the resource and authorization independently
- **C.** Yes, if the segment contains a MongoDB id
- **D.** No, because route parameters are always numbers

**Answer: B.** Frontend routing controls which UI is rendered, not server security. Enforce access rules at the API or server boundary.

### 19. Which is usually appropriate for a link to an external website?

- **A.** A normal anchor element
- **B.** A nested route's <code>Outlet</code>
- **C.** An Express API parameter
- **D.** A pathless route

**Answer: A.** Router links are for destinations managed by the client router. Normal anchors are appropriate for external destinations or full-document navigation.

### 20. What is the main risk of placing sensitive information in a URL query string?

- **A.** It can appear in history, logs, screenshots, and shared links
- **B.** The URL automatically encrypts it
- **C.** The router stores it only in server memory
- **D.** Search parameters cannot contain text

**Answer: A.** URLs are visible and can be copied or recorded. Do not put secrets or sensitive personal data in them.

## Short-answer questions

### 21. Explain the difference between a frontend route and an API route in a MERN app.

**Answer:** A frontend route, such as <code>/courses/react</code>, selects React UI. An API route, such as <code>/api/courses/react</code>, is handled by Express and returns data or an API response. Deployment must send each class of path to the correct handler.

### 22. Why should a routed app usually have one <code>BrowserRouter</code> around its routed subtree?

**Answer:** Router links and hooks need router context. One browser router gives the app one consistent location and history state. Nesting multiple browser routers around the same application subtree causes confusing or invalid routing boundaries.

### 23. What happens if a parent route component does not render <code>Outlet</code>?

**Answer:** Its matched child route has nowhere to render within that parent layout. Add <code>Outlet</code> at the position where the child page should appear.

### 24. How is a path parameter different from a search parameter?

**Answer:** A path parameter is part of the route pattern, such as <code>:courseId</code> in <code>/courses/:courseId</code>, and typically identifies the resource being viewed. A search parameter follows <code>?</code>, such as <code>?q=react</code>, and commonly holds optional filters or view state.

### 25. What is the purpose of a not-found route, and what does it not solve?

**Answer:** A wildcard route can render a helpful UI for unknown frontend paths after the app is running. It does not configure the production server to serve the SPA document for a direct request or refresh.

### 26. When should a route use <code>index</code> rather than a child path?

**Answer:** Use an index route when the parent URL itself should show a default child page. For a distinct child URL, give the child a path.

### 27. Why are links usually preferable to programmatic navigation for a main menu?

**Answer:** A link communicates its destination and preserves native anchor behaviors such as keyboard activation, opening in a new tab, and copying the destination. Programmatic navigation is better for action outcomes rather than ordinary destination selection.

### 28. What validation should happen after reading an id from <code>useParams</code>?

**Answer:** Validate the string's format as needed, look up the corresponding record, and handle a missing record. The API must also enforce authorization for protected data.

### 29. What production behavior should be tested for a deployed SPA?

**Answer:** Open a nested frontend route directly in a new tab, refresh it, use back and forward, visit an unknown path, and confirm that API paths still reach the API rather than the SPA fallback.

### 30. Why should the app avoid putting a password or access token in a query parameter?

**Answer:** URLs can be saved in browser history, sent to logs, shown in screenshots, or copied into messages. Sensitive credentials should use appropriate secure mechanisms and should not be exposed in a shareable URL.

## Applied questions

### 31. A site header should remain visible on Home, Courses, and About pages. How would you structure the routes?

**Answer:** Make a parent route render the shared header and an <code>Outlet</code>. Put index, courses, and about routes beneath it. Each child page then renders within the same shell.

~~~jsx
<Routes>
  <Route element={<SiteLayout />}>
    <Route index element={<HomePage />} />
    <Route path="courses" element={<CoursesPage />} />
    <Route path="about" element={<AboutPage />} />
  </Route>
</Routes>
~~~

### 32. A nested course route is declared as <code>path="courses"</code> beneath a parent route whose path is already <code>courses</code>. What is the likely problem?

**Answer:** The parent path is automatically included in child paths, so repeating it can create an unintended URL such as <code>/courses/courses</code>. Use a relative child path such as <code>:courseId</code> or an index route, depending on the desired URL.

### 33. Build the route and component read for a course id in <code>/courses/react</code>.

**Answer:**

~~~jsx
<Route path="courses/:courseId" element={<CourseDetailPage />} />
~~~

~~~jsx
function CourseDetailPage() {
  const { courseId } = useParams();
  return <h1>Course: {courseId}</h1>;
}
~~~

The value is a URL string. A real page should look up the course and handle an unknown id.

### 34. A course list's search box should be shareable in the URL as <code>?q=react</code>. Which API should it use and why?

**Answer:** Use <code>useSearchParams</code> to read <code>q</code> and set a new search parameter when the input changes. The updated query string becomes part of the URL, so the filter can be bookmarked and shared.

### 35. A form should navigate to the saved course's page only after the API confirms success. Which navigation approach fits?

**Answer:** Handle the submit event, await the API result, then call <code>navigate</code> to the saved course route after success. If the user is choosing a destination directly, render a <code>Link</code> instead.

### 36. Clicking a course link shows the detail page, but opening the detail URL directly returns a server 404. What should be fixed?

**Answer:** Configure the frontend host or web server to serve the SPA entry document for valid frontend paths. Keep the API route handling separate so a request under <code>/api</code> still goes to Express.

### 37. A page component reads a valid course id from the route, but the database has no matching course. What should the UI do?

**Answer:** Handle the missing record explicitly, such as rendering a course-not-found message or a not-found page. A matched route only means the URL pattern matched; it does not prove the data exists.

### 38. A developer uses <code>&lt;a href="/courses"&gt;</code> for every internal menu item. What behavior may result, and what should they use instead?

**Answer:** The browser may perform a full document navigation for each click. Use React Router's <code>Link</code> or <code>NavLink</code> for routes handled by the client router.

### 39. An unknown frontend path displays the React not-found page locally, but a production refresh gives a 404 before the React app appears. Why?

**Answer:** The wildcard route only runs after the SPA document has loaded. The deployment server needs a fallback that serves the app entry document for frontend paths; then the router can render its not-found UI.

### 40. A developer hides an admin link in React and assumes the API is protected. What must also be done?

**Answer:** Enforce authentication and authorization on the server/API for every protected operation. Hiding a link or guarding a React route only changes the UI and can be bypassed by making a direct API request.

## Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [074 - Context and shared application state](../lessons/074-context-and-shared-application-state.md) | [Lesson](../lessons/075-client-side-routing-and-route-layouts.md) | [Example](../examples/075-client-side-routing-and-route-layouts.md) | [076 - Fetch data from an API](../lessons/076-fetch-data-from-an-api.md) |
