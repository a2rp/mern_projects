# Example 009 - Asynchronous JavaScript: Callbacks, Promises, and Async/Await

## Question

How can a small Node.js program adapt a callback to a Promise, load independent data concurrently, await dependent work, and handle both expected and unexpected failures?

## Goal

Build a small dashboard with two files:

- `task-service.mjs` simulates delayed profile and task operations and exposes one callback-based operation.
- `app.mjs` adapts the callback, combines independent Promises, loads task details, and handles failures.

The timers simulate I/O so the code is easy to follow. This example uses only Node.js; it does not access a database or make a network request.

## Complete example

Create a folder named `async-javascript-practice` and add both files below.

### 1. Create task-service.mjs

~~~js
const taskRecords = [
  {
    id: "task-1",
    ownerId: "user-1",
    title: "Read the MERN overview",
    completed: false,
  },
  {
    id: "task-2",
    ownerId: "user-1",
    title: "Practice async flows",
    completed: false,
  },
  {
    id: "task-3",
    ownerId: "user-1",
    title: "Review the code",
    completed: true,
  },
];

function delay(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

export function readAnnouncement(callback) {
  setTimeout(() => {
    callback(null, "The task service is ready.");
  }, 10);
}

export function getProfile(userId) {
  return delay(30).then(() => {
    if (userId !== "user-1") {
      throw new Error("Profile not found for " + userId);
    }

    return {
      id: userId,
      displayName: "Asha",
    };
  });
}

export async function getTasks(userId) {
  await delay(40);

  if (userId !== "user-1") {
    throw new Error("Tasks not found for " + userId);
  }

  return taskRecords.filter((task) => task.ownerId === userId);
}

export async function getTask(taskId) {
  await delay(20);

  const task = taskRecords.find((record) => record.id === taskId);

  if (!task) {
    throw new Error("Task not found: " + taskId);
  }

  return task;
}
~~~

### 2. Create app.mjs

~~~js
import {
  getProfile,
  getTask,
  getTasks,
  readAnnouncement,
} from "./task-service.mjs";

function readAnnouncementAsPromise() {
  return new Promise((resolve, reject) => {
    readAnnouncement((error, message) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(message);
    });
  });
}

async function loadDashboard(userId) {
  const [profile, tasks] = await Promise.all([
    getProfile(userId),
    getTasks(userId),
  ]);

  return { profile, tasks };
}

async function main() {
  try {
    const announcement = await readAnnouncementAsPromise();
    console.log("Callback adapted: " + announcement);

    const dashboard = await loadDashboard("user-1");
    console.log("Profile: " + dashboard.profile.displayName);

    const openTasks = dashboard.tasks.filter(
      (task) => task.completed === false,
    );
    const completedCount = dashboard.tasks.filter(
      (task) => task.completed === true,
    ).length;

    console.log("Open task count: " + openTasks.length);
    console.log("Completed tasks: " + completedCount);

    const firstTask = await getTask(openTasks[0].id);
    console.log("First task detail: " + firstTask.title);

    const taskTitles = await Promise.all(
      openTasks.map(async (task) => {
        const loadedTask = await getTask(task.id);
        return loadedTask.title;
      }),
    );

    console.log("Task titles: " + taskTitles.join(" | "));

    try {
      await getTask("missing");
    } catch (error) {
      console.log("Missing task handled: " + error.message);
    }

    const outcomes = await Promise.allSettled([
      getTask("task-1"),
      getTask("missing"),
    ]);

    console.log(
      "Settled outcomes: " +
        outcomes.map((outcome) => outcome.status).join(", "),
    );
  } finally {
    console.log("Demo finished.");
  }
}

main().catch((error) => {
  console.error("Unexpected failure:", error.message);
  process.exitCode = 1;
});
~~~

## Run the example

Open a terminal in `async-javascript-practice` and run:

~~~sh
node app.mjs
~~~

The `.mjs` extensions tell Node.js to load both files as ES modules. No package installation is needed.

## Expected output

~~~text
Callback adapted: The task service is ready.
Profile: Asha
Open task count: 2
Completed tasks: 1
First task detail: Read the MERN overview
Task titles: Read the MERN overview | Practice async flows
Missing task handled: Task not found: missing
Settled outcomes: fulfilled, rejected
Demo finished.
~~~

## What the program demonstrates

