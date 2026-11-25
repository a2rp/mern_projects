# 008 - Modern JavaScript Syntax and Modules

## Learning goals

By the end of this lesson, you should be able to:

- Read and write array and object destructuring.
- Use rest and spread syntax for the job each one is meant to do.
- Set function defaults and build strings with template literals.
- Safely read optional data with optional chaining and nullish coalescing.
- Create JavaScript modules with named and default exports.
- Import local modules using the appropriate path and module setup.
- Recognize syntax mistakes that can change or hide program behavior.

## Why modern syntax matters

MERN applications pass structured data between React components, Express handlers, utility modules, and database code. Modern JavaScript syntax can make those operations shorter, but short code is useful only when its behavior stays clear.

For example, an Express handler may receive an object and select only the values it needs:

~~~js
const { title, priority = "normal" } = req.body;
~~~

This is destructuring. It reads properties from `req.body` and gives them local names. It does not validate the data or make a copy of the entire request body. Validate data before trusting it.

## Destructuring arrays

Array destructuring assigns array positions to variables in order:

~~~js
const frameworks = ["MongoDB", "Express", "React", "Node.js"];
const [database, serverFramework, ...remaining] = frameworks;

console.log(database);
console.log(serverFramework);
console.log(remaining);
~~~

Output:

~~~text
MongoDB
Express
[ 'React', 'Node.js' ]
~~~

The rest pattern `...remaining` collects the unassigned items into a new array. Missing positions become `undefined`:

~~~js
const [first, second] = ["lesson"];

console.log(first);
console.log(second);
~~~

Output:

~~~text
lesson
undefined
~~~

Use array destructuring when position has meaning, such as reading coordinates or a value returned in a known order. For collections of records, methods such as `map`, `filter`, and `find` usually communicate intent more clearly.

## Destructuring objects

Object destructuring selects properties by name:

~~~js
const lesson = {
  title: "Modern JavaScript",
  number: 8,
  status: "draft",
};

const { title, number } = lesson;

console.log(title);
console.log(number);
~~~

Output:

~~~text
Modern JavaScript
8
~~~

The local variable names normally match the property names. Use a colon to rename a local variable:

~~~js
const { title: lessonTitle, status: lessonStatus } = lesson;

console.log(lessonTitle);
console.log(lessonStatus);
~~~

Output:

~~~text
Modern JavaScript
draft
~~~

Object destructuring can also set a default for a missing or `undefined` property:

~~~js
const { priority = "normal" } = {};
console.log(priority);
~~~

Output:

~~~text
normal
~~~

The default is used when the property value is `undefined`, including when the property is absent. It is not used for `null`, `false`, `0`, or an empty string.

### Nested destructuring

Nested destructuring reads a property inside another object:

~~~js
const user = {
  name: "Asha",
  profile: {
    city: "Pune",
  },
};

const {
  profile: { city },
} = user;

console.log(city);
~~~

Output:

~~~text
Pune
~~~

Nested destructuring expects the intermediate object to exist. If `profile` might be absent, optional chaining is often easier to follow:

~~~js
const city = user.profile?.city ?? "Unknown city";
~~~

## Rest parameters and rest properties

The `...` rest syntax gathers multiple values into one array or object.

A rest parameter collects the remaining function arguments:

~~~js
function total(firstValue, ...otherValues) {
  return [firstValue, ...otherValues].reduce(
    (sum, value) => sum + value,
    0,
  );
}

console.log(total(4, 6, 10));
~~~

Output:

~~~text
20
~~~

An object rest property gathers properties that were not selected:

~~~js
const account = {
  name: "Asha",
  email: "asha@example.test",
  passwordHash: "not-for-display",
};

const { passwordHash, ...publicAccount } = account;

console.log(publicAccount);
~~~

Output:

~~~text
{ name: 'Asha', email: 'asha@example.test' }
~~~

Rest collects the remaining items. It does not remove them from the original array or object. Be deliberate about which properties you send to a client; explicitly choosing safe response fields is often clearer than removing one known sensitive field.

