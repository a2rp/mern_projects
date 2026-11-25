# 085 - State management choices and tradeoffs: Q&A

These questions review state ownership, local and shared state, reducers, Context, server-state caches, dedicated client stores, URL state, persistence, and tradeoffs.

## Multiple-choice questions

### 1. What is the best first step when choosing a state-management approach?

- **A.** Identify what the state represents, who owns it, and which components need it
- **B.** Install a global state library immediately
- **C.** Put every value in local storage
- **D.** Copy the state into every component that reads it

**Answer: A.** State scope and source of truth determine which mechanism is appropriate.

### 2. A menu's open/closed value is used by only the menu component. Where should it usually live?

- **A.** In local component state
- **B.** In a database collection
- **C.** In a global Redux store by default
- **D.** In the URL for every click

**Answer: A.** Local state keeps a local concern near the component that uses it.

### 3. Two sibling panels must always display the same selected course. What is a common React approach?

- **A.** Lift selection state to their nearest common parent
- **B.** Keep two separate copies and synchronize them with timers
- **C.** Make each sibling independently guess the selection
- **D.** Write the selection to a database on every render

**Answer: A.** Their common parent can own one value and pass it to both children.

### 4. What does “single source of truth” mean for one piece of state?

- **A.** There is one authoritative owner for that value
- **B.** All app state must be in one global object
- **C.** Every component must maintain a duplicate copy
- **D.** Only server state is allowed

**Answer: A.** Different state values can live in different places; each value should have a clear authoritative owner.

### 5. When is a reducer especially useful?

- **A.** Related state transitions benefit from being defined in one place
- **B.** Every component has one boolean
- **C.** The UI contains no state
- **D.** A component needs to fetch during render

**Answer: A.** A reducer can make related transition rules easier to understand and maintain.

### 6. What should a reducer normally do?

- **A.** Return the next state from the current state and an action
- **B.** Perform HTTP requests and mutate the database
- **C.** Read the DOM and change CSS directly
- **D.** Write secrets to local storage

**Answer: A.** Reducers should be pure state-transition functions.

### 7. What is a typical purpose of Context?

- **A.** Provide a value to descendants without forwarding it through every intermediate component
- **B.** Automatically cache all network requests
- **C.** Persist values across browser restarts
- **D.** Replace all reducers

**Answer: A.** Context provides values to a subtree; state and update rules still come from somewhere else.

### 8. What happens to a component that reads a Context when its provided value changes?

- **A.** It can re-render to receive the updated value
- **B.** It is guaranteed never to render
- **C.** It automatically becomes server-rendered
- **D.** Its state is deleted

**Answer: A.** Context consumers subscribe to the value and update when it changes.

### 9. What is one reason to split unrelated values into separate contexts?

- **A.** Components can subscribe to the context values they actually need
- **B.** Context can only store numbers
- **C.** It disables React rendering
- **D.** It forces values to be persisted

**Answer: A.** Separating concerns can limit which consumers receive updates for unrelated changes.

### 10. What is server state?

- **A.** Data whose authoritative source is an API or server-side database
- **B.** A local hover flag
- **C.** A CSS class name
- **D.** Any value stored in a reducer

**Answer: A.** The server owns the source of truth; the client works with a possibly stale copy.

### 11. What is a common use for a server-state query library?

- **A.** Cache and revalidate API data and manage request lifecycle
- **B.** Replace HTML semantics
- **C.** Persist all keyboard focus state
- **D.** Compile JSX

**Answer: A.** Query tools can handle loading, caching, request deduplication, and invalidation.

### 12. What is a risk of storing the same API response in both a query cache and a global client store?

- **A.** The copies can become inconsistent
- **B.** The response becomes more secure automatically
- **C.** React can no longer render the data
- **D.** The server stops owning the data

**Answer: A.** Duplicated sources of truth require explicit synchronization.

### 13. When might applied search filters belong in the URL?

- **A.** When users should be able to bookmark, share, refresh, or navigate back to the filtered view
- **B.** When the filter is a temporary hover state
- **C.** When the filter is a password
- **D.** When the application has no routes

**Answer: A.** URL state makes view selection addressable and shareable.

### 14. Which value is a better candidate for local storage than a credential?

- **A.** A non-sensitive theme preference
- **B.** A database password
- **C.** A private API secret
- **D.** A session token that must be protected

**Answer: A.** Local storage can preserve benign preferences, but sensitive credentials need a suitable security design.

### 15. Why should data read from local storage be validated?

- **A.** It may be missing, malformed, or written by an older application version
- **B.** It is always encrypted by the browser
- **C.** React refuses strings from storage
- **D.** It cannot survive a page reload

**Answer: A.** Persisted values can outlive the code and shape that created them.

### 16. What does <code>useSyncExternalStore</code> help with?

- **A.** Subscribing React components to a store outside React
- **B.** Creating a MongoDB schema
- **C.** Replacing event handlers with CSS
- **D.** Automatically saving state to the URL

**Answer: A.** It is React's built-in subscription Hook for external stores.

### 17. What is an example of derived state?

- **A.** A filtered list calculated from courses and a category filter
- **B.** A database password
- **C.** A new API response that was just received
- **D.** A user's current session on the server

**Answer: A.** A view can often be calculated from its source state rather than stored separately.

### 18. What is a common problem with storing both source and derived values?

