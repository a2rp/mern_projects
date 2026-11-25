# 007 - Functions, Scope, Arrays, and Objects Refresher: Questions and Answers

Use these questions to review scope, closures, function inputs and results, callbacks, array methods, object properties, references, and safe updates. Each answer includes an explanation.

Related lesson: [007 - Functions, scope, arrays, and objects refresher](../lessons/007-functions-scope-arrays-and-objects-refresher.md)

## Multiple-choice questions

### 1. What does scope describe?

- A. Where a variable or function name can be used
- B. Which files are staged in Git
- C. How wide an array is displayed
- D. Which database a server connects to

**Answer: A.** Scope determines where a binding is accessible in the program.

### 2. Where can a block-scoped `const` declared inside an `if` block be read?

- A. Anywhere in the application
- B. Only inside that block and nested code
- C. Only in another module
- D. Only after a Git push

**Answer: B.** A const or let declaration belongs to the block where it is declared.

### 3. What is lexical scope?

- A. Name access follows the code's written nesting structure
- B. Every value is global
- C. Variables are available only in arrays
- D. A project uses a special filename

**Answer: A.** Inner code can access names from its surrounding lexical scope.

### 4. What is function scope?

- A. Local parameters and declarations are available within their function
- B. All function values are available everywhere
- C. A function cannot use outer values
- D. A function can only be declared at the top of a file

**Answer: A.** A function's local bindings are limited to that function unless returned or otherwise exposed.

### 5. What does the counter example demonstrate when the returned function still reads `count`?

- A. A closure
- B. An HTTP request
- C. An array index
- D. A database query

**Answer: A.** A closure retains access to the lexical bindings around the function that created it.

### 6. What does a function parameter represent?

- A. A named input available inside the function
- B. A Git branch
- C. A property that must be global
- D. A return value already calculated

**Answer: A.** The caller supplies an argument for the function's parameter.

### 7. What does `return` do?

- A. Sends a result to the caller and ends that function call
- B. Starts a new module
- C. Adds an item to an array
- D. Catches an error automatically

**Answer: A.** A return statement provides the function call's result.

### 8. What value does a function call produce when the function has no return statement?

- A. `null`
- B. `false`
- C. `undefined`
- D. An empty array

**Answer: C.** A function without an explicit return produces undefined.

### 9. What is a pure function?

- A. A function that gives a result based on its inputs without changing outside state
- B. A function that can only be called once
- C. A function with no parameters
- D. A function that writes to MongoDB

**Answer: A.** Pure functions are easier to reason about because they do not perform side effects.

### 10. What is a callback?

- A. A function passed to another function to be called by it
- B. A function that always returns a callback
- C. A file downloaded from GitHub
- D. An array's first index

**Answer: A.** Callbacks let a function receive behavior to run as part of its work.

### 11. What does `map` return?

- A. A new array containing values returned by its callback
- B. The original array after deleting all items
- C. A Boolean
- D. The first matching item

**Answer: A.** Map transforms each item into a value for a new array.

### 12. What does `filter` return?

- A. A new array containing items whose callback result is truthy
- B. A count only
- C. A copy of every item regardless of the condition
- D. A Promise in all cases

**Answer: A.** Filter keeps the items that match the test.

### 13. What does `find` return when there is no matching item?

- A. `undefined`
- B. An empty array
- C. `false` always
- D. The original array

**Answer: A.** Find returns the first matching item or undefined when none matches.

### 14. Which method checks whether at least one array item matches a condition?

- A. `some`
- B. `push`
- C. `map`
- D. `slice`

**Answer: A.** Some returns a Boolean indicating whether any item passes its test.

### 15. What does `forEach` usually return for application logic?

- A. No useful transformed array
- B. A new array of callback values
- C. The first item
- D. A Git commit

**Answer: A.** Use forEach for actions on each item; use map if you need a transformed array.

### 16. Which method mutates an array by adding an item to its end?

- A. `push`
- B. `filter`
- C. `map`
- D. `slice`

**Answer: A.** Push modifies the array on which it is called.

### 17. What does `const copy = original` do if original is an object?

- A. Copies the object's properties into a new independent object
- B. Copies the reference, so both variables point to the same object
- C. Serializes the object to JSON
- D. Freezes the object

**Answer: B.** Assigning an object copies its reference, not all of its properties into a new object.

### 18. What does `{ ...user, role: "reviewer" }` create?

- A. A shallow copy with role set to reviewer
- B. A deep copy of every nested object
- C. A new array
- D. A Promise

**Answer: A.** Object spread copies the top-level enumerable properties into a new object, then the later role value overrides the earlier one.

### 19. If two objects contain identical properties, what does `first === second` normally return when they were created separately?

- A. `true` because all their properties match
- B. `false` because they are different object references
- C. `undefined`
- D. It throws a TypeError

