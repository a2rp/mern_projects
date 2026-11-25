# 009 - Asynchronous JavaScript: Callbacks, Promises, and Async/Await

## Learning goals

By the end of this lesson, you should be able to:

- Explain why JavaScript applications use asynchronous operations.
- Describe how callbacks report the result of an operation.
- Read Promise states and chain `then`, `catch`, and `finally`.
- Use `async` and `await` to write Promise-based code clearly.
- Handle failures from asynchronous operations.
- Run independent operations with `Promise.all` or `Promise.allSettled`.
- Explain why awaiting an operation does not block the whole JavaScript runtime.
- Avoid mistakes such as forgetting to return or handle a Promise.

## Why asynchronous JavaScript matters

A web application often waits for work outside the current JavaScript call: a network request, a file read, a timer, or a database query. Waiting synchronously for every operation would prevent the program from doing other work in the meantime.

In a browser, an unresponsive main thread can delay input and rendering. In Node.js, blocking JavaScript can delay other requests handled by the process. Asynchronous APIs let the runtime arrange for JavaScript to continue after the result is ready.

Asynchronous does not mean that every operation runs at the same time on another JavaScript thread. The JavaScript callback or continuation runs when the host runtime schedules it. Some I/O may be handled by the operating system or runtime; CPU-heavy JavaScript still occupies the thread that runs it.

## Synchronous and asynchronous order

Synchronous statements run in order:

~~~js
console.log("First");
console.log("Second");
console.log("Third");
~~~

Output:

~~~text
First
Second
Third
~~~

A timer callback runs later, after the current synchronous code has finished:

~~~js
console.log("Start");

setTimeout(() => {
  console.log("Timer callback");
}, 0);

console.log("End");
~~~

Output:

~~~text
Start
End
Timer callback
~~~

A delay of zero does not mean "run right now." It means the timer callback becomes eligible after the current work, subject to the runtime's scheduling rules.

## The event loop, tasks, and Promise reactions

The host environment coordinates JavaScript with timers, user events, network activity, and other work. When the current synchronous work finishes, the environment can run scheduled callbacks. Promise reactions such as callbacks registered with `then` are queued as microtasks; timer callbacks are scheduled through timer task mechanisms.

This example shows the usual ordering:

~~~js
console.log("Start");

setTimeout(() => {
  console.log("Timer callback");
}, 0);

Promise.resolve().then(() => {
  console.log("Promise reaction");
});

console.log("End");
~~~

Output:

~~~text
Start
End
Promise reaction
Timer callback
~~~

The current synchronous code runs first. Promise reactions run after that code, before this timer callback in this example. Do not use a particular timer delay as a precise clock or rely on an ordering between unrelated host tasks.

## Callbacks

A **callback** is a function passed to another function so it can be called later or used to handle a result.

~~~js
function loadLesson(onSuccess) {
  setTimeout(() => {
    onSuccess({ title: "Asynchronous JavaScript" });
  }, 100);
}

loadLesson((lesson) => {
  console.log(lesson.title);
});
~~~

Output:

~~~text
Asynchronous JavaScript
~~~

The caller supplies the action that should happen when the lesson data is ready. The timer represents delayed work in this small example; it does not access a database.

### Error-first callbacks

Some Node.js APIs use a convention of passing an error as the first callback argument. When there is no error, that argument is `null`:

~~~js
function readRecord(callback) {
  setTimeout(() => {
    const error = null;
    const record = { id: 12, title: "Callbacks" };

    callback(error, record);
  }, 50);
}

readRecord((error, record) => {
  if (error) {
    console.error("Could not read the record:", error.message);
    return;
  }

  console.log(record.title);
});
~~~

This convention works, but several dependent asynchronous operations can lead to deeply nested callbacks. Every path also needs clear error handling.

## Promises

A **Promise** represents the eventual result of an operation. It has one of three states:

- **Pending:** the operation has not settled.
- **Fulfilled:** it completed successfully with a value.
- **Rejected:** it failed with a reason, often an Error object.

A settled Promise does not switch to another state. Its result is observed by attaching reactions.

### Create and consume a Promise

The Promise constructor receives an executor function. Its `resolve` function fulfills the Promise; `reject` rejects it. The executor runs immediately when the Promise is created; the timer or API call inside it is what represents delayed work:

~~~js
function loadLesson() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const lesson = { title: "Promises" };

      if (!lesson.title) {
        reject(new Error("The lesson has no title."));
        return;
      }

      resolve(lesson);
    }, 50);
  });
}

