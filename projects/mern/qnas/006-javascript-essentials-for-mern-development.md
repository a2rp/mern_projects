# 006 - JavaScript Essentials for MERN Development: Questions and Answers

Use these questions to review JavaScript values, variables, operators, functions, arrays, objects, asynchronous work, modules, and the difference between browser and Node.js environments. Each answer includes a short explanation.

Related lesson: [006 - JavaScript essentials for MERN development](../lessons/006-javascript-essentials-for-mern-development.md)

## Multiple-choice questions

### 1. Where can JavaScript run in a MERN application?

- A. Only in MongoDB
- B. In the browser and in Node.js, with different host APIs
- C. Only inside React
- D. Only in the terminal

**Answer: B.** React code commonly runs in the browser; Express and server-side code run in Node.js.

### 2. Which statement about the browser and Node.js is correct?

- A. Both environments provide exactly the same APIs.
- B. Browser APIs such as `document` are not automatically available in Node.js.
- C. Node.js file-system APIs work in every browser.
- D. Node.js is a database.

**Answer: B.** JavaScript's language features are shared, but host environments supply different APIs.

### 3. Which value has the type string?

- A. `"MERN"`
- B. `42`
- C. `false`
- D. `null`

**Answer: A.** Text surrounded by quotes is a string.

### 4. What does `const` prevent?

- A. Any property of an object from changing
- B. Reassigning the variable binding
- C. Calling a function
- D. Adding strings

**Answer: B.** A const binding cannot be assigned a different value, but an object or array referenced by it may still be mutated.

### 5. When should you generally use `let`?

- A. When a binding needs to be reassigned
- B. For every variable, even if it never changes
- C. Only in a browser
- D. To declare an object property

**Answer: A.** Use let when the binding itself needs a new value; otherwise const is usually clearer.

### 6. What does `typeof null` return in JavaScript?

- A. `"null"`
- B. `"undefined"`
- C. `"object"`
- D. `"boolean"`

**Answer: C.** This is a historical behavior. Check for null with `value === null`.

### 7. Which comparison avoids implicit type conversion?

- A. `5 == "5"`
- B. `5 === "5"`
- C. `5 = "5"`
- D. `5 => "5"`

**Answer: B.** Strict equality compares without the coercion used by the loose equality operator.

### 8. Which value is truthy in a JavaScript condition?

- A. `0`
- B. `""`
- C. `null`
- D. `[]`

**Answer: D.** Empty arrays and empty objects are truthy. Zero, the empty string, and null are falsy.

### 9. What does `pageSize ?? 20` do when `pageSize` is zero?

- A. Replaces zero with 20
- B. Keeps zero
- C. Throws a TypeError
- D. Converts zero to null

**Answer: B.** Nullish coalescing uses the fallback only when the left side is null or undefined.

### 10. What is one benefit of optional chaining, such as `user.profile?.name`?

- A. It validates that name is a string.
- B. It avoids a property-access error if profile is nullish.
- C. It creates the missing profile object.
- D. It guarantees that name has a value.

**Answer: B.** Optional chaining returns undefined when the value before `?.` is null or undefined; it does not create or validate data.

### 11. What does a function's `return` statement do?

- A. Sends the value back to the caller
- B. Starts Node.js
- C. Adds a property to every object
- D. Pushes code to GitHub

**Answer: A.** A returned value is the result the caller receives. Without an explicit return, the result is undefined.

### 12. What does `filter` commonly do to an array?

- A. Selects items that match a condition into a new array
- B. Sorts the original array automatically
- C. Converts an array into an object
- D. Waits for a Promise

**Answer: A.** The callback's truthy result determines which items are included in the new array.

### 13. What does `map` commonly do to an array?

- A. Transforms each item and returns a new array
- B. Deletes every item
- C. Creates a Git branch
- D. Catches errors from fetch

**Answer: A.** Map calls a transformation function for each item and collects the returned values.

### 14. What does an async function return?

- A. Always a Promise
- B. Always a string
- C. Nothing
- D. A database connection

**Answer: A.** Its result is represented by a Promise, including when the function returns a plain value.

### 15. What does `await` do inside an async function?

- A. Pauses that async function until a Promise settles
- B. Freezes the browser or server entirely
- C. Converts a string to a number
- D. Commits a change

**Answer: A.** Await lets the function continue after the Promise fulfills or rejects; it does not block the whole runtime.

### 16. Where can a rejected Promise be handled in an async function?

- A. In a `try`/`catch` block around the awaited operation
- B. Only in a CSS file
- C. By using `const`
- D. In a Git remote

**Answer: A.** A rejection from an awaited Promise can be handled by the surrounding catch block.

### 17. What is a JavaScript module useful for?

- A. Splitting code into files with explicit imports and exports
- B. Hiding all errors
- C. Replacing the database
- D. Making all variables global

**Answer: A.** Modules let files expose and use selected functions or values.

### 18. What does this named import require?

~~~js
import { makeGreeting } from "./greeting.mjs";
~~~

- A. The imported module must export a matching named value.
- B. The greeting function must be global.
- C. The import path must be a GitHub URL.
- D. The file must contain JSX.

