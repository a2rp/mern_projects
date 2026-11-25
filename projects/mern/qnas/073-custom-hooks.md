# Chapter 073: Custom hooks — Q&A

These questions review how custom Hooks package reusable stateful logic, how the Rules of Hooks apply, and why separate Hook calls do not share a state instance.

## Multiple-choice questions

### 1. What is a custom Hook?

- **A.** A JavaScript function that uses React Hooks to package reusable logic
- **B.** A component that must return a DOM node
- **C.** A state variable shared by the entire app
- **D.** A replacement for React components

**Answer: A.** A custom Hook combines built-in or other custom Hooks into reusable stateful behavior.

### 2. What naming convention identifies a custom Hook?

- **A.** It starts with <code>component</code>
- **B.** It starts with <code>use</code> followed by a capital letter
- **C.** It ends with <code>Hook</code>
- **D.** It starts with a lowercase letter and contains no prefix

**Answer: B.** Names such as <code>useOnlineStatus</code> identify functions that follow Hook rules.

### 3. What may a custom Hook return?

- **A.** Only JSX
- **B.** Only a state setter
- **C.** Any useful value, object, array, or function
- **D.** Only a DOM node

**Answer: C.** Unlike components, custom Hooks do not need to return JSX.

### 4. When must a custom Hook call its Hooks?

- **A.** At the top level of the custom Hook
- **B.** Only inside a click handler
- **C.** Only inside a conditional branch
- **D.** After a return statement

**Answer: A.** Hooks must be called at the top level in a consistent order.

### 5. Which function should usually have a normal helper name instead of a <code>use</code> prefix?

- **A.** A function that calls <code>useEffect</code>
- **B.** A function that calls <code>useState</code>
- **C.** A pure formatting function that calls no Hooks
- **D.** A function that calls another custom Hook

**Answer: C.** A helper that does not call Hooks is an ordinary function, such as <code>formatDate</code>.

### 6. If two components each call <code>useOnlineStatus()</code>, what is true?

- **A.** Both calls use one automatically shared React state variable
- **B.** Each call has its own Hook state and Effect
- **C.** The second call is ignored
- **D.** The app crashes because Hooks cannot be reused

**Answer: B.** Each call is an independent instance of the Hook's stateful logic.

### 7. Why can two independent calls to <code>useOnlineStatus()</code> still show the same status?

- **A.** They both subscribe to the same external browser status
- **B.** React merges all Hook state
- **C.** The Hook returns a global variable
- **D.** The components become one component

**Answer: A.** Each call has independent state, but both synchronize with the same browser events.

### 8. If several children need one authoritative React state value, what should you usually do?

- **A.** Call a stateful custom Hook in every child and assume the state is shared
- **B.** Lift the state to a common parent and pass it down
- **C.** Store the value in a regular module variable
- **D.** Mutate each child's props

**Answer: B.** Custom Hooks share logic; lifting state shares one state instance.

### 9. Which is a valid place to call a custom Hook?

- **A.** At the top level of a function component
- **B.** Inside a loop
- **C.** Inside an event callback
- **D.** In a module's top-level initializer

**Answer: A.** Custom Hooks can be called at the top level of function components or other custom Hooks.

### 10. What is wrong with calling <code>useState</code> only when <code>enabled</code> is true?

- **A.** A Hook is being called conditionally, which can change Hook call order
- **B.** State cannot store booleans
- **C.** Components cannot receive booleans
- **D.** React requires every state value to be global

**Answer: A.** Hook calls must occur in the same order on every render.

### 11. Where may a condition belong if an Effect should only do work when a feature is enabled?

- **A.** Around the call to <code>useEffect</code>
- **B.** Inside the Effect callback
- **C.** Around the component function call
- **D.** In the Hook name

**Answer: B.** Call the Hook unconditionally at the top level and put the condition inside its callback.

### 12. What should a custom Hook do with a reactive argument read by its Effect?

