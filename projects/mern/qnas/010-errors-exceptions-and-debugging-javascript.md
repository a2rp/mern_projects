# 010 - Errors, Exceptions, and Debugging JavaScript: Questions and Answers

Use these questions to review JavaScript error types, thrown exceptions, Promise rejections, error propagation, and debugging practices. Each answer includes a short explanation.

Related lesson: [010 - Errors, exceptions, and debugging JavaScript](../lessons/010-errors-exceptions-and-debugging-javascript.md)

## Multiple-choice questions

### 1. What is a syntax or parse error?

- A. Source code the JavaScript parser cannot understand
- B. A program that runs but displays the wrong color
- C. A network request that takes longer than expected
- D. A valid value returned from a function

**Answer: A.** The parser must understand the source before that code can execute. A logic bug can run without a syntax error.

### 2. Which situation best describes a logic bug?

- A. A missing closing parenthesis prevents parsing
- B. A calculation runs but produces the wrong total
- C. An undeclared variable is read
- D. A Promise is rejected

**Answer: B.** Logic bugs produce incorrect behavior even though the program can run without throwing an exception.

### 3. What does a thrown exception usually do to the current execution path?

- A. It stops the current path and looks for a matching handler
- B. It retries the current line automatically
- C. It converts every error into a fulfilled Promise
- D. It skips directly to the next file

**Answer: A.** An exception interrupts the current path. If no handler catches it, it continues to propagate to the runtime boundary.

### 4. Which value should application code usually throw?

- A. An Error object
- B. An arbitrary number
- C. An HTML element
- D. A Promise that never settles

**Answer: A.** Error objects provide a name, message, and stack information that error handlers and debugging tools can use.

### 5. Which built-in error often indicates that an operation was used with a value of the wrong type?

- A. TypeError
- B. RangeError
- C. SyntaxError
- D. URIError

**Answer: A.** A TypeError often means the value does not support the operation being attempted, such as reading a property from null.

### 6. What does an Error object's message usually contain?

- A. A human-readable description of the failure
- B. The complete contents of every local variable
- C. A guaranteed stable programmatic identifier
- D. The browser's full history

**Answer: A.** A message is useful to people, but its wording can change. Use a stable error type or code for program decisions.

### 7. What information does a stack trace help you find?

- A. The sequence of calls leading to the error
- B. Every user who visited the page
- C. The CSS rules loaded by the browser
- D. The value of every variable for all time

**Answer: A.** The stack trace shows the call path associated with the error and can help locate relevant application code.

### 8. What happens if code inside a try block throws?

- A. Execution skips the rest of that block and enters its matching catch
- B. The exception is always ignored
- C. JavaScript restarts the whole program
- D. The finally block is permanently skipped

**Answer: A.** A matching catch receives the thrown value. The optional finally block runs afterward.

### 9. When should code catch an error?

- A. At a layer that can recover, add context, or report a safe failure
- B. In every function whether or not it can do anything
- C. Only to make the error disappear
- D. Only after returning a successful result

**Answer: A.** Error handling should make a meaningful decision. Catching and ignoring a failure can make the application report success incorrectly.

### 10. What is a suitable use for finally?

- A. Cleanup that should happen after success or failure
- B. Returning a replacement value from every function
- C. Retrying every request forever
- D. Hiding every stack trace by deleting the Error object

**Answer: A.** finally is useful for cleanup. Keep it focused on cleanup and avoid returning from it because that can override a result or suppress an exception.

### 11. Does this catch a later rejection from saveTask?

~~~js
try {
  saveTask(task);
} catch (error) {
  console.error(error);
}
~~~

- A. Yes, every Promise rejection is caught by any surrounding try
- B. No, the Promise is neither awaited nor caught
- C. Only if the Promise fulfills
- D. Only when the delay is zero

**Answer: B.** The call returns a Promise, and its later rejection is not a synchronous exception. Await it inside the try or attach a Promise catch.

### 12. Which version lets a try/catch handle a rejected Promise inside an async function?

- A. await saveTask(task) inside the try
- B. saveTask(task) without observing its Promise
- C. setTimeout(saveTask(task), 0)
- D. return error.message before calling it

**Answer: A.** Awaiting the Promise makes its rejection throw at the await expression, where the matching catch can handle it.

### 13. What happens when an async function throws an uncaught error?

- A. Its returned Promise rejects
- B. Its caller always receives null
- C. The runtime automatically retries the function
- D. The error becomes a syntax error

**Answer: A.** Async functions return Promises. A thrown error inside one rejects that Promise unless handled within the function.

### 14. What does it mean for an error to propagate?

- A. It moves to a caller or error boundary that can handle it
- B. It disappears after one function call
- C. It changes into a successful return value automatically
- D. It is written into the source file

**Answer: A.** A function that does not handle an exception lets it move up the call chain until a handler is reached.

### 15. What is the risk of throwing only error.message?

- A. It discards the original Error object's type and stack information
- B. It guarantees a better stack trace
- C. It retries the failing function
- D. It prevents the message from being displayed

**Answer: A.** Keep the original error or wrap it with additional context and preserve it as a cause.

### 16. Why should program logic avoid parsing an error's human-readable message?

- A. Message wording is not a reliable programmatic contract
- B. Messages are always empty
- C. Every message contains a password
- D. JavaScript cannot compare strings

**Answer: A.** Use a stable error class or code when program behavior must distinguish categories. Messages are primarily for people and may change.

### 17. What does a conditional breakpoint do?

