# 006 - JavaScript Essentials for MERN Development

## Learning goals

By the end of this lesson, you should be able to:

- Describe where JavaScript runs in a MERN application.
- Recognize common values, variables, expressions, and control flow.
- Write and call functions, and work with basic arrays and objects.
- Explain why asynchronous work uses Promises and `async`/`await`.
- Split code into modules with imports and exports.
- Read common runtime errors and handle expected failures.

## Why JavaScript matters in MERN

MERN uses JavaScript in more than one place:

- **Browser:** React code runs in the browser and updates the user interface.
- **Server:** Node.js runs JavaScript outside the browser. Express uses it to define API behavior.
- **Database boundary:** Node.js code exchanges data with MongoDB through a driver or another database library.

Using one language across the browser and server can make it easier to share concepts and some data rules. The environments still provide different APIs. Browser-only features such as the document object model are not automatically available in Node.js. Node.js features such as its file-system APIs are not automatically available in browser code.

JavaScript is a programming language. React, Express, and MongoDB are separate tools that use or work with JavaScript; knowing basic JavaScript makes each of them easier to learn.

## Values and basic types

A value is a piece of data a program can use. Common primitive values include:

| Type | Example | Typical use |
| --- | --- | --- |
| String | `"MERN"` | Text |
| Number | `42` or `3.5` | Counts and measurements |
| BigInt | `9007199254740993n` | Very large integers when needed |
| Boolean | `true` or `false` | A yes/no state |
| Undefined | `undefined` | A value has not been provided or assigned |
| Null | `null` | An intentional empty value |
| Symbol | `Symbol("id")` | A unique symbol value; uncommon in beginner application code |

Objects hold properties. Arrays are ordered lists. Functions are callable values. You will practice arrays and objects in more depth in the next lesson.

~~~js
const courseName = "MERN";
const lessonNumber = 6;
const isPublished = true;
const nextLesson = null;

console.log(typeof courseName);
console.log(typeof lessonNumber);
console.log(typeof isPublished);
~~~

Output:

~~~text
string
number
boolean
~~~

JavaScript also has special values such as `NaN` for a failed numeric operation. One historical edge case is `typeof null` returning `"object"`. If you need to check for null, compare directly with `=== null`.

## Variables: const and let

Use `const` when a variable binding will not be assigned a different value. Use `let` when you need to reassign it. Avoid `var` in new application code because its function-level scope and hoisting behavior can be surprising to beginners.

~~~js
const course = "MERN";
let currentLesson = 6;

currentLesson = 7;

console.log(course);
console.log(currentLesson);
~~~

Output:

~~~text
MERN
7
~~~

`const` prevents rebinding the variable. It does not freeze an object or array:

~~~js
const topics = ["React", "Node.js"];
topics.push("MongoDB");

console.log(topics);
~~~

Output:

~~~text
[ 'React', 'Node.js', 'MongoDB' ]
~~~

Prefer a new value instead of mutating shared state when a copy is clearer:

~~~js
const updatedTopics = [...topics, "Express"];
~~~

The spread syntax here copies the array items into a new array; nested objects are still shared references. Later lessons explore mutation and copying in more detail.

## Expressions, statements, and strings

An **expression** produces a value. A **statement** performs an action such as declaring a variable or choosing a branch.

~~~js
const total = 4 + 3;
~~~

`4 + 3` is an expression; the full declaration is a statement.

Use a template literal, surrounded by backticks, to insert a value into a string:

~~~js
const learner = "Asha";
const message = `Welcome, ${learner}!`;
console.log(message);
~~~

Output:

~~~text
Welcome, Asha!
~~~

JavaScript is case-sensitive: `userName` and `username` are different names. Choose descriptive names, usually in camelCase, and keep capitalization consistent.

## Comparisons, truthiness, and conditions

Use strict equality operators `===` and `!==` for comparisons in everyday code. They compare without the implicit type conversion performed by `==` and `!=`.

~~~js
console.log(5 === "5");
console.log(5 == "5");
~~~

Output:

~~~text
false
true
~~~

