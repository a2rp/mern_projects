# 074 - Context and shared application state: Q&A

This set reviews when to use React context, how providers and consumers work, how context interacts with state, and how to reason about updates and scope.

## Multiple-choice questions

### 1. What problem is context most directly designed to help with?

- **A.** Persisting data after the browser closes
- **B.** Passing a shared value to distant descendants without forwarding it through every intermediate component
- **C.** Sending data between unrelated browser tabs
- **D.** Replacing every component prop

**Answer: B.** Context lets descendants read a value from a provider above them in the same React tree. It can reduce prop drilling, but it does not persist data or communicate across tabs.

### 2. Where should a context usually be created?

- **A.** Inside each component that reads it
- **B.** Inside an event handler
- **C.** At module scope, so providers and consumers share the same context object
- **D.** In a CSS file

**Answer: C.** A module-level context has a stable identity. Creating it during component rendering creates a new context object and disconnects it from providers using the previous object.

### 3. What does the argument to <code>createContext(defaultValue)</code> represent?

- **A.** The value used only when no matching provider exists above the consumer
- **B.** The initial state for every provider
- **C.** A value that overrides every provider
- **D.** A value that React saves to local storage

**Answer: A.** The default is a fallback for consumers with no matching provider. It does not initialize provider state and is not persistence.

### 4. Which provider supplies a value to a consumer when multiple providers for the same context are above it?

- **A.** The outermost provider
- **B.** The nearest provider above the consumer
- **C.** The provider with the newest value
- **D.** All provider values are merged automatically

**Answer: B.** Context lookup finds the nearest matching provider in the rendered tree. A nested provider overrides the outer value for its descendants.

### 5. What value does a consumer receive when a provider explicitly passes <code>null</code>?

- **A.** The context default value
- **B.** An empty object
- **C.** <code>null</code>
- **D.** React skips the context read

**Answer: C.** A provider's value is used exactly as supplied. The default is used only when there is no matching provider.

### 6. Which is a valid place to call <code>useContext</code>?

- **A.** At the top level of a function component
- **B.** Inside a conditional branch
- **C.** Inside an event handler
- **D.** Inside a loop that renders list items

**Answer: A.** Like other Hooks, <code>useContext</code> must be called at the top level of a function component or custom Hook, not conditionally or in a nested callback.

### 7. A component reads a context and then returns a provider for that context. Which value does that component read?

- **A.** The provider it returns
- **B.** The nearest provider above itself, or the default if none exists
- **C.** The first descendant provider
- **D.** The provider value is merged with the default

**Answer: B.** Context lookup only considers ancestors of the component doing the read. The provider it returns is below it and only affects its descendants.

### 8. What must be true for a consumer to receive a provider value?

- **A.** The provider must be a direct parent
- **B.** The consumer must be rendered somewhere below that provider in the same React tree
- **C.** The provider must use the same component name as the consumer
- **D.** The provider must be in the same source file

**Answer: B.** Components can be separated by many intermediary components and files. The important requirement is that the consumer is a descendant of the matching provider.

### 9. When should an application use context instead of props?

- **A.** Whenever a component receives any value
- **B.** When distant descendants need a shared value and repeatedly forwarding it through intermediate components is awkward
- **C.** Whenever the value is a string
- **D.** Whenever a component has more than one child

**Answer: B.** Props are useful and explicit for nearby data flow. Context is useful when a shared dependency crosses many levels in a subtree.

### 10. Does creating a context automatically create changing state?

- **A.** Yes, every context owns a state value
- **B.** Yes, but only when it stores an object
- **C.** No; a provider can pass state owned elsewhere, such as state from <code>useState</code> or <code>useReducer</code>
- **D.** No; context can only hold constants

**Answer: C.** Context distributes a value. A provider component commonly owns state and passes it through context, but context itself is not a state Hook.

### 11. How does React determine whether a context provider value changed?

- **A.** It compares the previous and next values with <code>Object.is</code>
- **B.** It compares only object fields
- **C.** It checks whether the provider component has a new name
- **D.** It deep-compares the entire value

**Answer: A.** React uses <code>Object.is</code>. A newly created object or function has a different identity and is considered a changed value.

### 12. What can happen if a provider creates a fresh object value on every render?

- **A.** Consumers may update because the object has a new identity
- **B.** React deep-merges it with the previous object
- **C.** React ignores all fields after the first render
- **D.** The provider stops rendering