- A. Pauses only when a specified condition is true
- B. Deletes a failing line from the program
- C. Catches every Promise rejection automatically
- D. Changes a variable's type

**Answer: A.** Conditional breakpoints help stop at the relevant iteration or input without pausing on every execution.

### 18. What is a useful first debugging step?

- A. Reproduce the problem and record the input and steps
- B. Rewrite unrelated files immediately
- C. Remove all error handling
- D. Assume the first visible symptom is the root cause

**Answer: A.** A repeatable failure gives you evidence to inspect and lets you confirm the fix later.

### 19. Which information is generally unsafe to include in error logs?

- A. Access tokens and passwords
- B. A non-sensitive request identifier
- C. The error category
- D. A safe task identifier

**Answer: A.** Secrets and private data should not be logged by default. Include only context needed to investigate the failure safely.

### 20. What should a user usually see when an internal operation fails?

- A. A short, safe message that explains what they can do next
- B. A complete internal stack trace with file paths
- C. Database credentials
- D. Every environment variable

**Answer: A.** Keep internal diagnostics in appropriate developer logs and show users a clear message that does not reveal implementation details.

## Short-answer questions

### 1. How do syntax errors, runtime errors, and logic bugs differ?

**Answer:** A syntax error prevents invalid source from being parsed. A runtime error is thrown while valid code runs. A logic bug allows the program to run but produces behavior different from the intended result.

### 2. What useful information can an Error object provide?

**Answer:** It commonly provides a name, a human-readable message, and a stack describing the call path. The stack is useful for developers and may reveal internal details.

### 3. Why is throwing a new Error usually preferable to throwing a string?

**Answer:** An Error object has a useful name and stack and is recognized by debugging tools. A bare string does not carry the same structured information.

### 4. When should a function throw an error?

**Answer:** When it cannot fulfill its documented contract and the caller should decide how to recover, report failure, or stop the operation. Expected alternatives may instead be represented with a deliberate result type.

### 5. What does a catch block need to do?

**Answer:** It should recover safely, convert a known failure into an appropriate result, add context and rethrow, or report the error at a suitable boundary. It should not silently discard a failure.

### 6. What is the purpose of finally?

**Answer:** It runs after the try path whether it succeeds or throws, making it useful for cleanup such as releasing a resource. Avoid returning from finally because that can override another return or suppress an exception.

### 7. How does an error move through ordinary function calls?

**Answer:** A function that does not catch an error lets it propagate to its caller. It continues through callers until a suitable handler catches it or the runtime reports it as unhandled.

### 8. How can a higher-level function add context without losing the original cause?

**Answer:** It can wrap the original error with a clearer operation-level message and keep the original as the new error's cause, when supported. Otherwise it can rethrow the original Error object.

### 9. Why does a synchronous try/catch not catch an unawaited Promise rejection?

**Answer:** The Promise rejects later, after the synchronous call has returned. Await the Promise inside the try block or handle it with a Promise catch.

### 10. What happens when await encounters a rejected Promise inside a try block?

**Answer:** The rejection is thrown at the await expression, so control enters the matching catch block.

### 11. What does the stack trace tell you?

**Answer:** It describes the chain of function calls associated with an error. Read it to locate the relevant application frame and follow the calls and values that led there.

### 12. Why are Error messages poor identifiers for branching logic?

**Answer:** Message wording is intended for people and can change. Use a stable type or code for decisions that the program must make.

### 13. What is one good use of a custom error class?

**Answer:** A validation error class can let a caller distinguish invalid user input from an unexpected failure. Use custom classes only when the distinction changes handling.

### 14. Describe a short, repeatable debugging process.

**Answer:** Reproduce the failure, read the error and stack, inspect the relevant values and assumptions, narrow down the first incorrect value with logs or a breakpoint, fix the cause, then reproduce the original case again.

### 15. What do step over, step into, and step out do?

**Answer:** Step over executes the current line without entering a called function. Step into enters a call. Step out runs until the current function returns to its caller.

### 16. What makes a log entry useful and safer?

**Answer:** Include the failed operation, error category or message, and only non-sensitive context needed to investigate, such as a request ID. Do not log passwords, tokens, or private data by default.

### 17. Why should applications separate user messages from developer diagnostics?

**Answer:** Users need a clear, safe description and possible next action. Developers need enough diagnostic detail to investigate. Internal stacks and implementation details can expose sensitive information if shown publicly.

### 18. What is an unhandled Promise rejection?

**Answer:** It is a rejected Promise for which application code has not attached an appropriate handler. Return, await, or catch asynchronous work at a boundary that can decide how to report or recover.

## Review checklist

You are ready to move on when you can:

- Tell a syntax error from a runtime exception and a logic bug.
- Use Error objects and explain the value of their names, messages, and stacks.
- Choose where an exception should be caught and what the handler should do.
- Use try/catch with await to handle Promise rejections.
- Preserve the original failure when adding useful context.
- Describe a debugging workflow using a stack trace, logs, or a breakpoint.
- Keep secrets and internal stack traces out of user-facing messages.

---

### Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Chapter example | Next chapter |
| :--- | :--- | :--- | :--- | :---: |
| [009 - Asynchronous JavaScript](../lessons/009-asynchronous-javascript-callbacks-promises-and-async-await.md) | [Lesson](../lessons/010-errors-exceptions-and-debugging-javascript.md) | Q&A | [Example](../examples/010-errors-exceptions-and-debugging-javascript.md) | [011 - Node.js runtime and process model](../lessons/011-node-js-runtime-and-process-model.md) |
