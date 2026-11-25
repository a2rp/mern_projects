# 039 - Routes, route parameters, and routers - complete example

This example documents Express 5 routes and routers.

~~~javascript
const app = express();
app.get("/api/files/:file{.:extension}", (req, res) => {
  return res.json({ extension: req.params.extension ?? null });
});
~~~

This example builds a small Express 5 API with project routes.

## 2. Create src/projectRoutes.js

~~~javascript
import express from "express";

export function createProjectRouter(projects) {
  const projectRouter = express.Router();
  const taskRouter = express.Router({
    mergeParams: true
  });

  projectRouter.param("projectId", (req, res, next, projectId) => {
    if (!/^[0-9]+$/.test(projectId)) {
      return res.status(400).json({
        error: "projectId must contain digits only."
      });
    }

    const project = projects.find((item) => item.id === projectId);

    if (!project) {
      return res.status(404).json({
        error: "Project not found."
      });
    }

    req.project = project;
    return next();
  });

  taskRouter.param("taskId", (req, res, next, taskId) => {
    if (!/^[0-9]+$/.test(taskId)) {
      return res.status(400).json({
        error: "taskId must contain digits only."
      });
    }

    const task = req.project.tasks.find((item) => item.id === taskId);

    if (!task) {
      return res.status(404).json({
        error: "Task not found in this project."
      });
    }

    req.task = task;
    return next();
  });

  projectRouter.use("/:projectId/tasks", taskRouter);

  taskRouter.get("/", (req, res) => {
    return res.status(200).json({
      projectId: req.project.id,
      tasks: req.project.tasks
    });
  });

  taskRouter.get("/:taskId", (req, res) => {
    return res.status(200).json({
      projectId: req.project.id,
      task: req.task
    });
  });

  projectRouter.get("/", (req, res) => {
    return res.status(200).json({
      projects: projects.map(({ id, name }) => ({ id, name }))
    });
  });

  projectRouter.get("/new", (req, res) => {
    return res.status(200).json({
      route: "fixed",
      message: "Use POST /api/projects to create a project."
    });
  });

  projectRouter
    .route("/:projectId")
    .get((req, res) => {
      return res.status(200).json({
        project: req.project
      });
    });

  return projectRouter;
}
~~~

## 3. Create src/app.js

~~~javascript
import express from "express";
import { createProjectRouter } from "./projectRoutes.js";

const app = express();

app.disable("x-powered-by");

const projects = [
  {
    id: "101",
    name: "Website refresh",
    tasks: [
      { id: "1", title: "Map the existing pages" },
      { id: "2", title: "Build the responsive header" }
    ]
  },
  {
    id: "202",
    name: "Learning portal",
    tasks: [
      { id: "1", title: "Write the course outline" }
    ]
  }
];

app.get("/api/route-syntax/files/:file{.:extension}", (req, res) => {
  return res.status(200).json({
    file: req.params.file,
    extension: req.params.extension ?? null
  });
});

app.get("/api/route-syntax/assets/*filepath", (req, res) => {
  return res.status(200).json({
    pathSegments: req.params.filepath
  });
});

app.use("/api/projects", createProjectRouter(projects));

app.use((req, res) => {
  return res.status(404).json({
    error: "Route not found."
  });
});

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  console.error("Request failed:", error.message);

  return res.status(500).json({
    error: "Internal server error."
  });
});

export default app;
~~~

The app mounts the project router at /api/projects. The router's local /:projectId path therefore handles /api/projects/:projectId.

## 4. Create src/server.js

~~~javascript
import app from "./app.js";

const port = 3000;
const host = "127.0.0.1";

const server = app.listen(port, host, () => {
  console.log("Routes example listening at http://localhost:" + port);
});

server.on("error", (error) => {
  console.error("Server failed to start:", error.message);
  process.exitCode = 1;
});
~~~

## 5. Start the server

~~~powershell
npm start
~~~

Expected terminal output:

~~~text
Routes example listening at http://localhost:3000
~~~

Keep the server running. Send the following requests from a second PowerShell window.

## 6. List projects

~~~powershell
curl.exe -i http://localhost:3000/api/projects
~~~

Expected status: 200 OK.

Expected JSON body:

~~~json
{
  "projects": [
    {
      "id": "101",
      "name": "Website refresh"
    },
    {
      "id": "202",
      "name": "Learning portal"
    }
  ]
}
~~~

The app mount prefix and the router's local root path combine into /api/projects.

## 7. Match a fixed route before the identifier route

~~~powershell
curl.exe -i http://localhost:3000/api/projects/new
~~~

Expected status: 200 OK.

Expected JSON body:

~~~json
{
  "route": "fixed",
  "message": "Use POST /api/projects to create a project."
}
~~~

The fixed /new route is registered before /:projectId. It is handled as a named action page instead of being treated as a project identifier.

## 8. Read one project

~~~powershell
curl.exe -i http://localhost:3000/api/projects/101
~~~

Expected status: 200 OK.

Expected JSON body:

~~~json
{
  "project": {
    "id": "101",
    "name": "Website refresh",
    "tasks": [
      {
        "id": "1",
        "title": "Map the existing pages"
      },
      {
        "id": "2",
        "title": "Build the responsive header"
      }
    ]
  }
}
~~~

The projectId parameter callback validates and loads the project before the route handler runs.

## 9. Read the tasks for a project

~~~powershell
curl.exe -i http://localhost:3000/api/projects/101/tasks
~~~

Expected status: 200 OK.

