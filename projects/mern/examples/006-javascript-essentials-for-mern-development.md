# Example 006 - JavaScript Essentials for MERN Development

## Question

How do JavaScript values, functions, arrays, objects, modules, and asynchronous work fit together in a small task-list program?

## Goal

This runnable Node.js example uses two ES module files:

- `task-data.mjs` creates and checks task objects and simulates loading saved tasks.
- `app.mjs` imports those functions, awaits the data, filters an array, and prints a summary.

The example uses only built-in JavaScript and Node.js features. It does not install packages, connect to a server, or use MongoDB; the loading step is a short timer that represents asynchronous work.

## Complete example

Create a new folder named `javascript-essentials-practice` and add both files below to it.

### 1. Create task-data.mjs

~~~js
let nextTaskId = 3;

export function createTask(title, options = {}) {
  if (typeof title !== "string" || title.trim() === "") {
    throw new TypeError("Task title must be a non-empty string.");
  }

  const {
    completed = false,
    priority = "normal",
  } = options;

  if (typeof completed !== "boolean") {
    throw new TypeError("Task completed must be a Boolean.");
  }

  const allowedPriorities = ["low", "normal", "high"];

  if (!allowedPriorities.includes(priority)) {
    throw new TypeError("Task priority must be low, normal, or high.");
  }

  return {
    id: "task-" + nextTaskId++,
    title: title.trim(),
    completed,
    priority,
  };
}

export function loadTasks() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: "task-1",
          title: "Read the MERN overview",
          completed: false,
          priority: "normal",
        },
        {
          id: "task-2",
          title: "Install Node.js",
          completed: true,
          priority: "low",
        },
      ]);
    }, 100);
  });
}
~~~

### 2. Create app.mjs

~~~js
import { createTask, loadTasks } from "./task-data.mjs";

function formatTask({ title, priority }) {
  return "- " + title + " [" + priority + "]";
}

async function main() {
  try {
    const savedTasks = await loadTasks();

    const newTask = createTask("  Practice JavaScript essentials  ", {
      priority: "high",
    });

    const tasks = [...savedTasks, newTask];
    const openTasks = tasks.filter((task) => task.completed === false);
    const completedCount = tasks.filter((task) => task.completed === true).length;
    const taskLines = openTasks.map(formatTask);
    const firstTaskTitle = openTasks[0]?.title ?? "No open tasks";

    console.log("Open tasks (" + openTasks.length + "):");
    console.log(taskLines.join("\n"));
    console.log("Completed tasks: " + completedCount);
    console.log("First open task: " + firstTaskTitle);
  } catch (error) {
    console.error("Could not prepare the task list:", error.message);
    process.exitCode = 1;
  }
}

main();
~~~

## Run the example

Open a terminal in the `javascript-essentials-practice` folder and run:

~~~sh
node app.mjs
~~~

The `.mjs` file extension tells Node.js to treat these files as ES modules. No package installation is needed.

## Expected output

~~~text
Open tasks (2):
- Read the MERN overview [normal]
- Practice JavaScript essentials [high]
Completed tasks: 1
First open task: Read the MERN overview
~~~

## What the program demonstrates

| Code feature | Where it appears | What it does |
| --- | --- | --- |
| Module exports and imports | `export` in task-data.mjs; `import` in app.mjs | Makes selected functions available across files. |
| `const` and `let` | Both files | Uses const for stable bindings and let for the next generated ID. |
| Function parameters and return values | `createTask` and `formatTask` | Accepts data, validates it, and returns useful results. |
| Object and array values | Task records and `savedTasks` | Represents task data and groups tasks in order. |
| Destructuring | `createTask` options and `formatTask` parameter | Reads selected properties from an object. |
| Spread syntax | `[...savedTasks, newTask]` | Builds a new array containing old tasks and the added task. |
| Array methods | `filter` and `map` | Selects open tasks and turns them into display lines. |
| Promise and timer | `loadTasks` | Represents data that becomes available asynchronously. |
| `async`/`await` | `main` | Waits for the Promise before using the task data. |
| Error handling | `try`/`catch` | Displays a useful message when task creation or loading fails. |
| Optional chaining and nullish coalescing | `openTasks[0]?.title ?? "No open tasks"` | Handles the case where no open task is available. |

## Try these changes

1. Change the new task title to `" "`. The validation throws a TypeError, and the catch block displays an error.
2. Add `completed: "false"` to the options. The string is rejected because this field must be a Boolean.
3. Change the priority to `"urgent"`. The task factory rejects a value outside its allowed list.
4. Add `completed: true` to the new task options. It moves from the open list to the completed count.
5. Change the saved task objects and observe how the filtered list changes.
6. Add a new property such as `category` to a task and display it from `formatTask`.

## Explanation

The module starts with two saved sample tasks and exports functions for loading and creating task data. The app imports those named exports and awaits the simulated load before combining the saved tasks with a new one.

The program keeps the original saved array intact by creating a new array with spread syntax. It filters for tasks whose completed property is exactly Boolean false, maps the result into display lines, and prints a summary.

The loading function uses a timer only to demonstrate asynchronous flow. In a real MERN application, the data would come from an API or a database operation; the Promise and error-handling concepts still apply. This example does not connect to MongoDB or make a network request.

## Related chapter files

- [Lesson 006 - JavaScript essentials for MERN development](../lessons/006-javascript-essentials-for-mern-development.md)
- [Q&A 006 - JavaScript essentials for MERN development](../qnas/006-javascript-essentials-for-mern-development.md)

---

### Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Next chapter |
| :--- | :--- | :--- | :---: |
| [005 - Terminal, files, Git, and GitHub workflow](../lessons/005-terminal-files-git-and-github-workflow.md) | [Lesson](../lessons/006-javascript-essentials-for-mern-development.md) | [Q&A](../qnas/006-javascript-essentials-for-mern-development.md) | [007 - Functions, scope, arrays, and objects refresher](../lessons/007-functions-scope-arrays-and-objects-refresher.md) |