loadLesson()
  .then((lesson) => {
    console.log(lesson.title);
  })
  .catch((error) => {
    console.error("Could not load lesson:", error.message);
  });
~~~

Output:

~~~text
Promises
~~~

In a real application, a Promise often comes from an API such as `fetch` or a database library. Avoid wrapping an existing Promise in a new Promise without a specific reason; return or chain the existing Promise instead.

### Chain Promise operations

`then` returns a new Promise. Return the next value or Promise from a `then` callback so the following step receives it:

~~~js
function loadNumber() {
  return Promise.resolve(4);
}

loadNumber()
  .then((number) => {
    return number * 3;
  })
  .then((result) => {
    console.log(result);
  });
~~~

Output:

~~~text
12
~~~

If a callback returns another Promise, the next step waits for that Promise to settle. If a callback throws, the Promise returned by `then` becomes rejected.

### Handle errors and cleanup

Use `catch` to handle a rejection. It also catches errors thrown by earlier Promise-chain callbacks:

~~~js
Promise.reject(new Error("Network unavailable"))
  .catch((error) => {
    console.log("Request failed:", error.message);
  });
~~~

Output:

~~~text
Request failed: Network unavailable
~~~

`finally` runs after the Promise settles, whether it fulfilled or rejected. It is useful for cleanup such as clearing a loading indicator:

~~~js
loadLesson()
  .then((lesson) => console.log(lesson.title))
  .catch((error) => console.error(error.message))
  .finally(() => console.log("Loading finished"));
~~~

A `finally` callback normally does not replace the original result. If it throws or returns a rejected Promise, however, the Promise produced by `finally` can reject.

## Async functions and await

An `async` function always returns a Promise. A normal return value becomes that Promise's fulfillment value; an uncaught throw becomes its rejection:

~~~js
async function getLessonTitle() {
  return "Async functions";
}

getLessonTitle().then((title) => {
  console.log(title);
});
~~~

Output:

~~~text
Async functions
~~~

Use `await` inside an async function to wait for a Promise's fulfillment value:

~~~js
function loadLesson() {
  return Promise.resolve({ title: "Async and await" });
}

async function showLesson() {
  const lesson = await loadLesson();
  console.log(lesson.title);
}

showLesson();
~~~

Output:

~~~text
Async and await
~~~

`await` suspends the rest of that async function until the Promise settles. It does not synchronously freeze the whole runtime; other work can be scheduled while it is waiting. If the awaited Promise rejects, the `await` expression throws that rejection reason.

### Catch errors with try and catch

Use ordinary `try`/`catch` around awaited work:

~~~js
async function showLesson() {
  try {
    const lesson = await loadLesson();
    console.log(lesson.title);
  } catch (error) {
    console.error("Could not show the lesson:", error.message);
  } finally {
    console.log("Finished attempting to load the lesson.");
  }
}
~~~

A `try`/`catch` only handles a rejection if the Promise is awaited or otherwise connected to the handled flow. Calling an async function and ignoring the Promise can leave a failure unhandled:

~~~js
showLesson();
~~~

At a boundary such as a top-level script, a route handler, or an event handler, decide how errors should be handled. Return, await, or catch the Promise according to the API and framework being used.

### Sequential work

Use sequential `await` when one operation depends on the previous result:

~~~js
async function loadTaskDetails(taskId) {
  const task = await getTask(taskId);
  const owner = await getUser(task.ownerId);

  return { task, owner };
}
~~~

The user lookup needs the task's owner ID, so it starts after the task is available.

### Independent work with Promise.all

If operations are independent, start them before awaiting their combined results:

~~~js
async function loadDashboard(userId) {
  const tasksPromise = getTasks(userId);
  const profilePromise = getProfile(userId);

  const [tasks, profile] = await Promise.all([
    tasksPromise,
    profilePromise,
  ]);

  return { tasks, profile };
}
~~~

`Promise.all` fulfills with results in input order after every input fulfills. If one input rejects, the combined Promise rejects; other operations that have already started are not automatically cancelled.

This can reduce total waiting time when operations do not depend on each other. It does not make CPU-heavy JavaScript run in parallel.

### Promise.allSettled for independent outcomes

Use `Promise.allSettled` when you need the outcome of every operation even if some fail:

~~~js
async function inspectOutcomes() {
  const outcomes = await Promise.allSettled([
    getProfile("user-1"),
    getTasks("user-1"),
  ]);

  for (const outcome of outcomes) {
    if (outcome.status === "fulfilled") {
      console.log("Loaded a value");
    } else {
      console.log("One operation failed:", outcome.reason);
    }
  }
}

inspectOutcomes();
~~~

