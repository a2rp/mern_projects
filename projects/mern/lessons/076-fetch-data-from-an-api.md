# 076 - Fetch data from an API

A React frontend and an Express API communicate through HTTP requests. The browser sends a request to an API endpoint, the server validates it and performs the required work, and the frontend processes the response.

This chapter explains the request and response flow, the browser's Fetch API, JSON, status codes, CORS, and how a React component can synchronize with a GET endpoint. The next chapter focuses on how to present loading, error, empty, and success states clearly.

## Learning goals

After this chapter, you should be able to:

- Describe the frontend-to-API request and response cycle.
- Use <code>fetch</code> to make a request and read a JSON response.
- Check HTTP status separately from network and parsing failures.
- Send JSON in a POST request.
- Fetch data in response to component input changes and clean up obsolete requests.
- Explain CORS and configure the API boundary appropriately.
- Distinguish read requests from user-triggered writes.
- Keep API configuration, validation, and authorization in the right place.

## The request and response cycle

A browser request to a MERN API commonly follows this path:

1. A React component or user action needs data.
2. The frontend sends an HTTP request to an API URL.
3. Express matches the route and runs middleware.
4. The server validates inputs and checks access.
5. The server reads or changes data, often through a database layer.
6. Express sends a status code and response body.
7. The frontend checks the response and updates the UI.

For example:

~~~text
GET /api/courses/react
Accept: application/json

200 OK
Content-Type: application/json

{"id":"react","title":"React foundations"}
~~~

The browser and server are separate programs. The frontend can request data, but the server decides what data exists and whether the caller is allowed to access it.

## Fetch a JSON response

The browser provides <code>fetch</code>. A small GET request can look like this:

~~~js
async function getCourses() {
  const response = await fetch("/api/courses", {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Could not load courses. HTTP status: " + response.status);
  }

  return response.json();
}
~~~

There are two asynchronous steps:

- <code>fetch</code> resolves to a <code>Response</code>.
- <code>response.json()</code> reads and parses the response body.

The <code>fetch</code> promise usually rejects for transport-level failures, such as a network error or an aborted request. It does not reject merely because the server returned an HTTP error status such as 404 or 500. Check <code>response.ok</code> or <code>response.status</code> before treating the response as successful.

Parsing JSON can fail too, for example if the server returned HTML or invalid JSON. A 204 No Content response has no JSON body, so do not call <code>response.json()</code> for it.

## HTTP methods and API intent

Common HTTP methods communicate the kind of operation requested:

- <code>GET</code> reads a resource.
- <code>POST</code> submits data, often to create a resource or start an operation.
- <code>PUT</code> replaces a resource representation.
- <code>PATCH</code> updates part of a resource.
- <code>DELETE</code> requests removal of a resource.

The API contract defines exactly what each endpoint accepts and returns. Do not assume every POST creates a database record or every DELETE is immediately permanent; document the behavior of the API you build.

For a POST request containing JSON, specify the media type and serialize the body:

~~~js
async function createCourse(courseInput) {
  const response = await fetch("/api/courses", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(courseInput),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Could not create the course.");
  }

  return result;
}
~~~

Use a GET request for loading data. Send a mutation because of a user action, such as a form submission or button click. Do not put a purchase, create, or delete request in an Effect that runs because a component rendered; a development remount or a later revisit could repeat the action.

## Read a route parameter and fetch its resource

A page can fetch data when the resource identifier changes. The following illustrates the basic React pattern:

~~~jsx
import { useEffect, useState } from "react";

function CoursePage({ courseId }) {
  const [course, setCourse] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadCourse() {
      try {
        setError(null);

        const response = await fetch(
          "/api/courses/" + encodeURIComponent(courseId),
          {
            headers: { Accept: "application/json" },
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error("Course request failed: " + response.status);
        }

        const result = await response.json();
        setCourse(result);
      } catch (requestError) {
        if (requestError.name !== "AbortError") {
          setError(requestError);
        }
      }
    }

    loadCourse();

    return () => {
      controller.abort();
    };
  }, [courseId]);

  if (error) {
    return <p>Could not load the course.</p>;
  }

  if (course === null) {
    return <p>Loading course…</p>;
  }

  return <h1>{course.title}</h1>;
}
~~~

