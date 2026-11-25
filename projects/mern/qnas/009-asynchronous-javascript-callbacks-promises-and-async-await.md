# 009 - Asynchronous JavaScript: Callbacks, Promises, and Async/Await: Questions and Answers

Use these questions to review asynchronous execution, callbacks, Promise behavior, async functions, error handling, concurrency, and HTTP responses. Each answer includes an explanation.

Related lesson: [009 - Asynchronous JavaScript: callbacks, promises, and async await](../lessons/009-asynchronous-javascript-callbacks-promises-and-async-await.md)

## Multiple-choice questions

### 1. Why do applications use asynchronous APIs for network and file operations?

- A. To keep the application able to schedule other work while it waits
- B. To make every operation run on a new JavaScript thread
- C. To guarantee that every operation finishes immediately
- D. To avoid handling errors

**Answer: A.** Asynchronous APIs allow the runtime to continue scheduling other work while an operation such as I/O is pending. They do not automatically create a JavaScript thread per operation.

### 2. What happens to ordinary synchronous statements?

- A. They run in order in the current execution
- B. They wait until every network request finishes
- C. They run only after timers
- D. Their order is always random

**Answer: A.** Synchronous statements execute in order until the current call stack completes or the code yields through an asynchronous mechanism.

### 3. What does a timer delay of zero mean?

- A. Its callback runs before the next statement
- B. Its callback is eligible after the current work, subject to scheduling
- C. It runs at an exact zero-millisecond deadline
- D. The callback is cancelled

**Answer: B.** A zero delay does not run the callback immediately or guarantee an exact time. The callback runs later according to the host runtime's scheduling.

### 4. What are the three states of a Promise?

- A. Waiting, running, and stopped
- B. Pending, fulfilled, and rejected
- C. Started, paused, and resumed
- D. Open, closed, and broken

**Answer: B.** A Promise begins pending and eventually fulfills with a value or rejects with a reason.

### 5. When does a Promise constructor's executor function run?

- A. Immediately when the Promise is constructed
- B. Only after a call to `then`
- C. Only after the timer in the executor expires
- D. Only when the Promise is rejected

**Answer: A.** The executor is called synchronously by the Promise constructor. Work scheduled inside it, such as a timer callback, can complete later.

### 6. What does `then` return?

- A. Always the original Promise
- B. A new Promise representing the next chain step
- C. The callback function itself
- D. A timer ID

**Answer: B.** `then` returns a new Promise. The callback's returned value or Promise determines how that next Promise settles.

### 7. What happens if a `then` callback throws an error?

- A. The Promise returned by `then` is rejected
- B. The original Promise becomes pending forever
- C. The error is silently ignored in every case
- D. The callback is re-run

**Answer: A.** A thrown error turns the Promise from that chain step into a rejection, which a later `catch` can handle.

### 8. What is a common purpose of `finally`?

- A. Cleanup that should happen after either fulfillment or rejection
- B. Replacing every successful value with undefined
- C. Retrying a rejected request automatically
- D. Cancelling every operation in a Promise chain

**Answer: A.** `finally` is useful for cleanup, such as resetting a loading indicator. If its callback throws or returns a rejected Promise, the resulting Promise can reject.

### 9. What does an async function always return?

- A. An array
- B. A Promise
- C. A timer
- D. A callback

**Answer: B.** An async function returns a Promise. A returned value fulfills that Promise; an uncaught throw rejects it.

### 10. What happens when an awaited Promise rejects?

- A. The `await` expression throws the rejection reason
- B. The `await` expression silently returns false
- C. The async function becomes synchronous
- D. The Promise is automatically retried

**Answer: A.** A rejection becomes a throw at the `await` expression. Use `try`/`catch` or handle the returned Promise at the caller.

### 11. When does sequential `await` make sense?

- A. When a later operation needs a result from the earlier one
- B. Whenever several independent requests are available
- C. To make operations run in parallel
- D. To ignore a Promise's result

**Answer: A.** If the second operation depends on the first result, await the first before starting the second.

### 12. What order does `Promise.all` use for fulfilled results?

