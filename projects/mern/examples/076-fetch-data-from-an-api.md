# 076 - Fetch data from an API: example

This example connects a React page to an Express API backed by MongoDB. The API returns a course list as JSON, and the frontend requests it with Fetch when the page mounts.

The focus is the client/server data flow. The page includes basic loading and error messages so the request can be explored; the next chapter develops those UI states in more detail.

## What you will build

- An Express API with a MongoDB-backed <code>GET /api/courses</code> endpoint.
- A React page that requests the endpoint and renders course cards.
- An API helper that checks the HTTP status and reads the JSON response.
- Effect cleanup that aborts a request when the page unmounts.
- A development CORS setting for a separate Vite and Express origin.

## File structure

~~~text
server/
├── .env.example
├── app.js
├── index.js
└── models/
    └── Course.js

client/
├── .env.example
└── src/
    ├── api/
    │   └── courses.js
    ├── App.jsx
    ├── CoursesPage.jsx
    └── main.jsx
~~~

## 1. Create the MongoDB model

Create <code>server/models/Course.js</code>:

~~~js
const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    level: {
      type: String,
      required: true,
      enum: ["Beginner", "Intermediate", "Advanced"],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Course", courseSchema);
~~~

MongoDB stores the course records. The API selects only the public fields needed by the page; it does not return timestamps or internal document fields.

For a local learning database named <code>mern_learning</code>, add a few records with <code>mongosh</code>:

~~~js
use mern_learning

db.courses.insertMany([
  {
    slug: "html",
    title: "HTML foundations",
    description: "Learn semantic document structure and accessible markup.",
    level: "Beginner"
  },
  {
    slug: "css",
    title: "CSS layout and styling",
    description: "Practice selectors, responsive layout, and visual design.",
    level: "Beginner"
  },
  {
    slug: "react",
    title: "React fundamentals",
    description: "Build interfaces from reusable components and state.",
    level: "Intermediate"
  }
])
~~~

The unique slug index prevents two records from using the same route identifier. In a real project, apply database indexes through a deliberate migration or deployment process.

## 2. Create the Express API

Create <code>server/app.js</code>:

~~~js
const express = require("express");
const cors = require("cors");
const Course = require("./models/Course");

const app = express();

if (process.env.CLIENT_ORIGIN) {
  app.use(cors({ origin: process.env.CLIENT_ORIGIN }));
}

app.use(express.json());

app.get("/api/courses", async (req, res, next) => {
  try {
    const courses = await Course.find()
      .select("slug title description level -_id")
      .sort({ title: 1 })
      .lean();

    return res.status(200).json({ courses });
  } catch (error) {
    return next(error);
  }
});

app.get("/api/courses/:slug", async (req, res, next) => {
  try {
    const course = await Course.findOne({ slug: req.params.slug })
      .select("slug title description level -_id")
      .lean();

    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    return res.status(200).json({ course });
  } catch (error) {
    return next(error);
  }
});

app.use("/api", (req, res) => {
  return res.status(404).json({ message: "API route not found." });
});

app.use((error, req, res, next) => {
  console.error(error);
  return res.status(500).json({ message: "An unexpected server error occurred." });
});

module.exports = app;
~~~

The API returns a predictable JSON shape:

~~~json
{
  "courses": [
    {
      "slug": "html",
      "title": "HTML foundations",
      "description": "Learn semantic document structure and accessible markup.",
      "level": "Beginner"
    }
  ]
}
~~~

The route returns 404 with a JSON message if a requested slug does not exist. The final error middleware avoids returning internal error details to the client. A production API should also validate input, apply authentication and authorization where needed, and log errors through its chosen logging system.

## 3. Configure the server

Create <code>server/.env.example</code>:

~~~text
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/mern_learning
CLIENT_ORIGIN=http://localhost:5173
~~~

Copy it to <code>server/.env</code> for local work and adjust values for your machine. Do not commit real database credentials.

Create <code>server/index.js</code>:

~~~js
require("dotenv").config();

const mongoose = require("mongoose");
const app = require("./app");

const port = Number(process.env.PORT) || 3000;
const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  throw new Error("MONGODB_URI must be configured.");
}

