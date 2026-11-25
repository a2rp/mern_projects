# Chapter 070: Share state by lifting it — Q&A

These questions review how to coordinate React components by choosing one owner for shared state, passing values and callbacks through props, and avoiding duplicate state.

## Multiple-choice questions

### 1. What does “lifting state up” mean?

- **A.** Moving a component higher in the JSX tree
- **B.** Moving shared state to a common parent of the components that need it
- **C.** Replacing props with HTML attributes
- **D.** Putting all state in the root component

**Answer: B.** State is moved from separate children to a parent that can coordinate them.

### 2. Where should shared state usually live?

- **A.** In the deepest child
- **B.** In every child that reads it
- **C.** In the closest common parent that can coordinate its readers and writers
- **D.** In a global variable outside React

**Answer: C.** This keeps the owner high enough to coordinate the components and no higher than needed.

### 3. How does a parent normally give its state value to a child?

- **A.** Through props
- **B.** Through a DOM query
- **C.** Through a CSS selector
- **D.** By mutating the child

**Answer: A.** A parent passes the current value down as a prop.

### 4. How can a child request a change to state owned by its parent?

- **A.** Mutate the prop
- **B.** Call a callback provided by the parent
- **C.** Directly edit the parent's hook variable
- **D.** Use a global variable

**Answer: B.** The parent passes an event handler or callback, and the child calls it in response to an action.

### 5. What happens if two sibling inputs each keep their own query state?

- **A.** React automatically synchronizes them
- **B.** They are independent and can show different values
- **C.** The browser combines the state values
- **D.** The second input becomes read-only

**Answer: B.** Separate component instances have separate state unless their value is coordinated by a shared owner.

### 6. What should make two controlled inputs display the same text?

- **A.** They use the same id
- **B.** They receive the same value prop and a callback that updates the shared owner
- **C.** They use the same placeholder
- **D.** They have different names

**Answer: B.** Both render from one state value, so an update to that value appears in both.

### 7. Which component owns a value when that value is supplied to a child through props?

- **A.** The child always owns it
- **B.** The component that supplied the prop owns its state
- **C.** The browser owns it
- **D.** The component with the longest name owns it

**Answer: B.** A prop is an input to a component; the parent that stores and supplies the state is its owner.

### 8. Which statement about props is correct?

- **A.** A child should mutate props when it needs an update
- **B.** Props are read-only inputs; a child can request changes through callbacks
- **C.** Props are always strings
- **D.** Props replace all component state

**Answer: B.** A child should treat received props as values to render, not mutate them.

### 9. If only one child uses a temporary tooltip-open boolean, where should it usually live?

- **A.** In the closest common ancestor of the entire app
- **B.** In the tooltip component
- **C.** In every component in the tree
- **D.** In a URL query parameter

**Answer: B.** State that does not need coordination can stay local to the component that uses it.

### 10. A result count and a list both depend on the same category filter. Where should the selected category live?

- **A.** Separately in the count and list
- **B.** In their closest common parent
- **C.** In the result count only
- **D.** In a CSS class

**Answer: B.** One shared category value lets both components render consistently.

### 11. In a single-open accordion, what is a suitable state shape?

- **A.** One shared <code>activeIndex</code> or active item id
- **B.** A boolean duplicated in every panel
- **C.** The text of every panel copied into state
- **D.** A new random value on each render

**Answer: A.** One active identifier represents the single panel that may be open.

### 12. What should a panel receive from its parent in a controlled accordion?

- **A.** The parent's entire application state
- **B.** Its derived <code>isOpen</code> value and a toggle callback
- **C.** A mutable reference to the parent's hook
- **D.** No props

**Answer: B.** The parent determines whether that panel is active and provides a way to request a change.

### 13. Why might a functional state update be useful in a callback?

- **A.** It can calculate the next value from the previous state value
- **B.** It prevents child components from receiving props
- **C.** It makes state global
- **D.** It disables rendering

**Answer: A.** An updater such as <code>setCount((current) =&gt; current + 1)</code> bases the next state on the pending previous value.

### 14. If <code>visibleItems</code> can be calculated from <code>items</code> and <code>query</code>, what is usually the simpler design?

- **A.** Store all three as independent state and synchronize them
- **B.** Derive <code>visibleItems</code> during render
- **C.** Recalculate only when the user refreshes the page
- **D.** Put the list in a global variable

**Answer: B.** Derived data does not need a second authoritative state value.

### 15. What is a risk of storing duplicate copies of one shared fact?

- **A.** They can drift apart and show conflicting results
- **B.** Components cannot have keys
- **C.** CSS stops loading
- **D.** React cannot render arrays

**Answer: A.** Every copy must be kept synchronized, which creates opportunities for bugs.

### 16. What is prop drilling?

- **A.** Passing props through intermediate components that do not use them, so a deeper component can receive them
- **B.** Mutating props to change a child
- **C.** Passing an array to a component
- **D.** Styling props with CSS

**Answer: A.** It can become cumbersome when shared data must travel through many layers.

### 17. When might context be worth considering?

- **A.** Whenever a component has state
- **B.** When many descendants across a subtree need the same value and passing it through every layer is cumbersome
- **C.** For every text input
- **D.** To avoid choosing a state owner

**Answer: B.** Context can reduce the number of intermediate components that need to forward a prop.

### 18. Does using context remove the need to decide where a state value belongs?

- **A.** Yes, context chooses the owner automatically
- **B.** No, the application still needs a clear owner and update design
- **C.** Yes, all context values are global variables
- **D.** No, context cannot provide values to descendants