## Spread syntax

Spread syntax expands an iterable or object into another place. With arrays, it can make a new array containing existing items:

~~~js
const existingTopics = ["HTML", "CSS"];
const topics = [...existingTopics, "JavaScript"];

console.log(existingTopics);
console.log(topics);
~~~

Output:

~~~text
[ 'HTML', 'CSS' ]
[ 'HTML', 'CSS', 'JavaScript' ]
~~~

With objects, spread copies enumerable own properties into a new object:

~~~js
const originalUser = {
  name: "Asha",
  role: "learner",
};

const updatedUser = {
  ...originalUser,
  role: "reviewer",
};

console.log(originalUser.role);
console.log(updatedUser.role);
console.log(originalUser === updatedUser);
~~~

Output:

~~~text
learner
reviewer
false
~~~

When a property is supplied more than once, the later value wins. Here the explicit `role` after the spread replaces the copied value.

Array and object spread make shallow copies. A nested object or array is still shared unless you copy that nested value too:

~~~js
const profile = {
  name: "Asha",
  preferences: { theme: "dark" },
};

const shallowCopy = { ...profile };

console.log(profile === shallowCopy);
console.log(profile.preferences === shallowCopy.preferences);
~~~

Output:

~~~text
false
true
~~~

For an immutable nested update, copy each level you change:

~~~js
const updatedProfile = {
  ...profile,
  preferences: {
    ...profile.preferences,
    theme: "light",
  },
};

console.log(profile.preferences.theme);
console.log(updatedProfile.preferences.theme);
~~~

Output:

~~~text
dark
light
~~~

This pattern is useful for predictable React state updates, but spread is not a deep-cloning tool and does not validate API data.

## Default parameters

A function parameter can have a default value:

~~~js
function greet(name = "learner") {
  return "Hello, " + name + "!";
}

console.log(greet());
console.log(greet("Asha"));
console.log(greet(undefined));
console.log(greet(null));
~~~

Output:

~~~text
Hello, learner!
Hello, Asha!
Hello, learner!
Hello, null!
~~~

A default parameter is used when the argument is omitted or is `undefined`. Passing `null` is an explicit value, so the default does not apply.

Defaults are useful for optional configuration objects:

~~~js
function createLabel(text, options = {}) {
  const { prefix = "Topic", uppercase = false } = options;
  const label = uppercase ? text.toUpperCase() : text;

  return prefix + ": " + label;
}

console.log(createLabel("modules"));
console.log(createLabel("modules", { prefix: "Lesson", uppercase: true }));
~~~

Output:

~~~text
Topic: modules
Lesson: MODULES
~~~

The default `{}` prevents destructuring from failing when `options` is omitted. It does not replace `null`, so callers must not pass `null` unless the function handles it.

## Template literals

Template literals use backticks and can insert expressions with `${...}`:

~~~js
const name = "Asha";
const chapterNumber = 8;

const heading = `Chapter ${chapterNumber}: Modern JavaScript`;

console.log(`Hello, ${name}!`);
console.log(heading);
~~~

Output:

~~~text
Hello, Asha!
Chapter 8: Modern JavaScript
~~~

Template literals can also span multiple lines:

~~~js
const message = `Welcome, ${name}.
You are studying chapter ${chapterNumber}.`;

console.log(message);
~~~

Output:

~~~text
Welcome, Asha.
You are studying chapter 8.
~~~

The expression inside `${...}` can be any JavaScript expression. Template literals make string construction readable, but they do not automatically escape text for HTML, SQL, or shell commands. Use the appropriate safe APIs for the output context.

## Optional chaining

Optional chaining uses `?.` to stop a property or call chain when the value immediately before it is `null` or `undefined`. Instead of throwing at that point, the expression evaluates to `undefined`:

~~~js
const user = {
  name: "Asha",
  profile: {
    city: "Pune",
  },
};