A condition can use a Boolean directly:

~~~js
const task = { completed: false };

if (task.completed) {
  console.log("Done");
} else {
  console.log("Still open");
}
~~~

Output:

~~~text
Still open
~~~

JavaScript converts some values to true or false in conditions. Values such as `false`, `0`, `""`, `null`, `undefined`, and `NaN` are falsy. Most other values, including empty arrays and empty objects, are truthy. When the exact condition matters, compare explicitly instead of relying on a surprising conversion.

## Logical operators, defaults, and safe property access

The logical operators `&&`, `||`, and `!` are common in conditions. The nullish coalescing operator `??` uses its fallback only when the left side is `null` or `undefined`:

~~~js
const pageSize = 0;

console.log(pageSize || 20);
console.log(pageSize ?? 20);
~~~

Output:

~~~text
20
0
~~~

The first line uses the fallback because zero is falsy. The second keeps zero because it is not nullish. Choose the operator that matches the meaning you want.

Optional chaining `?.` lets you read a property when an earlier value may be nullish:

~~~js
const user = { profile: { displayName: "Asha" } };

console.log(user.profile?.displayName);
console.log(user.settings?.theme);
~~~

Output:

~~~text
Asha
undefined
~~~

Optional chaining avoids an error for a missing intermediate object. It does not validate the value or make a required field exist.

## Functions

Functions package behavior so it can be called where needed. They can accept parameters and return a value:

~~~js
function formatGreeting(name) {
  return "Hello, " + name + "!";
}

const greeting = formatGreeting("Asha");
console.log(greeting);
~~~

Output:

~~~text
Hello, Asha!
~~~

An arrow function is another common way to write a function:

~~~js
const double = (number) => number * 2;
console.log(double(4));
~~~

Output:

~~~text
8
~~~

A function with no explicit `return` returns `undefined`. Parameter names describe the values the caller supplies. Functions can be passed to other functions as callbacks, for example to process each array item.

## Arrays and objects: a first look

An array stores items in order. An object stores related values under property names:

~~~js
const tasks = [
  { title: "Read the lesson", completed: true },
  { title: "Practice JavaScript", completed: false },
];

const openTasks = tasks.filter((task) => !task.completed);
const titles = openTasks.map((task) => task.title);

console.log(titles);
~~~

Output:

~~~text
[ 'Practice JavaScript' ]
~~~

`filter` selects matching items; `map` transforms each item into a new value. They do not change the original array in this example. In React, these methods often help display a list from state or data returned by an API. The next chapter reviews functions, scope, arrays, and objects in more detail.

Objects may be unpacked with destructuring:

~~~js
const task = { title: "Practice", completed: false };
const { title, completed } = task;

console.log(title, completed);
~~~

Output:

~~~text
Practice false
~~~

Treat values from forms, APIs, files, or other users as data that needs validation. Their shape and types are not guaranteed just because they were parsed successfully.

## Asynchronous JavaScript

A browser request, timer, or database operation may take time. JavaScript represents many such results with a **Promise**, an object that will eventually be fulfilled with a value or rejected with an error.

Use `async` and `await` to write Promise-based code in a style that is easier to follow:

~~~js
function loadTasks() {
  return Promise.resolve([
    { title: "Read the lesson", completed: true },
    { title: "Practice async code", completed: false },
  ]);
}

async function showOpenTasks() {
  try {
    const tasks = await loadTasks();
    const openTasks = tasks.filter((task) => !task.completed);

    console.log(openTasks.map((task) => task.title));
  } catch (error) {
    console.error("Could not load tasks:", error.message);
  }
}

showOpenTasks();
~~~

Output:

~~~text
[ 'Practice async code' ]
~~~

`await` pauses this async function until the Promise settles; it does not freeze the entire JavaScript runtime. A rejected Promise can be handled with `try`/`catch`. Real MERN code uses this pattern around network and database operations.

## Modules: import and export

Modules split a program into files with clear responsibilities. An ES module can export code for another file to import.

Save this as **greeting.mjs**:

~~~js
export function makeGreeting(name) {
  return "Hello, " + name + "!";
}
~~~