**Answer: A.** Named imports use the exported name shown inside the braces.

### 19. What does `try`/`catch` help with?

- A. Handling thrown errors from operations that may fail
- B. Ignoring every error permanently
- C. Changing a let binding to const
- D. Loading a module without a path

**Answer: A.** Catch gives the program a place to handle an error or show a useful message.

### 20. Which value is falsy?

- A. `[]`
- B. `{}`
- C. `"0"`
- D. `NaN`

**Answer: D.** NaN is falsy. Empty arrays, empty objects, and non-empty strings are truthy.

## Short-answer questions

### 21. What is the difference between a primitive value and an object?

**Answer:** Primitive values include strings, numbers, Booleans, null, undefined, BigInt, and symbols. Objects hold properties; arrays and functions are object values with special behavior.

### 22. What is the difference between null and undefined?

**Answer:** Null is commonly used to represent an intentional empty value. Undefined often means a value has not been assigned or supplied. Application code should document which meaning it expects.

### 23. Why does `const` not make an array immutable?

**Answer:** Const protects the variable binding from reassignment. The array object can still be changed, for example by calling `push`. Use a copy or an immutable update pattern when that better fits the application.

### 24. What is the difference between `===` and `==`?

**Answer:** Strict equality does not perform implicit type conversion. Loose equality may convert values before comparing, which can make results surprising.

### 25. Why can `||` and `??` produce different defaults?

**Answer:** The logical OR operator uses the right side when the left side is any falsy value, such as zero or an empty string. Nullish coalescing uses the fallback only for null or undefined.

### 26. What does optional chaining do, and what does it not do?

**Answer:** It safely stops a property chain when an earlier value is nullish and returns undefined. It does not create missing values or validate the resulting data.

### 27. What is the difference between an expression and a statement?

**Answer:** An expression produces a value, such as `4 + 3`. A statement performs an action, such as declaring a variable or running an if/else block.

### 28. What is a callback?

**Answer:** A callback is a function passed to another function to be called as part of its work. Array methods such as `map` and `filter` commonly receive callbacks.

### 29. What is the difference between `map` and `filter`?

**Answer:** Map transforms each item and returns the transformed items in a new array. Filter keeps the original items whose callback result is truthy.

### 30. Why should a function return a value when callers need its result?

**Answer:** The caller can store, display, or pass along the returned value. Without an explicit return, the function result is undefined.

### 31. What does an async function return, and how do you get its resolved value?

**Answer:** An async function returns a Promise. Use `await` inside an async function, or use Promise methods such as `then`, to work with its resolved value.

### 32. How can an async operation's error be handled?

**Answer:** Put the awaited call inside a `try` block and respond in `catch`. Do not silently ignore the error if the user or application needs to know that the operation failed.

### 33. Why use modules instead of putting all code in one file?

**Answer:** Modules separate responsibilities and expose selected functionality through imports and exports. This makes application code easier to organize and reuse.

### 34. Why can browser code and Node.js code not always use the same global APIs?

**Answer:** The JavaScript host environment provides additional APIs. Browsers provide page-related features such as the DOM; Node.js provides server and system APIs. Those environment-specific APIs are not automatically shared.

### 35. What should you do when a runtime error appears?

**Answer:** Read its type, message, and file/line location. Inspect the relevant values and call path, fix the cause, then repeat the action that produced the error.

### 36. Why is `typeof null` a result that can surprise beginners?

**Answer:** It returns `"object"` for historical reasons. To check for null, use a direct comparison such as `value === null`.

### 37. Does `await` block all JavaScript work in the browser or server?

**Answer:** No. It pauses the current async function until the Promise settles while the runtime can continue other work.

### 38. Are empty arrays and empty objects falsy?

**Answer:** No. They are truthy. An empty string, zero, false, null, undefined, and NaN are examples of falsy values.

### 39. Why validate values received from a form or API?

**Answer:** External input may be missing, malformed, or have an unexpected type. Validate its shape and allowed values before the application relies on it.

### 40. What must be true for the greeting module example to run?

**Answer:** The files must be in the expected folder, the importing file must reference the correct relative module path and exported name, and the command must run from the project folder with Node.js available.

## Review checklist

You are ready to move on when you can:

- Identify common primitive values and distinguish them from objects.
- Explain `const` versus `let` and how strict equality differs from loose equality.
- Recognize truthy and falsy values and choose `||` or `??` intentionally.
- Write a small function that accepts input and returns a value.
- Use `map` and `filter` to transform and select array items.
- Explain what Promises represent and use `async`/`await` with error handling.
- Export a function from one module and import it in another.
- Explain why browser globals and Node.js APIs differ.
- Read an error message and inspect the values involved.
- Remember that external input still needs validation.

---

### Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| :--- | :--- | :--- | :---: |
| [005 - Terminal, files, Git, and GitHub workflow](../lessons/005-terminal-files-git-and-github-workflow.md) | [Q&A](006-javascript-essentials-for-mern-development.md) | [Example](../examples/006-javascript-essentials-for-mern-development.md) | [007 - Functions, scope, arrays, and objects refresher](../lessons/007-functions-scope-arrays-and-objects-refresher.md) |
