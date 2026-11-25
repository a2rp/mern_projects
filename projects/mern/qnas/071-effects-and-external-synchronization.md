# Chapter 071: Effects and external synchronization — Q&A

These questions review when to use React Effects, how dependencies and cleanup work, and how to avoid using Effects for ordinary rendering or user-event logic.

## Multiple-choice questions

### 1. What is the main purpose of a React Effect?

- **A.** To calculate every value shown in JSX
- **B.** To synchronize a component with an external system
- **C.** To replace event handlers
- **D.** To prevent React from rendering

**Answer: B.** Effects are for synchronization with systems outside React, such as browser APIs, subscriptions, timers, network requests, or third-party widgets.

### 2. When does an Effect setup normally run?

- **A.** During the component's render calculation
- **B.** After React commits the render
- **C.** Before the component function is called
- **D.** Only after a button click

**Answer: B.** Effects run after React commits a render, so rendering can remain pure.

### 3. What does an Effect without a dependency array do?

- **A.** Runs only once
- **B.** Runs after every committed render
- **C.** Never runs
- **D.** Runs only when a prop changes

**Answer: B.** Omitting the dependency array means React runs the Effect after every commit.

### 4. What does an empty dependency array mean for an Effect?

- **A.** The Effect never runs
- **B.** The Effect runs after the component first appears, with an extra development check in Strict Mode
- **C.** The Effect runs after every state update
- **D.** The Effect runs only on button clicks

**Answer: B.** An empty array means the Effect does not depend on changing reactive values; Strict Mode may run an extra setup-cleanup cycle in development.

### 5. What does <code>[roomId]</code> mean as an Effect dependency array?

- **A.** The Effect runs only when the room is removed
- **B.** The Effect runs after the first commit and when <code>roomId</code> changes
- **C.** The Effect runs only if roomId is a string
- **D.** The Effect runs before every render

**Answer: B.** React re-synchronizes the Effect when the dependency value differs from its previous value.

### 6. What should cleanup usually do?

- **A.** Undo or stop the external work started by setup
- **B.** Render a second copy of the component
- **C.** Remove all React state
- **D.** Run a user event handler

**Answer: A.** Cleanup can clear a timer, remove an event listener, disconnect a connection, or cancel/ignore a request.

### 7. When does React run an Effect's cleanup?

- **A.** Only when the browser closes
- **B.** Before the next setup for that Effect and when the component is removed
- **C.** Before every render, even when the Effect does not re-run
- **D.** Only when an exception occurs

**Answer: B.** Cleanup corresponds to the previous setup that needs to be replaced or stopped.

### 8. Which is the correct cleanup pair for <code>setInterval</code>?

- **A.** <code>clearTimeout</code>
- **B.** <code>clearInterval</code>
- **C.** <code>removeInterval</code>
- **D.** <code>stopEvent</code>

**Answer: B.** Save the interval id and pass it to <code>clearInterval</code> during cleanup.

### 9. What is the cleanup pair for <code>window.addEventListener("online", handler)</code>?

- **A.** <code>window.clearEventListener</code>
- **B.** <code>window.removeEventListener("online", handler)</code>
- **C.** <code>window.stopPropagation</code>
- **D.** <code>window.cancelAnimationFrame</code>

**Answer: B.** Remove the listener with the same event name and handler reference.

### 10. How does React compare dependencies between renders?

- **A.** By converting every value to JSON
- **B.** With <code>Object.is</code>
- **C.** By comparing variable names
- **D.** By comparing only strings

**Answer: B.** Each dependency is compared to its previous value using <code>Object.is</code> semantics.

### 11. What should you do when an Effect reads a prop or state value?

- **A.** Include that reactive value in the dependency array
- **B.** Omit it so the Effect runs less often
- **C.** Put it in a CSS class
- **D.** Convert it to a global variable

**Answer: A.** Dependencies describe the reactive values read by the Effect. Restructure the code if a dependency is unnecessary.

### 12. Which work belongs in a click event handler rather than an Effect?

