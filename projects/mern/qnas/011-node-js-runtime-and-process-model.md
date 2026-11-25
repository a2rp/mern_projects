# 011 - Node.js Runtime and Process Model: Questions and Answers

Use these questions to review Node.js runtime components, processes and threads, event-loop behavior, asynchronous I/O, process configuration, and shutdown. Each answer includes a short explanation.

Related lesson: [011 - Node.js runtime and process model](../lessons/011-node-js-runtime-and-process-model.md)

## Multiple-choice questions

### 1. What is Node.js?

- A. A JavaScript runtime environment that runs JavaScript outside a browser
- B. A JavaScript framework that only creates database schemas
- C. A browser page with a built-in document
- D. A programming language that replaces JavaScript

**Answer: A.** Node.js provides an environment and APIs for running JavaScript programs outside the browser.

### 2. What is V8's main role in Node.js?

- A. It executes JavaScript
- B. It stores application passwords
- C. It creates every HTTP response
- D. It replaces the operating system

**Answer: A.** V8 is the JavaScript engine used by Node.js to parse and execute JavaScript.

### 3. Which statement best describes libuv?

- A. It helps Node.js coordinate the event loop and asynchronous operations across platforms
- B. It is the JavaScript language specification
- C. It is the package manager included in every browser
- D. It stores every Node.js module in a database

**Answer: A.** libuv provides cross-platform support for the event loop and asynchronous operations.

### 4. Does Node.js provide the browser document object model by default?

- A. No, a Node.js process is not a browser page
- B. Yes, every Node.js script has a window and document
- C. Only after importing the process object
- D. Only when using an .mjs file

**Answer: A.** Node.js provides its own APIs. A browser's window and DOM are not available by default in Node.js.

### 5. What is a process?

- A. A running program with its own identity and resources
- B. A callback waiting in a timer queue
- C. A JavaScript expression
- D. A line in package.json

**Answer: A.** A process is a running program. It can contain one or more threads and has information such as a process ID.

### 6. Which statement describes a typical Node.js application?

- A. JavaScript callbacks usually run on one main JavaScript thread
- B. Node creates a new JavaScript thread for every request
- C. All file and network operations must block until finished
- D. A process can run only one request from start to finish

**Answer: A.** Node normally executes JavaScript callbacks on one main thread, while asynchronous work can make progress outside that JavaScript execution.

### 7. How can one Node.js process handle other work while an I/O operation is pending?

- A. The runtime arranges asynchronous I/O and schedules JavaScript to continue when a result is ready
- B. The JavaScript thread must spin in a loop until the I/O completes
- C. Every request is copied into a browser tab
- D. The operating system changes the JavaScript source code

**Answer: A.** Asynchronous I/O lets the JavaScript thread do other work while an operation waits.

### 8. What happens when a long synchronous loop runs on the main JavaScript thread?

- A. It can delay timers, callbacks, and other JavaScript work
- B. It automatically runs on a worker thread
- C. It makes the event loop run faster
- D. It pauses only the current user's browser

**Answer: A.** Synchronous JavaScript occupies the thread until it finishes, so other callbacks must wait.

### 9. What does the event loop coordinate?

- A. The scheduling and execution of callbacks and asynchronous work
- B. The creation of HTML tags in a browser
- C. The naming of JavaScript variables
- D. Git commits and branches

**Answer: A.** The event loop allows Node.js to process scheduled callbacks and asynchronous operations.

### 10. What does a timer delay of zero mean?

- A. The callback can run later when the runtime schedules it
- B. The callback runs before the next synchronous statement
- C. The callback runs at an exact zero-millisecond deadline
- D. The callback is cancelled

**Answer: A.** A zero-delay timer is scheduled work. Current JavaScript and other queued work run first.

### 11. What is true about setTimeout and setImmediate ordering?

- A. Their relative order can depend on where they are scheduled
- B. setTimeout always runs before every setImmediate callback
- C. setImmediate always runs before every setTimeout callback
- D. Neither function schedules a callback

