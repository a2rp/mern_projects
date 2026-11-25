# Example 010 - Errors, Exceptions, and Debugging JavaScript

## Question

How can a Node.js program validate task input, report expected validation problems, handle a failed asynchronous save, keep the original failure for developers, and still clean up after every attempt?

## Goal

Build a small task-creation demo with one file. The program simulates saving a task; it does not connect to MongoDB or another service. It uses only Node.js and requires no package installation.

You will see three outcomes:

1. A valid task is saved.
2. Invalid input produces a clear validation message.
3. A simulated storage failure produces a safe summary and a developer detail from the original cause.

## Complete example

Create a folder named `task-error-demo` and save the following as `app.mjs`.

~~~js
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

class TaskSaveError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = "TaskSaveError";
    this.cause = cause;
  }
}

function validateTask(input) {
  if (
    input === null ||
    typeof input !== "object" ||
    Array.isArray(input)
  ) {
    throw new ValidationError("Task input must be an object.");
  }

  const title =
    typeof input.title === "string" ? input.title.trim() : "";

  if (title === "") {
    throw new ValidationError("Task title is required.");
  }

  const priority = input.priority ?? "normal";
  const allowedPriorities = ["low", "normal", "high"];

  if (!allowedPriorities.includes(priority)) {
    throw new ValidationError(
      "Priority must be low, normal, or high.",
    );
  }

  return { title, priority };
}

async function saveTask(task, { simulateFailure = false } = {}) {
  if (simulateFailure) {
    throw new Error("Storage is unavailable for this demo.");
  }

  // A real application would await a database operation here.
  return {
    id: "task-001",
    title: task.title,
    priority: task.priority,
  };
}

async function createTask(input, options) {
  const task = validateTask(input);

  try {
    return await saveTask(task, options);
  } catch (cause) {
    throw new TaskSaveError("Could not save task.", cause);
  }
}

async function runAttempt(label, input, options) {
  console.log("Attempt: " + label);

  try {
    const task = await createTask(input, options);

    console.log(
      "Saved " +
        task.id +
        ": " +
        task.title +
        " (" +
        task.priority +
        ")",
    );
  } catch (error) {
    if (error instanceof ValidationError) {
      console.log("Validation issue: " + error.message);
    } else if (error instanceof TaskSaveError) {
      console.log("Save issue: " + error.message);

      if (error.cause instanceof Error) {
        console.log("Developer detail: " + error.cause.message);
      }
    } else {
      // Unknown failures should reach the program's top-level handler.
      throw error;
    }
  } finally {
    console.log("Attempt finished.");
  }
}

async function main() {
  await runAttempt("valid task", {
    title: "  Learn error handling  ",
    priority: "normal",
  });

  await runAttempt("invalid task", {
    title: "   ",
    priority: "high",
  });

  await runAttempt(
    "simulated storage outage",
    {
      title: "Practice safe error messages",
      priority: "high",
    },
    { simulateFailure: true },
  );
}

main().catch((error) => {
  console.error("Unexpected program failure:", error);
  process.exitCode = 1;
});
~~~

## Run the example

Open a terminal in `task-error-demo` and run:

~~~sh
node app.mjs
~~~

The file uses the `.mjs` extension, so Node.js treats it as an ES module. No database, server, or npm package is required.

## Expected output

~~~text
Attempt: valid task
Saved task-001: Learn error handling (normal)
Attempt finished.
Attempt: invalid task
Validation issue: Task title is required.
Attempt finished.
Attempt: simulated storage outage
Save issue: Could not save task.
Developer detail: Storage is unavailable for this demo.
Attempt finished.
~~~

## What the program demonstrates

| Feature | Where it appears | What it does |
| --- | --- | --- |
| Custom validation error | `ValidationError` | Marks an expected input problem so the caller can handle it clearly. |
| Input validation | `validateTask` | Checks the input shape, trims the title, and restricts priority values. |
| Throwing an Error | Validation checks and `saveTask` | Stops an operation when it cannot satisfy its contract. |
| Async failure | `saveTask` | Simulates an operation that rejects before it can save. |
| Preserved cause | `TaskSaveError` | Adds operation context and keeps the lower-level error for developer diagnostics. |
| Promise rejection handling | `await createTask` inside `runAttempt` | Lets the matching `catch` handle either a thrown validation error or a rejected save. |
| Error categories | `instanceof ValidationError` and `instanceof TaskSaveError` | Chooses different handling for expected validation and save failures. |
| Cleanup | `finally` in `runAttempt` | Prints a completion message for success and handled failures. |
| Final safety boundary | `main().catch(...)` | Reports an unexpected error and sets a failing process exit code. |

## Explanation

`validateTask` runs before the save operation. It throws a `ValidationError` for invalid input, such as a blank title or an unsupported priority. Because validation is outside the save `try` block, a validation error keeps its correct category instead of being mislabeled as a storage problem.

`saveTask` is asynchronous to model a database call. The first attempt returns a saved task. The third attempt receives an option that deliberately makes the save fail, so the function throws an ordinary Error.

`createTask` awaits the save and catches only failures from that operation. It wraps the original failure in a `TaskSaveError`, which explains which action failed and keeps the original error in `cause`. This lets the caller present a short operation-level message while retaining the specific detail for debugging.

`runAttempt` awaits `createTask` inside a `try` block. It handles validation failures and save failures differently. Unknown errors are rethrown to the top-level boundary rather than being silently ignored. Its `finally` block runs after each attempt, including when a failure is handled.

The user-facing message can be kept short, while an appropriate developer log can include the cause. In a real service, decide carefully where logs are stored and avoid including secrets or private user data.

## Try these changes

1. Change the invalid task's title to a non-empty string. The validation message should disappear.
2. Remove the priority from the valid task. The nullish fallback assigns the normal priority.
3. Set its priority to an unsupported value. Observe the validation error.
4. Remove `await` before `createTask` in `runAttempt`. Notice why the local `try`/`catch` no longer handles the Promise rejection.
5. Temporarily remove the `finally` block and compare the completion messages.
6. Change the simulated save failure message. The user-safe save summary stays the same while the developer detail changes.
7. Add another known error class and handle it separately only if it needs different behavior.
8. Put a breakpoint inside `validateTask` and inspect `input`, `title`, and `priority` for each attempt.

## Key takeaways

- Validate input before starting work that depends on it.
- Use Error objects and meaningful categories for failures callers need to handle differently.
- Await asynchronous work inside the `try` that should catch its rejection.
- Add useful context while keeping the original cause available for debugging.
- Use `finally` for cleanup that must happen after every outcome.
- Let unexpected errors reach a boundary that can report failure instead of swallowing them.
- Keep user-facing messages safe and concise; keep diagnostic details in appropriate logs.

## Related chapter files

- [Lesson 010 - Errors, exceptions, and debugging JavaScript](../lessons/010-errors-exceptions-and-debugging-javascript.md)
- [Q&A 010 - Errors, exceptions, and debugging JavaScript](../qnas/010-errors-exceptions-and-debugging-javascript.md)
- [Example 009 - Asynchronous JavaScript: callbacks, promises, and async await](009-asynchronous-javascript-callbacks-promises-and-async-await.md)

---

### Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Next chapter |
| :--- | :--- | :--- | :---: |
| [009 - Asynchronous JavaScript](../lessons/009-asynchronous-javascript-callbacks-promises-and-async-await.md) | [Lesson](../lessons/010-errors-exceptions-and-debugging-javascript.md) | [Q&A](../qnas/010-errors-exceptions-and-debugging-javascript.md) | [011 - Node.js runtime and process model](../lessons/011-node-js-runtime-and-process-model.md) |
