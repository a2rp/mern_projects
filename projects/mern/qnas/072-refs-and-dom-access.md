# Chapter 072: Refs and DOM access — Q&A

These questions review how refs retain values, how to access DOM nodes, when to choose state instead, and how refs behave in custom components and Strict Mode.

## Multiple-choice questions

### 1. What does <code>useRef(initialValue)</code> return?

- **A.** A new DOM element
- **B.** A stable object with a mutable <code>current</code> property
- **C.** A state setter
- **D.** A callback that always runs after rendering

**Answer: B.** A ref object persists between renders and exposes its current value through <code>current</code>.

### 2. What happens when you change <code>ref.current</code>?

- **A.** React always re-renders the component
- **B.** React updates every child prop
- **C.** The ref value changes, but React does not re-render because of that change
- **D.** The component is unmounted

**Answer: C.** React does not subscribe to mutations of a ref's <code>current</code> property.

### 3. Which should hold a value that must update the displayed UI?

- **A.** A ref
- **B.** State
- **C.** A local variable that resets every render
- **D.** A DOM dataset

**Answer: B.** Updating state requests a render; changing a ref does not.

### 4. What is the initial value of a DOM ref before the element is committed?

- **A.** The DOM node
- **B.** <code>null</code>, if the ref was initialized with <code>null</code>
- **C.** An empty string
- **D.** The parent component

**Answer: B.** React assigns the DOM node to <code>current</code> during the commit.

### 5. What happens to an object ref when its DOM node is removed?

- **A.** It keeps pointing to the removed node forever
- **B.** React sets <code>current</code> to <code>null</code>
- **C.** React turns it into state
- **D.** The ref is deleted from JavaScript

**Answer: B.** Always account for a ref being null when an element is not mounted.

### 6. Which is an appropriate use for an input DOM ref?

- **A.** Store the text value that should render into the input instead of state
- **B.** Call <code>focus()</code> in response to a button click
- **C.** Replace React rendering for the whole form
- **D.** Force React to render after changing <code>current</code>

**Answer: B.** Focus is an imperative browser operation that a ref can perform on the DOM node.

### 7. Where is a safe place to read a DOM ref after React has attached it?

- **A.** In an event handler
- **B.** During the first line of rendering before the node exists
- **C.** In a module-level initializer
- **D.** In a JSX string

**Answer: A.** Event handlers run after the node has been committed. Effects and callback refs are other appropriate places depending on the task.

### 8. Why should you generally avoid reading or writing <code>ref.current</code> during render?

- **A.** The DOM may not yet reflect the render being calculated, making behavior unpredictable
- **B.** Refs are only allowed in CSS
- **C.** React deletes all refs before calling a component
- **D.** It automatically changes props

**Answer: A.** React may be preparing a render before committing its DOM changes.

### 9. How should a ref be attached to a built-in DOM input?

- **A.** <code>&lt;input domRef={myRef} /&gt;</code>
- **B.** <code>&lt;input ref={myRef} /&gt;</code>
- **C.** <code>&lt;input current={myRef} /&gt;</code>
- **D.** <code>&lt;input useRef={myRef} /&gt;</code>

**Answer: B.** React sets the ref's <code>current</code> property to the input DOM node during commit.

### 10. Which pair is most appropriate for storing the text of a controlled input and focusing that input?

- **A.** Ref for the text; ref for focus
- **B.** State for the text; DOM ref for focus
- **C.** State for both text and DOM node
- **D.** A global variable for both

**Answer: B.** The text affects rendered UI and belongs in state. The DOM node used for the imperative focus operation belongs in a ref.

### 11. What is a callback ref?

- **A.** A state setter passed to an event handler
- **B.** A function passed as a ref that React calls when attaching or detaching a node
- **C.** A ref that can only point to a function component
- **D.** A callback that triggers a render on every call

**Answer: B.** Callback refs let code react to a DOM node being attached or detached.