Each result has a `status` of `"fulfilled"` or `"rejected"`. A fulfilled result contains `value`; a rejected result contains `reason`.

## Async array callbacks

An async callback returns a Promise. So `map` with an async callback creates an array of Promises, not an array of completed values:

~~~js
async function loadTasks(taskIds) {
  const taskPromises = taskIds.map(async (id) => {
    return getTask(id);
  });

  const tasks = await Promise.all(taskPromises);
  return tasks;
}
~~~

The `Promise.all` step waits for all task lookups. Avoid this common mistake:

~~~js
async function loadTasksIncorrectly(taskIds) {
  const tasks = taskIds.map(async (id) => getTask(id));
  console.log(tasks[0].title);
}
~~~

Here `tasks[0]` is a Promise, so it does not have the completed task's `title`. Await the Promise or use `Promise.all` to collect the results.

Use sequential iteration when each operation depends on the previous one or when you deliberately want to limit how many operations run at once. Starting too many requests together can overload a service or hit rate limits.

## Fetching data and checking HTTP responses

In a browser client, `fetch` returns a Promise for a Response. A network failure rejects the Promise, but an HTTP error status such as 404 still produces a Response; check `response.ok` before treating it as a successful result:

~~~js
async function loadTasks() {
  const response = await fetch("/api/tasks");

  if (!response.ok) {
    throw new Error("Request failed with status " + response.status);
  }

  return response.json();
}
~~~

`response.json()` is also asynchronous and returns a Promise. The example awaits `fetch` and returns that parsing Promise to its caller. The caller must still handle errors. A production client may also need loading state, cancellation, authentication, input validation, and user-facing error messages.

## Timers are not precise clocks

A timer sets a minimum delay before its callback is eligible to run. Busy synchronous work, other scheduled work, runtime scheduling, and system load can make it run later than requested. Use a timer for scheduling, not for measuring exact elapsed time.

## Common mistakes to avoid

- Assuming asynchronous code runs before the next synchronous statement.
- Treating a timer delay of zero as an immediate callback or an exact deadline.
- Forgetting to return a value or Promise from a `then` callback.
- Calling an async function without handling the Promise it returns.
- Assuming `await` blocks the whole browser or Node.js runtime.
- Awaiting independent requests one by one when they can be started together.
- Using `Promise.all` without considering how one rejection affects the combined result.
- Treating Promises from `array.map(async ...)` as completed values.
- Assuming `fetch` rejects for HTTP error statuses without checking `response.ok`.
- Using too much concurrency without considering rate limits, resources, or cancellation.
- Catching an error and silently pretending the operation succeeded.

## Practice

1. Add a timer callback and predict which synchronous messages print first.
2. Create a Promise that resolves with a lesson object after a short timer.
3. Reject a Promise with an Error and handle it with `catch`.
4. Convert a Promise chain to an async function with `await`.
5. Throw inside an async function and handle its rejected Promise.
6. Load a task and then its owner sequentially because the second operation needs the first result.
7. Start independent profile and task requests together with `Promise.all`.
8. Use `Promise.allSettled` and print a message for each fulfilled or rejected outcome.
9. Use `map` with an async callback and then collect the Promises with `Promise.all`.
10. Make a fetch request and check `response.ok` before parsing the response body.
11. Add a `finally` callback that always resets a loading indicator.
12. Explain why a long synchronous loop can delay timers and requests from being handled by JavaScript.

## Key takeaways

- Asynchronous APIs let an application continue scheduling work while it waits for I/O or timers.
- A callback is a function passed to run later; a Promise represents an eventual fulfillment or rejection.
- `then` returns a new Promise, and errors can flow through `catch`.
- An async function returns a Promise; `await` unwraps its fulfillment value inside that function and throws on rejection.
- Use sequential awaits for dependent work and `Promise.all` for independent work that must all succeed.
- Use `Promise.allSettled` when each operation's result should be inspected independently.
- Async callbacks in array methods return Promises; collect them intentionally.
- Catch failures at the boundary where the application can respond appropriately.
- The next lesson covers errors, exceptions, and debugging JavaScript.

---

### Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| :--- | :--- | :--- | :---: |
| [008 - Modern JavaScript syntax and modules](008-modern-javascript-syntax-and-modules.md) | [Q&A](../qnas/009-asynchronous-javascript-callbacks-promises-and-async-await.md) | [Example](../examples/009-asynchronous-javascript-callbacks-promises-and-async-await.md) | [010 - Errors, exceptions, and debugging JavaScript](010-errors-exceptions-and-debugging-javascript.md) |