The effect depends on <code>courseId</code>, because that value determines which resource to request. When it changes or the component is removed, cleanup aborts the previous request. This prevents obsolete work from unnecessarily continuing and avoids an older request overwriting a newer result.

The snippet is a teaching baseline. Production data fetching may need caching, request deduplication, preloading, retries, pagination, or server rendering. If the application has adopted a router data mode, framework, or query-cache library, use its data-fetching approach where it fits instead of duplicating those facilities by hand.

## Effects and user actions

Use an Effect for synchronization caused by the component being present or by one of its inputs changing. Loading a page's current course is a common example.

Use an event handler for an operation caused by a specific user interaction:

~~~jsx
async function handleDeleteClick() {
  const response = await fetch("/api/courses/" + courseId, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Could not delete the course.");
  }

  onDeleted(courseId);
}
~~~

A request in an Effect can run again when dependencies change or when React checks the component's setup and cleanup behavior in development. A write should be tied to the user's explicit action. The server should also design mutation endpoints carefully and protect operations against accidental duplicates where required.

## Build the API endpoint with Express

Express handles the server side of the request. A simplified GET endpoint might look like this:

~~~js
app.get("/api/courses/:courseId", async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.courseId).lean();

    if (!course) {
      return res.status(404).json({
        message: "Course not found.",
      });
    }

    return res.status(200).json(course);
  } catch (error) {
    return next(error);
  }
});
~~~

The route parameter is untrusted input. Validate it, handle invalid identifiers, check authorization when the resource is protected, and avoid returning internal details in error responses.

For JSON request bodies, install JSON parsing middleware before routes that read <code>req.body</code>:

~~~js
app.use(express.json());

app.post("/api/courses", async (req, res, next) => {
  try {
    const title =
      typeof req.body.title === "string" ? req.body.title.trim() : "";

    if (!title) {
      return res.status(400).json({
        message: "A course title is required.",
      });
    }

    const course = await Course.create({ title });

    return res.status(201).json(course);
  } catch (error) {
    return next(error);
  }
});
~~~

The client can improve usability with basic checks, but server-side validation remains required. A caller can bypass the React UI and send a request directly.

## Status codes and response bodies

Use HTTP status codes to communicate the outcome:

- <code>200 OK</code>: request succeeded and a response body is available.
- <code>201 Created</code>: a resource was created successfully.
- <code>204 No Content</code>: request succeeded with no response body.
- <code>400 Bad Request</code>: the request input is invalid.
- <code>401 Unauthorized</code>: authentication is missing or invalid.
- <code>403 Forbidden</code>: the caller is authenticated but not allowed to perform the action.
- <code>404 Not Found</code>: the requested resource or route does not exist.
- <code>409 Conflict</code>: the request conflicts with the current resource state.
- <code>500 Internal Server Error</code>: an unexpected server failure occurred.

Agree on a consistent response shape for API errors, such as <code>{ "message": "Course not found." }</code>. The frontend should not assume that every response body is JSON: a proxy, web server, or upstream failure might return HTML or an empty body. Choose parsing behavior that matches the endpoint contract.

Never send stack traces, database credentials, or private internal details to the browser as an API error message.

## Configure the API origin

If the frontend and API share an origin, a relative URL such as <code>/api/courses</code> is often convenient. During development, the build tool can proxy that prefix to the backend.

If they use different origins, configure a public API base URL for the frontend build, for example:

~~~text
VITE_API_BASE_URL=https://api.example.test
~~~

Values exposed to client-side code are visible to users in the downloaded bundle. Never put database passwords, private server secrets, or signing keys in frontend environment variables. Keep those secrets on the server.