const city = user.profile?.city;
const phone = user.contact?.phone;

console.log(city);
console.log(phone);
~~~

Output:

~~~text
Pune
undefined
~~~

Optional chaining also works for array entries and optional methods:

~~~js
const firstLesson = ["Introduction"]?.[0];
const onComplete = undefined;

onComplete?.();

console.log(firstLesson);
console.log(onComplete?.());
~~~

Output:

~~~text
Introduction
undefined
~~~

Optional chaining only guards the part marked with `?.`. It does not make an undeclared variable safe, validate an object, or prove that a required field is present. Use validation when data must meet a contract.

## Nullish coalescing

The nullish coalescing operator `??` returns its right-hand value only when the left-hand value is `null` or `undefined`:

~~~js
const savedPageSize = 0;
const missingPageSize = undefined;

console.log(savedPageSize ?? 20);
console.log(missingPageSize ?? 20);
~~~

Output:

~~~text
0
20
~~~

Logical OR `||` instead uses the right-hand value whenever the left-hand value is falsy. That includes `0`, `false`, and an empty string:

~~~js
console.log(0 || 20);
console.log(0 ?? 20);
console.log("" || "Untitled");
console.log("" ?? "Untitled");
~~~

Output:

~~~text
20
0
Untitled

~~~

Use `??` when zero, false, or an empty string may be intentional values. Use `||` when any falsy value should trigger the fallback. Do not mix `??` directly with `&&` or `||` in the same expression without parentheses; JavaScript requires grouping to make that logic explicit.

Optional chaining and nullish coalescing often work together:

~~~js
const user = {};
const displayName = user.profile?.name ?? "Guest";

console.log(displayName);
~~~

Output:

~~~text
Guest
~~~

## Object shorthand and computed property names

When a variable name matches an object property name, shorthand syntax avoids repeating it:

~~~js
const title = "Modern JavaScript";
const number = 8;

const lesson = { title, number };

console.log(lesson);
~~~

Output:

~~~text
{ title: 'Modern JavaScript', number: 8 }
~~~

Use a computed property name when the key is stored in a variable:

~~~js
const fieldName = "status";
const fieldValue = "published";

const update = {
  [fieldName]: fieldValue,
};

console.log(update);
~~~

Output:

~~~text
{ status: 'published' }
~~~

Computed names are useful when building an update from a known field. Validate or allow-list field names before using untrusted input to decide which property an application changes.

## ES modules: share code between files

A module is a JavaScript file with its own scope. An ES module explicitly exports the values other modules may use. Importing code does not add its variables to the global scope.

### Named exports and imports

A module may export several named values:

~~~js
// task-utils.mjs
export function formatTitle(title) {
  return title.trim();
}

export const defaultPriority = "normal";
~~~

A different module imports the names it needs:

~~~js
// app.mjs
import { formatTitle, defaultPriority } from "./task-utils.mjs";

console.log(formatTitle("  Build an API  "));
console.log(defaultPriority);
~~~

Output:

~~~text
Build an API
normal
~~~

Named imports use the exported name. An alias can give an imported value a different local name:

~~~js
import { formatTitle as cleanTitle } from "./task-utils.mjs";
~~~

### Default exports and imports

A module can provide one default export:

~~~js
// greeting.mjs
export default function greeting(name) {
  return "Hello, " + name + "!";
}
~~~

The importer chooses its local name:

~~~js
// app.mjs
import makeGreeting from "./greeting.mjs";

console.log(makeGreeting("Asha"));
~~~

Output:

~~~text
Hello, Asha!
~~~

Named and default exports can coexist, but use a consistent style so the module's public interface is easy to understand. A default import does not use braces; named imports do.

### Module path basics

- A relative path starts with `./` for the current folder or `../` for a parent folder.
- A bare specifier such as `react` or `express` refers to a package or a configured import mapping, not a relative file.
- In Node.js, `.mjs` explicitly identifies an ES module. A package can also use `.js` files as ES modules when its nearest `package.json` declares `"type": "module"`.
- Node.js ES module imports of local files generally include the file extension, for example `./task-utils.mjs`.
- Browser modules use `<script type="module">`; a browser also needs a URL it can load for each imported module.

