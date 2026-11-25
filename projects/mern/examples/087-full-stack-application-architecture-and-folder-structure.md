# 087 - Full-stack application architecture and folder structure: Examples

This example uses a small course-catalog feature to show how a MERN workspace can organize browser code, API code, persistence, configuration, and process startup without mixing their responsibilities.

## 1. Repository and package boundaries

~~~~text
mern-course/
├── client/
│   ├── package.json
│   └── src/
├── server/
│   ├── package.json
│   └── src/
├── .gitignore
├── package.json
└── README.md
~~~~

This monorepo keeps client and server in one clone, but they remain separate packages and runtime processes. Separate repositories can be a better fit when access control, ownership, or releases differ.

A root package can coordinate workspaces:

~~~~json
{
  "name": "mern-course",
  "private": true,
  "workspaces": ["client", "server"],
  "scripts": {
    "build": "npm run build --workspace client",
    "start:server": "npm run start --workspace server"
  }
}
~~~~

Each workspace still owns its dependencies and package scripts. Start the development processes in separate terminals or use a process runner that works in the team's shell.

## 2. Keep server code grouped by feature

~~~~text
server/src/
├── app.js
├── server.js
├── config/
│   └── env.js
├── database/
│   └── connect.js
├── middleware/
│   └── error-handler.js
└── features/
    └── courses/
        ├── course.routes.js
        ├── course.controller.js
        ├── course.service.js
        └── course.model.js
~~~~

A small project can begin with fewer modules. Split code when a boundary makes ownership, testing, or change impact easier to understand.

### Read and validate server configuration at startup

~~~~js
// server/src/config/env.js
export function readConfig(env = process.env) {
  const port = Number(env.PORT ?? 4000);
  const mongoUri = env.MONGODB_URI;

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be a valid TCP port.");
  }

  if (!mongoUri) {
    throw new Error("MONGODB_URI is required.");
  }

  return {
    port,
    mongoUri,
    clientOrigin: env.CLIENT_ORIGIN ?? "http://localhost:5173"
  };
}
~~~~

Configuration is read once at the process boundary. Missing required values fail startup with a useful message.

### Keep the database connection in the server

~~~~js
// server/src/database/connect.js
import mongoose from "mongoose";

export async function connectDatabase(mongoUri) {
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB.");
}
~~~~

The MongoDB URI is private server configuration. Never place it in client source or a public client environment variable.

### Put the model near its feature

~~~~js
// server/src/features/courses/course.model.js
import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: ""
    },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft"
    }
  },
  { timestamps: true }
);

export const Course = mongoose.model("Course", courseSchema);
~~~~

The schema describes persistence constraints. The API also needs to validate incoming data and control which fields callers may change.

### Put use-case rules in a service

~~~~js
// server/src/features/courses/course.service.js
import { Course } from "./course.model.js";

export async function listCourses() {
  return Course.find()
    .select("title description status createdAt updatedAt")
    .sort({ updatedAt: -1 })
    .lean();
}

export async function createCourse(input) {
  const title = input.title?.trim();

  if (!title) {
    const error = new Error("A course title is required.");
    error.status = 400;
    throw error;
  }

  return Course.create({
    title,
    description: input.description?.trim() ?? "",
    status: "draft"
  });
}
~~~~

The service performs the use case and persistence work. A repository abstraction can be introduced later if the application has a concrete need for another storage implementation or a more isolated persistence boundary.

### Adapt HTTP requests in a controller

~~~~js
// server/src/features/courses/course.controller.js
import { createCourse, listCourses } from "./course.service.js";

export async function getCourses(req, res, next) {
  try {
    const courses = await listCourses();
    res.json({ data: courses });
  } catch (error) {
    next(error);
  }
}

export async function postCourse(req, res, next) {
  try {
    const course = await createCourse(req.body);
    res.status(201).json({ data: course });
  } catch (error) {
    next(error);
  }
}
~~~~

The controller maps HTTP input to a use-case call and maps the result to an HTTP response. It does not connect to MongoDB or contain presentation logic.

### Declare the HTTP endpoints in routes

~~~~js
// server/src/features/courses/course.routes.js
import { Router } from "express";
import { getCourses, postCourse } from "./course.controller.js";

export const courseRouter = Router();

courseRouter.get("/", getCourses);
courseRouter.post("/", postCourse);
~~~~

Add request-validation, authentication, and authorization middleware at the route boundary when required by the feature.

## 3. Assemble the Express app separately from startup

~~~~js
// server/src/app.js
import express from "express";
import cors from "cors";
import { courseRouter } from "./features/courses/course.routes.js";
import { createErrorHandler } from "./middleware/error-handler.js";

