# Example 011 - Node.js Runtime and Process Model

## Question

What runs synchronously in a Node.js process, when do Promise and timer callbacks run, how can a script read its mode, and how can it report failure without forcing the process to stop?

## Goal

Build a small command-line program that:

- Reads a mode from a command-line argument or an environment variable.
- Shows synchronous code running before scheduled callbacks.
- Schedules a Promise reaction and a timer.
- Sets a non-zero exit code when asked to simulate a failure.
- Lets Node.js finish the active timer and exit naturally.

This example uses Node.js only. It does not start a server or require a package installation.

## Complete example

Create a folder named `node-process-demo` and save the following as `app.mjs`.

~~~js
const mode =
  process.argv[2] ?? process.env.APP_MODE ?? "development";
const shouldFail = process.argv.includes("--fail");

console.log("Node.js process started");
console.log("Mode: " + mode);

if (shouldFail) {
  console.log("Failure requested; exit code set to 1.");
  process.exitCode = 1;
}

setTimeout(() => {
  console.log("Timer callback");
}, 0);

Promise.resolve().then(() => {
  console.log("Promise reaction");
});

console.log("Synchronous work finished");
~~~

## Run the example

Open a terminal in `node-process-demo` and run:

~~~sh
node app.mjs staging
~~~

The first argument after the script name is `staging`. It is available as `process.argv[2]`, so the program uses it instead of the environment variable or the default.

## Expected output

~~~text
Node.js process started
Mode: staging
Synchronous work finished
Promise reaction
Timer callback
~~~

The synchronous messages appear first. The Promise reaction runs after the current synchronous JavaScript finishes. The timer callback runs later. Once the timer has completed and no other active work remains, Node.js can exit.

## Simulate a failed command

Run:

~~~sh
node app.mjs staging --fail
~~~

The output is:

~~~text
Node.js process started
Mode: staging
Failure requested; exit code set to 1.
Synchronous work finished
Promise reaction
Timer callback
~~~

The process still runs the scheduled callbacks. After normal work finishes, the shell receives a non-zero exit status because the code set `process.exitCode` to `1`. This illustrates why setting an exit code is useful when pending output or cleanup should finish.

## What the program demonstrates

| Feature | Where it appears | What it does |
| --- | --- | --- |
| Node process information | `process.argv` and `process.env` | Reads command-line input and environment configuration. |
| Command-line argument | `process.argv[2]` | Uses the first extra argument as the mode. |
| Environment fallback | `process.env.APP_MODE` | Uses configuration from the environment when no mode argument is supplied. |
| Default value | `"development"` | Gives the program a predictable mode when no input was provided. |
| Synchronous execution | The two initial `console.log` calls and final synchronous log | Runs in order before queued asynchronous callbacks. |
| Promise reaction | `Promise.resolve().then(...)` | Schedules a reaction that runs after the current synchronous JavaScript. |
| Timer callback | `setTimeout(...)` | Schedules a callback for a later event-loop turn. |
| Active work | The pending timer | Keeps the process available until the callback has run. |
| Exit status | `process.exitCode = 1` | Reports failure while allowing Node.js to exit naturally. |

## Explanation

The `process` object describes and controls parts of the current Node.js process. In this example, `process.argv[2]` is the optional mode argument. If no argument is present, `process.env.APP_MODE` is used. If the environment variable is also missing, the script uses `"development"`.

The program schedules a timer callback and a Promise reaction, but it does not pause the synchronous script to wait for either one. It reaches `Synchronous work finished` first. After the current synchronous work ends, the Promise reaction runs before the timer callback in this example.

The active timer keeps the process running until its callback is handled. After that, if no server, socket, timer, or other active resource remains, Node.js can exit on its own.

The optional `--fail` argument sets `process.exitCode` to `1`. It does not force an immediate shutdown. Pending work can finish, and the shell can still use the exit code to detect failure in a script or automation workflow.

## Try these changes

1. Run `node app.mjs` without an argument. The mode should use the environment value or fall back to development.
2. Set `APP_MODE` in your terminal, then run the program without a mode argument. It should use the environment setting. In PowerShell, use `$env:APP_MODE = "test"` for the current terminal session.
3. Run `node app.mjs production` and observe the selected mode.
4. Add `--fail` after the mode and check the command's exit status. In PowerShell, inspect it immediately with `$LASTEXITCODE`.
5. Add a longer synchronous loop before the callbacks. The timer will wait until that loop releases the JavaScript thread.
6. Add another Promise reaction and compare the order with the timer. Do not assume the same ordering for every event-loop API or context.
7. Remove the timer and observe that the script can exit after its remaining work has completed.

## Key takeaways

- A Node.js program runs inside a process with arguments, environment values, and active runtime resources.
- Synchronous JavaScript finishes its current work before scheduled callbacks can run.
- A Promise reaction and a timer are asynchronous callbacks, and their scheduling mechanisms differ.
- A pending timer can keep the process alive; a Promise object alone does not necessarily do so.
- Use `process.exitCode` to report a failure while allowing normal output and cleanup to finish.
- The process can exit naturally after active work is complete.

## Related chapter files

- [Lesson 011 - Node.js runtime and process model](../lessons/011-node-js-runtime-and-process-model.md)
- [Q&A 011 - Node.js runtime and process model](../qnas/011-node-js-runtime-and-process-model.md)
- [Example 010 - Errors, exceptions, and debugging JavaScript](010-errors-exceptions-and-debugging-javascript.md)

---

### Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Next chapter |
| :--- | :--- | :--- | :---: |
| [010 - Errors, exceptions, and debugging JavaScript](../lessons/010-errors-exceptions-and-debugging-javascript.md) | [Lesson](../lessons/011-node-js-runtime-and-process-model.md) | [Q&A](../qnas/011-node-js-runtime-and-process-model.md) | [012 - Install and verify Node.js and npm](../lessons/012-install-and-verify-node-js-and-npm.md) |