- **A.** Submitting a purchase because the user clicked “Buy”
- **B.** Connecting to a room because a component is displayed
- **C.** Removing a subscription when a component is removed
- **D.** Synchronizing a widget with a changing prop

**Answer: A.** The event handler directly represents the user's action that caused the work.

### 13. A filtered array can be calculated from props and state. What should usually be done?

- **A.** Store a duplicate filtered array and synchronize it with an Effect
- **B.** Derive the filtered array during render
- **C.** Fetch it from a server after every render
- **D.** Put it in a module-level mutable variable

**Answer: B.** Derived UI data belongs in render unless there is a specific performance reason to memoize the calculation.

### 14. What is one common cause of an infinite Effect loop?

- **A.** The Effect updates state, that update causes a render, and the Effect runs again
- **B.** An Effect returns a cleanup function
- **C.** A component has a label
- **D.** A dependency is a string

**Answer: A.** An Effect that updates a dependency on every run can keep triggering itself.

### 15. Why can an object created during render cause an Effect to re-run repeatedly if it is a dependency?

- **A.** It usually has a new object identity on each render
- **B.** React never compares objects
- **C.** Objects cannot be dependencies
- **D.** The browser serializes it

**Answer: A.** React compares the object identity; a newly created object can differ each render even if its contents look the same.

### 16. What is a safe way to call async work from an Effect?

- **A.** Make the Effect callback itself <code>async</code> and return its Promise
- **B.** Define and call an inner async function inside the Effect
- **C.** Put <code>await</code> directly in the component body
- **D.** Call the request during render

**Answer: B.** The Effect callback may return a cleanup function, not a Promise, so asynchronous work should be handled by an inner function.

### 17. When an old request may finish after the user changes to a different id, what should cleanup do?

- **A.** Allow the old response to overwrite the new result
- **B.** Abort the old request or ignore its result
- **C.** Clear all props
- **D.** Start another interval

**Answer: B.** Cleanup should prevent outdated work from affecting the current UI.

### 18. What extra Effect behavior does React Strict Mode perform in development?

- **A.** An extra setup and cleanup cycle
- **B.** A permanent second production subscription
- **C.** A network request for every component
- **D.** A forced page reload

**Answer: A.** The extra development cycle helps reveal missing cleanup or setup that is not safe to repeat.

### 19. What should you do if an Effect updates state based only on other React state and no external system is involved?

- **A.** Keep the Effect and add more dependencies
- **B.** Consider deriving the value during render or handling it in the event
- **C.** Disable Strict Mode
- **D.** Put the state in a ref

**Answer: B.** Effects are not intended to be the default tool for synchronizing React state with itself.

### 20. What is <code>useLayoutEffect</code> generally for?

- **A.** Work that must measure or update layout before the browser repaints
- **B.** Every network request
- **C.** Replacing all uses of <code>useEffect</code>
- **D.** Running server-side code

**Answer: A.** It runs earlier and can block painting, so use it only when that timing is necessary.

## Short-answer questions

### 21. Explain the difference between an Effect and an event handler.

**Answer:** An Effect runs because a component rendered and needs to synchronize with an external system. An event handler runs because a particular user interaction occurred. Use the event handler for work caused by that interaction.

### 22. What is an Effect dependency?

**Answer:** A reactive value such as a prop, state value, or component-body variable read by the Effect. React uses the dependency list to know when the external system must be synchronized again.

### 23. Why must an Effect's cleanup remove the same event listener that setup added?

**Answer:** The browser identifies a listener using the event type, function reference, and relevant options. Removing a different function reference does not unsubscribe the original listener.

### 24. Why is cleanup important for a timer?

**Answer:** Without clearing an interval, it can continue running after the component is paused or removed, wasting work or updating state when it is no longer relevant.

### 25. How can an Effect safely update a counter on each interval tick without depending on the counter value?

**Answer:** Use a functional state update such as <code>setCount((currentCount) =&gt; currentCount + 1)</code>. The callback calculates the next value from the previous state instead of reading a captured render value.

### 26. What are the three common dependency-array forms and their behavior?