**Answer: A.** The context matters. Application code should avoid depending on a universal ordering between them.

### 12. Which operation can keep a Node.js process alive?

- A. A server listening for connections
- B. A string stored in a variable
- C. A completed synchronous function call
- D. A Promise object with no active operation behind it

**Answer: A.** An active server, timer, socket, or similar resource can keep the event loop busy. A Promise object alone does not necessarily do so.

### 13. What does process.argv contain?

- A. The executable path, script path, and command-line arguments
- B. Only environment variables
- C. The current process's open file contents
- D. The browser's navigation history

**Answer: A.** Additional arguments appear after the executable and script path, beginning at index 2.

### 14. What kind of values does process.env provide?

- A. Environment variables represented as strings
- B. JavaScript functions loaded from the operating system
- C. Always typed numbers
- D. Only values from package.json

**Answer: A.** Values read from process.env are strings. Validate and convert them before using them as another type.

### 15. What does process.cwd() return?

- A. The current working directory from which the process is running
- B. The path to the Node.js executable
- C. The current user's password
- D. The name of the active event-loop phase

**Answer: A.** The current working directory depends on where the command was started.

### 16. What does a process exit code of 0 conventionally mean?

- A. The process completed successfully
- B. The process is waiting for a network request
- C. The program contains a syntax error
- D. The process must restart immediately

**Answer: A.** Shells and automation commonly interpret zero as success and a non-zero code as failure.

### 17. Why is process.exitCode often preferable to process.exit()?

- A. It reports a failure while allowing normal pending output and cleanup to finish
- B. It makes every operation synchronous
- C. It creates a new process for each callback
- D. It prevents the process from ever exiting

**Answer: A.** Setting process.exitCode allows Node.js to exit naturally after active work and output are finished.

### 18. Which kind of work is a good reason to consider worker threads?

- A. CPU-heavy JavaScript computation
- B. A short ordinary network request
- C. Reading one small command-line argument
- D. Printing a short message

**Answer: A.** Worker threads can run JavaScript in parallel and are useful for CPU-intensive work. They are usually unnecessary for ordinary asynchronous I/O.

### 19. Which statement about asynchronous I/O is accurate?

- A. The operation may progress through operating system facilities or a runtime worker pool, depending on the API
- B. Every asynchronous operation uses the same worker thread
- C. Every asynchronous operation runs on the main JavaScript call stack until completion
- D. It always means multiple JavaScript instructions execute in parallel

**Answer: A.** The implementation depends on the API and platform. The JavaScript callback generally runs later on the JavaScript thread.

### 20. When can Node.js normally exit on its own?

- A. When no active work remains to keep the event loop running
- B. Only after process.exit() is called
- C. Only after the computer is shut down
- D. Immediately after importing the first module

**Answer: A.** A script can finish naturally when its active timers, servers, sockets, and other work are complete or closed.

## Short-answer questions

### 1. What does a runtime environment provide beyond the JavaScript language?

**Answer:** It executes JavaScript and provides host features such as modules, timers, filesystem or network APIs, and information about the current process. The available APIs depend on the runtime.

### 2. Describe the high-level roles of V8, Node.js APIs, and libuv.

**Answer:** V8 executes JavaScript. Node.js APIs expose features such as filesystem access, networking, and process information. libuv helps coordinate the event loop and asynchronous operations across supported operating systems.

### 3. What is the difference between a process and a thread?

**Answer:** A process is a running program with its own identity and resources. A thread is an execution path within a process. A process can have multiple threads.

### 4. If JavaScript usually runs on one main thread, how can Node.js handle concurrent I/O?

**Answer:** The runtime can arrange for I/O to progress without keeping JavaScript in a blocking wait. The main thread can run other callbacks, and Node.js schedules a callback or continuation when an operation has a result.

### 5. What is the event loop responsible for?