**Answer: B.** Context changes how values reach descendants; it does not remove state-design decisions.

### 19. What does “single source of truth” mean for a piece of state?

- **A.** All application state must be in one file
- **B.** One chosen component owns the authoritative value
- **C.** Every component stores a copy
- **D.** The server and browser must use the same variable

**Answer: B.** Different state values can have different owners; each unique value should have one authoritative owner.

### 20. When is lifting state too high?

- **A.** When unrelated components rerender or depend on state they do not need
- **B.** When a value is passed through props
- **C.** When state is updated with a callback
- **D.** When the common parent has a short name

**Answer: A.** Lift only as far as required to coordinate the relevant components.

## Short-answer questions

### 21. Describe the usual direction of data and event handling in a lifted-state design.

**Answer:** The parent passes state values down to children as props. The parent also passes callbacks down. A child calls a callback after an interaction, and the parent updates its state; React then passes the new value back down.

### 22. What is the closest common parent?

**Answer:** It is the nearest component in the rendered tree that is an ancestor of all the components that need to coordinate. It is a natural candidate to own their shared state.

### 23. What makes a component controlled?

**Answer:** Important behavior or displayed values are determined by props supplied by its parent. The child reports user actions through callbacks instead of privately deciding the shared value.

### 24. What makes a component uncontrolled?

**Answer:** It keeps an important behavior or value in its own local state, so the parent does not directly determine that value through a prop.

### 25. Can one component be partly controlled and partly uncontrolled?

**Answer:** Yes. A component can receive a selected value as a prop while keeping unrelated temporary UI state locally. These terms describe design choices, not an all-or-nothing component category.

### 26. Why should an application not lift every state value to its root?

**Answer:** It makes unrelated parts of the component tree depend on state they do not need and can cause broader rerenders. Local state is simpler when no coordination is required.

### 27. How can you avoid storing a filtered list twice?

**Answer:** Keep the source list and filter criteria as state, then calculate the visible list from them during render. Store the derived result only if there is a specific measured need and a reliable synchronization strategy.

### 28. What should a child do if it needs to request a different prop value?

**Answer:** Call a callback provided by its parent, passing any needed event or new value. The parent decides whether and how to update its state.

### 29. Why should a callback prop have a clear name?

**Answer:** Names such as <code>onQueryChange</code> or <code>onToggle</code> explain what action the child can request, making the component interface easier to understand and reuse.

### 30. What should you consider before using context for a shared value?

**Answer:** Consider how many descendants need the value, how many intermediate layers would otherwise forward it, and whether a closer common parent with ordinary props is still clear.

## Applied questions

### 31. Two <code>SearchInput</code> components should always show the same text. Each currently calls <code>useState</code> internally. What change should you make?

**Answer:** Move the query state into their closest common parent. Pass the same query as a <code>value</code> prop to both inputs and pass a shared <code>onQueryChange</code> callback to both.

### 32. A parent passes <code>selectedTab</code> to a child, but the child tries to assign to <code>props.selectedTab</code>. What is wrong?

**Answer:** Props should not be mutated. The parent owns the selected tab. Pass an <code>onSelectTab</code> callback, have the child call it with the requested tab, and let the parent update its state.

### 33. A page has a filter select, a result count, and a product list. Changing the select should update both the count and list. Where should the filter state live?

**Answer:** In the closest common parent that renders or coordinates these components. The select receives the current filter and callback; the count and list receive values derived from that filter.

### 34. A dashboard shows ten panels and only one may be open. What should the parent store?

**Answer:** Store one active panel id or index, with a value such as <code>null</code> when none is open. Give each panel <code>isOpen={activeId === panel.id}</code> and a callback that asks the parent to select or close it.

### 35. A child callback increments a parent-owned counter. Why can this form be safer than calculating from a captured value?

**Answer:** Use a functional updater: <code>setCount((currentCount) =&gt; currentCount + 1)</code>. React calculates the next value from the previous state, which is appropriate when multiple updates may be queued.

### 36. A search page stores <code>products</code>, <code>query</code>, and <code>matchingProducts</code> as separate state. What can be simplified?

**Answer:** If <code>matchingProducts</code> is only a filter of <code>products</code> using <code>query</code>, derive it during render. This removes duplicate data that could become stale.

### 37. A value is passed through five components, but only the last component uses it. What is this pattern called, and what might you consider?

**Answer:** This is prop drilling. First check whether the components and state owner are arranged sensibly; if many descendants need the value, consider context for that subtree.

### 38. A component has a shared selected category and a temporary tooltip. Which state should be lifted?

**Answer:** Lift the category if sibling components need to coordinate around it. Keep the tooltip's temporary open state local if no other component needs to control it.

### 39. Two components need to display the same cart quantity, but each has its own cart state. What problem can occur?

**Answer:** The two copies can diverge. Put the cart quantity or cart data in one shared owner and pass the relevant values and callbacks to both components.

### 40. A child receives <code>value</code> and <code>onValueChange</code>. What is its responsibility when the user edits the control?

**Answer:** Render the supplied value and call <code>onValueChange</code> with the proposed next value. The owner updates state and supplies the new value back through props.

## Chapter navigation

| Previous chapter | Lesson | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [069 - Forms and controlled inputs](../lessons/069-forms-and-controlled-inputs.md) | [Lesson](../lessons/070-share-state-by-lifting-it.md) | [Example](../examples/070-share-state-by-lifting-it.md) | [071 - Effects and external synchronization](../lessons/071-effects-and-external-synchronization.md) |