export function createApp(config) {
  const app = express();

  app.use(cors({ origin: config.clientOrigin }));
  app.use(express.json({ limit: "1mb" }));

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/courses", courseRouter);
  app.use(createErrorHandler());

  return app;
}
~~~~

~~~~js
// server/src/server.js
import { readConfig } from "./config/env.js";
import { connectDatabase } from "./database/connect.js";
import { createApp } from "./app.js";

const config = readConfig();
await connectDatabase(config.mongoUri);

const app = createApp(config);
app.listen(config.port, () => {
  console.log("API listening on port " + config.port);
});
~~~~

The app module composes middleware and routes. The process entry point reads configuration, opens external connections, and starts listening. This separation allows automated checks to construct the Express app without opening a long-running network listener.

A small centralized error handler keeps response formatting consistent:

~~~~js
// server/src/middleware/error-handler.js
export function createErrorHandler() {
  return (error, req, res, next) => {
    if (res.headersSent) {
      return next(error);
    }

    const status = Number.isInteger(error.status) ? error.status : 500;
    const message =
      status < 500 ? error.message : "An unexpected server error occurred.";

    if (status >= 500) {
      console.error(error);
    }

    res.status(status).json({ error: { message } });
  };
}
~~~~

Production responses should not reveal stack traces, database details, or secrets.

## 4. Give the browser its own API boundary

~~~~text
client/src/
├── app/
│   └── App.jsx
├── lib/
│   └── api.js
└── features/
    └── courses/
        ├── CourseList.jsx
        └── courseApi.js
~~~~

The shared client helper owns the API base URL and JSON error handling:

~~~~js
// client/src/lib/api.js
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "";

export async function apiRequest(path, options = {}) {
  const response = await fetch(apiBaseUrl + path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers
    }
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error?.message ?? "The request failed.");
  }

  return payload;
}
~~~~

Client environment variables are bundled into code that visitors can inspect. They may contain public configuration such as an API origin, but must never contain database credentials or private signing keys.

Keep feature endpoints out of components:

~~~~js
// client/src/features/courses/courseApi.js
import { apiRequest } from "../../lib/api.js";

export function getCourses() {
  return apiRequest("/api/courses");
}

export function addCourse(input) {
  return apiRequest("/api/courses", {
    method: "POST",
    body: JSON.stringify(input)
  });
}
~~~~

A component handles user interface state and rendering:

~~~~jsx
// client/src/features/courses/CourseList.jsx
import { useEffect, useState } from "react";
import { getCourses } from "./courseApi.js";

export function CourseList() {
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    getCourses()
      .then((result) => {
        if (active) setCourses(result.data);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      });

    return () => {
      active = false;
    };
  }, []);

  if (error) return <p role="alert">{error}</p>;

  return (
    <ul>
      {courses.map((course) => (
        <li key={course._id}>{course.title}</li>
      ))}
    </ul>
  );
}
~~~~

The client consumes the server's JSON contract; it does not import Mongoose models or server modules.

## 5. Use safe environment templates

~~~~text
# server/.env.example
PORT=4000
CLIENT_ORIGIN=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/mern_course
~~~~

~~~~text
# client/.env.example
VITE_API_BASE_URL=http://localhost:4000
~~~~

Commit example files with safe local defaults. Keep real environment files out of version control:

~~~~text
node_modules/
dist/
coverage/
.env
.env.*
!.env.example
~~~~

In production, configure credentials through the hosting provider's secret manager or protected environment configuration.

## 6. Trace the request through the layers

A read request follows this path:

1. The CourseList component calls the course API function.
2. The API helper sends a request to GET /api/courses.
3. Express matches the course router.
4. The controller calls the list-courses service function.
5. The service queries the model and returns data.
6. The controller sends JSON, and React renders the returned list.

For creation, the form sends JSON to POST /api/courses. The server validates and normalizes that input before persistence. Client-side form validation improves feedback, but server-side validation is still required because any client can call an API directly.

## 7. Keep the architecture proportional

Start with explicit client and server packages and a few clear feature modules. Add another abstraction only when it clarifies a real boundary. A useful structure lets a developer find the feature owner, trace a request, and identify where configuration belongs without adding folders that have no distinct responsibility.

## Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Next chapter |
| --- | --- | --- | --- |
| [086 - Build a reusable component system](../lessons/086-build-a-reusable-component-system.md) | [Lesson](../lessons/087-full-stack-application-architecture-and-folder-structure.md) | [Q&A](../qnas/087-full-stack-application-architecture-and-folder-structure.md) | [088 - Configure frontend and backend origins](../lessons/088-configure-frontend-and-backend-origins.md) |