**Answer: A.** A new object reference fails the identity comparison. First keep the provider clear; optimize only if measurement shows unnecessary updates are a real issue.

### 13. Does wrapping a context consumer in <code>memo</code> block updates caused by the context it reads?

- **A.** Yes, always
- **B.** Yes, when the context contains an object
- **C.** No; a context update can update a consumer even when it is memoized
- **D.** Only for a default context value

**Answer: C.** Memoization does not block updates from a context value the component reads. Narrow subscriptions and provider design matter when context update scope is important.

### 14. Why might an application separate state and dispatch into different contexts?

- **A.** To let dispatch-only components avoid subscribing to changing state values
- **B.** To make a reducer run twice
- **C.** To persist dispatch actions in the browser
- **D.** To make providers communicate across React roots

**Answer: A.** Dispatch from <code>useReducer</code> is stable. A separate dispatch context lets components that only send actions depend on that stable value rather than the changing state context.

### 15. What is the main role of a custom Hook such as <code>useAccount()</code> around a context read?

- **A.** It creates a new React root
- **B.** It can provide a focused API and a clear error if a required provider is missing
- **C.** It automatically caches server data
- **D.** It prevents the context value from changing

**Answer: B.** A custom Hook can centralize the context read and enforce a provider requirement. It does not change context update behavior or add persistence.

### 16. What happens if a component subtree is wrapped in a second provider for the same context?

- **A.** The values are combined automatically
- **B.** Descendants below the nested provider receive its value
- **C.** All consumers stop working
- **D.** The outer provider is deleted

**Answer: B.** The nearest provider takes precedence for its descendants. Consumers outside that nested subtree continue reading from their nearest provider.

### 17. Which statement about context scope is correct?

- **A.** Context is shared by every browser tab with the same URL
- **B.** Context is available across separate React roots automatically
- **C.** Context values are scoped to descendants in a React tree
- **D.** Context is a server database

**Answer: C.** Context lookup follows the rendered React tree. Cross-tab, cross-root, persistence, and server-sharing needs require other mechanisms.

### 18. Which is the best default for a context that requires a provider?

- **A.** A realistic account object that hides a missing provider
- **B.** <code>null</code> plus a custom Hook that throws a helpful error when the provider is absent
- **C.** A random object created at render time
- **D.** An empty string regardless of the expected value

**Answer: B.** A sentinel such as <code>null</code> makes a missing provider detectable. The custom Hook can fail with a clear message close to the cause.

### 19. Which is usually a simpler choice when only one child needs a value?

- **A.** Add a new global context
- **B.** Pass the value as a prop
- **C.** Store the value in a browser cookie
- **D.** Create a new React root

**Answer: B.** A regular prop keeps the dependency explicit and avoids introducing a provider for a small local relationship.

### 20. Which statement about context and server data is accurate?

- **A.** Context automatically fetches and caches data from a server
- **B.** Context handles authorization for API requests
- **C.** Context can carry a value such as a client, but it does not replace fetching, caching, or server authorization
- **D.** Context makes a server request whenever any consumer renders

**Answer: C.** Context transports a value in the UI tree. Network requests, cache policy, and security boundaries need their own design.

## Short-answer questions

### 21. Define prop drilling and give one reason it can become difficult to maintain.

**Answer:** Prop drilling is forwarding a value through intermediate components that do not use it, so a deeper descendant can receive it. It can make component interfaces noisy and require updates to many forwarding components when a value or component structure changes.

### 22. What is the difference between a context default and a provider value?

**Answer:** The default is a fallback used when a consumer has no matching provider above it. The provider value is supplied for descendants in that provider's subtree and overrides the fallback there.

### 23. Why must the provider and consumer use the same context object?

**Answer:** React identifies a context by the context object itself, not by its name or default value. If the provider and consumer use different objects, the consumer cannot read that provider's value.

### 24. Why does a provider returned by a component not affect a context read earlier in that same component?

**Answer:** The returned provider is a child in the rendered tree. A component's context read looks upward at its ancestors, so only an outer provider or the default can affect that read.

### 25. How can <code>useState</code> and context work together?

**Answer:** A component or provider owns state with <code>useState</code>, then passes the current state and any needed update function through a provider. Descendants read that value with <code>useContext</code>.

### 26. When can <code>useReducer</code> be a good fit for context-backed state?

