# 010 - Errors, Exceptions, and Debugging JavaScript

## Learning goals

By the end of this lesson, you should be able to:

- Distinguish syntax errors, runtime errors, and logic bugs.
- Read an error's name, message, and stack trace to find where a failure started.
- Throw useful Error objects when an operation cannot continue.
- Use `try`, `catch`, and `finally` for deliberate error handling and cleanup.
- Handle both synchronous exceptions and rejected Promises.
- Preserve useful context while errors move through functions.
- Debug with logs, breakpoints, and a repeatable investigation process.
- Avoid swallowing errors or exposing internal details to users.

## What is an error?

An error is information that tells you an operation could not proceed as intended. A failure can come from invalid input, a bug in the program, an unavailable service, or an environment that is not configured as expected.

For example, a task service might receive a missing task ID, attempt to use a value that is not an object, or fail to reach a database. Good error handling helps code decide what to do next and helps a developer find the cause.

An error is not always a thrown exception. A program can also have a logic bug: it runs without throwing, but produces the wrong result. Debugging includes both handling exceptions and checking whether the program follows the intended rules.

## Three broad kinds of problems

### Syntax or parse errors

The source cannot be parsed as valid JavaScript, so that code cannot begin running. A missing parenthesis or an unmatched brace can cause this type of error.

~~~js
const total = (4 + 5;
~~~

Fix the syntax before investigating runtime behavior. The error location usually points near the part the parser could not understand.

### Runtime errors

The code parses, but an operation fails while it runs. Accessing a property on `null`, calling a non-function, or referencing an undeclared variable can produce a runtime exception.

~~~js
const task = null;
console.log(task.title);
~~~

The program reaches the access, then throws a `TypeError`. A thrown error interrupts the current path until code catches it or the runtime reports it as unhandled.

### Logic errors

The program runs, but the result is incorrect. For instance, using `>=` when the rule requires `>` can silently include one extra item. No exception is required for a logic bug.

Check the expected result, inspect important values, and trace the conditions that lead to it. Tests and debugging help reveal these cases.

## Error objects and common error names

JavaScript provides the built-in `Error` type and more specific error types. An error commonly has a `name`, a human-readable `message`, and a `stack` that describes the call path where it was created or thrown.

- `Error` is the general error type.
- `TypeError` often means a value is not of the kind an operation expects.
- `ReferenceError` often means code tried to use a name that is not available in that scope.
- `SyntaxError` reports invalid JavaScript syntax or invalid text parsed as a language such as JSON.
- `RangeError` reports a value outside an allowed range.

These names are useful clues, not a complete explanation. Read the message and stack, then inspect the values and code involved.

~~~js
const error = new TypeError("Expected a task object");

console.log(error.name);
console.log(error.message);
~~~

Output:

~~~text
TypeError
Expected a task object
~~~

The stack is most useful to developers. It can contain file paths, function names, and internal implementation details, so do not send it as a response to an end user.

## Throw an Error object when an operation cannot continue

Use `throw` to signal that a function cannot complete its contract. Throw an Error object with a message that describes the failure.

~~~js
function getTaskTitle(task) {
  if (task === null || typeof task !== "object") {
    throw new TypeError("Expected task to be an object");
  }

  if (typeof task.title !== "string" || task.title.trim() === "") {
    throw new Error("Task title is required");
  }

  return task.title.trim();
}
~~~

When the function throws, the caller's current path stops unless a matching `catch` handles the exception. The caller can then recover, return an error response, or report the failure at an appropriate boundary.

Prefer throwing Error objects over strings or numbers. Error objects carry a name and stack trace and work naturally with debugging tools and error handlers. Avoid a bare `throw` with an arbitrary value.

Use a specific built-in error type when it describes the problem clearly. For application rules, you can define your own type:

~~~js
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}
~~~

A custom type lets a caller distinguish an expected validation failure from an unexpected programming or infrastructure failure. Do not create many custom classes when a clear error message and one or two categories are enough.

## Handle synchronous exceptions with try and catch