Expected JSON body:

~~~json
{
  "projectId": "101",
  "tasks": [
    {
      "id": "1",
      "title": "Map the existing pages"
    },
    {
      "id": "2",
      "title": "Build the responsive header"
    }
  ]
}
~~~

Because mergeParams is enabled, the child router can read the parent project's ID and loaded project.

## 10. Read one task within its project

~~~powershell
curl.exe -i http://localhost:3000/api/projects/101/tasks/2
~~~

Expected status: 200 OK.

Expected JSON body:

~~~json
{
  "projectId": "101",
  "task": {
    "id": "2",
    "title": "Build the responsive header"
  }
}
~~~

The task is looked up from project 101's task list. This checks that task 2 belongs to the project named in the URL.

## 11. Reject a malformed project identifier

~~~powershell
curl.exe -i http://localhost:3000/api/projects/abc
~~~

Expected status: 400 Bad Request.

Expected JSON body:

~~~json
{
  "error": "projectId must contain digits only."
}
~~~

The identifier has the wrong format, so the lookup does not run.

## 12. Return 404 for a well-formed but unknown project

~~~powershell
curl.exe -i http://localhost:3000/api/projects/999
~~~

Expected status: 404 Not Found.

Expected JSON body:

~~~json
{
  "error": "Project not found."
}
~~~

The identifier is formatted correctly, but it does not match a project in the data set.

## 13. Return 404 when a task is not in the selected project

~~~powershell
curl.exe -i http://localhost:3000/api/projects/101/tasks/999
~~~

Expected status: 404 Not Found.

Expected JSON body:

~~~json
{
  "error": "Task not found in this project."
}
~~~

The child router searches inside project 101. A task from another project must not be returned simply because its ID exists elsewhere.

## 14. Match an optional file extension

~~~powershell
curl.exe -i http://localhost:3000/api/route-syntax/files/readme
~~~

Expected JSON body:

~~~json
{
  "file": "readme",
  "extension": null
}
~~~

The optional extension is absent, so req.params does not contain an extension value.

Try the same route with an extension:

~~~powershell
curl.exe -i http://localhost:3000/api/route-syntax/files/readme.md
~~~

Expected JSON body:

~~~json
{
  "file": "readme",
  "extension": "md"
}
~~~

The braces make the dot and extension optional together.

## 15. Capture multiple segments with a named wildcard

~~~powershell
curl.exe -i http://localhost:3000/api/route-syntax/assets/images/logo.svg
~~~

Expected JSON body:

~~~json
{
  "pathSegments": [
    "images",
    "logo.svg"
  ]
}
~~~

The named wildcard captures the remaining path segments as an array. This example only returns the values; never use an unvalidated wildcard directly as a filesystem path.

## Expected behavior summary

| Request | Expected status | Route behavior |
| --- | --- | --- |
| GET /api/projects | 200 | Router root lists project summaries |
| GET /api/projects/new | 200 | Fixed route handles new before the dynamic parameter route |
| GET /api/projects/101 | 200 | Parameter callback loads and returns the project |
| GET /api/projects/101/tasks | 200 | Child router receives the parent projectId |
| GET /api/projects/101/tasks/2 | 200 | Task is selected within project 101 |
| GET /api/projects/abc | 400 | Malformed projectId is rejected |
| GET /api/projects/999 | 404 | Well-formed projectId has no matching record |
| GET /api/projects/101/tasks/999 | 404 | Task does not exist in the selected project |
| GET /api/route-syntax/files/readme | 200 | Optional extension is omitted |
| GET /api/route-syntax/files/readme.md | 200 | Optional extension is captured |
| GET /api/route-syntax/assets/images/logo.svg | 200 | Named wildcard returns path segments |

## How it works

1. Express evaluates matching middleware and routes in registration order.
2. The app mounts the project router at /api/projects.
3. The fixed /new route is declared before the dynamic /:projectId route.
4. The projectId parameter callback validates and loads the project before its handler.
5. The task router is mounted below /:projectId/tasks.
6. mergeParams makes the parent projectId available inside the child router.
7. The task lookup occurs within the loaded project, preserving the parent-child relationship.
8. The app-level 404 handles requests that reach the end without a matching route.
9. The four-argument error handler handles unexpected forwarded errors without exposing internal details.

## Common mistakes

- Forgetting to mount the router with app.use().
- Duplicating the /api/projects prefix inside router-local paths.
- Registering a dynamic route before a fixed route that overlaps it.
- Assuming route parameters are numbers or trusted values.
- Treating req.query as part of the route path.
- Forgetting mergeParams in a nested router that needs parent values.
- Loading a child record globally without checking that it belongs to the parent.
- Using old Express 4 optional or unnamed wildcard syntax.
- Expecting an Express 5 wildcard to be one string instead of an array.
- Using a wildcard value directly as a file path.
- Assuming a route parameter check also grants authorization.
- Returning stack traces or internal errors in client responses.

## Safety and scope

The project and task data are in memory and disappear when the process stops. This example has no authentication, authorization, database, or write routes. Add the policies and persistence rules required by your application before exposing resource routes to users.

## Chapter navigation

| Previous chapter | Chapter Q&A | Next chapter |
| --- | --- | --- |
| [038 - Middleware order and request lifecycle](../lessons/038-middleware-order-and-request-lifecycle.md) | [Q&A](../qnas/039-routes-route-parameters-and-routers.md) | [040 - Requests, responses, and content types](../lessons/040-requests-responses-and-content-types.md) |
