# 083 - React performance and memoization: Q&A

These questions review React renders and commits, profiling, state placement, <code>memo</code>, <code>useMemo</code>, <code>useCallback</code>, referential identity, React Compiler, and practical performance decisions.

## Multiple-choice questions

### 1. What should normally happen before adding a memoization optimization?

- **A.** Measure a specific slow interaction and locate the expensive work
- **B.** Wrap every component in <code>memo</code>
- **C.** Add an empty dependency array to every Hook
- **D.** Increase the number of state variables

**Answer: A.** Measurement helps identify the actual bottleneck and avoid adding complexity where it will not help.

### 2. What does “render” mean in React?

- **A.** Calling components to calculate the next UI description
- **B.** Always changing every DOM node
- **C.** Sending a network request
- **D.** Writing component state to a database

**Answer: A.** React can render a component and determine that no DOM change is needed.

### 3. What does <code>memo(Component)</code> usually help skip?

- **A.** A child render when its props are unchanged
- **B.** Every render caused by the child's own state
- **C.** Every context update in the application
- **D.** All browser painting

**Answer: A.** By default, React compares each prop with <code>Object.is</code> and can skip a parent-caused child render when props remain equal.

### 4. What does <code>useMemo</code> cache?

- **A.** The result of a calculation between renders
- **B.** The entire application in persistent storage
- **C.** A server response forever
- **D.** A component's DOM node

**Answer: A.** It caches a calculation result while its dependencies remain equal; it is a performance optimization, not persistent storage.

### 5. What does <code>useCallback</code> cache?

- **A.** A function identity between renders
- **B.** The return value of a function call
- **C.** A database collection
- **D.** The browser's rendered pixels

**Answer: A.** It returns a cached function identity while its dependencies remain equal.

### 6. How does React compare dependencies passed to memoization Hooks?

- **A.** With <code>Object.is</code>
- **B.** By deep-comparing every object
- **C.** By sorting the values
- **D.** By comparing their JSON strings

**Answer: A.** A new object or function reference is considered changed even if its contents appear equivalent.

### 7. What can prevent a memoized child from skipping a render?

- **A.** Its parent creates a new object prop on each render
- **B.** The child has a stable primitive string prop
- **C.** The parent passes the same stable function
- **D.** The child has no changed props

**Answer: A.** New object identity means the prop changed under the default comparison.

### 8. Which is a good use for <code>useMemo</code>?

- **A.** Reusing a measured expensive pure calculation when its inputs are unchanged
- **B.** Storing important data so React can never discard it
- **C.** Hiding a missing dependency
- **D.** Preventing every state update

**Answer: A.** It can skip costly recalculation when the calculation inputs remain stable.

### 9. When is <code>useCallback</code> most likely useful?

- **A.** A function is passed to a memoized child and stable identity helps avoid measured work
- **B.** Every inline event handler exists
- **C.** A function must be stored in a database
- **D.** A function has no dependencies

**Answer: A.** The identity matters when a consumer uses it to decide whether work can be skipped.

### 10. What is a stale closure?

- **A.** A callback uses an old value because a reactive dependency was omitted
- **B.** A callback always runs on the server
- **C.** A cached DOM node changes its CSS
- **D.** An object has too many properties

**Answer: A.** The callback retains values from the render in which it was created.

### 11. Why should a memoized calculation be pure?

- **A.** React may run render calculations more than once, and cached calculations must not cause side effects
- **B.** Pure functions automatically connect to MongoDB
- **C.** Pure functions never receive inputs
- **D.** React only accepts pure CSS values

**Answer: A.** Mutating data or causing side effects during render can make repeated rendering incorrect.

### 12. What does React Compiler do when it is configured and able to analyze the code?

- **A.** It can automatically memoize many components, values, and functions
- **B.** It replaces application state with global variables
- **C.** It eliminates the need to profile
- **D.** It automatically fixes every impure component

**Answer: A.** It reduces the need for manual memoization, but it does not remove the need for correct and pure code.