Put code that may fail inside `try`. If it throws, JavaScript skips the rest of the `try` block and enters the matching `catch` block.

~~~js
try {
  const title = getTaskTitle({ title: "Review request" });
  console.log("Task: " + title);
} catch (error) {
  console.error("Could not read task:", error.message);
}
~~~

A `catch` block should make a deliberate choice:

- Recover if there is a safe alternative.
- Convert a known expected failure into a useful result.
- Add context and rethrow if a higher layer can handle it better.
- Log and report the failure at a boundary that can take action.

Do not catch an error just to ignore it. An empty handler can make failed work appear successful and leave the application in an inconsistent state.

A `try` block only protects code that runs inside it. It does not automatically catch an exception thrown later by an unrelated callback.

## Use finally for cleanup

The optional `finally` block runs after the `try` path finishes, whether it succeeds or throws. Use it for cleanup such as releasing a lock or ending a temporary operation.

~~~js
let connectionOpen = true;

try {
  console.log("Working with the connection");
} catch (error) {
  console.error("Operation failed:", error.message);
} finally {
  connectionOpen = false;
  console.log("Connection closed:", !connectionOpen);
}
~~~

Avoid returning from `finally`. A return from `finally` can override a return from `try` or suppress an exception. Let the main operation determine its result, and keep `finally` focused on cleanup.

## Errors across function calls

When a function does not handle an error, it propagates to its caller. The call stack shows the sequence of calls that led to the failure. Catch an error at the layer that has enough information to make a useful decision.

~~~js
function loadTask(id) {
  return findTaskRecord(id);
}

function showTask(id) {
  const task = loadTask(id);
  return task.title;
}

try {
  showTask("missing");
} catch (error) {
  console.error("Task screen could not load:", error.message);
}
~~~

In real code, the lookup might be asynchronous and reject a Promise. The same principle applies: let the failure reach a layer that can recover or communicate a safe result.

When adding context, preserve the original error if your runtime supports error causes:

~~~js
try {
  await saveTask(task);
} catch (cause) {
  throw new Error("Could not save task", { cause });
}
~~~

The cause connects the higher-level explanation to the lower-level failure. If you do not need a new layer of context, rethrow the same error with `throw error;`. Throwing only `error.message` discards its type and stack information.

## Handle Promise rejections

An `async` function returns a Promise. If it throws inside the function, its Promise rejects. Await that Promise inside a `try` block to catch the rejection.

~~~js
async function loadTaskPage(id) {
  try {
    const task = await getTaskFromApi(id);
    return { ok: true, task };
  } catch (error) {
    return { ok: false, message: "The task could not be loaded." };
  }
}
~~~

The `await` matters. This catches the rejection:

~~~js
try {
  await saveTask(task);
} catch (error) {
  console.error("Save failed:", error.message);
}
~~~

This does not catch a later rejection from the Promise:

~~~js
try {
  saveTask(task);
} catch (error) {
  console.error("This will not catch a Promise rejection");
}
~~~

Return or await asynchronous work so the caller can observe its result. If you intentionally start work without awaiting it, attach a rejection handler and decide what should happen if it fails.

A rejected Promise is a failure signal, not a reason to silently continue. Choose where it should be handled: a UI event boundary, an API route boundary, a command-line entry point, or another layer that can respond.

## A practical debugging workflow

When a program fails, work from evidence instead of guessing:

1. **Reproduce it.** Record the exact action, input, environment, and steps that trigger the failure.
2. **Read the error.** Note its name and message. Do not stop at the first line if a stack trace is available.
3. **Find your code in the stack.** Start at the first relevant application frame and inspect the surrounding call path.
4. **Check assumptions.** Inspect the value that failed, its type, and where it came from. Confirm whether an object, ID, response, or configuration value is actually present.
5. **Narrow the location.** Use a breakpoint, a targeted log, or a smaller reproduction to find the first incorrect value.
6. **Fix the cause.** Avoid masking the symptom with a broad catch or a default value that changes the program's meaning.
7. **Reproduce the original case again.** Confirm the failure is handled and that the normal path still works.