**Answer:** It coordinates when scheduled JavaScript callbacks run and allows asynchronous operations to make progress without blocking the main JavaScript thread while they wait.

### 6. Why can a CPU-heavy loop hurt a Node.js server?

**Answer:** The loop occupies the main JavaScript thread. Other callbacks, including handlers for requests and timers, must wait until the loop finishes.

### 7. Does asynchronous I/O mean the JavaScript callback runs in parallel with your current JavaScript?

**Answer:** No. The I/O can progress while JavaScript does other work, but the JavaScript continuation or callback usually runs on the JavaScript thread when it is scheduled.

### 8. Are all Node.js asynchronous operations implemented with the same mechanism?

**Answer:** No. Depending on the API and platform, work may use operating system facilities or a runtime worker pool. Application code should follow the API's documented behavior.

### 9. What is the difference between a timer threshold and an exact execution time?

**Answer:** A timer's delay is the time before its callback becomes eligible to run. Synchronous work and other scheduling can delay the callback beyond that threshold.

### 10. Why should code avoid assuming one fixed order for setTimeout and setImmediate?

**Answer:** Their relative order can depend on where they are scheduled and the event-loop context. Code should rely on documented API behavior rather than one observed ordering.

### 11. What do the first three common process.argv positions represent?

**Answer:** Index 0 is the Node executable path, index 1 is the script path, and index 2 begins the additional arguments supplied to the script.

### 12. Why should a program validate a value read from process.env?

**Answer:** Environment values are strings and may be missing or malformed. Validate and convert them before using them as ports, flags, or other typed configuration.

### 13. Why can process.cwd() differ between two runs of the same script?

**Answer:** It reports the directory from which the process was started, not necessarily the directory containing the script. The shell's current directory can differ between runs.

### 14. Name three kinds of active work that can keep Node.js running.

**Answer:** A listening server, an active timer, an open socket, an unclosed file handle, a child process, or another active runtime resource can keep the event loop active.

### 15. Does a never-settling Promise by itself always keep Node.js alive?

**Answer:** No. The active handle or operation behind the Promise keeps the event loop busy. A Promise object alone does not necessarily keep the process alive.

### 16. How should a command-line program report failure while allowing cleanup and output to finish?

**Answer:** It can set process.exitCode to a non-zero value and allow Node.js to exit naturally after active work completes, rather than forcibly terminating immediately.

### 17. What does graceful shutdown mean for a long-running API server?

**Answer:** Stop accepting new work, finish or cancel in-flight requests according to policy, close database and network resources, and then let the process exit.

### 18. When might worker threads be useful?

**Answer:** They can help run CPU-intensive JavaScript in parallel. Ordinary asynchronous I/O usually does not need a worker thread.

### 19. Why does a Node.js HTTP server remain running after startup?

**Answer:** Its listening server is an active resource that keeps the event loop available to accept incoming connections.

### 20. What is one security concern with process.env?

**Answer:** Environment variables often contain secrets such as credentials. Do not commit them into source files or print them in logs.

## Review checklist

You are ready to move on when you can:

- Explain Node.js as a runtime and name the high-level roles of V8, Node APIs, and libuv.
- Describe the difference between a process and a thread.
- Explain asynchronous I/O, the event loop, and why synchronous CPU work blocks callbacks.
- Identify runtime resources that keep a process alive.
- Read and validate process arguments and environment values.
- Explain exit codes and why process.exitCode is often safer than forced termination.
- Describe when worker threads and graceful shutdown are relevant.

---

### Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Chapter example | Next chapter |
| :--- | :--- | :--- | :--- | :---: |
| [010 - Errors, exceptions, and debugging JavaScript](../lessons/010-errors-exceptions-and-debugging-javascript.md) | [Lesson](../lessons/011-node-js-runtime-and-process-model.md) | Q&A | [Example](../examples/011-node-js-runtime-and-process-model.md) | [012 - Install and verify Node.js and npm](../lessons/012-install-and-verify-node-js-and-npm.md) |