### 13. What is the main risk of a custom <code>memo</code> comparator?

- **A.** It may claim changed behavior is equal and preserve stale props or callbacks
- **B.** It always clears component state
- **C.** It disables React DevTools
- **D.** It makes all children server-rendered

**Answer: A.** A comparator must account for every prop that can affect output or behavior.

### 14. What does Profiler <code>actualDuration</code> represent?

- **A.** Time spent rendering the profiled subtree for the current update
- **B.** Total network request time for the whole app
- **C.** Time spent loading the browser
- **D.** Database query duration

**Answer: A.** It is a render measurement for the profiled subtree, not a complete measurement of all user-perceived latency.

### 15. What does Profiler <code>baseDuration</code> estimate?

- **A.** The time to render the subtree without memoization
- **B.** The page's production network bandwidth
- **C.** The time spent in CSS layout only
- **D.** The number of components in the repository

**Answer: A.** It gives a baseline estimate for rendering the subtree without skipped work.

### 16. What is a good first fix if an effect repeatedly sets derived state and triggers more renders?

- **A.** Remove the unnecessary effect and derive the value from existing props or state
- **B.** Wrap the entire application in <code>memo</code>
- **C.** Add a one-second timeout
- **D.** Disable all state updates

**Answer: A.** The repeated update chain is the cause; memoizing around it may only hide symptoms.

### 17. What is usually true about a memoized child that consumes a changed context?

- **A.** It can still re-render because its context value changed
- **B.** It is guaranteed not to render
- **C.** Context is ignored by React
- **D.** It becomes a server component

**Answer: A.** Memoization of props does not block updates to state or context that the component consumes.

### 18. What is an important limitation of memoization?

- **A.** It is an optimization and not a guarantee that React will never render
- **B.** It makes every first render faster
- **C.** It provides persistent storage
- **D.** It makes poor algorithms optimal

**Answer: A.** React may still render, and the first calculation still has to run.

### 19. What can help when a huge list creates too many DOM nodes?

- **A.** Pagination or list virtualization
- **B.** More nested memoization Hooks only
- **C.** A custom comparator for every DOM element
- **D.** Adding a unique callback to each render

**Answer: A.** Rendering fewer items can address DOM size more directly than memoizing work around every row.

### 20. Why can development profiling differ from production profiling?

- **A.** Development checks can add work, such as Strict Mode checks
- **B.** Production has no JavaScript
- **C.** Development profiling includes database records
- **D.** React disables rendering in production

**Answer: A.** Use production-like measurements when the question concerns production performance.

## Short-answer and scenario questions

### 21. A memoized card still renders when its parent updates. The parent passes <code>{{ theme: 'light' }}</code> directly in JSX each time. Why?

**Answer:** Each object literal creates a new object identity. The default prop comparison sees the prop as changed even though its contents look the same. First consider whether the prop can be moved outside the component or the boundary simplified; memoize it only when the optimization is useful.

### 22. A sort of 15 short items takes less than a millisecond, but the code adds three Hooks to cache it. Is this automatically an improvement?

**Answer:** No. If the work is cheap and not a measured bottleneck, the extra dependencies and indirection may reduce readability without a meaningful user benefit.

### 23. A callback reads <code>userId</code> but its dependency list is empty. What bug can occur?

**Answer:** The callback can keep using the old <code>userId</code> from the render where it was created. Include every reactive value it reads or restructure the callback so it does not need that value.

### 24. A component mutates a prop array in a <code>useMemo</code> calculation by calling <code>sort()</code>. What is wrong?

**Answer:** <code>sort()</code> mutates the array. The calculation should create a copy before sorting or use an immutable operation so it does not mutate props or state.

### 25. A custom comparator checks a card's title but ignores its new <code>onOpen</code> callback. What can go wrong?

**Answer:** The memoized card may retain an old callback that closes over outdated values. The comparator must treat props as equal only if both rendered output and behavior remain equivalent.

