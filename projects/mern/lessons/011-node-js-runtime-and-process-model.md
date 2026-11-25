# 011 - Node.js Runtime and Process Model

## Learning goals

By the end of this lesson, you should be able to:

- Explain what a JavaScript runtime adds around the JavaScript language.
- Describe the roles of V8, Node.js APIs, and libuv at a high level.
- Distinguish a Node.js process from a JavaScript thread.
- Explain how the event loop lets Node.js coordinate asynchronous work.
- Recognize how synchronous, CPU-heavy work can block other callbacks.
- Read command-line arguments and environment values from the `process` object.
- Explain why a Node.js program stays alive or exits.
- Use exit codes and basic graceful-shutdown ideas appropriately.

## What is Node.js?

JavaScript is a language. To run a JavaScript program, an environment needs to parse and execute the language and provide useful features such as timers, file access, and networking.

Node.js is a JavaScript runtime environment for running programs outside a browser. It uses the V8 JavaScript engine to execute JavaScript and provides built-in APIs for tasks such as reading files, creating servers, working with streams, and inspecting the current process.

A browser runtime provides browser-specific objects such as `window` and the document object model. Node.js does not provide a browser page or DOM by default. A Node program can import modules and use Node APIs instead.

## A simplified view of the runtime

A useful beginner model has three parts:

- **V8** parses and executes JavaScript.
- **Node.js APIs** expose runtime features such as filesystem, networking, streams, modules, and process information.
- **libuv** helps Node.js coordinate its event loop and asynchronous operations across supported operating systems.

These parts work together. Your application usually calls a Node API rather than managing operating system details directly. Depending on the operation and platform, Node.js may use non-blocking operating system facilities or a worker pool for work that should not run on the JavaScript thread.

This is a simplified model, not a strict boundary for every operation. The important idea is that JavaScript callbacks still need time on a thread to run, even when the operation that produced their result happened elsewhere.

## Process and thread are different things

A **process** is a running program with its own process identity and resources. A Node.js process has a process ID, command-line arguments, environment values, open handles, and one or more threads.

In a typical Node.js application, JavaScript callbacks run on one main JavaScript thread. Node does not create one JavaScript thread for every incoming request. That does not mean it can handle only one request at a time. While one operation waits for asynchronous I/O, the process can schedule other callbacks.

Some runtime work can use operating system facilities or a worker pool. If you need to run CPU-heavy JavaScript in parallel, Node.js also provides worker threads. Worker threads are a separate topic; they do not need to be added to ordinary I/O code.

## The event loop

The **event loop** coordinates scheduled JavaScript callbacks and asynchronous work.

A simplified cycle looks like this:

1. Node.js runs the current synchronous JavaScript until the call stack is clear.
2. APIs may have started timers, filesystem work, network activity, or other operations.
3. When an operation has a result or a timer becomes eligible, its callback is queued for execution.
4. Node.js runs callbacks on the JavaScript thread as the event loop advances.
5. The process can exit naturally after there is no more active work keeping it alive.

Node.js has different event-loop phases for timers, I/O callbacks, polling for I/O, immediate callbacks, and close events. Promise reactions and the Node-specific next-tick queue also affect callback order. Most application code should depend on documented API behavior rather than trying to memorize every internal phase.

### A simple scheduling example

~~~js
console.log("1. Synchronous start");

setTimeout(() => {
  console.log("4. Timer callback");
}, 0);

Promise.resolve().then(() => {
  console.log("3. Promise callback");
});

console.log("2. Synchronous end");
~~~

Typical output:

~~~text
1. Synchronous start
2. Synchronous end
3. Promise callback
4. Timer callback
~~~

All ordinary synchronous statements in this script run first. The Promise reaction then runs before the timer callback in this example. A timer delay of zero does not mean "run before the next statement"; it schedules work for a later turn when the runtime can run it.

The exact relative order between some scheduling APIs can depend on where they are called. In particular, do not rely on one universal ordering for `setTimeout` and `setImmediate` in every context.

## Asynchronous I/O does not make JavaScript CPU work parallel

When code starts an asynchronous operation, the JavaScript thread can continue while the runtime or operating system waits for that operation. When the result is ready, JavaScript runs the continuation or callback on the JavaScript thread.

~~~js
import { readFile } from "node:fs/promises";

console.log("Before file read");

const contents = await readFile("notes.txt", "utf8");

console.log("File characters: " + contents.length);
console.log("After file read");
~~~

This top-level `await` is supported in an ES module such as a `.mjs` file. The file read does not require the JavaScript thread to sit idle in a blocking wait. The continuation runs once the result is available.

By contrast, synchronous JavaScript runs until it finishes. A long loop, expensive calculation, or synchronous filesystem operation can prevent timers and other callbacks from running on that thread.

~~~js
console.log("Start");

// A long synchronous calculation keeps this thread busy.
let total = 0;
for (let index = 0; index < 100000000; index += 1) {
  total += index;
}

console.log("Calculation finished: " + total);
~~~

In a server, blocking the event loop delays other JavaScript callbacks, including work for other clients. Keep request handlers short. For expensive CPU work, consider whether it can be reduced, moved to a worker thread, or handled by a separate process.

## What keeps a Node.js process alive?