- **A.** They can get out of sync
- **B.** They always improve performance
- **C.** They automatically share updates
- **D.** They remove the need for actions

**Answer: A.** Maintaining duplicated derived data introduces synchronization work and inconsistency risk.

### 19. Which state value is usually a good fit for local state?

- **A.** An unsent draft in a single dialog
- **B.** A cross-route shopping cart shared throughout an app
- **C.** A server-owned course catalogue cache
- **D.** A shareable pagination parameter

**Answer: A.** A dialog-local draft can stay close to the dialog until it needs to be shared or persisted.

### 20. What is an appropriate reason to add a dedicated client-state store?

- **A.** Distant features need coordinated state, clear actions, and the team's tooling benefits
- **B.** The application contains one open/closed menu
- **C.** All React projects require Redux
- **D.** A global store makes all components faster automatically

**Answer: A.** A store is useful when its coordination and debugging benefits justify its added architecture.

## Short-answer and scenario questions

### 21. An input value is only used by one search panel. Should it live in the application root?

**Answer:** Usually no. Keep the draft close to the search panel unless other components need to coordinate with it.

### 22. Two child components need to show the same selected category. Where should the state move?

**Answer:** Move it to their nearest common parent and pass the selected value and update callback to each child.

### 23. A component has many related actions that update several fields. What can make these transitions easier to reason about?

**Answer:** A reducer can define the next state for each action in one pure function.

### 24. A reducer needs to fetch new courses. Should it make the request directly?

**Answer:** No. Keep the reducer pure. Perform the request in a service, effect, event handler, or server-state library and dispatch the resulting state transition.

### 25. A provider passes a new object literal on every render. What can happen?

**Answer:** Context consumers can see a different value by identity and re-render even when its data appears unchanged. Move stable values where appropriate, split contexts, or profile before optimizing.

### 26. A deeply nested component needs a theme but its intermediate parents do not. What is Context useful for here?

**Answer:** Context can provide the theme to the subtree so intermediate components do not need to forward a theme prop they do not use.

### 27. A frequently changing context makes many unrelated consumers re-render. What should you consider?

**Answer:** Split unrelated contexts, narrow the provider scope, keep local state local, and profile the consumer updates. A selector-based external store may fit high-frequency selectively subscribed data.

### 28. A course page loads an API response and also copies it into a Redux slice. What design question should be asked?

**Answer:** Determine which store is authoritative and why both copies are needed. A query cache may already manage the server data; duplicated copies need a clear synchronization and invalidation strategy.

### 29. A user applies a sort order and wants to share the page with a teammate. Where could the applied sort value live?

**Answer:** In the URL query string, after validating and parsing it at the route boundary.

### 30. A search field should update its draft on every keypress but only update the URL after the user presses Apply. What should the design distinguish?

**Answer:** Keep an editable draft locally and a separate applied filter represented in the URL. Define the Apply and reset behavior so the two values do not become accidentally inconsistent.

### 31. A theme preference is stored in local storage. What should happen if its value is an unexpected string?

**Answer:** Validate it and fall back to a known safe default. Do not assume persisted data always matches the current application's expected shape.

### 32. An application stores an API secret in local storage to reuse it after reload. Is that appropriate?

**Answer:** No. Browser local storage is not a safe place for private secrets. Use a security design appropriate to the credential and threat model.

### 33. A list's result count is calculated from the visible list. Should it be another state variable?

**Answer:** Usually not. Derive the count from the visible list so the count cannot drift from the displayed data.

### 34. A team is considering Redux because the app has several React components. Is that enough reason?

**Answer:** No. Count and understand the shared workflows, update rules, debugging needs, and alternatives. Several components alone do not prove that a global store is needed.

### 35. Two instances of an accordion should open independently. Should their open state be lifted to their common parent?

**Answer:** Not unless the parent needs to coordinate them. Independent local state is simpler when the instances do not need to stay in sync.

### 36. A cart is used by the header, product pages, and checkout route. What should guide its state location?

**Answer:** The shared access pattern and workflow. A scoped provider or client store may be appropriate, while authoritative products and prices still come from the server.

### 37. A component reads a mutable module-level variable during render. Why might React not update when the variable changes?

**Answer:** React is not subscribed to that mutation. Integrate the external store through a supported subscription API such as <code>useSyncExternalStore</code> or the library's React adapter.

### 38. A preference should follow the user across devices. Is local storage sufficient?

**Answer:** No. Local storage belongs to one browser. Store the preference with the user's server-side account settings if it should follow them across devices.

### 39. A state library promises to eliminate all unnecessary renders. Should that claim decide the architecture?

**Answer:** No. Compare its subscription model, update semantics, debugging tools, integration, and maintenance cost for the actual application. Measure performance rather than choosing from a blanket promise.

### 40. How should an engineer explain why a state-management tool was selected?

**Answer:** State what the value represents, who owns it, which components read and update it, its persistence and sharing needs, and why the chosen tool is the smallest clear fit.

## Chapter navigation

| Previous chapter | Chapter lesson | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [084 - Error boundaries and recovery](../lessons/084-error-boundaries-and-recovery.md) | [Lesson](../lessons/085-state-management-choices-and-tradeoffs.md) | [Example](../examples/085-state-management-choices-and-tradeoffs.md) | [086 - Build a reusable component system](../lessons/086-build-a-reusable-component-system.md) |
