# 061 - React mental model and declarative UI: Q&A

This chapter review contains 40 questions: 20 multiple-choice questions, 10 short-answer questions, and 10 application questions. Answers and explanations are included for self-study.

## Multiple-choice questions

### 1. What does declarative UI code primarily describe?

- A. Every DOM operation in the order it must run.
- B. What the interface should look like for the current inputs and state.
- C. The database schema.
- D. The browser's internal rendering algorithm.

**Answer: B.** A component describes the UI for its current data. React coordinates the DOM updates needed to display that description.

### 2. What is a React component in a typical function-component app?

- A. A JavaScript function that returns a UI description, commonly written with JSX.
- B. A MongoDB collection.
- C. A CSS selector.
- D. A browser event.

**Answer: A.** Function components compose the interface by returning JSX based on their inputs.

### 3. Why does a user-defined component usually start with a capital letter?

- A. JavaScript requires all functions to be capitalized.
- B. JSX uses capitalization to distinguish component references from built-in element names.
- C. It enables database access.
- D. It prevents rerenders.

**Answer: B.** JSX treats a lowercase tag such as `<section>` as a built-in element and an uppercase name such as `<ProductCard>` as a component.

### 4. What are props?

- A. Read-only inputs passed from a parent component to a child.
- B. Mutable values stored in MongoDB.
- C. DOM nodes returned by a browser query.
- D. A replacement name for event handlers.

**Answer: A.** Props let a parent provide values and callbacks to a child. The child should not mutate them.

### 5. What is state used for?

- A. Information that changes over time and affects the rendered UI.
- B. Any constant declared inside a component.
- C. Only data downloaded from a database.
- D. Storing HTML strings for manual DOM insertion.

**Answer: A.** State is component data whose update asks React to render the component again.

### 6. What should happen when a state setter is called?

- A. React is asked to update the state and render the affected UI again.
- B. A local variable is permanently changed without rendering.
- C. The browser always reloads the page.
- D. MongoDB is updated automatically.

**Answer: A.** State setters schedule React work; the update does not automatically persist anything to a backend.

### 7. What is the simplified purpose of the render phase?

- A. Calculate the next UI from component inputs.
- B. Send every component directly to MongoDB.
- C. Bind the application to a network port.
- D. Compile CSS selectors.

**Answer: A.** During rendering, React calls components to determine what the next UI should look like.

### 8. What is the commit phase in a browser React app?

- A. The point when React applies necessary changes to the DOM.
- B. A Git operation required by every component.
- C. A database transaction.
- D. The time when props become mutable.

**Answer: A.** After calculating the next UI, React commits the needed host changes to the DOM.

### 9. What does a re-render mean?

- A. The browser necessarily deletes and recreates the entire page DOM.
- B. React recalculates UI from component inputs and applies necessary changes.
- C. The server restarts.
- D. All state is reset.

**Answer: B.** A component may run again, but React applies the necessary changes rather than blindly rebuilding the entire DOM.

### 10. What is a pure render?

- A. Rendering that produces output from current inputs without changing external state or causing side effects.
- B. Rendering that uses no JSX.
- C. Rendering that never happens twice.
- D. Rendering that always returns an empty element.

**Answer: A.** Pure rendering is predictable and can safely be repeated by React.

### 11. Where should a click-triggered action such as toggling a button usually happen?

- A. In an event handler.
- B. During an unrelated component's render.
- C. In a MongoDB schema.
- D. In a CSS media query.

**Answer: A.** Event handlers run in response to user interaction and can request state updates.

### 12. When is an Effect generally appropriate?

- A. To calculate a total that can be derived directly during rendering.
- B. To synchronize with an external system such as a browser API or subscription.
- C. To mutate props.
- D. To replace all event handlers.

**Answer: B.** Effects are for synchronization with systems outside React; derived UI data usually belongs in render calculations.

### 13. How should an object stored in state usually be updated?

- A. Mutate the existing object and assume React notices.
- B. Create a new object representing the updated state.
- C. Change a DOM node directly.
- D. Store the object as HTML.

**Answer: B.** State should be treated immutably so React can reliably see and render the update.

### 14. When should a functional state updater be used?

- A. When the next state depends on the previous state.
- B. Only when a component returns a string.
- C. To update a prop in place.
- D. To call a database query during render.

**Answer: A.** An updater such as `setCount(current => current + 1)` bases the next value on the pending previous value.

### 15. What is the usual meaning of lifting state up?

- A. Moving shared state to the nearest common parent that needs to coordinate it.
- B. Moving every value into a global store.
- C. Moving state into the browser DOM.
- D. Sending all state to Express.

**Answer: A.** A shared parent can own the value and pass it to children through props and callbacks.

### 16. Why do elements in a rendered list need stable keys?

- A. To help React match items between renders when the list changes.
- B. To make the array sort itself.
- C. To encrypt the list.
- D. To prevent all state updates.

**Answer: A.** Stable keys help React preserve the correct relationship between data items and rendered elements.

### 17. When can an array index be a poor list key?

- A. When items may be inserted, removed, or reordered.
- B. When the array has two elements.
- C. When JSX contains a paragraph.
- D. When React runs in a browser.

**Answer: A.** If positions change, an index can make React associate existing component state with the wrong item.

