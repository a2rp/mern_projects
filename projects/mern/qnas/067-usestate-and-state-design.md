# 067 - useState and state design: Q&A

## Multiple-choice questions

### 1. What does the <code>useState</code> Hook provide?

A. A state value for the current render and a setter function.

B. A MongoDB collection and query function.

C. A CSS class and HTML element.

D. A value that automatically persists after reload.

**Answer: A.** The setter requests a new render with an updated state value.

### 2. When is the initial argument to <code>useState</code> used?

A. On every render.

B. For the component instance's initial state.

C. Only after a button click.

D. Whenever a parent prop changes.

**Answer: B.** Later renders receive the state React currently stores for that component instance.

### 3. Where should a function component call <code>useState</code>?

A. At the top level of the component, in a consistent order.

B. Inside a conditional branch only.

C. Inside the event handler that changes the value.

D. Inside a loop over the component's data.

**Answer: A.** Hooks must be called consistently at the top level.

### 4. Why does assigning to a local variable usually fail to update rendered UI?

A. A normal local variable does not persist between renders or request a React render.

B. JavaScript variables cannot hold numbers.

C. React converts every local variable into a prop.

D. JSX only renders constants.

**Answer: A.** Use state and its setter for changing values that must affect the UI.

### 5. Which value is usually redundant if the state already contains the full item list?

A. A total count that can be calculated from the list.

B. A user-entered search query.

C. A selected status that changes independently.

D. An editable draft value.

**Answer: A.** Derive the count from the list during rendering instead of synchronizing a second copy.

### 6. What is a problem with storing <code>isLoading</code>, <code>hasError</code>, and <code>isComplete</code> as unrelated booleans?

A. They can represent contradictory combinations.

B. React does not support booleans in state.

C. They cannot be displayed in JSX.

D. They are automatically persisted.

**Answer: A.** A single status value can make mutually exclusive states clearer.

### 7. How should related profile fields that are edited together often be represented?

A. In a coherent state object updated immutably.

B. As one concatenated string.

C. In separate global variables.

D. As duplicated props and state.

**Answer: A.** Grouping related fields can make ownership and updates clearer.

### 8. What must happen when updating a nested field in an object held in state?

A. Create new objects along each changed level.

B. Mutate the nested object after copying only the outer object.

C. Change the corresponding DOM text directly.

D. Store the new field in a separate component global.

**Answer: A.** A shallow copy does not protect nested objects from mutation.

### 9. When is storing a selected ID instead of a duplicate selected object useful?

A. When the selected object can be found in existing data by that ID.

B. When the selected item has no ID.

C. Only when there is exactly one component.

D. When the ID changes on every render.

**Answer: A.** Deriving the selected object from its authoritative collection avoids duplicate copies.

### 10. How does a pure lazy initializer work with <code>useState</code>?

A. Pass the initializer function itself, such as <code>useState(createItems)</code>.

B. Call it in every event handler.

C. Pass its result as a function, such as <code>useState(() =&gt; createItems())</code> only when always recalculating.

D. Place it inside a conditional Hook call.

**Answer: A.** React calls the initializer to obtain the initial value; the function should be pure.

### 11. Does state automatically synchronize with a prop when that prop changes?

A. Yes, every prop replaces the state.

B. No, the initial state value is used for initialization only.

C. Only for object props.

D. Only after an event.

**Answer: B.** Use the prop directly when the display should always reflect it; mirror it only for an intentional independent snapshot.

### 12. Where should a piece of state usually live?

A. In the component that needs it, or a common owner when multiple components must coordinate.

B. Always in the root component.

C. In every component that reads it.

D. In a random event handler.

**Answer: A.** Place state as close as practical to the UI that owns and uses it.

### 13. What does each rendered instance of the same component normally get?

A. Its own local state.

B. A shared state automatically.

C. The same props object forever.

D. A separate database.

**Answer: A.** Instances have separate local state unless a shared owner coordinates them.

### 14. How should an array in state be extended?

A. Create a new array containing the old items and the new item.

B. Call <code>push</code> on the current state array.

C. Assign to the current array's last index.

D. Append markup directly to the DOM.

**Answer: A.** State arrays should be treated as read-only values.

### 15. Which method is commonly useful to derive a filtered list without mutation?

A. <code>filter</code>.

B. <code>splice</code>.

C. <code>sort</code> directly on the state array.

D. <code>pop</code>.

**Answer: A.** <code>filter</code> returns a new array.

### 16. Which state design is clearest for a request with mutually exclusive phases?

A. One status such as <code>"idle"</code>, <code>"loading"</code>, <code>"success"</code>, or <code>"error"</code>.

B. Five unrelated booleans with no constraints.

C. One number that changes randomly.

D. A DOM class read as state.

**Answer: A.** An explicit status avoids impossible boolean combinations.

### 17. What is a warning sign of deeply nested state?

A. A simple update requires many copies and is hard to reason about.

B. It contains an array.

C. It is used in a React component.

D. The UI has a heading.