- A. The order in which operations finish
- B. The order of the input iterable
- C. Alphabetical order
- D. A random order

**Answer: B.** The fulfillment array preserves input order even if the operations finish in a different order.

### 13. What happens to the Promise returned by `Promise.all` if one input rejects?

- A. It rejects with that failure; already-started work is not automatically cancelled
- B. It waits forever for every other operation to finish
- C. It fulfills with the rejected input removed
- D. It cancels every other operation

**Answer: A.** `Promise.all` rejects when an input rejects, but it does not cancel the other input operations automatically.

### 14. When is `Promise.allSettled` useful?

- A. When the outcome of every operation should be inspected
- B. When every operation must be cancelled after the first success
- C. When only the first fulfillment is needed
- D. When Promises should be converted to timers

**Answer: A.** `Promise.allSettled` fulfills after all inputs settle and returns a status record for each input.

### 15. What does `array.map(async callback)` return?

- A. An array of Promises
- B. An array of already unwrapped values
- C. One combined Promise
- D. A callback error

**Answer: A.** Each async callback returns a Promise, so `map` returns an array of those Promises. Use `Promise.all` when you need the fulfilled values together.

### 16. Does `await` block the entire JavaScript runtime?

- A. Yes, all timers and requests stop
- B. No, it suspends that async function while other work can be scheduled
- C. Yes, but only in a browser
- D. No, because it skips the rest of the function permanently

**Answer: B.** `await` pauses the continuation of its async function. It does not synchronously freeze the whole runtime.

### 17. What should a browser client check after a successful `fetch` call?

- A. `response.ok` before treating an HTTP status as successful
- B. Only whether the response object exists
- C. Whether the timer delay was zero
- D. Whether the server returned a Promise

**Answer: A.** `fetch` normally fulfills with a Response for HTTP error statuses too. Check `response.ok` and handle non-success status codes explicitly.

### 18. What does `response.json()` return?

- A. A Promise for the parsed response body
- B. A JSON file path
- C. A synchronous Boolean
- D. A timer callback

**Answer: A.** Parsing the response body is asynchronous; `response.json()` returns a Promise that should be awaited or returned.

### 19. Why can a long synchronous loop delay a timer callback?

- A. The loop occupies the JavaScript execution thread until it finishes
- B. Timers can run only when the loop is infinite
- C. The timer is automatically cancelled
- D. The timer becomes a Promise

**Answer: A.** JavaScript must finish the current synchronous work before it can run the scheduled callback on that execution thread.

### 20. What should code do with an async function call that can fail?

- A. Return, await, or catch its Promise at an appropriate boundary
- B. Ignore the Promise because async errors disappear
- C. Call the function twice
- D. Convert every error to a fulfilled Promise without logging

**Answer: A.** Async functions return Promises that can reject. The caller should decide how to handle errors rather than leaving them unobserved.

## Short-answer questions

### 1. What is a callback?

**Answer:** A callback is a function passed to another function so it can be called later or used to handle a result. Event handlers and timer handlers are common examples.

### 2. What does an error-first callback convention mean?

**Answer:** The callback receives an error value as its first argument, usually `null` on success, followed by any result values. The caller checks the error before using the result.

### 3. Why can deeply nested callbacks become difficult to maintain?

**Answer:** Each dependent operation nests another function, making the success path harder to read. Error handling and cleanup can also be repeated across multiple branches.

### 4. Describe the three Promise states.

**Answer:** A Promise is pending while its operation has not settled, fulfilled when it completes successfully with a value, and rejected when it fails with a reason. Once settled, its state does not change.

### 5. When should you use the Promise constructor?

**Answer:** Use it when you need to adapt a callback-based or otherwise non-Promise API into a Promise. An existing Promise should normally be returned or chained directly instead of wrapped unnecessarily.

### 6. Why should a `then` callback return the next value or Promise?

**Answer:** The Promise chain uses the callback's return value to settle the next Promise. Returning a Promise lets the chain wait for that operation; forgetting to return it can let the chain continue too early.

### 7. How can errors travel through a Promise chain?