| Feature | Where it appears | What it does |
| --- | --- | --- |
| Callback | `readAnnouncement` | Sends a result to a function supplied by the caller. |
| Callback-to-Promise adapter | `readAnnouncementAsPromise` | Uses `resolve` or `reject` to expose the callback result as a Promise. |
| Promise executor | `new Promise` in `delay` and the adapter | Shows how a callback or timer API can be represented with a Promise. |
| Promise chain | `getProfile` | Returns a Promise chain and throws to signal a failure. |
| Async functions | `getTasks`, `getTask`, and `main` | Provide Promise-returning functions that can use `await`. |
| Concurrent independent work | `loadDashboard` | Starts the profile and task operations together with `Promise.all`. |
| Sequential dependent work | `getTask(openTasks[0].id)` | Starts the detail lookup after the task list has been loaded. |
| Async array callback | `openTasks.map(async ...)` | Creates a Promise for each task title. |
| Expected error handling | The missing task `try`/`catch` | Handles one known failure without ending the whole demo. |
| All-settled outcomes | `Promise.allSettled` | Reports both a fulfilled operation and a rejected one. |
| Cleanup | The `finally` block | Prints a completion message whether the main operations succeed or fail. |

## Explanation

`readAnnouncement` follows a callback convention: its callback receives an error first and a message second. `readAnnouncementAsPromise` adapts that convention. It rejects if the callback receives an error and fulfills with the message otherwise.

`loadDashboard` starts `getProfile` and `getTasks` before it awaits either one. They are independent, so `Promise.all` can wait for both together. The returned values stay in the same order as the input array: profile first, tasks second.

After the dashboard is ready, the example filters the task list and then loads a detail record by ID. The ID comes from the list, so the detail lookup happens afterward. The async `map` callback returns a Promise for each title; `Promise.all` gathers the completed titles in the original task order.

The missing task is an expected failure and is handled locally. `Promise.allSettled` then demonstrates how to inspect the outcome of each operation separately. The outer `catch` handles any unexpected rejection from `main`, while `finally` runs the completion message either way.

The timers stand in for I/O delays. Real database and network libraries return their own Promises, and production code should validate data, handle timeouts or cancellation when needed, and return useful errors at the application boundary.

## Try these changes

1. Change the user ID passed to `loadDashboard`. Observe how the outer catch handles a rejected dashboard operation.
2. Remove the local `try`/`catch` around the missing task and compare the behavior of `Promise.allSettled` with `Promise.all`.
3. Change the delay durations. The printed task-title order remains based on the input order, not on which detail lookup finishes first.
4. Replace the async `map` callback with a normal callback that returns `getTask(task.id)`. The result is still an array of Promises.
5. Add another independent request to the `Promise.all` array and handle its returned value.
6. Make `readAnnouncement` call its callback with an Error and check that the adapter rejects.
7. Remove `await` from a call and inspect what value the caller receives.
8. Add a loading message before the work and move the cleanup message into `finally`.

## Key takeaways

- A callback can report a later result; a Promise offers a chainable representation of fulfillment or failure.
- An async function always returns a Promise, and awaiting a rejection throws at that point.
- Use `Promise.all` when independent operations must all succeed; result positions match input positions.
- Use `Promise.allSettled` to inspect each independent outcome, including failures.
- Async callbacks in `map` produce Promises; await the collection intentionally.
- Handle errors at a boundary that can log, recover, or show a useful response.

## Related chapter files

- [Lesson 009 - Asynchronous JavaScript: callbacks, promises, and async await](../lessons/009-asynchronous-javascript-callbacks-promises-and-async-await.md)
- [Q&A 009 - Asynchronous JavaScript: callbacks, promises, and async await](../qnas/009-asynchronous-javascript-callbacks-promises-and-async-await.md)
- [Example 008 - Modern JavaScript syntax and modules](008-modern-javascript-syntax-and-modules.md)

---

### Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Next chapter |
| :--- | :--- | :--- | :---: |
| [008 - Modern JavaScript syntax and modules](../lessons/008-modern-javascript-syntax-and-modules.md) | [Lesson](../lessons/009-asynchronous-javascript-callbacks-promises-and-async-await.md) | [Q&A](../qnas/009-asynchronous-javascript-callbacks-promises-and-async-await.md) | [010 - Errors, exceptions, and debugging JavaScript](../lessons/010-errors-exceptions-and-debugging-javascript.md) |