**Answer: B.** Strict equality for objects compares identity, not each property's content.

### 20. Why should a React state array generally be updated by creating a new array?

- A. React state should not be directly mutated; a new value clearly represents the update.
- B. Arrays cannot use push in JavaScript.
- C. React does not support arrays.
- D. A new array turns all values into strings.

**Answer: A.** An immutable update preserves the prior value and gives React a new reference for the changed state.

## Short-answer questions

### 21. Why should a function usually receive needed data through parameters instead of relying on global variables?

**Answer:** Parameters make the function's inputs visible at the call site and reduce hidden dependencies on shared state. The function is easier to reuse and reason about.

### 22. What is a closure, in beginner-friendly terms?

**Answer:** A closure is a function that keeps access to variables from the surrounding scope where it was created, even after that outer function has finished running.

### 23. What is the difference between a parameter and an argument?

**Answer:** A parameter is the name in a function definition. An argument is the actual value supplied when the function is called.

### 24. What is a side effect?

**Answer:** A side effect is a change or interaction outside the function's returned result, such as writing a file, changing shared data, logging output, or updating a database.

### 25. When should you use `map`, and when should you use `filter`?

**Answer:** Use map to transform every item into a new array. Use filter to keep only items that satisfy a condition.

### 26. How is `some` different from `find`?

**Answer:** Some returns a Boolean indicating whether any item matches. Find returns the first matching item or undefined.

### 27. How do array indexes work?

**Answer:** Indexes start at zero. The first item is at index 0, and the number of items is available through the array's length property.

### 28. When is bracket notation useful for an object property?

**Answer:** Use bracket notation when the property name is stored in a variable or when the property name cannot be written as a normal dot-property identifier.

### 29. What is the difference between `push` and array spread in `[...items, newItem]`?

**Answer:** Push mutates the existing array. Spread in a new array expression creates another outer array that contains the existing items plus the new one.

### 30. What is a shallow copy?

**Answer:** A shallow copy creates a new outer object or array but keeps references to nested objects and arrays. Nested values are not recursively copied.

### 31. How do you update a nested object without changing the original outer object or nested object?

**Answer:** Copy the outer object and each nested level being changed, for example `{ ...account, profile: { ...account.profile, city: "Jaipur" } }`.

### 32. Why is directly mutating React state discouraged?

**Answer:** Mutation changes an existing reference in place. Creating a new array or object makes the update explicit and helps React detect the changed state.

### 33. Why can changing an object through one variable affect another variable?

**Answer:** Assigning an object copies its reference. Both variables point to the same object until a separate object is created.

### 34. How does object equality with `===` work?

**Answer:** For objects, strict equality checks whether both variables refer to the same object. Two separate objects with matching property values are still different references.

### 35. What does `find` return if there are no matching items, and why should code account for that?

**Answer:** It returns undefined. Code should check for a missing result before reading properties from it.

### 36. Are module-level bindings automatically available in other modules?

**Answer:** No. A binding declared at the top level of an ES module belongs to that module unless it is exported and imported elsewhere.

### 37. What is the difference between `let`/`const` and `var` scope?

**Answer:** Let and const are block-scoped. Var is scoped to the containing function or global script rather than the nearest block, which can make it less predictable in modern code.

### 38. Why is it important to know whether an array method mutates its receiver?

**Answer:** If another part of the application shares that array, a mutation changes the data it sees too. Knowing the method's behavior helps prevent accidental state changes.

### 39. What is the difference between changing an object property and making an updated object copy?

**Answer:** Assigning a property changes the existing object. Spreading into a new object and overriding a property creates a different top-level reference while leaving the source object unchanged.

### 40. Why should arrays or objects received from an API be checked before use?

**Answer:** The response may be missing fields or contain unexpected types. Validate the data shape before code assumes that a property or method is available.

## Review checklist

You are ready to move on when you can:

- Explain module, function, and block scope.
- Describe a closure and why it retains access to outer bindings.
- Write a function with inputs and a useful return value.
- Explain the role of callbacks.
- Choose among `map`, `filter`, `find`, `some`, and `forEach`.
- Identify common array mutations and choose when to make a copy.
- Explain object references and why identical-looking objects may not be equal.
- Make a shallow copy and identify which nested references remain shared.
- Update arrays and objects without mutating shared React state.
- Validate object and array data before relying on it.

---

### Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| :--- | :--- | :--- | :---: |
| [006 - JavaScript essentials for MERN development](../lessons/006-javascript-essentials-for-mern-development.md) | [Q&A](007-functions-scope-arrays-and-objects-refresher.md) | [Example](../examples/007-functions-scope-arrays-and-objects-refresher.md) | [008 - Modern JavaScript syntax and modules](../lessons/008-modern-javascript-syntax-and-modules.md) |