- **A.** Omit it from dependencies
- **B.** Include it in the Effect's dependency list
- **C.** Convert it to a global variable
- **D.** Pass it to CSS

**Answer: B.** Effect dependencies are based on the reactive values read by the Effect.

### 13. What is a good reason to extract an Effect into a custom Hook?

- **A.** The Effect synchronizes an external system and callers need a clear domain-specific behavior
- **B.** Every function must start with <code>use</code>
- **C.** To hide missing dependencies
- **D.** To avoid returning cleanup

**Answer: A.** A focused Hook can expose intent while encapsulating the synchronization details.

### 14. Which is an example of an overly generic lifecycle-style Hook to avoid?

- **A.** <code>useOnlineStatus</code>
- **B.** <code>useChatRoom</code>
- **C.** <code>useMount</code>
- **D.** <code>useWindowSize</code>

**Answer: C.** Generic lifecycle wrappers can hide dependency requirements and encourage brittle Effect patterns.

### 15. What should a pure calculation such as formatting a date usually be?

- **A.** An ordinary helper function if it calls no Hooks
- **B.** A custom Hook in every case
- **C.** An Effect
- **D.** A React context

**Answer: A.** Use a Hook when it composes React stateful logic, not just to rename a pure calculation.

### 16. Where should browser event listener cleanup live when the listener is part of a custom Hook's behavior?

- **A.** In the Effect cleanup inside that Hook
- **B.** In every component that calls the Hook
- **C.** In a global timer
- **D.** It is unnecessary

**Answer: A.** The Hook that owns the subscription should also own its cleanup.

### 17. What should a component normally render from a custom Hook?

- **A.** The Hook's returned values
- **B.** The Hook's hidden state object by mutation
- **C.** Every internal variable in the Hook
- **D.** The Hook function itself as a DOM node

**Answer: A.** The Hook exposes a clear interface; the component uses the returned values to render.

### 18. What happens to a custom Hook when its calling component re-renders?

- **A.** Its function runs as part of that component render and sees the latest inputs
- **B.** It only runs once for the entire app
- **C.** It becomes a separate background process
- **D.** React ignores its arguments

**Answer: A.** A custom Hook's code runs during the render of its caller.

### 19. How can a custom Hook be exercised in a test?

- **A.** Call it once at the top of a plain test file outside React
- **B.** Render a component that calls it or use an appropriate Hook testing utility
- **C.** Put it in a CSS selector
- **D.** Call it from a click handler

**Answer: B.** Hooks run within React's rendering rules, so they need a component or Hook test harness.

### 20. What should a custom Hook API try to make clear?

- **A.** Its purpose, arguments, and returned values
- **B.** The caller's entire component tree
- **C.** All global variables in the app
- **D.** How to bypass the Rules of Hooks

**Answer: A.** A clear API lets components express intent without depending on unnecessary implementation details.

## Short-answer questions

### 21. Explain the difference between a component and a custom Hook.

**Answer:** A component describes UI and returns something React can render. A custom Hook packages reusable React logic, calls Hooks at its top level, and can return any useful value; it does not need to return JSX.

### 22. What do custom Hooks share between components?

**Answer:** They share the implementation of stateful logic. Every call creates its own Hook state and Effects; the calls do not automatically share one state instance.

### 23. How can two components share the same React state value?

**Answer:** Put that state in their closest common parent and pass the value and update callbacks down. Context may help when many descendants need the value across a subtree.

### 24. Why must Hook calls keep the same order between renders?

**Answer:** React associates Hook state with the order of Hook calls. Conditional or looped calls can shift that order and cause React to associate state with the wrong Hook.

### 25. What is a clear custom Hook name for subscribing to browser connectivity?

**Answer:** <code>useOnlineStatus</code>. It starts with <code>use</code> and describes the behavior consumers need.

### 26. What should a custom Hook return if callers only need the current connectivity value?