### 26. A parent owns a search field used only by one small panel. Typing rerenders the entire dashboard. What should you consider?

**Answer:** Move the search state closer to the panel that uses it. Local state can narrow the update boundary more simply than adding memoization throughout the dashboard.

### 27. Why is a React Profiler measurement not a complete measure of a slow user interaction?

**Answer:** It measures React rendering for the profiled tree. The overall interaction may also include JavaScript outside React, network time, browser style and layout work, painting, or other tasks. Use browser performance tools too.

### 28. A component renders once after a theme context changes even though it is wrapped in <code>memo</code>. Is this necessarily a defect?

**Answer:** No. A component that consumes that context can re-render when the context value changes. <code>memo</code> compares props; it does not freeze state or context updates.

### 29. A calculation becomes slower as a list grows. What should be checked before adding <code>useMemo</code>?

**Answer:** Measure the calculation, check the algorithm and data size, and determine whether the list can be filtered on the server, paginated, or virtualized. Memoization only skips the calculation when its inputs are unchanged.

### 30. A state update appends a new item using the current <code>items</code> variable inside a callback. How can a functional update help?

**Answer:** Use <code>setItems(currentItems =&gt; [...currentItems, item])</code>. The updater receives the latest state, so the callback may not need to capture the current array or list it as a dependency.

### 31. The same expensive calculation runs on every render even though the inputs do not change. What tool might help?

**Answer:** If profiling confirms the calculation is significant, <code>useMemo</code> can cache its result using a complete dependency list. First make sure the inputs themselves are not recreated unnecessarily.

### 32. A parent passes an inline callback to a child wrapped with <code>memo</code>. What should you investigate?

**Answer:** Check whether the child rerender is measurably costly and whether callback identity is the reason. If it is, use <code>useCallback</code> with complete dependencies or restructure the props and state boundary.

### 33. An empty dependency array makes a callback work in the first render but not after the selected record changes. Why?

**Answer:** The callback captured the initial record. Its dependency list must include the changing record or use a functional update or other design that avoids capturing it.

### 34. A developer assumes <code>useMemo</code> will make the first page load faster. Is that what it does?

**Answer:** No. The calculation still runs on the initial render. It can only skip recalculating on later renders when dependencies are unchanged.

### 35. Why should important user data not be stored only in a memoized value?

**Answer:** React may discard memoization caches, and memoization is not persistent storage or state. Use state, a ref, or an appropriate persistence layer based on how the data must behave.

### 36. Strict Mode causes a pure calculation to run twice in development. What should the developer do?

**Answer:** Keep the calculation pure and do not depend on its exact call count. Strict Mode's development checks help reveal mutations and other render-time side effects.

### 37. React Compiler is enabled. Should all existing <code>useMemo</code> and <code>useCallback</code> Hooks be deleted immediately?

**Answer:** No. The compiler can reduce the need for manual memoization, but existing code should be changed deliberately and checked. Keep manual memoization where it provides needed control or where removal has not been validated.

### 38. A component's own local state changes but its props stay the same. Can <code>memo</code> prevent the update?

**Answer:** No. A component still needs to render when its own state changes so React can calculate the updated UI.

### 39. Development timing improved after memoization, but production timing is unchanged. What should happen next?

**Answer:** Reproduce the relevant workload using a production build and representative device conditions. Keep the optimization only if it improves the user-relevant interaction without harming maintainability.

### 40. A list with thousands of rows is slow even though each row is memoized. What architectural option should be considered?

**Answer:** Render fewer rows at once with pagination or virtualization. Memoization cannot remove the cost of keeping an enormous DOM tree mounted.

## Chapter navigation

| Previous chapter | Chapter lesson | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [082 - Component tests with React](../lessons/082-component-tests-with-react.md) | [Lesson](../lessons/083-react-performance-and-memoization.md) | [Example](../examples/083-react-performance-and-memoization.md) | [084 - Error boundaries and recovery](../lessons/084-error-boundaries-and-recovery.md) |
