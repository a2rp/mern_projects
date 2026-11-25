# 007 - Functions, Scope, Arrays, and Objects Refresher

## Learning goals

By the end of this lesson, you should be able to:

- Explain global, function, and block scope.
- Pass values into functions and return results.
- Recognize when a function or array is being used as a callback.
- Read and update arrays and objects safely.
- Distinguish mutating array methods from methods that return a new array.
- Explain how object references and shallow copies affect MERN state and data.

## Why these concepts matter

MERN code constantly moves and transforms data:

- React components call functions to respond to events and render lists.
- Express route handlers read request data and return responses.
- MongoDB records are represented as objects in application code.
- Arrays hold collections of records, and functions validate, transform, and select them.

Clear scope prevents values from leaking into unrelated code. Clear functions and careful data updates make application behavior easier to understand and debug.

## Scope: where a name is available

**Scope** is the part of a program where a variable or function name can be used. JavaScript uses lexical scope: a name is available according to where the code is written.

### Global or module scope

Top-level bindings in a module are available throughout that module but are not automatically shared with other modules. A global binding has a broader reach. Avoid putting application state in broad global scope; unrelated code can then read or change it.

### Function scope

Parameters and local variables are available inside the function where they are declared:

~~~js
const courseName = "MERN";

function showLesson() {
  const lessonName = "Functions and data";
  console.log(courseName + ": " + lessonName);
}

showLesson();
~~~

Output:

~~~text
MERN: Functions and data
~~~

`courseName` is declared outside the function and can be read inside it. `lessonName` exists only inside `showLesson`.

### Block scope

A block is code inside braces, such as an `if` block or loop body. Variables declared with `let` and `const` are limited to that block:

~~~js
const isReady = true;

if (isReady) {
  const status = "ready";
  console.log(status);
}

console.log(isReady);
~~~

Output:

~~~text
ready
true
~~~

The name `status` cannot be used after the `if` block. `var` is function-scoped rather than block-scoped, which is one reason modern code generally uses `const` and `let`.

### Inner code can read outer values

A nested function can read values from the surrounding scope:

~~~js
function makeCounter() {
  let count = 0;

  return function increment() {
    count += 1;
    return count;
  };
}

const nextCount = makeCounter();

console.log(nextCount());
console.log(nextCount());
~~~

Output:

~~~text
1
2
~~~

The returned `increment` function keeps access to the `count` binding created by `makeCounter`. This behavior is called a **closure**. Closures are useful for callbacks and private state, but prefer the simplest structure that makes the data flow clear.

## Functions: inputs, work, and results

A function can accept **parameters**, perform work, and return a result. The caller supplies **arguments** when it calls the function:

~~~js
function calculateLineTotal(price, quantity) {
  if (price < 0 || quantity < 0) {
    throw new RangeError("Price and quantity cannot be negative.");
  }

  return price * quantity;
}

const lineTotal = calculateLineTotal(12, 3);
console.log(lineTotal);
~~~

Output:

~~~text
36
~~~

The parameters are `price` and `quantity`. The arguments supplied are `12` and `3`. `return` sends the result back to the caller and ends that function call. A function without a return statement produces `undefined`.

### Keep functions focused

A small function with a descriptive name is easier to reuse and review. A function can return a value, update data, log output, send a response, or perform another side effect. Make side effects clear in its name or purpose.

A **pure function** returns a result based on its inputs and does not change outside state:

~~~js
function formatPrice(amount) {
  return "$" + amount.toFixed(2);
}

console.log(formatPrice(12));
~~~

Output:

~~~text
$12.00
~~~

By contrast, a function that writes a file, updates a database, or changes a shared object has a side effect. MERN route handlers and event handlers often perform side effects, so separate the decision-making logic from those operations when that improves clarity.

### Callbacks

A **callback** is a function passed to another function. The receiving function decides when to call it:

~~~js
function greetLearner(name) {
  return "Hello, " + name;
}

function announce(name, formatter) {
  console.log(formatter(name));
}

announce("Asha", greetLearner);
~~~

Output:

~~~text
Hello, Asha
~~~

Array methods also accept callbacks. For example, `map` calls its callback with each item and builds a new array from the returned values:

~~~js
const prices = [5, 12, 20];
const formattedPrices = prices.map(formatPrice);

console.log(formattedPrices);
~~~

Output:

~~~text
[ '$5.00', '$12.00', '$20.00' ]
~~~

Use `map` when you need transformed values. Use `forEach` when you want to perform an action for each item and do not need a returned array. Do not rely on `map` for side effects while discarding its result.

## Arrays: collections in order

An array stores values by position. Indexes start at zero, and `length` gives the number of items:

~~~js
const frameworks = ["React", "Express", "Node.js"];

console.log(frameworks[0]);
console.log(frameworks.length);
~~~

Output:

~~~text
React
3
~~~

Use `for...of` when you want to visit each item:

~~~js
for (const framework of frameworks) {
  console.log(framework);
}
~~~

### Choose the array method by intent

| Need | Method | Result |
| --- | --- | --- |
| Transform each item | `map` | A new array of returned values |
| Keep matching items | `filter` | A new array of matching items |
| Find the first match | `find` | The first match or undefined |
| Check whether any item matches | `some` | A Boolean |
| Run an action for each item | `forEach` | No useful returned array |

~~~js
const tasks = [
  { title: "Read the lesson", completed: true },
  { title: "Practice arrays", completed: false },
  { title: "Review objects", completed: false },
];