Node.js normally exits when it has no active work left to perform. Examples of active work that can keep a process running include:

- A server that is listening for connections.
- A timer that has not fired or been cancelled.
- An open socket or file handle.
- A child process or another active runtime resource.

A Promise object by itself does not necessarily keep the process alive. The underlying active timer, socket, or other operation is what keeps the event loop busy. When the event loop has nothing left to do, Node.js can exit.

This is why a small script can finish by itself, while an HTTP server keeps running until it is stopped or closed.

## The process object

Node.js exposes information about the currently running program through the `process` object. You do not need to import it in ordinary CommonJS or ES module code.

### Command-line arguments

The `process.argv` array contains command-line arguments. The first entry is the Node.js executable path, the second is the script path, and later entries are values supplied to the script.

For example, run:

~~~sh
node app.mjs staging
~~~

Then read the extra argument:

~~~js
const mode = process.argv[2] ?? "development";
console.log("Mode: " + mode);
~~~

The output is:

~~~text
Mode: staging
~~~

### Environment values

`process.env` exposes environment variables as values supplied to the process. They are commonly used for configuration, such as a port or database connection string.

Environment values are strings when read from `process.env`. Validate and convert them before using them as numbers, booleans, or other types. Keep credentials out of source files and avoid printing secrets in logs.

~~~js
const rawPort = process.env.PORT ?? "3000";
const port = Number(rawPort);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be a valid TCP port number.");
}

console.log("Configured port: " + port);
~~~

This example reads an optional port, validates it, and reports only the non-secret numeric value.

### Other useful process properties

- `process.cwd()` returns the current working directory.
- `process.pid` is the process ID.
- `process.platform` identifies the operating system platform.
- `process.versions` reports versions of Node.js and runtime components.
- `process.exitCode` sets the code the process should return when it exits.

Avoid depending on a hard-coded current directory when a path should be relative to the source file. The current working directory depends on where the command was started.

## Exit codes and graceful shutdown

A process exit code communicates whether a command completed successfully. By convention, `0` means success and a non-zero code indicates failure.

Set `process.exitCode` when work has failed but Node.js should finish pending output and clean up normally:

~~~js
async function main() {
  try {
    await runJob();
  } catch (error) {
    console.error("Job failed:", error.message);
    process.exitCode = 1;
  }
}

main();
~~~

Avoid calling `process.exit()` just to set a failure code. It stops the process immediately and can interrupt pending output or cleanup. Let Node.js exit naturally after active work is complete.

Long-running servers also need graceful shutdown. At a high level, a service should stop accepting new work, allow or cancel in-flight work according to its policy, close database and network resources, and then exit. Later API and deployment chapters build on this process lifecycle.

## Common misconceptions

### "Node.js is single-threaded, so it cannot do work concurrently."

JavaScript callbacks in a typical process run on one main JavaScript thread, but asynchronous I/O can progress while that thread does other work. Concurrency is not the same as running every JavaScript instruction in parallel.

### "Every asynchronous operation runs in a worker thread."

No. Some operations use operating system facilities; some APIs use a worker pool; and the callback that handles a result generally runs on the JavaScript thread. The mechanism depends on the API.

### "A zero-delay timer runs immediately."

It schedules a callback that becomes eligible later. Current synchronous work and other queued work can delay it.

### "A pending Promise always keeps Node.js alive."

Not by itself. Active handles or operations, such as a server or timer, keep the event loop active.

### "I should call process.exit at the end of every script."

Usually the runtime exits when there is no active work. Use `process.exitCode` to report a failure while allowing normal completion.

## Key takeaways

- Node.js runs JavaScript outside a browser and provides APIs for server-side and system tasks.
- V8 executes JavaScript; Node.js APIs expose runtime capabilities; libuv coordinates the event loop and asynchronous operations.
- A process is not the same as a thread. Asynchronous I/O lets one JavaScript thread handle other work while an operation is pending.
- CPU-heavy synchronous code can block callbacks and delay requests.
- The event loop schedules callbacks, and exact ordering can depend on the API and context.
- Use `process.argv` for command-line values and `process.env` for configuration; validate both.
- Node.js exits naturally when active work is finished; prefer `process.exitCode` over forced termination.

## Review checklist

You are ready to move on when you can:

- Explain what the JavaScript runtime provides beyond the language itself.
- Describe the high-level roles of V8, Node.js APIs, and libuv.
- Distinguish a process from a thread and explain Node's usual JavaScript execution model.
- Explain why asynchronous I/O can overlap with other work without making CPU-bound JavaScript parallel.
- Identify work that can keep a Node.js process alive.
- Read a command-line argument and safely validate a configuration value.
- Explain why applications should avoid unnecessary calls to `process.exit()`.

---

### Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Chapter example | Next chapter |
| :--- | :--- | :--- | :--- | :---: |
| [010 - Errors, exceptions, and debugging JavaScript](010-errors-exceptions-and-debugging-javascript.md) | Lesson | [Q&A](../qnas/011-node-js-runtime-and-process-model.md) | [Example](../examples/011-node-js-runtime-and-process-model.md) | [012 - Install and verify Node.js and npm](012-install-and-verify-node-js-and-npm.md) |
