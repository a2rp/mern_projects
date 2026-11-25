# 008 - Modern JavaScript Syntax and Modules: Questions and Answers

Use these questions to review destructuring, rest and spread syntax, defaults, template literals, optional chaining, nullish coalescing, object properties, and ES modules. Each answer includes an explanation.

Related lesson: [008 - Modern JavaScript syntax and modules](../lessons/008-modern-javascript-syntax-and-modules.md)

## Multiple-choice questions

### 1. What does this statement do?

~~~js
const { title } = lesson;
~~~

- A. Reads the `title` property into a local variable named `title`
- B. Deletes `title` from `lesson`
- C. Validates that `title` is a string
- D. Copies every nested object in `lesson`

**Answer: A.** Object destructuring reads the selected property and binds its value to a local name. It does not delete, validate, or deep-copy data.

### 2. How do you assign an object property to a differently named local variable?

- A. `const { title => lessonTitle } = lesson;`
- B. `const { title: lessonTitle } = lesson;`
- C. `const { lessonTitle = title } = lesson;`
- D. `const [title as lessonTitle] = lesson;`

**Answer: B.** In object destructuring, `propertyName: localName` selects a property and gives it a local name.

### 3. When is a destructuring default such as `{ priority = "normal" }` used?

- A. Whenever the value is falsy
- B. Only when the value is `undefined`
- C. Only when the value is `null`
- D. Whenever the property exists

**Answer: B.** A destructuring default applies when the property is absent or its value is `undefined`. It does not replace `null`, `false`, `0`, or an empty string.

### 4. What does an array rest pattern collect?

~~~js
const [first, ...remaining] = values;
~~~

- A. A reference to the original array with its first item removed
- B. The remaining array items in a new array
- C. Only the final value
- D. A copy of every nested object

**Answer: B.** The rest pattern gathers unassigned array items into a new array. The original array remains unchanged.

### 5. What is the difference between rest and spread?

- A. Rest collects values; spread expands values
- B. Rest expands values; spread collects values
- C. They are two names for destructuring
- D. Rest changes values; spread validates values

**Answer: A.** The same three-dot syntax has different roles by position. Rest gathers remaining values in parameters or destructuring; spread expands values in arrays, objects, or calls.

### 6. What does object spread create?

- A. Always a deep clone
- B. A shallow copy of enumerable own properties
- C. A frozen object
- D. A validated object

**Answer: B.** Object spread creates a new outer object, but nested objects and arrays are still shared unless you copy them separately.

### 7. Which value wins when the same property is written before and after object spread?

~~~js
const updated = { role: "reviewer", ...user };
~~~

- A. Always `"reviewer"`
- B. The value from `user.role`, if that property is present
- C. Neither value; JavaScript throws
- D. Whichever value is shorter

**Answer: B.** Later properties overwrite earlier properties. Here the spread comes later, so a `role` property from `user` can replace `"reviewer"`.

### 8. When does a default parameter apply?

~~~js
function greet(name = "learner") {}
~~~

- A. When the argument is omitted or `undefined`
- B. When the argument is `null` or `undefined`
- C. Whenever the argument is falsy
- D. Only when the function has no parameters

**Answer: A.** Parameter defaults are used for omitted or `undefined` arguments. A passed `null` is an explicit value.

### 9. Which syntax inserts an expression into a template literal?

- A. `"Hello, {name}"`
- B. `` `Hello, ${name}` ``
- C. `'Hello, $(name)'`
- D. `<Hello name={name}>`

**Answer: B.** A template literal uses backticks, and interpolation writes a dollar sign followed by braces around the expression, as represented in this inline example.

### 10. Do template literals automatically escape inserted text for HTML?

- A. Yes, all inserted values are HTML-safe
- B. Yes, but only in Node.js
- C. No; use an appropriate safe API for the output context
- D. Only when the value is a string

**Answer: C.** Template literals build strings; they do not perform HTML, SQL, or shell escaping. Apply the safe output mechanism for the context.

### 11. What happens when an optional chain reaches a nullish value?

~~~js
const phone = user.contact?.phone;
~~~