const openTasks = tasks.filter((task) => !task.completed);
const openTitles = openTasks.map((task) => task.title);
const hasPracticeTask = tasks.some((task) => task.title === "Practice arrays");

console.log(openTitles);
console.log(hasPracticeTask);
~~~

Output:

~~~text
[ 'Practice arrays', 'Review objects' ]
true
~~~

### Mutating and non-mutating operations

Mutating an array changes that array. For example, `push` adds an item to the end, `pop` removes the last item, and `splice` can insert or remove items.

~~~js
const numbers = [1, 2];
numbers.push(3);

console.log(numbers);
~~~

Output:

~~~text
[ 1, 2, 3 ]
~~~

Methods such as `map`, `filter`, and `slice` return another array; they do not change the source array in ordinary use. The spread syntax can also create a new outer array:

~~~js
const original = ["React", "Express"];
const updated = [...original, "MongoDB"];

console.log(original);
console.log(updated);
~~~

Output:

~~~text
[ 'React', 'Express' ]
[ 'React', 'Express', 'MongoDB' ]
~~~

In React, don't mutate state arrays directly. Create an updated array and pass it to the state update function so React can observe the change.

## Objects: related values by name

An object stores properties, each with a key and a value. Use dot notation for a known property name:

~~~js
const user = {
  id: "user-12",
  name: "Asha",
  role: "learner",
};

console.log(user.name);
~~~

Output:

~~~text
Asha
~~~

Use bracket notation when the property key comes from a variable or contains characters that are not valid in a dot-property name:

~~~js
const fieldName = "role";
console.log(user[fieldName]);
~~~

Output:

~~~text
learner
~~~

## Object references, mutation, and copies

Objects and arrays are reference values. Assigning an object to another variable copies the reference; both names still point to the same object:

~~~js
const originalUser = { name: "Asha" };
const sameUser = originalUser;

sameUser.name = "Ravi";

console.log(originalUser.name);
console.log(originalUser === sameUser);
~~~

Output:

~~~text
Ravi
true
~~~

If you need a separate top-level object, use object spread or another deliberate copy:

~~~js
const user = { name: "Asha", role: "learner" };
const updatedUser = { ...user, role: "reviewer" };

console.log(user.role);
console.log(updatedUser.role);
console.log(user === updatedUser);
~~~

Output:

~~~text
learner
reviewer
false
~~~

Object spread makes a **shallow copy**. Nested objects are still shared:

~~~js
const account = {
  name: "Asha",
  profile: { city: "Pune" },
};

const accountCopy = { ...account };

console.log(account === accountCopy);
console.log(account.profile === accountCopy.profile);
~~~

Output:

~~~text
false
true
~~~

The outer objects differ, but their `profile` property points to the same nested object. For a nested update, copy each level you change:

~~~js
const updatedAccount = {
  ...account,
  profile: {
    ...account.profile,
    city: "Jaipur",
  },
};
~~~

This pattern is common when updating React state. Preserve the original data and create new objects or arrays for changed values.

## Scope and data-flow mistakes to avoid

- Declaring every value globally instead of passing needed values into functions.
- Expecting a function's local variable to exist outside that function.
- Using a block-scoped `let` or `const` after its block ends.
- Mutating an array or object shared by another part of the application.
- Assuming spread syntax makes a deep copy of nested values.
- Using `map` when you only want a side effect; use `forEach` for that purpose.
- Forgetting that `find` returns `undefined` when no item matches.
- Treating arrays or objects received from an API as valid without checking their shape.
- Assuming two separately created objects with identical properties compare equal with `===`; object comparison checks identity.

## Practice

1. Write a function that accepts a list of prices and returns a new array with tax added to each price.
2. Use `filter` to find tasks that are incomplete and `find` to locate one task by its ID.
3. Create a function with a local counter. Return another function that increments it and explain why the counter remains available.
4. Assign one object to two variables, change a property through one, and observe the value through the other.
5. Use object spread to create an updated copy. Compare the original and copy with `===`.
6. Make a shallow copy of an object with a nested profile. Compare the nested profile references.
7. Write a React-style state update that adds an item to an array without calling `push` on the existing state.
8. Move a name inside a block, then check which lines can access it.
9. Create two objects with the same properties and explain why `first === second` is false.
10. Pass data through a function parameter instead of relying on a global variable.

## Key takeaways

- Scope controls where a binding can be read; pass data through parameters instead of relying on broad global state.
- Functions accept inputs, perform focused work, and return values.
- A closure keeps access to the lexical bindings around the function that created it.
- Arrays organize ordered records; use `map` to transform and `filter` to select.
- Mutating methods change their array or object; use copies when shared or React state data should remain unchanged.
- Object spread creates a shallow copy, so nested references may still be shared.
- Objects and arrays compare by identity with `===`, not by comparing all their properties.
- Validate data from forms and APIs before relying on it.
- The next lesson introduces modern JavaScript syntax and module patterns in more depth.

---

### Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| :--- | :--- | :--- | :---: |
| [006 - JavaScript essentials for MERN development](006-javascript-essentials-for-mern-development.md) | [Q&A](../qnas/007-functions-scope-arrays-and-objects-refresher.md) | [Example](../examples/007-functions-scope-arrays-and-objects-refresher.md) | [008 - Modern JavaScript syntax and modules](008-modern-javascript-syntax-and-modules.md) |