### 12. In React 19, what may a callback ref return?

- **A.** A Promise
- **B.** A cleanup function that React calls when detaching the node
- **C.** A state object
- **D.** A replacement DOM node

**Answer: B.** React 19 supports cleanup functions returned from callback refs.

### 13. What is the typical detach behavior for callback refs in versions before React 19?

- **A.** React calls the callback with <code>null</code>
- **B.** React leaves the callback attached forever
- **C.** React calls the component with no props
- **D.** React deletes the parent

**Answer: A.** Earlier React versions signal detachment by calling the callback with <code>null</code>.

### 14. What does React 19 allow a function component to do with a <code>ref</code> prop?

- **A.** Receive it as a prop and pass it to a DOM element
- **B.** Mutate the parent's state directly
- **C.** Turn it automatically into state
- **D.** Use it as a CSS selector

**Answer: A.** React 19 lets function components accept <code>ref</code> as a prop.

### 15. What is the common way to forward a ref through a function component in React 18 and earlier?

- **A.** <code>createContext</code>
- **B.** <code>forwardRef</code>
- **C.** <code>useMemo</code>
- **D.** <code>useReducer</code>

**Answer: B.** <code>forwardRef</code> is the established API for passing refs through function components before React 19.

### 16. What does <code>useImperativeHandle</code> let a component do?

- **A.** Expose a limited imperative API through a ref
- **B.** Replace all props with DOM nodes
- **C.** Force every update to be synchronous
- **D.** Automatically focus every child

**Answer: A.** It is useful when a parent needs a small set of imperative methods rather than direct access to the full DOM node.

### 17. Which DOM operation is generally safe to perform through a ref?

- **A.** Remove a React-rendered list item behind React's back
- **B.** Replace a React-managed subtree with <code>innerHTML</code>
- **C.** Focus an input
- **D.** Reorder DOM children manually while React renders them

**Answer: C.** Focus is a non-destructive operation that does not change the structure React manages.

### 18. What should generally be used to show or hide a React-rendered message?

- **A.** Call <code>remove()</code> on its DOM node
- **B.** Use state and conditional rendering
- **C.** Set a ref to false
- **D.** Rewrite the parent with <code>innerHTML</code>

**Answer: B.** State keeps React's description and the rendered DOM in sync.

### 19. What can happen if an inline callback ref is recreated on every render?

- **A.** React may detach the old callback ref and attach the new one
- **B.** React converts it to state
- **C.** The DOM node is always removed permanently
- **D.** The component stops receiving props

**Answer: A.** A different callback identity can cause detach and reattach work; keep callback refs stable when practical.

### 20. What does Strict Mode do to callback refs in development?

- **A.** It may perform an extra setup and cleanup cycle to reveal missing cleanup
- **B.** It disables all refs
- **C.** It permanently attaches every ref twice
- **D.** It changes object refs into state

**Answer: A.** This development-only check helps reveal callback ref lifecycle bugs.

## Short-answer questions

### 21. Describe how to focus an input with a ref.

**Answer:** Create the ref with <code>useRef(null)</code>, attach it to the input's <code>ref</code> prop, and call <code>inputRef.current?.focus()</code> from an event handler or another safe post-commit location.

### 22. Why does changing a ref not cause a render?

**Answer:** React does not track mutations to the ref object's <code>current</code> property. Refs retain imperative information; state is the mechanism for values that should affect rendered output.

### 23. Give two examples of values that can be stored in refs rather than state.

**Answer:** A DOM node and a timer id are common examples, provided the value itself does not need to determine the rendered UI.

### 24. When should an input's text be stored in state instead of only a ref?

**Answer:** When React needs the current text to render other UI, such as a live preview, validation message, or filtered result list. State updates trigger the needed render.

### 25. When are DOM refs assigned and cleared?

**Answer:** React assigns a DOM node to the ref during the commit after creating or updating the DOM. When the node is detached, React clears an object ref to <code>null</code>; callback refs receive the relevant detach behavior for that React version.