- A. It returns `undefined` at that optional step
- B. It creates an empty `contact` object
- C. It returns `false`
- D. It validates the whole user object

**Answer: A.** Optional chaining stops at `null` or `undefined` and evaluates to `undefined` instead of throwing for that access.

### 12. Does optional chaining make an undeclared identifier safe?

- A. Yes, every missing name becomes `undefined`
- B. No, reading an undeclared identifier still throws a `ReferenceError`
- C. Yes, but only in modules
- D. It silently declares the identifier

**Answer: B.** Optional chaining guards a property or call after a value is evaluated. The base identifier must itself exist.

### 13. What does `pageSize ?? 20` use as its fallback condition?

- A. Any falsy value
- B. Only `null` and `undefined`
- C. Only zero
- D. Only an empty string

**Answer: B.** Nullish coalescing falls back only when the left side is `null` or `undefined`.

### 14. What does `0 || 20` evaluate to?

- A. `0`
- B. `20`
- C. `null`
- D. It throws

**Answer: B.** Logical OR falls back for any falsy left value, including zero. `0 ?? 20` would preserve zero.

### 15. Which syntax imports a named export called `formatTitle`?

- A. `import formatTitle from "./task-utils.mjs";`
- B. `import { formatTitle } from "./task-utils.mjs";`
- C. `const formatTitle = import "./task-utils.mjs";`
- D. `require { formatTitle } from "./task-utils.mjs";`

**Answer: B.** A named import uses braces and matches the exported name, unless it is explicitly aliased.

### 16. How is a default export imported?

- A. Always with braces and the original function name
- B. Without braces; the importer chooses a local name
- C. With `require.default` in every JavaScript environment
- D. It cannot be imported

**Answer: B.** A default import does not use braces, and the local binding may have a different name from the exported function.

### 17. How can Node.js explicitly recognize a file as an ES module?

- A. Use `.mjs` or configure the package's `"type": "module"`
- B. Rename it to `.json`
- C. Add `export` inside a comment
- D. Use only capital letters in the filename

**Answer: A.** Node.js documents `.mjs` and a package scope with `"type": "module"` as explicit ES module markers.

### 18. Which is a relative file specifier?

- A. `react`
- B. `express/router`
- C. `./task-utils.mjs`
- D. `node:fs`

**Answer: C.** A relative specifier starts with `./` or `../`. Bare names and built-in specifiers have different resolution meanings.

### 19. What does dynamic `import()` return?

- A. A Promise for the imported module
- B. A synchronous string
- C. A new global variable
- D. A CommonJS function in every environment

**Answer: A.** Dynamic import loads a module asynchronously and returns a Promise. The next chapter studies asynchronous JavaScript in detail.

### 20. What does this object shorthand produce?

~~~js
const title = "Modules";
const lesson = { title };
~~~

- A. An object with a `title` property whose value is the variable `title`
- B. An array containing `title`
- C. An object with no properties
- D. A copied module

**Answer: A.** When the local variable and property key have the same name, `{ title }` is shorthand for `{ title: title }`.

## Short-answer questions

### 1. What is destructuring?

**Answer:** Destructuring extracts selected values from an array or object into local variables. It makes property or position selection visible in the declaration, but it does not validate or sanitize those values.

### 2. How do you rename a property while destructuring it?

**Answer:** Use `const { title: lessonTitle } = lesson;`. This reads `lesson.title` and binds it locally as `lessonTitle`.

### 3. What happens when you destructure an array position that does not exist?

**Answer:** The corresponding variable receives `undefined` unless a default is supplied, for example `const [first = "none"] = [];`.

### 4. What is a rest parameter?

**Answer:** A rest parameter, written with `...` in the final parameter position, gathers the remaining arguments into an array. For example, `function logAll(...items) {}` collects all arguments in `items`.

### 5. What is the difference between an object rest property and object spread?

**Answer:** In `const { id, ...details } = record;`, rest collects properties not selected into `details`. In `const copy = { ...record };`, spread expands the source properties into a new object.

### 6. Does rest remove the selected or remaining fields from the original object?

**Answer:** No. Destructuring and rest create local bindings and a new container for gathered properties; they do not delete properties from the source object.

