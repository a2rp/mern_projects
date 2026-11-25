# Example 008 - Modern JavaScript Syntax and Modules

## Question

How can a small Node.js program split reusable functions into modules and use destructuring, defaults, rest and spread, template literals, optional chaining, and nullish coalescing?

## Goal

Build a small lesson-summary program with two files:

- `lesson-utils.mjs` exports named helpers and one default formatter.
- `app.mjs` imports them, creates and updates a lesson record, and prints a summary.

The example uses only Node.js and built-in JavaScript. It does not install packages or connect to a database.

## Complete example

Create a folder named `modern-syntax-practice` and add both files below.

### 1. Create lesson-utils.mjs

~~~js
export const courseName = "MERN";

export function createLesson(title, options = {}) {
  const {
    number = 0,
    status = "draft",
    tags = [],
  } = options;

  return {
    title: title.trim(),
    number,
    status,
    tags: [...tags],
  };
}

export function summarizeLesson({ title, number, author }) {
  const authorName = author?.name ?? "Unknown author";

  return `Chapter ${number}: ${title} (author: ${authorName})`;
}

export default function formatLesson(
  { title, number },
  prefix = "Chapter",
) {
  return `${prefix} ${number}: ${title}`;
}
~~~

### 2. Create app.mjs

~~~js
import formatLesson, {
  courseName as course,
  createLesson,
  summarizeLesson,
} from "./lesson-utils.mjs";

const lesson = createLesson("  Modern JavaScript  ", {
  number: 8,
  status: "in progress",
  tags: ["syntax", "modules"],
});

const lessonWithAuthor = {
  ...lesson,
  author: { name: "Asha" },
};

const [firstTag, ...remainingTags] = lesson.tags;
const { status: currentStatus, ...lessonDetails } = lesson;

const statusField = "status";
const changes = {
  [statusField]: "ready",
  tags: [...lesson.tags, "node"],
};

const updatedLesson = {
  ...lesson,
  ...changes,
};

const user = {};
const displayName = user.profile?.name ?? "Guest";
const savedPageSize = 0;
const report = { course, firstTag };

console.log("Course: " + report.course);
console.log("Title: " + lesson.title);
console.log("Formatted: " + formatLesson(lesson));
console.log("Summary: " + summarizeLesson(lessonWithAuthor));
console.log("First tag: " + firstTag);
console.log("Remaining tags: " + remainingTags.join(", "));
console.log("Current status: " + currentStatus);
console.log("Status removed from details: " + !("status" in lessonDetails));
console.log("Updated status: " + updatedLesson.status);
console.log("Updated tags: " + updatedLesson.tags.join(", "));
console.log("Original status: " + lesson.status);
console.log("Original tags: " + lesson.tags.join(", "));
console.log("Optional name fallback: " + displayName);
console.log("Zero with ?? : " + (savedPageSize ?? 20));
console.log("Zero with || : " + (savedPageSize || 20));
~~~

## Run the example

Open a terminal in `modern-syntax-practice` and run:

~~~sh
node app.mjs
~~~

Both files use the `.mjs` extension, so Node.js treats them as ES modules. No package installation is needed.

## Expected output

~~~text
Course: MERN
Title: Modern JavaScript
Formatted: Chapter 8: Modern JavaScript
Summary: Chapter 8: Modern JavaScript (author: Asha)
First tag: syntax
Remaining tags: modules
Current status: in progress
Status removed from details: true
Updated status: ready
Updated tags: syntax, modules, node
Original status: in progress
Original tags: syntax, modules
Optional name fallback: Guest
Zero with ?? : 0
Zero with || : 20
~~~

## What the program demonstrates

| Feature | Where it appears | What it does |
| --- | --- | --- |
| Named exports | `courseName`, `createLesson`, and `summarizeLesson` in lesson-utils.mjs | Exposes selected helpers for other modules. |
| Default export | `formatLesson` in lesson-utils.mjs | Exposes the module's default formatter. |
| Named and default imports | The import declaration in app.mjs | Imports selected names; `courseName` is locally aliased to `course`. |
| Object destructuring and defaults | `createLesson` options | Reads fields and supplies defaults for undefined values. |
| Array destructuring and rest | `[firstTag, ...remainingTags]` | Separates the first tag from the remaining tags. |
| Object rest | `{ status: currentStatus, ...lessonDetails }` | Reads and renames a property while gathering the rest. |
| Array and object spread | `[...lesson.tags, "node"]` and object literals | Creates updated outer values without changing the original lesson. |
| Template literals | The two utility functions | Interpolates values into readable strings. |
| Optional chaining and `??` | `user.profile?.name ?? "Guest"` | Safely reads optional data and supplies a nullish fallback. |
| `||` compared with `??` | The page-size output | Shows that `||` replaces zero while `??` preserves it. |
| Object shorthand | `{ course, firstTag }` | Uses variable names as property names and values. |
| Computed property | `[statusField]: "ready"` | Uses a variable's value as an object key. |

## Explanation

The utility file has its own module scope. It exports three named values and a default function. The app imports the default formatter without braces and imports named exports in braces. It aliases `courseName` to the local name `course`.

`createLesson` uses a default options object and destructures its properties. It trims the title and copies the tag array. In the app, array destructuring and object rest pull values into local names. Spread builds a new tag array and lesson object, so the original lesson's status and tags remain unchanged.

`summarizeLesson` uses optional chaining for a possibly absent author, then nullish coalescing supplies a fallback. The page-size lines show why `??` is useful when zero is meaningful: it preserves zero, while `||` treats zero as falsy.

These patterns make data transformations explicit, but they do not validate arbitrary input or deeply clone nested data. A real Express route should validate request fields and allowed values before creating or updating records.

## Try these changes

1. Omit `status` from the options. The destructuring default sets it to `"draft"`.
2. Pass `status: undefined` and then `status: null`. Compare how the default behaves.
3. Remove the author from `lessonWithAuthor` and observe the fallback in the summary.
4. Change `savedPageSize` to `25`, `null`, and `undefined`. Compare the two fallback expressions.
5. Add a tag to `changes` and check that `lesson.tags` still has its original items.
6. Change `statusField` to another allowed property name and observe which field is updated.
7. Move `formatLesson` to a named export and adjust the import syntax in app.mjs.

## Key takeaways

- ES modules keep file scope separate and share values through explicit imports and exports.
- Named imports use braces; default imports do not.
- Destructuring reads and renames values, while defaults apply when a value is undefined.
- Rest collects remaining values; spread expands values and makes shallow outer copies.
- Template literals interpolate values, while optional chaining and nullish coalescing help handle missing data.
- None of these syntax features replaces validation or context-appropriate output handling.

## Related chapter files

- [Lesson 008 - Modern JavaScript syntax and modules](../lessons/008-modern-javascript-syntax-and-modules.md)
- [Q&A 008 - Modern JavaScript syntax and modules](../qnas/008-modern-javascript-syntax-and-modules.md)
- [Example 007 - Functions, scope, arrays, and objects refresher](007-functions-scope-arrays-and-objects-refresher.md)

---

### Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Next chapter |
| :--- | :--- | :--- | :---: |
| [007 - Functions, scope, arrays, and objects refresher](../lessons/007-functions-scope-arrays-and-objects-refresher.md) | [Lesson](../lessons/008-modern-javascript-syntax-and-modules.md) | [Q&A](../qnas/008-modern-javascript-syntax-and-modules.md) | [009 - Asynchronous JavaScript: callbacks, promises, and async await](../lessons/009-asynchronous-javascript-callbacks-promises-and-async-await.md) |