mongoose
  .connect(mongoUri)
  .then(() => {
    app.listen(port, () => {
      console.log("API listening on port " + port);
    });
  })
  .catch((error) => {
    console.error("Could not connect to MongoDB:", error);
    process.exitCode = 1;
  });
~~~

Install the server dependencies from the <code>server</code> directory:

~~~bash
npm init -y
npm install express mongoose cors dotenv
~~~

Start the API after MongoDB is available:

~~~bash
node index.js
~~~

The route can then be inspected at <code>http://localhost:3000/api/courses</code>. It should return JSON with a <code>courses</code> array.

## 4. Configure the React API origin

Create <code>client/.env.example</code>:

~~~text
VITE_API_BASE_URL=http://localhost:3000
~~~

Copy it to <code>client/.env.local</code>. This is public frontend configuration: it identifies the API host and must not contain private credentials. Restart the Vite server after changing its environment file.

## 5. Add an API helper

Create <code>client/src/api/courses.js</code>:

~~~js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

async function readJson(response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    throw new Error("The API returned a non-JSON response.");
  }

  return response.json();
}

export async function getCourses({ signal } = {}) {
  const response = await fetch(API_BASE_URL + "/api/courses", {
    headers: {
      Accept: "application/json",
    },
    signal,
  });

  const payload = await readJson(response);

  if (!response.ok) {
    throw new Error(payload.message || "Could not load courses.");
  }

  if (!Array.isArray(payload.courses)) {
    throw new Error("The API response did not include a course list.");
  }

  return payload.courses;
}
~~~

Keeping request code in an API module gives components a clear function to call. The helper checks that the server returned JSON, reads the body, and checks the status before returning the course list.

A 404 response still produces a <code>Response</code>, so checking <code>response.ok</code> is essential. The helper accepts an optional abort signal so the React component can cancel obsolete work.

## 6. Fetch courses in React

Create <code>client/src/CoursesPage.jsx</code>:

~~~jsx
import { useEffect, useState } from "react";
import { getCourses } from "./api/courses.js";

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    let ignoreResult = false;

    async function loadCourses() {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const result = await getCourses({ signal: controller.signal });

        if (!ignoreResult) {
          setCourses(result);
        }
      } catch (error) {
        if (!ignoreResult && error.name !== "AbortError") {
          setErrorMessage(error.message || "Could not load courses.");
        }
      } finally {
        if (!ignoreResult) {
          setIsLoading(false);
        }
      }
    }

    loadCourses();

    return () => {
      ignoreResult = true;
      controller.abort();
    };
  }, []);

  if (isLoading) {
    return <p>Loading courses…</p>;
  }

  if (errorMessage) {
    return <p role="alert">{errorMessage}</p>;
  }

  if (courses.length === 0) {
    return <p>No courses are available yet.</p>;
  }

  return (
    <main className="page">
      <header className="page-heading">
        <p className="eyebrow">From the API</p>
        <h1>Available courses</h1>
        <p>These records were loaded from the Express API.</p>
      </header>

      <ul className="course-list">
        {courses.map((course) => (
          <li className="course-card" key={course.slug}>
            <p className="course-level">{course.level}</p>
            <h2>{course.title}</h2>
            <p>{course.description}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
~~~

The Effect represents a GET request associated with this page being visible. Its cleanup aborts the fetch and marks its result as obsolete. Both the abort and the guard help prevent a response from an old request from changing state after the component is removed.

The basic loading, error, and empty branches are included so the example remains usable. Chapter 077 explains these states, retries, and user feedback in detail.

## 7. Render the page

Create <code>client/src/App.jsx</code>:

~~~jsx
import CoursesPage from "./CoursesPage.jsx";

export default function App() {
  return <CoursesPage />;
}
~~~

Update <code>client/src/main.jsx</code> to render the app and styles:

~~~jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./style.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
~~~

If your Vite project uses a differently named stylesheet, keep its existing filename or create <code>client/src/style.css</code> with these styles:

~~~css
:root {
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
    "Segoe UI", sans-serif;
  color: #182437;
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

.page {
  width: min(100% - 2rem, 900px);
  margin-inline: auto;
  padding-block: 3.5rem;
}

.page-heading {
  max-width: 680px;
  margin-bottom: 1.75rem;
}

.eyebrow {
  margin-bottom: 0.55rem;
  color: #315bcc;
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
  margin-bottom: 0.7rem;
  font-size: clamp(2rem, 5vw, 3rem);
  letter-spacing: -0.045em;
}

.page-heading > p:last-child {
  color: #59677a;
  line-height: 1.6;
}

.course-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.course-card {
  padding: 1.25rem;
  border: 1px solid #dce4ef;
  border-radius: 0.9rem;
  background: #fff;
  box-shadow: 0 10px 30px rgb(32 55 90 / 6%);
}

.course-level {
  margin-bottom: 0.55rem;
  color: #315bcc;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.course-card h2 {
  margin-bottom: 0.6rem;
  font-size: 1.25rem;
}

.course-card > p:last-child {
  margin-bottom: 0;
  color: #59677a;
  line-height: 1.6;
}

@media (max-width: 620px) {
  .page {
    padding-block: 2rem;
  }

  .course-list {
    grid-template-columns: 1fr;
  }
}
~~~

## 8. Run and inspect the request

Create a React client with Vite if you do not already have one, then install its dependencies. Run the API and frontend in separate terminals.

Try these steps:

1. Confirm MongoDB is running and the sample records exist.
2. Start the API from <code>server</code> and open <code>/api/courses</code> on port 3000.
3. Start the Vite client and open its local address.
4. Inspect the browser Network panel and find the GET request to <code>/api/courses</code>.
5. Confirm the response status is 200 and the response body contains a <code>courses</code> array.
6. Stop the API and reload the frontend to see the request failure.
7. Stop the frontend or navigate away during a request and inspect cancellation behavior.

In development, React Strict Mode may perform an extra setup and cleanup cycle for Effects. A GET should be safe to repeat, and cleanup should correctly cancel or ignore obsolete work.

## Troubleshooting

- **The request goes to the Vite port:** Check <code>client/.env.local</code> and restart Vite.
- **The browser reports a CORS error:** Check that <code>CLIENT_ORIGIN</code> exactly matches the Vite origin, including scheme and port. Restart Express after changing the server environment.
- **The API returns an empty list:** Confirm that MongoDB uses the same database name and that the records are in the <code>courses</code> collection.
- **The browser says the response is not JSON:** Check the request URL and the Network response. A frontend development server's HTML fallback often means the request reached the wrong origin or path.
- **The server returns 500:** Inspect server logs and confirm the MongoDB connection is ready.
- **The page fetches more than once in development:** Check Effect cleanup and remember that Strict Mode intentionally checks setup and cleanup behavior in development.

## Security and deployment notes

- Keep MongoDB credentials in server-only configuration.
- Validate incoming data and enforce permissions on the server for every protected endpoint.
- Configure CORS only for the intended origins when the browser and API are cross-origin.
- Do not use CORS as authentication.
- Use HTTPS for deployed applications and protect cookie-based writes against CSRF as appropriate.
- Configure the production frontend and API routing so API requests do not receive the SPA's HTML fallback.
- A public frontend API base URL is configuration, not a secret.

## Key takeaways

- Fetch resolves with a response for HTTP failures, so check the status.
- Request JSON bodies need serialization and a content type.
- Effects that fetch should declare dependencies and clean up obsolete requests.
- User-triggered writes belong in their event flow.
- CORS controls browser access to cross-origin responses; it does not secure an API.
- The server validates and authorizes requests, regardless of frontend checks.

## Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [075 - Client-side routing and route layouts](../lessons/075-client-side-routing-and-route-layouts.md) | [Q&A](../qnas/076-fetch-data-from-an-api.md) | [Lesson](../lessons/076-fetch-data-from-an-api.md) | [077 - Loading, error, empty, and success states](../lessons/077-loading-error-empty-and-success-states.md) |