**Answer:** Use a reducer when several related actions update shared state and it helps to keep transition rules together. The provider owns the reducer and exposes state and dispatch to the relevant subtree.

### 27. What does <code>Object.is</code> mean for object-valued context?

**Answer:** React checks object identity rather than deeply comparing fields. A newly allocated object is considered different from the previous object even if it has identical properties.

### 28. What is one benefit and one limitation of splitting state and dispatch contexts?

**Answer:** Dispatch-only consumers can avoid subscribing to the changing state context. State consumers still update when that shared state changes, and the split adds structure that may not be useful for a very small feature.

### 29. When is a custom Hook useful for consuming a required context?

**Answer:** A custom Hook can provide a consistent, focused interface and check for a missing provider. It can throw a clear error instead of letting later code fail on an unexpected null value.

### 30. Name two requirements that context does not solve by itself.

**Answer:** Any two of persistence after reload, synchronization across browser tabs, communication across separate React roots, server-side authorization, network fetching, or caching. Context only makes a value available to descendants in a React tree.

## Applied questions

### 31. A value is passed through five components, and only the last component uses it. What options should you consider?

**Answer:** First decide whether explicit props remain clear and appropriate. If the descendants share a subtree and forwarding is becoming awkward, create a context, place its provider above the consumers, and let the final component read it. Avoid adding context automatically when simply passing a prop is still understandable.

### 32. A consumer unexpectedly receives the context default even though its parent component returns a provider. What should you inspect?

**Answer:** Check whether the context read is inside the parent component that returns the provider. That read occurs above the returned provider. Move the consumer into a descendant component under the provider, or read the value from an outer provider.

### 33. A developer creates the context inside <code>App</code>. What problem can result, and how should the code be changed?

**Answer:** Every render can create a new context identity, while providers and consumers may refer to different instances. Move <code>createContext</code> to module scope in a shared module, export that single object, and import it wherever the provider and consumers need it.

### 34. An account page must fail clearly if it is rendered without its provider. Sketch the context and consumer Hook.

**Answer:**

~~~jsx
const AccountContext = createContext(null);

function useAccount() {
  const account = useContext(AccountContext);

  if (account === null) {
    throw new Error("useAccount must be used inside AccountProvider");
  }

  return account;
}
~~~

The provider must pass a non-null account value above every component calling <code>useAccount</code>. The Hook turns a tree configuration mistake into a clear error.

### 35. A provider supplies <code>value={{ user, signOut }}</code>, and consumers update after unrelated parent renders. Why might that happen?

**Answer:** The object literal creates a new object on every provider render. Since React compares provider values with <code>Object.is</code>, the new object is considered changed. Confirm that the updates matter, then consider a stable value with correct dependencies or split contexts by purpose.

### 36. In a course progress feature, a header reads courses and a row only dispatches a completion toggle. How can the contexts be structured?

**Answer:** Provide a reading state context containing the course array and a separate dispatch context containing the reducer dispatch function. The header reads the state context. A row that only sends a toggle action reads dispatch and does not subscribe to the changing course array. The row may still receive its individual course as a prop.

### 37. Two independent course panels should each manage their own list. Where should their providers go?

**Answer:** Wrap each panel in its own provider instance. Each panel and its descendants then read and update the state owned by that provider. A single provider above both panels would make them share one state instance.

### 38. A developer expects a context value to be available in a second browser tab. What should you explain?

**Answer:** React context is scoped to a rendered React tree and does not synchronize browser tabs. Use an appropriate shared mechanism, such as storage with cross-tab notifications or a server-backed source, based on the consistency and persistence requirements.

### 39. A nested preview should use a temporary dark theme while the rest of the page remains light. How can context help?

**Answer:** Put a nested theme provider around the preview and give it the dark value. Consumers inside that subtree read the nearest nested provider; consumers elsewhere continue reading the outer light theme.

### 40. A team proposes putting every UI value into one application-wide context. What questions should guide the design?

**Answer:** Ask which components need each value, who owns and changes it, whether those components share a subtree, how frequently the value changes, and whether props or local state are clearer. Keep contexts focused by purpose, scope providers to the intended consumers, and measure before adding performance optimizations.

## Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [073 - Custom hooks](../lessons/073-custom-hooks.md) | [Lesson](../lessons/074-context-and-shared-application-state.md) | [Example](../examples/074-context-and-shared-application-state.md) | [075 - Client-side routing and route layouts](../lessons/075-client-side-routing-and-route-layouts.md) |