**Answer:** No array runs after every commit. An empty array runs after the initial appearance (with the development Strict Mode check). An array of values runs after the first commit and again when one of those dependencies changes.

### 27. Why is an async Effect callback itself usually incorrect?

**Answer:** An async function returns a Promise, but an Effect may return a cleanup function. Define an inner async function, call it from the Effect, and return cleanup synchronously.

### 28. How can a request avoid setting state with an outdated response?

**Answer:** Abort the request in cleanup when supported, or mark the Effect instance as ignored and check that flag before applying the result. A request identity check can also ensure only the latest request updates the UI.

### 29. Why should you not suppress a missing-dependency warning by leaving a value out?

**Answer:** The Effect can use a stale value and fail to re-synchronize when that value changes. Include reactive values the Effect reads or restructure the code so it no longer reads an unnecessary dependency.

### 30. Name two common situations where an Effect is unnecessary.

**Answer:** When calculating a value from current props/state that can be derived during render, and when performing work that should happen directly in response to a particular user action.

## Applied questions

### 31. A component starts an interval in an Effect but never clears it. What should be added?

**Answer:** Return a cleanup function that calls <code>clearInterval</code> with the id returned by <code>setInterval</code>. The cleanup runs before replacing the interval and when the component is removed.

### 32. A component subscribes to the <code>resize</code> event every render. After several renders, the handler fires multiple times. What is wrong?

**Answer:** The Effect is adding listeners without removing prior subscriptions. Use an Effect that adds one listener and returns cleanup to remove the same handler. Include any reactive values the handler needs in the dependency design.

### 33. An Effect reads <code>roomId</code> but has an empty dependency array. What bug can occur?

**Answer:** The connection can remain attached to the initial room when <code>roomId</code> changes. Add <code>roomId</code> as a dependency so cleanup disconnects the previous room and setup connects to the new one.

### 34. A search page stores both <code>query</code> and <code>matchingResults</code>. An Effect updates matching results when the query changes. How can this be simplified?

**Answer:** If results are simply derived from a stable source list and the current query, calculate the filtered results during rendering rather than storing a second state value synchronized by an Effect.

### 35. A “Buy” button sets <code>shouldBuy</code> to true, and an Effect watches that value to submit the purchase. What is a clearer design?

**Answer:** Submit the purchase directly in the button's event handler. The handler already knows that the user requested the purchase, so an Effect is not needed to infer the cause from state.

### 36. An Effect depends on an object literal created in the component body and re-runs after every state update. What should you inspect?

**Answer:** The object receives a new identity on each render. Move its construction into the Effect if possible, or depend on the individual reactive values that matter. Do not remove a real dependency just to stop re-running.

### 37. A profile request for user A finishes after the screen has switched to user B. The UI briefly shows A's profile. What should cleanup do?

**Answer:** Abort A's request where possible, or ignore its result after the Effect for A is cleaned up. The Effect for B should be the only active request allowed to update the visible profile.

### 38. An Effect subscribes to a chat connection. How should setup and cleanup relate?

**Answer:** Setup should connect to the current chat room. Cleanup should disconnect that exact connection. When the room id changes, React cleans up the previous connection before setting up the new one.

### 39. A component works in production but logs two active subscriptions on first mount in development Strict Mode. What should you investigate?

**Answer:** Check that each setup has matching cleanup and that cleanup removes the exact subscription created by that setup. Strict Mode intentionally performs an extra setup-cleanup cycle in development to reveal lifecycle bugs.

### 40. You need to update the document title when a page's selected lesson changes. Why is an Effect appropriate, and what should its dependency be?

**Answer:** The document title is an external browser property that must be synchronized with the rendered lesson. The Effect should read and depend on the selected lesson value, and can restore the prior title in cleanup if the component owns that synchronization lifecycle.

## Chapter navigation

| Previous chapter | Lesson | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [070 - Share state by lifting it](../lessons/070-share-state-by-lifting-it.md) | [Lesson](../lessons/071-effects-and-external-synchronization.md) | [Example](../examples/071-effects-and-external-synchronization.md) | [072 - Refs and DOM access](../lessons/072-refs-and-dom-access.md) |