Save this as **app.mjs** in the same folder:

~~~js
import { makeGreeting } from "./greeting.mjs";

console.log(makeGreeting("Asha"));
~~~

Run it with Node.js:

~~~sh
node app.mjs
~~~

Output:

~~~text
Hello, Asha!
~~~

The exported name and imported name must match in this named-export example. The relative path points to the module file. Browser code also supports ES modules when loaded with a module script. Node.js and browsers have different module loading environments, so a Node built-in import is not automatically available in a browser.

## Debugging and errors

Use the console to inspect values while learning:

- `console.log(value)` displays a value.
- `console.error(message)` displays an error message.
- Read the error type, message, and file/line location.
- Trace the value that was passed into the failing operation.
- Fix the cause, then repeat the action that produced the error.

A `try`/`catch` block handles an operation that may throw. Catch an error when the program can respond usefully; do not silently hide every error.

~~~js
try {
  const result = JSON.parse('{"ready": true}');
  console.log(result.ready);
} catch (error) {
  console.error("Could not read the data:", error.message);
}
~~~

Output:

~~~text
true
~~~

## Browser JavaScript and Node.js JavaScript

The ECMAScript language has shared syntax and core behavior, but a host environment supplies additional APIs:

| In a browser | In Node.js |
| --- | --- |
| Interact with a page through browser APIs such as the DOM. | Work with server APIs and Node.js built-in modules. |
| Send HTTP requests from a page. | Run an API server or make requests from server code. |
| Usually loaded by a page using a script element. | Started from a terminal, such as with `node app.mjs`. |

Do not assume that a browser global such as `document` exists in Node.js, or that Node.js file-system modules exist in browser code. This separation is important when React code runs in the browser and Express code runs in Node.js.

## Common beginner mistakes

- Using `==` without understanding implicit type conversion; prefer `===` for explicit comparisons.
- Thinking `const` makes an object immutable; it only prevents assigning a different value to that binding.
- Treating `null` and `undefined` as interchangeable without an application rule.
- Assuming an empty array or object is falsy; both are truthy in JavaScript.
- Using `||` when a fallback should apply only to `null` or `undefined`; consider `??`.
- Forgetting to `await` a Promise before using its result.
- Handling only synchronous errors while allowing a Promise rejection to go unnoticed.
- Assuming browser APIs and Node.js APIs are available in both environments.
- Using `map` only for side effects; use it to create a transformed array.
- Trusting form or API values without checking their types and required fields.

## Practice

1. Create a `const` string for a project name and a `let` counter. Change the counter and display both values.
2. Compare the number `7` with the string `"7"` using `===` and explain the result.
3. Use `??` and `||` with a value of `0`. Explain why they produce different results.
4. Write a function that accepts a task title, trims it, and returns a task object.
5. Use `filter` to select incomplete tasks and `map` to create an array of their titles.
6. Write an async function that awaits a Promise and handles a possible error with `try`/`catch`.
7. Move a function to a separate `.mjs` file, export it, import it, and run the importing file with Node.js.
8. Identify which features in your code require a browser and which can run in Node.js.

## Key takeaways

- JavaScript runs in both browsers and Node.js, but the environments provide different APIs.
- Values have types; use `const` and `let` for clear variable bindings.
- Strict comparisons, explicit conditions, and validation reduce surprises.
- Functions, arrays, objects, and modules help organize application code.
- Promises represent asynchronous results; `async`/`await` and error handling make them manageable.
- Inspect runtime errors and validate external data rather than guessing its shape.
- The next lesson gives functions, scope, arrays, and objects a focused review.

---

### Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| :--- | :--- | :--- | :---: |
| [005 - Terminal, files, Git, and GitHub workflow](005-terminal-files-git-and-github-workflow.md) | [Q&A](../qnas/006-javascript-essentials-for-mern-development.md) | [Example](../examples/006-javascript-essentials-for-mern-development.md) | [007 - Functions, scope, arrays, and objects refresher](007-functions-scope-arrays-and-objects-refresher.md) |