### 18. What does JSX represent?

- A. A JavaScript syntax extension transformed by tooling into UI-related JavaScript.
- B. A string of HTML that React inserts unchanged.
- C. A database query language.
- D. A browser-only CSS format.

**Answer: A.** JSX resembles markup but is JavaScript syntax and is transformed by the project's tooling.

### 19. What does a state update in React guarantee about MongoDB?

- A. The data is saved automatically.
- B. Nothing; a client state change does not itself persist data to the backend.
- C. A transaction is always started.
- D. Every component becomes authorized.

**Answer: B.** Persistence requires an explicit API request and backend handling.

### 20. Why is frontend validation not sufficient for security?

- A. Users can bypass or alter client code, so the server must validate and authorize independently.
- B. React cannot display messages.
- C. JSX does not support forms.
- D. CSS changes validation results.

**Answer: A.** The backend is a trust boundary and must enforce authorization, input validation, and business rules.

## Short-answer questions

### 21. Explain declarative UI in your own words.

**Answer:** Describe the interface that should be visible for the current data and state, then let React coordinate the necessary DOM changes instead of manually patching each node.

### 22. What is the difference between props and state?

**Answer:** Props are inputs provided by a parent and treated as read-only by the receiving component. State is component-owned information that can change and trigger a render.

### 23. What does a component render calculate?

**Answer:** It calculates the next UI description from its current props, state, and other React inputs such as context. It should not perform unrelated side effects.

### 24. Why can React call a component more than once?

**Answer:** State or parent updates can trigger rendering again, and development tools such as Strict Mode may repeat calls to help expose impure logic. Code should not depend on rendering exactly once.

### 25. Name two examples of side effects that should not happen during render.

**Answer:** Direct DOM mutation and network requests are examples. Subscribing to an external event source or mutating a global value during render are also inappropriate.

### 26. What does an event handler do in a stateful component?

**Answer:** It responds to an interaction, performs the associated event logic, and may call a state setter to request an updated UI.

### 27. Why calculate derived values during rendering instead of storing duplicates in state?

**Answer:** Deriving values avoids multiple sources of truth that can become inconsistent. It also keeps the stored state minimal.

### 28. How do children request a change to state owned by a parent?

**Answer:** The parent can pass a callback prop. The child calls the callback in response to an event, and the parent updates its own state.

### 29. What problem can an unstable list key cause?

**Answer:** React may match an element to the wrong item after insertions, removals, or reordering, which can move component or DOM state to an unintended item.

### 30. In a MERN app, what is React responsible for and what remains the backend's job?

**Answer:** React describes the client interface and handles client interactions. The backend remains responsible for trusted validation, authentication, authorization, business rules, and persistence.

## Application questions

### 31. A component calls `document.querySelector()` during every render to update a heading. How should it be redesigned?

**Answer:** Render the heading from props or state in JSX and let React update its managed DOM. Use a ref or Effect only when a real external DOM integration requires direct access.

### 32. A like button sets a local variable from false to true, but the label does not update. Why?

**Answer:** A local assignment does not notify React or schedule a render. Store the value in state and call its setter in the click handler.

### 33. A child component directly assigns to a prop to change its parent's title. What data-flow pattern should replace this?

**Answer:** The parent should own the title and pass a callback prop. The child invokes the callback to request a change; the parent updates state and passes the new value down.

### 34. A component sends a fetch request every time its function body runs. What is the problem?

**Answer:** Rendering can run repeatedly, so the request is an uncontrolled side effect. Trigger the request from an appropriate event or synchronize it with an external system using the app's chosen data-fetching approach.

### 35. A component stores both a list of cart items and a separately updated item count. The two values sometimes disagree. How can this be improved?

**Answer:** Keep the item list as the source of truth and calculate the count from its quantities during render, unless there is a specific reason the count must be independently stored.

### 36. A list uses each item's array position as its key, and after sorting, an input's text appears on another row. What should change?

**Answer:** Give each item a stable unique key from its data, such as a product ID, so React can match the same item across reordering.

### 37. A developer expects React to replace the whole DOM tree whenever state changes. What is the more accurate explanation?

**Answer:** React recalculates the component UI and commits the necessary DOM changes. A rerender does not inherently mean the entire DOM is destroyed and recreated.

### 38. In development, a render function appears to run twice and increments a module-level counter each time. What does this reveal?

**Answer:** The component has an impure render side effect. Rendering should not mutate external values, and development Strict Mode can expose this kind of bug.

### 39. A form validates a price in React, but a crafted request stores a negative price through the API. Which layer is missing protection?

**Answer:** The backend must validate the request and enforce the business rule independently. Client validation improves feedback but is not a security boundary.

### 40. Two sibling components need to display and update the same selected product. Where should the state live?

**Answer:** Move the selected product state to their nearest common parent and pass the value and update callback to each sibling.

## Chapter navigation

| Previous chapter | Lesson | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [060 - Search, filtering, sorting, and pagination APIs](../lessons/060-search-filtering-sorting-and-pagination-apis.md) | [Lesson](../lessons/061-react-mental-model-and-declarative-ui.md) | [Example](../examples/061-react-mental-model-and-declarative-ui.md) | [062 - Create a React app with modern tooling](../lessons/062-create-a-react-app-with-modern-tooling.md) |