### 26. What is the difference between an object ref and a callback ref?

**Answer:** An object ref is usually returned by <code>useRef</code> and React writes the node to its <code>current</code> property. A callback ref is a function React calls with the node when attaching and with cleanup or <code>null</code> when detaching.

### 27. Why might a component expose only <code>focus()</code> instead of its entire DOM node?

**Answer:** A narrow API reduces how much the parent knows about the child's implementation and prevents unrelated direct DOM manipulation.

### 28. How should React show or remove a DOM node that it rendered?

**Answer:** Update state or props and let React change the JSX output. Do not manually remove or rewrite React-managed nodes.

### 29. What should code do before calling a method on a DOM ref?

**Answer:** Account for the ref possibly being <code>null</code>, such as with an optional chain or an explicit check. The element may not be mounted or may have been removed.

### 30. Why should list refs be associated with stable item ids rather than only array positions?

**Answer:** Insertion, removal, or reordering can change array positions. Stable ids keep the relationship between each data item and its DOM node meaningful.

## Applied questions

### 31. A component stores the text shown in a heading by assigning to <code>headingRef.current.textContent</code>. What is the more React-like approach?

**Answer:** Store the heading text in state or props and render it in JSX. React should own content that participates in the UI. Use refs for imperative operations that React does not express declaratively.

### 32. A button should move keyboard focus to a search input. Which ref setup is needed?

**Answer:** Create <code>searchRef</code> with <code>useRef(null)</code>, attach it to the input, and call <code>searchRef.current?.focus()</code> in the button's click handler.

### 33. You changed <code>counterRef.current</code> from 1 to 2, but the displayed count still says 1. Why?

**Answer:** Mutating a ref does not trigger a render. If the count is visible UI, store it in state and update that state.

### 34. A custom input component receives a ref in a React 18 project, but the ref is undefined inside its props. What should you check?

**Answer:** In React 18, refs are not passed to function components as ordinary props. Wrap the component with <code>forwardRef</code> and pass the received ref to the DOM input.

### 35. A React 19 function component should expose a DOM input to its parent. How can it receive the ref?

**Answer:** Declare <code>ref</code> in its props and pass it to the built-in input's <code>ref</code> attribute. Use the API for the React version actually installed in the project.

### 36. A list's callback ref appends a node to an array every time it runs. After rerenders, the array contains duplicates. What should change?

**Answer:** Manage attach and detach explicitly instead of blindly appending. Associate nodes with stable item ids in a map, remove them when detached, and keep callback identities stable when practical.

### 37. A ref is still <code>null</code> during the first render. Is that a bug?

**Answer:** No. The DOM node does not exist until React commits the rendered output. Access it later from an event handler, Effect, or callback ref.

### 38. A parent needs to call <code>focus()</code> on a child's internal input, but should not directly manipulate that input's value or styles. What API can help?

**Answer:** The child can use <code>useImperativeHandle</code> to expose only a <code>focus()</code> method through its ref. This is an advanced option; ordinary values should still use props and state.

### 39. A React-rendered message is removed by calling <code>messageNode.remove()</code>, but later state updates make the DOM inconsistent. Why?

**Answer:** The manual removal changed the DOM without changing React state. React still expects to manage that node based on its last render. Change the state that controls whether the message is rendered instead.

### 40. A ref is used to remember an interval id, and the screen must also show whether the interval is running. What should own each value?

**Answer:** Store the interval id in a ref because it is imperative data that does not itself render. Store the visible running status in state so the UI updates when that status changes.

## Chapter navigation

| Previous chapter | Lesson | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [071 - Effects and external synchronization](../lessons/071-effects-and-external-synchronization.md) | [Lesson](../lessons/072-refs-and-dom-access.md) | [Example](../examples/072-refs-and-dom-access.md) | [073 - Custom hooks](../lessons/073-custom-hooks.md) |