### 7. What does array spread do in an immutable update?

**Answer:** It creates a new outer array containing the expanded items. For example, `const nextItems = [...items, newItem];` leaves the original `items` array unchanged, but objects inside are still shared.

### 8. What does “shallow copy” mean for object spread?

**Answer:** The outer object is new, but nested object and array values are copied as references. To update a nested value immutably, copy every object or array level that changes.

### 9. In what order should you write properties when overriding a value with object spread?

**Answer:** Put the spread first and the explicit override afterward: `{ ...user, role: "reviewer" }`. A later property value wins over an earlier one.

### 10. When does a default parameter value apply?

**Answer:** It applies when the argument is omitted or evaluates to `undefined`. It does not apply to `null`, zero, false, or an empty string.

### 11. How is a destructuring default different from nullish coalescing?

**Answer:** A destructuring default assigns a fallback to a binding when the selected property is `undefined`. Nullish coalescing evaluates an expression and uses its fallback when the left side is `null` or `undefined`.

### 12. What is a template literal, and how do you interpolate an expression?

**Answer:** A template literal is a string enclosed in backticks. Write an expression inside a dollar sign and braces, for example `` `Hello, ${name}` ``. It can also span multiple lines.

### 13. Do template literals escape HTML or SQL values?

**Answer:** No. They only construct strings. Use safe DOM APIs, parameterized database operations, or other context-appropriate escaping and APIs.

### 14. What does optional chaining protect against?

**Answer:** It stops the marked property, element, or call chain when the value before that step is `null` or `undefined`, returning `undefined`. It does not validate the value or protect an undeclared base identifier.

### 15. When should you choose `??` instead of `||`?

**Answer:** Choose `??` when only `null` or `undefined` should trigger a fallback. It preserves intentional values such as `0`, `false`, and `""`. Use `||` when every falsy value should use the fallback.

### 16. What is object property shorthand?

**Answer:** If a variable and property have the same name, write `const user = { name };` instead of `const user = { name: name };`. The property key is `name` and its value comes from the local variable.

### 17. What is a computed property name?

**Answer:** A computed property name evaluates an expression to determine the key, using brackets: `const update = { [fieldName]: value };`. Validate or allow-list untrusted field names before using them in application updates.

### 18. How do named and default imports differ?

**Answer:** A named import uses braces and the exported name, such as `import { formatTitle } from "./task-utils.mjs";`. A default import has no braces and may choose its local name, such as `import greeting from "./greeting.mjs";`.

### 19. How does Node.js know to load a file as an ES module?

**Answer:** An `.mjs` extension identifies an ES module. A package can also declare `"type": "module"` in its nearest `package.json` so its `.js` files are treated as ES modules. Check the project configuration before choosing module syntax.

### 20. Why should an Express route still validate fields after destructuring `req.body`?

**Answer:** Destructuring only reads values and can set defaults. Client input may be missing, malformed, or intentionally invalid, so the route must validate required values, types, and allowed options before using or storing them.

## Review checklist

You are ready to move on when you can:

- Destructure selected array positions and object properties.
- Explain object renaming, defaults, rest patterns, and spread syntax.
- Tell when object or array spread leaves nested references shared.
- Distinguish a parameter default from `??` and from `||`.
- Explain what optional chaining protects and what it does not.
- Write template literals and name the output-escaping limitation.
- Create and import named and default ES module exports.
- Recognize Node.js module markers and relative import paths.
- Explain why request data still needs validation after destructuring.

---

### Chapter navigation

| Previous chapter | Chapter lesson | Chapter example | Next chapter |
| :--- | :--- | :--- | :---: |
| [007 - Functions, scope, arrays, and objects refresher](../lessons/007-functions-scope-arrays-and-objects-refresher.md) | [Lesson](../lessons/008-modern-javascript-syntax-and-modules.md) | [Example](../examples/008-modern-javascript-syntax-and-modules.md) | [009 - Asynchronous JavaScript: callbacks, promises, and async await](../lessons/009-asynchronous-javascript-callbacks-promises-and-async-await.md) |
