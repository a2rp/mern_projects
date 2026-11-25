# Example 001 - Course Overview and MERN Architecture

## Question

A learner types **Read the first MERN lesson** into a task form and selects **Add task**. Trace the feature through the MERN stack:

- What does the browser send?
- What does the server do?
- Where does MongoDB fit?
- How does the new task appear in the interface?

## Goal

Map one small feature to the responsibility of each technology:

| Part | Responsibility in this example |
| --- | --- |
| React | Displays the form and task list; shows request status |
| HTTP API | Carries the create-task request and response |
| Express on Node.js | Validates the request and coordinates the operation |
| MongoDB | Stores the new task document |

This is an architecture walkthrough. The snippets are shown as code for study; this Markdown does not run them. They illustrate the boundaries between the layers and are not a complete project setup. Later examples will create and configure the application step by step.

## Scenario

The task application has a MongoDB collection named `tasks`. A person submits a task title. For this small demonstration, the API accepts a non-empty title of at most 120 characters, stores the task as incomplete, and returns the saved task.

A production application would also check the user's identity and permission, apply request limits, and use the project's full validation and error-handling setup.

## 1. The browser sends an HTTP request

The React code asks the API to create a task:

~~~http
POST /api/tasks
Content-Type: application/json

{
  "title": "Read the first MERN lesson"
}
~~~

The request has three important parts:

- **Method:** POST asks the server to create a resource.
- **Path:** `/api/tasks` identifies the API endpoint.
- **Body:** JSON carries the submitted title.

The browser does not write to MongoDB. It sends a request to the backend.

## 2. Express validates and stores the request

Assume the server has already created an Express app, connected to MongoDB, and selected the `tasks` collection. JSON parsing middleware must be registered before this route so the request body is available as `req.body`.

~~~js
app.use(express.json());

app.post("/api/tasks", async (req, res, next) => {
  try {
    const title =
      typeof req.body?.title === "string" ? req.body.title.trim() : "";

    if (title.length === 0 || title.length > 120) {
      return res.status(400).json({
        error: "Enter a task title between 1 and 120 characters."
      });
    }

    const task = {
      title,
      completed: false
    };

    const result = await tasks.insertOne(task);

    return res.status(201).json({
      task: {
        id: result.insertedId.toString(),
        ...task
      }
    });
  } catch (error) {
    return next(error);
  }
});
~~~

The `tasks` variable represents the MongoDB collection chosen by the server. This fragment assumes that database setup exists elsewhere in the project. The `try`/`catch` passes unexpected failures to the server's error-handling middleware.

The route checks the input on the server even if the React form also checks it. Browser checks help a person correct mistakes quickly, but the server must treat every request as untrusted.

## 3. MongoDB stores a document

After a successful insert, the collection contains a document conceptually like this:

~~~json
{
  "_id": "MongoDB-generated identifier",
  "title": "Read the first MERN lesson",
  "completed": false
}
~~~

MongoDB stores the record as a BSON document. The API response uses a string form of the identifier so it can be sent in JSON. The document and response are related, but the API is free to choose a response shape that suits the frontend.

## 4. React sends the request

A small API helper can send the title and return the created task:

~~~js
async function createTask(title) {
  const response = await fetch("/api/tasks", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ title })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? "The task could not be saved.");
  }

  return data.task;
}
~~~

A completed `fetch` call does not necessarily mean the server accepted the operation. Checking `response.ok` lets the interface handle an HTTP error response instead of treating it as a saved task.

## 5. The form represents the result

This compact component shows how a React form can request the operation and report its status. It expects its parent to provide `onTaskCreated`, which adds the returned task to the displayed list.

~~~jsx
import { useState } from "react";

function CreateTaskForm({ onTaskCreated }) {
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    const trimmedTitle = title.trim();

    if (!trimmedTitle || trimmedTitle.length > 120) {
      setStatus("Enter a title with 1 to 120 characters.");
      return;
    }

    setStatus("Saving task...");

    try {
      const task = await createTask(trimmedTitle);
      onTaskCreated(task);
      setTitle("");
      setStatus("Task saved.");
    } catch (error) {
      setStatus(error.message);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="task-title">Task title</label>
      <input
        id="task-title"
        value={title}
        maxLength={120}
        onChange={(event) => setTitle(event.target.value)}
      />
      <button type="submit">Add task</button>
      <p role="status">{status}</p>
    </form>
  );
}
~~~

A parent component can own the task list and add the returned item to its state:

~~~jsx
function TaskPage() {
  const [tasks, setTasks] = useState([]);

  function handleTaskCreated(task) {
    setTasks((currentTasks) => [...currentTasks, task]);
  }

  return (
    <>
      <CreateTaskForm onTaskCreated={handleTaskCreated} />
      <ul>
        {tasks.map((task) => (
          <li key={task.id}>{task.title}</li>
        ))}
      </ul>
    </>
  );
}
~~~

The parent then passes `handleTaskCreated` to `CreateTaskForm` as the `onTaskCreated` prop. This is a simplified example of data moving from a parent to a child through props and of an event reporting a result back to the parent.

## Expected output

After a valid submission, the person sees the task in the list:

~~~text
Task title
[Read the first MERN lesson] [Add task]

Tasks
- Read the first MERN lesson
Task saved.
~~~

While the request is in progress, the status message says **Saving task...**. If the server rejects the title, the interface displays the returned validation message. If the network or server fails unexpectedly, the error message is shown and the task is not added as though it were saved.

The exact visual design depends on the application's HTML and CSS. This walkthrough focuses on what each layer does, not on styling the page.

## Explanation

1. **React collects the user's input.** The component keeps the current field value and shows a status. It is responsible for the interface, not direct database access.
2. **The browser makes an HTTP request.** The method, path, headers, and JSON body form the API call.
3. **Express matches the method and path.** The middleware parses JSON, then the route validates the submitted value.
4. **Node.js runs the server code.** The asynchronous database operation is awaited so the route can use its result.
5. **MongoDB stores the document.** The collection persists the task beyond the current page.
6. **The API sends a response.** The created task is returned as JSON with a creation status.
7. **React updates the interface.** The parent adds the returned task to its state, and React renders the updated list.

The UI performs a quick check for usability, while the API repeats validation for security and data integrity. In a real application, also authenticate the request and verify the user's permission before creating or returning private data.

## What this example teaches

- React, Express, Node.js, and MongoDB have separate responsibilities.
- The API is the communication boundary between the browser and backend.
- The backend owns validation, permission checks, and database access.
- MongoDB stores the record; React displays a representation of it.
- A useful interface handles pending, successful, and failed requests.
- Example snippets are easier to understand when you can identify which runtime and layer each one belongs to.

## Try changing the scenario

1. Change the title to an empty string. Which layer should reject it?
2. Imagine the database is unavailable. What should the API return, and what should React display?
3. Add a completed checkbox to the task. Which parts of the request, stored document, and interface would need to change?
4. For a private task list, where should the server check that a task belongs to the signed-in user?

## Related chapter files

- [Lesson 001 - Course overview and MERN architecture](../lessons/001-course-overview-and-mern-architecture.md)
- [Q&A 001 - Course overview and MERN architecture](../qnas/001-course-overview-and-mern-architecture.md)

---

### Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Next chapter |
| :--- | --- | --- | ---: |
|  | [Lesson](../lessons/001-course-overview-and-mern-architecture.md) | [Q&A](../qnas/001-course-overview-and-mern-architecture.md) | [002 - How browsers, servers, and clients communicate](../lessons/002-how-browsers-servers-and-clients-communicate.md) |