Node.js also supports CommonJS syntax such as `require` and `module.exports`. CommonJS and ES modules are different module systems. Use the syntax expected by the project rather than mixing them casually. MERN tools and project configuration determine how frontend and server files are loaded.

Static `import` declarations are written at module scope. Dynamic `import()` loads a module asynchronously and returns a Promise; asynchronous control flow is covered in the next lesson.

## A practical MERN pattern

Destructuring can make an Express route easier to read, but it does not validate request data:

~~~js
app.post("/api/tasks", (req, res) => {
  const { title, priority = "normal" } = req.body ?? {};

  if (typeof title !== "string" || title.trim() === "") {
    return res.status(400).json({ error: "A task title is required." });
  }

  const task = {
    title: title.trim(),
    priority,
  };

  return res.status(201).json({ task });
});
~~~

Here `req.body ?? {}` supplies an empty object only when the body is nullish. Destructuring reads the fields, the default applies when `priority` is undefined, and the route still validates the required title. A complete API should also validate `priority` against allowed values and handle errors consistently.

## Common mistakes to avoid

- Confusing rest, which collects remaining values, with spread, which expands values.
- Assuming spread makes a deep copy of nested objects or arrays.
- Assuming destructuring validates or sanitizes a value.
- Forgetting that destructuring defaults and parameter defaults apply to `undefined`, not `null`.
- Using `||` when `0`, `false`, or `""` must be preserved.
- Assuming `?.` checks that data has the right type or required shape.
- Forgetting braces for named imports or adding braces to a default import.
- Omitting a relative path prefix or required file extension in a Node.js ES module import.
- Mixing CommonJS and ES module syntax without checking the project's module configuration.
- Treating a template literal as automatic HTML or SQL escaping.

## Practice

1. Destructure a task's `title` and `priority` from an object, assigning a default priority.
2. Write a function that accepts a required ID and any number of labels using a rest parameter.
3. Create an updated task object with spread syntax while preserving the original object.
4. Add a nested `preferences` object and update one property by copying each changed level.
5. Write a function with a default options object and destructure two options from it.
6. Build a multi-line message with a template literal and insert a user's name.
7. Compare `value || fallback` and `value ?? fallback` for `0`, `false`, `""`, `null`, and `undefined`.
8. Use optional chaining to read a missing nested property, then use `??` to provide a display fallback.
9. Export a named helper and a default function from separate modules; import each in an app module.
10. Check which module system a Node.js project uses before choosing `import` or `require`.

## Key takeaways

- Destructuring reads selected values from arrays and objects; it does not validate them.
- Rest collects remaining values; spread expands values into an array, object, or function call.
- Spread copies only the outer array or object, so nested values may still be shared.
- Parameter and destructuring defaults apply to `undefined`; `??` falls back only for `null` and `undefined`.
- Optional chaining safely stops a chain at a nullish value, but it is not a substitute for validation.
- Template literals interpolate expressions but do not escape output for a security-sensitive context.
- ES modules keep file scope separate and expose an intentional interface with `export` and `import`.
- Choose module syntax and file setup to match the project's Node.js, browser, and build-tool configuration.
- The next lesson focuses on asynchronous JavaScript with callbacks, Promises, and `async`/`await`.

---

### Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| :--- | :--- | :--- | :---: |
| [007 - Functions, scope, arrays, and objects refresher](007-functions-scope-arrays-and-objects-refresher.md) | [Q&A](../qnas/008-modern-javascript-syntax-and-modules.md) | [Example](../examples/008-modern-javascript-syntax-and-modules.md) | [009 - Asynchronous JavaScript: callbacks, promises, and async await](009-asynchronous-javascript-callbacks-promises-and-async-await.md) |