### Use logs carefully

A useful log states what operation failed and includes safe context, such as a task ID or request ID. Do not log passwords, access tokens, private user data, or complete request bodies by default.

~~~js
console.error("Could not save task", {
  taskId: task.id,
  message: error.message,
});
~~~

Keep user-facing messages separate from developer diagnostics. A user might see "We could not save your task. Try again." A developer log can include the error name, message, safe identifiers, and stack trace in an appropriate protected environment.

Avoid logging the same error at every layer. Usually one boundary should record it, while intermediate layers either handle it or let it propagate.

### Use a debugger

Browser developer tools and Node.js inspector support breakpoints. Pause before the failing operation, inspect local variables, and step through the code.

- A **breakpoint** pauses execution at a selected line.
- **Step over** runs the current line without entering a called function.
- **Step into** enters a function call.
- **Step out** finishes the current function and returns to its caller.
- The **call stack** shows the active chain of function calls.
- A **watch expression** lets you monitor a value as execution continues.
- A **conditional breakpoint** pauses only when a chosen condition is true.

For browser code, use the developer tools' Sources panel and Console. For Node.js, use the Node inspector or the debugging support in your editor. A debugger is especially helpful when the value becomes incorrect several calls before the exception is thrown.

## Common mistakes

### Catching without handling

~~~js
try {
  await chargeCard(order);
} catch (error) {
  // Ignoring the failure makes the caller believe the order completed.
}
~~~

Choose a safe recovery, return a clear failure result, or rethrow.

### Losing useful error information

~~~js
catch (error) {
  throw error.message;
}
~~~

Throw the original error or add context while retaining it as a cause.

### Catching only synchronous work

~~~js
try {
  loadDashboard();
} catch (error) {
  // A later Promise rejection does not enter this catch.
}
~~~

Use `await` inside the `try` or attach a `catch` to the Promise chain.

### Treating every failure as the same

A validation problem may be shown to a user, while an unavailable database should be logged and reported differently. Classify errors with a stable type or code when the application needs to choose different behavior. Avoid parsing a human-readable message to decide program flow; wording can change.

In Node.js, built-in errors can include a `code` property for categorizing certain system errors. Error messages are intended to help people and may change, so do not rely on message text as a programmatic contract.

### Exposing stack traces to users

Stacks help developers debug. Keep them in appropriate logs and show a short, safe message to users. Never include secrets in error messages or diagnostic output.

## Key takeaways

- Syntax errors prevent invalid source from running; runtime errors interrupt execution; logic bugs can produce wrong results without throwing.
- Error objects provide a name, message, and stack that help explain a failure.
- Throw an Error object when an operation cannot fulfill its contract.
- Catch errors where code can recover, add useful context, or report a safe failure.
- Await a Promise inside a `try` block to catch its rejection there.
- Use `finally` for cleanup and avoid returning from it.
- Debug by reproducing the failure, reading the stack, inspecting values, and confirming the fix.

## Review checklist

You are ready to move on when you can:

- Identify whether a problem is a syntax error, runtime exception, or logic bug.
- Explain how a thrown error moves through function calls.
- Write an Error object and handle a known failure with `try` and `catch`.
- Catch a rejected Promise with `await`.
- Explain why a synchronous `try` does not catch an unawaited Promise rejection.
- Use logs or a debugger to inspect the first incorrect value.
- Keep user messages safe while preserving useful developer diagnostics.

---

### Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Chapter example | Next chapter |
| :--- | :--- | :--- | :--- | :---: |
| [009 - Asynchronous JavaScript](009-asynchronous-javascript-callbacks-promises-and-async-await.md) | Lesson | [Q&A](../qnas/010-errors-exceptions-and-debugging-javascript.md) | [Example](../examples/010-errors-exceptions-and-debugging-javascript.md) | [011 - Node.js runtime and process model](011-node-js-runtime-and-process-model.md) |