**Answer: A.** A flatter shape can make update paths and ownership clearer.

### 18. Why might a component store an ID instead of the full selected record?

A. The record can be derived from the source list, so there is only one authoritative record.

B. IDs cannot be changed.

C. The selected object cannot be rendered.

D. React requires every selected item to be a string.

**Answer: A.** Deriving the selected record avoids a duplicate object that can become stale.

### 19. Which statement about ordinary React state and reloads is correct?

A. State is automatically saved to MongoDB.

B. State belongs to the mounted component instance and does not automatically persist after a full reload.

C. State is stored in the URL by default.

D. State survives browser restarts unless cleared.

**Answer: B.** Persistence requires an explicit storage or server mechanism.

### 20. Why can a function initializer be preferable for an expensive initial calculation?

A. It avoids evaluating that calculation as an argument on every render.

B. It runs on every event instead of render.

C. It makes the initial data mutable.

D. It bypasses Hook rules.

**Answer: A.** Passing the pure function itself lets React use it for initial state calculation.

## Short-answer questions

### 21. What are the two values returned by <code>useState</code>?

**Answer:** The current state value for the render and a setter function for requesting an update.

### 22. Why must Hooks be called at the top level?

**Answer:** React needs Hook calls to occur in the same order across renders so it can match each call with the correct stored state.

### 23. Give two examples of values often derived instead of stored in state.

**Answer:** A filtered view of a list and a total or count calculated from that list. They can be calculated from existing inputs during render.

### 24. What is contradictory state?

**Answer:** A state representation that permits combinations that cannot meaningfully be true together, such as simultaneously reporting a request as both loading and complete.

### 25. When is it useful to group fields into one state object?

**Answer:** When the fields describe one coherent entity or tend to be updated together, such as the editable fields of a profile.

### 26. What does immutable nested updating require?

**Answer:** Create a new object at each level along the changed path, preserving unchanged fields with copies.

### 27. What does “state is local to a component instance” mean?

**Answer:** Each mounted instance owns its own state. Two instances do not share state unless a common owner coordinates them.

### 28. What should you do if a component must always display the latest prop value?

**Answer:** Use the prop directly instead of copying it into state.

### 29. Why is keeping state near its users helpful?

**Answer:** It makes ownership easier to understand and avoids moving unrelated state to a distant root component.

### 30. Does React state automatically save data to a database?

**Answer:** No. Component state describes current UI memory; persistence needs an explicit storage or server approach.

## Application questions

### 31. A form stores <code>firstName</code>, <code>lastName</code>, and <code>fullName</code> in state and updates all three on each keystroke. What can be simplified?

**Answer:** Keep the editable first and last names as state and derive <code>fullName</code> during rendering. This removes a redundant value that could become stale.

### 32. A request UI has separate booleans for loading, success, and error. Replace them with a clearer model.

**Answer:** Use one status value such as <code>"idle"</code>, <code>"loading"</code>, <code>"success"</code>, or <code>"error"</code>, then render based on that status.

### 33. A shopping cart stores both <code>items</code> and <code>subtotal</code>, but subtotal is calculated only from the items. What should change?

**Answer:** Keep the cart items as state and calculate the subtotal from their quantities and prices during render.

### 34. A state object has <code>profile.address.city</code>. Show how to update the city without mutation.

**Answer:** Return a new profile and address, for example <code>setProfile(previous =&gt; ({ ...previous, address: { ...previous.address, city: nextCity } }))</code>.

### 35. A Hook is called only when <code>isOpen</code> is true. How should the component be redesigned?

**Answer:** Call the Hook unconditionally at the component's top level, then use <code>isOpen</code> to choose what JSX to render.

### 36. A component copies <code>props.theme</code> into state, but should immediately reflect any new theme from its parent. What is the fix?

**Answer:** Render from <code>props.theme</code> directly instead of mirroring it in state.

### 37. A lesson list and a details panel store separate copies of the selected lesson. How can they avoid drifting apart?

**Answer:** Store the selected lesson ID in a common owner and derive the selected record from the authoritative lesson list.

### 38. Initial data is built by an expensive pure function. How should it be passed to <code>useState</code>?

**Answer:** Pass the initializer function itself, such as <code>useState(createInitialData)</code>, rather than calling it as an argument on every render.

### 39. Two copies of a <code>Disclosure</code> component are on the page. Should opening one automatically open the other?

**Answer:** Not unless that is intended. Each instance has local state by default; if they must coordinate, move the shared open-state ownership to their common parent.

### 40. A UI stores <code>isEmpty</code> separately from its <code>items</code> array. What is a simpler model?

**Answer:** Keep the items array and derive <code>items.length === 0</code> during render.

## Chapter navigation

| Previous chapter | Lesson | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [066 - Events and state updates](../lessons/066-events-and-state-updates.md) | [Lesson](../lessons/067-usestate-and-state-design.md) | [Example](../examples/067-usestate-and-state-design.md) | [068 - Conditional rendering and lists](../lessons/068-conditional-rendering-and-lists.md) |