**Answer:** A rejection or a thrown error rejects the Promise at that chain step. A later `catch` can handle it; if the handler throws or returns a rejected Promise, the chain remains rejected.

### 8. What does `finally` do?

**Answer:** It runs after a Promise fulfills or rejects, making it useful for cleanup. Its ordinary return value does not replace the original result, but an exception or rejected Promise from the callback can reject the resulting Promise.

### 9. What does an async function return when it returns a plain value?

**Answer:** It returns a fulfilled Promise whose value is that plain value. If an uncaught error is thrown, its returned Promise rejects.

### 10. What does `await` do inside an async function?

**Answer:** It waits for the awaited Promise's result within that function. Fulfillment provides the value; rejection is thrown at the await expression. Other runtime work can continue to be scheduled.

### 11. When should operations be awaited sequentially?

**Answer:** Await sequentially when a later operation depends on the earlier result, such as loading a task first and then using its owner ID to load that user.

### 12. When is `Promise.all` appropriate?

**Answer:** Use it when independent operations should all succeed before the program proceeds. It returns results in input order and rejects if any input rejects; it does not automatically cancel the other operations.

### 13. When is `Promise.allSettled` appropriate?

**Answer:** Use it when the program needs to inspect every result whether fulfilled or rejected, such as showing which independent dashboard panels loaded successfully.

### 14. What does `map` with an async callback produce, and how do you collect the values?

**Answer:** It produces an array of Promises. Pass that array to `Promise.all` and await the combined Promise to get an array of fulfillment values.

### 15. Why is this code incorrect if the caller expects a task object?

~~~js
const tasks = ids.map(async (id) => getTask(id));
console.log(tasks[0].title);
~~~

**Answer:** `tasks[0]` is a Promise, not the resolved task. Await the Promise or use `await Promise.all(tasks)` before reading task properties.

### 16. Does `await` make CPU-heavy JavaScript run on another thread?

**Answer:** No. Awaiting an operation does not move CPU-heavy JavaScript to another thread. A long synchronous computation can still block the JavaScript thread; worker threads or other strategies are needed for CPU-bound work.

### 17. Why should a client check `response.ok` after `fetch`?

**Answer:** A failed network operation generally rejects `fetch`, but an HTTP response such as 404 or 500 can still fulfill it with a Response. The client should inspect `response.ok` or status and handle an unsuccessful response deliberately.

### 18. Why is a timer delay not an exact deadline?

**Answer:** The delay is a threshold after which the callback can become eligible. Current synchronous work, other queued work, and runtime scheduling can make it run later.

### 19. What should an async route or event-handler boundary do with a rejected Promise?

**Answer:** It should return, await, or catch the Promise according to the framework and operation. The error should reach a handler that can log it, return an appropriate response, or show a useful message.

### 20. What is one risk of starting a large number of requests with `Promise.all`?

**Answer:** Although independent requests can overlap, starting too many at once may exhaust resources, overload a service, or exceed rate limits. Use a deliberate concurrency limit when needed.

## Review checklist

You are ready to move on when you can:

- Explain the difference between synchronous statements and scheduled asynchronous work.
- Describe callback and error-first callback patterns.
- Explain Promise states and how `then`, `catch`, and `finally` behave.
- Use `async`/`await` with suitable error handling.
- Choose sequential awaits, `Promise.all`, or `Promise.allSettled` for the task.
- Explain why async array callbacks produce Promises.
- Check HTTP responses and parsed data from `fetch`.
- Identify work that can block the JavaScript thread.

---

### Chapter navigation

| Previous chapter | Chapter lesson | Chapter example | Next chapter |
| :--- | :--- | :--- | :---: |
| [008 - Modern JavaScript syntax and modules](../lessons/008-modern-javascript-syntax-and-modules.md) | [Lesson](../lessons/009-asynchronous-javascript-callbacks-promises-and-async-await.md) | [Example](../examples/009-asynchronous-javascript-callbacks-promises-and-async-await.md) | [010 - Errors, exceptions, and debugging JavaScript](../lessons/010-errors-exceptions-and-debugging-javascript.md) |
