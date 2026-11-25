# Example 007 - Functions, Scope, Arrays, and Objects Refresher

## Question

How can a small task-list program use function inputs and returns, closures, array methods, object copies, and ES modules together?

## Goal

Build a small task summary from task records. The example is split into two JavaScript modules:

- `task-utils.mjs` contains task functions and a private ID counter kept by a closure.
- `app.mjs` imports those functions, builds task arrays, creates a nested object copy, and prints a summary.

The code uses Node.js built-in features only. It does not install packages or connect to a database.

## Complete example

Create a folder named `functions-scope-practice` and add these two files.

### 1. Create task-utils.mjs

~~~js
export function makeTaskIdGenerator() {
  let nextId = 1;

  return function nextTaskId() {
    const id = "task-" + nextId;
    nextId += 1;
    return id;
  };
}

export function createTask(nextTaskId, title, options = {}) {
  if (typeof title !== "string" || title.trim() === "") {
    throw new TypeError("Task title must be a non-empty string.");
  }

  if (typeof nextTaskId !== "function") {
    throw new TypeError("A task ID generator function is required.");
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
    throw new RangeError("Task priority must be low, normal, or high.");
  }

  return {
    id: nextTaskId(),
    title: title.trim(),
    completed,
    priority,
  };
}

export function formatTask({ title, priority }) {
  return "- " + title + " [" + priority + "]";
}
~~~

### 2. Create app.mjs

~~~js
import {
  createTask,
  formatTask,
  makeTaskIdGenerator,
} from "./task-utils.mjs";

const nextTaskId = makeTaskIdGenerator();

const tasks = [
  createTask(nextTaskId, "Read the lesson"),
  createTask(nextTaskId, "Practice arrays", { priority: "high" }),
  createTask(nextTaskId, "Review objects", {
    completed: true,
    priority: "low",
  }),
];

const addedTask = createTask(
  nextTaskId,
  "  Build a task summary  ",
  { priority: "high" },
);

const updatedTasks = [...tasks, addedTask];
const openTasks = updatedTasks.filter((task) => task.completed === false);
const taskLines = openTasks.map(formatTask);
const completedCount = updatedTasks.filter(
  (task) => task.completed === true,
).length;

console.log("Generated IDs: " + updatedTasks.map((task) => task.id).join(", "));
console.log("Open tasks (" + openTasks.length + "):");
console.log(taskLines.join("\n"));
console.log("Completed tasks: " + completedCount);
console.log("Original task count: " + tasks.length);
console.log("Updated task count: " + updatedTasks.length);

const account = {
  name: "Asha",
  profile: { city: "Pune" },
};

const shallowAccountCopy = { ...account };
console.log(
  "Shallow copy shares profile: " +
    (account.profile === shallowAccountCopy.profile),
);

const updatedAccount = {
  ...account,
  profile: {
    ...account.profile,
    city: "Jaipur",
  },
};

console.log("Original city: " + account.profile.city);
console.log("Updated city: " + updatedAccount.profile.city);
console.log("Same outer object: " + (account === updatedAccount));
console.log(
  "Same profile object: " +
    (account.profile === updatedAccount.profile),
);
~~~

## Run the example

Open a terminal in `functions-scope-practice` and run:

~~~sh
node app.mjs
~~~

The `.mjs` extension tells Node.js to treat these files as ES modules. No package installation is needed.

## Expected output

~~~text
Generated IDs: task-1, task-2, task-3, task-4
Open tasks (3):
- Read the lesson [normal]
- Practice arrays [high]
- Build a task summary [high]
Completed tasks: 1
Original task count: 3
Updated task count: 4
Shallow copy shares profile: true
Original city: Pune
Updated city: Jaipur
Same outer object: false
Same profile object: false
~~~

## Explanation

### Functions, inputs, and returned values

`createTask` receives the ID generator, a title, and an optional options object. It validates the input and returns a task object. `formatTask` receives a task and returns one display line. Passing data through parameters keeps these functions useful without relying on a global task variable.

### Scope and closures

`nextId` is declared inside `makeTaskIdGenerator`, so code outside that function cannot read it directly. The returned `nextTaskId` function still has access to `nextId` and advances it on each call. That retained access is a closure. The counter stays private while the app can request new IDs.

### Arrays and callbacks

`tasks` is the original three-item array. Array spread creates `updatedTasks` with the added task while leaving `tasks` unchanged. `filter` selects unfinished tasks, and `map` transforms those tasks into display strings by calling `formatTask` for each one. Both methods return new arrays.

### Objects, identity, and shallow copies

Each task is an object. The account spread creates a new outer object, but the nested `profile` object is still shared, which is why the shallow-copy comparison prints `true`. To update the city without changing the original account, the example copies both the outer account and its nested profile. The updated outer and profile objects therefore have different identities.

This copy-each-changed-level pattern is useful when updating nested data in React state. Avoid mutating existing shared state objects or arrays.

## Try these changes

1. Change the title passed to `createTask` to an empty string. It throws a `TypeError` before making a task.
2. Pass `{ completed: "false" }`. The string is rejected because `completed` must be a Boolean.
3. Pass `{ priority: "urgent" }`. The factory rejects a priority outside its allowed values.
4. Create a second ID generator and compare its first ID with the original generator's next ID. Each generator has its own closed-over counter.
5. Add a task with `completed: true` and observe how the open-task list and completed count change.
6. Use `find` to locate a task by its ID, or `some` to check whether a task with a given title exists.
7. Add another nested property to `profile` and copy each object level that your update changes.
8. Replace the array spread with a mutating method, then check whether the original `tasks` array changed.

## Key takeaways

- Function parameters make data flow explicit, and return values let callers use a function's result.
- A closure retains access to bindings from the lexical scope where its function was created.
- `map` transforms array items; `filter` selects matching items. Both return new arrays.
- Arrays and objects are reference values, so assignments can share the same underlying object.
- Object spread makes a shallow copy. Copy nested levels too when you need to update them immutably.
- The same immutable update patterns help keep React state changes predictable.

## Related chapter files

- [Lesson 007 - Functions, scope, arrays, and objects refresher](../lessons/007-functions-scope-arrays-and-objects-refresher.md)
- [Q&A 007 - Functions, scope, arrays, and objects refresher](../qnas/007-functions-scope-arrays-and-objects-refresher.md)
- [Example 006 - JavaScript essentials for MERN development](006-javascript-essentials-for-mern-development.md)

---

### Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Next chapter |
| :--- | :--- | :--- | :---: |
| [006 - JavaScript essentials for MERN development](../lessons/006-javascript-essentials-for-mern-development.md) | [Lesson](../lessons/007-functions-scope-arrays-and-objects-refresher.md) | [Q&A](../qnas/007-functions-scope-arrays-and-objects-refresher.md) | [008 - Modern JavaScript syntax and modules](../lessons/008-modern-javascript-syntax-and-modules.md) |