**Answer:** It can return a boolean such as <code>isOnline</code>, keeping event listener details private.

### 27. Why is a pure utility such as <code>formatDate</code> not normally a custom Hook?

**Answer:** It calls no React Hooks and does not manage stateful behavior. Naming it as a Hook would misleadingly imply Hook rules apply.

### 28. Where should the condition go if a Hook's Effect should do nothing for a disabled feature?

**Answer:** Call <code>useEffect</code> unconditionally at the top level, then check the feature flag inside the Effect callback.

### 29. What is the purpose of cleanup in an online-status Hook?

**Answer:** Remove the browser event listeners when the Hook's component unmounts, preventing leaked or duplicate subscriptions.

### 30. What should you do if several consumers need one shared value and one subscription?

**Answer:** Own the subscription or shared state once in an appropriate parent or shared store, then pass the value to consumers. Calling a local-state custom Hook in each consumer creates independent instances.

## Applied questions

### 31. A developer calls <code>useState</code> inside <code>if (props.enabled)</code>. How should the code be fixed?

**Answer:** Move the Hook call to the top level so it runs on every render. If behavior should depend on <code>enabled</code>, conditionally use the value or put the condition inside the Effect callback.

### 32. Two components call <code>useCounter()</code> and each counter begins at zero. Clicking one does not change the other. Is the Hook broken?

**Answer:** No. Each Hook call owns an independent state instance. To coordinate one counter, lift the state to a common parent and pass its value and callbacks to both children.

### 33. A custom Hook registers an <code>online</code> listener but never removes it. What should be added?

**Answer:** Return an Effect cleanup function that removes the same event type and handler reference that setup registered.

### 34. An Effect inside <code>useChatRoom(roomId)</code> reads <code>roomId</code> but has an empty dependency array. What problem can occur?

**Answer:** The connection may remain associated with the initial room after the argument changes. Include <code>roomId</code> in the Effect dependencies so cleanup and setup synchronize the connection with the latest room.

### 35. A helper called <code>useSorted(items)</code> only copies and sorts an array and calls no Hooks. What is a clearer name?

**Answer:** A normal utility name such as <code>getSortedItems</code>. The <code>use</code> prefix suggests a Hook and can restrict where the function is called.

### 36. A team creates <code>useEffectOnce</code> to avoid writing dependency arrays. What concern should they address?

**Answer:** The wrapper can hide reactive dependencies and stale values. Prefer a Hook named for the actual external behavior, with its dependencies and cleanup made explicit.

### 37. A component uses <code>useOnlineStatus()</code> and a separate <code>SaveButton</code> also calls it. Why can both update without sharing React state?

**Answer:** Each call has independent state and a subscription, but both subscriptions respond to the same browser connectivity events. Their matching values come from the external system, not shared Hook state.

### 38. A Hook accepts a changing <code>roomId</code> but its Effect never reconnects. What should you inspect?

**Answer:** Check that the Effect reads and lists <code>roomId</code> as a dependency, and verify the custom Hook is called with the latest value on each component render.

### 39. A custom Hook returns a JSX banner. Is that always invalid?

**Answer:** It is not a useful default design: components should own rendering, and Hooks should expose logic or values. A Hook can technically return values of many types, but return state, callbacks, or data and let the component choose the UI.

### 40. A custom Hook wraps one <code>useState</code> call but adds no naming, behavior, or reuse benefit. What should you consider?

**Answer:** Keep the state in the component if that is clearer. Extract a Hook when it represents meaningful reusable stateful behavior or a clear API, not just to move a line elsewhere.

## Chapter navigation

| Previous chapter | Lesson | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [072 - Refs and DOM access](../lessons/072-refs-and-dom-access.md) | [Lesson](../lessons/073-custom-hooks.md) | [Example](../examples/073-custom-hooks.md) | [074 - Context and shared application state](../lessons/074-context-and-shared-application-state.md) |