A configuration value is not a security boundary. The API must still authenticate and authorize each protected request.

## CORS and origins

An origin consists of the scheme, host, and port. For example, <code>http://localhost:5173</code> and <code>http://localhost:3000</code> are different origins.

When browser JavaScript requests a different origin, the browser applies Cross-Origin Resource Sharing rules. The API must return appropriate CORS headers for the frontend origin. Some requests trigger a preflight OPTIONS request before the actual request.

CORS is enforced by browsers to decide whether frontend JavaScript can read a cross-origin response. It is not authentication or authorization, and it does not stop a non-browser client from sending a request.

Do not try to bypass CORS with <code>mode: "no-cors"</code> for a JSON API. That mode produces an opaque response whose body and useful status information are unavailable to the calling JavaScript. Configure the server or development proxy correctly instead.

For cookie-based cross-origin authentication, the client and server need compatible credential and CORS settings. Credentialed requests require a specific allowed origin rather than a wildcard origin, and cookie security and CSRF protections still need careful design.

## Credentials and protected requests

By default, Fetch sends same-origin credentials according to browser behavior. A request may use <code>credentials: "include"</code> when the application intentionally uses cookies across origins, subject to browser cookie policies and matching server CORS headers.

~~~js
const response = await fetch(apiUrl, {
  credentials: "include",
  headers: {
    Accept: "application/json",
  },
});
~~~

If using a bearer token, send it only to the intended API origin and avoid logging it:

~~~js
const response = await fetch(apiUrl, {
  headers: {
    Accept: "application/json",
    Authorization: "Bearer " + accessToken,
  },
});
~~~

Do not store secrets in a URL. Never trust client-side role checks as the sole protection for a server operation.

## Inspect and debug requests

The browser's Network panel can help you inspect:

- Request URL, method, and status.
- Request and response headers.
- Whether a request was blocked by CORS.
- The response body and content type.
- Timing, redirects, cancellation, and duplicate calls.

Also inspect the server logs and API response. A frontend error message alone may not reveal whether the failure came from a bad URL, a rejected HTTP status, invalid JSON, a server exception, or a browser cross-origin policy.

When developing locally, confirm the API is running on the expected port and that the frontend proxy or base URL matches it.

## Common mistakes

- Assuming <code>fetch</code> rejects for HTTP 404 or 500 responses.
- Calling <code>response.json()</code> on a 204 response with no body.
- Forgetting to await or return <code>response.json()</code>.
- Sending a JavaScript object directly instead of <code>JSON.stringify</code> for a JSON request body.
- Omitting the <code>Content-Type</code> header for a JSON request.
- Treating frontend validation as a substitute for server validation.
- Making a write request in an Effect when it should happen after a user action.
- Omitting Effect dependencies or failing to clean up obsolete requests.
- Using <code>no-cors</code> to try to fix a JSON API request.
- Treating CORS as API authentication.
- Exposing server secrets in a frontend environment variable.
- Returning stack traces or private implementation details to the client.

## Chapter checklist

Before connecting a React page to an API:

- Define the endpoint URL, method, request shape, and response shape.
- Check the HTTP status before treating the response as successful.
- Parse the body according to the endpoint's response contract.
- Keep server validation and authorization on the server.
- Tie read synchronization to relevant component inputs and clean up obsolete work.
- Tie mutations to the event that caused them.
- Configure CORS or a development proxy for the actual origins.
- Keep private configuration and secrets out of the client bundle.
- Inspect the request and response in the browser Network panel.
- Handle loading, error, empty, and success UI states; those are expanded in the next chapter.

## Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [075 - Client-side routing and route layouts](075-client-side-routing-and-route-layouts.md) | [Q&A](../qnas/076-fetch-data-from-an-api.md) | [Example](../examples/076-fetch-data-from-an-api.md) | [077 - Loading, error, empty, and success states](077-loading-error-empty-and-success-states.md) |
