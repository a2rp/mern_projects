# 084 - Error boundaries and recovery: Q&A

These questions review React error-boundary behavior, fallback UI, reporting, recovery, asynchronous failures, Suspense, and boundary placement.

## Multiple-choice questions

### 1. What does a React error boundary primarily do?

- **A.** Shows fallback UI when a descendant throws during rendering
- **B.** Retries every failed HTTP request automatically
- **C.** Catches every exception in the application
- **D.** Replaces all form validation

**Answer: A.** A boundary isolates render errors from its descendants and renders fallback UI for the failed region.

### 2. Which built-in React mechanism is used to define an error boundary?

- **A.** Class lifecycle methods such as <code>getDerivedStateFromError</code> and <code>componentDidCatch</code>
- **B.** A <code>useErrorBoundary</code> Hook exported by React
- **C.** A CSS media query
- **D.** A promise returned from every component

**Answer: A.** React's built-in boundary mechanism uses class component lifecycle methods.

### 3. What should <code>getDerivedStateFromError</code> do?

- **A.** Return state used to render fallback UI
- **B.** Send an email to every user
- **C.** Retry an HTTP request indefinitely
- **D.** Change global CSS

**Answer: A.** It should be pure and return the state that tells the boundary to display its fallback.

### 4. What is an appropriate use of <code>componentDidCatch</code>?

- **A.** Report an error and component stack to an approved diagnostics system
- **B.** Render raw stack traces to all users
- **C.** Replace every child with an unrelated route
- **D.** Mutate props during rendering

**Answer: A.** Reporting is a side effect and belongs in <code>componentDidCatch</code> or a callback it invokes.

### 5. Which error is not normally caught by a React error boundary?

- **A.** An error thrown inside a button's event handler
- **B.** A descendant throwing while rendering
- **C.** A descendant throwing while rendering a lifecycle method
- **D.** A child component's render failure

**Answer: A.** Event handlers need their own error handling.

### 6. What should ordinary asynchronous request failures do?

- **A.** Be caught by the request code and represented as a UI state
- **B.** Be assumed to reach every error boundary automatically
- **C.** Be ignored if the component has a fallback
- **D.** Be shown as a raw stack trace

**Answer: A.** Handle rejected promises at the async boundary and render a safe status or error message.

### 7. Can an error boundary catch an error thrown by its own fallback?

- **A.** No; it cannot catch errors in itself
- **B.** Yes, every boundary catches its own fallback
- **C.** Only if its fallback is a string
- **D.** Only when a CSS class is present

**Answer: A.** A boundary cannot catch errors thrown by itself; an ancestor boundary may catch an error in its descendant boundary.

### 8. What is a reason to place a boundary around one page region rather than the whole page?

- **A.** The region can fail independently while useful page content remains visible
- **B.** Every component must have its own boundary
- **C.** Boundaries improve network speed
- **D.** The boundary should hide all navigation

**Answer: A.** Local boundaries help preserve independent content and make the failure scope understandable.

### 9. What does changing an error boundary's React key do?

- **A.** It creates a fresh boundary and subtree
- **B.** It automatically fixes any broken data
- **C.** It permanently disables errors
- **D.** It starts a database transaction

**Answer: A.** A new key remounts that tree. The cause still needs to be corrected or the fallback may reappear.

### 10. Which statement best distinguishes Suspense from an error boundary?

- **A.** Suspense handles a supported pending state; an error boundary handles a thrown render error
- **B.** Suspense is only for CSS, and boundaries are only for APIs
- **C.** They are identical components
- **D.** An error boundary shows loading UI for every network request

**Answer: A.** They handle different states and may be nested together.

### 11. How should an event handler catch a failed save request?

- **A.** Use a try/catch around the awaited request and update a safe UI state
- **B.** Assume an error boundary always catches its rejected promise
- **C.** Throw it from a timer and hope React sees it
- **D.** Render the server stack trace

**Answer: A.** The event handler owns the asynchronous failure path and should present an appropriate message.

### 12. What information should usually be shown in production fallback UI?

- **A.** A safe explanation and a meaningful next step
- **B.** The full stack trace and server file paths
- **C.** Database credentials
- **D.** The raw internal exception object

**Answer: A.** The user needs useful guidance, not sensitive diagnostic details.

### 13. What can happen if a boundary's monitoring callback itself throws?

- **A.** Reporting can interfere with fallback behavior unless it is protected
- **B.** React automatically repairs the network
- **C.** The child is guaranteed to succeed
- **D.** The database becomes read-only

**Answer: A.** Keep the fallback resilient and protect it from a failing reporting service.

### 14. Which is a good boundary region?

- **A.** An independently useful recommendations panel
- **B.** A wrapper around every text node
- **C.** A boundary around only a CSS declaration
- **D.** A boundary with no fallback or recovery plan

**Answer: A.** A boundary is useful where a feature can fail independently and the user can still use the surrounding page.

### 15. What does a boundary around a component not guarantee?

- **A.** That async request errors, event errors, and server-rendering errors are all caught
- **B.** That descendant render errors can produce fallback UI
- **C.** That a local render failure can be isolated
- **D.** That a fallback can explain a failed section

**Answer: A.** Boundaries do not catch every kind of error.

### 16. Can a function component create React's built-in error boundary using only a Hook?

- **A.** No; the built-in mechanism uses class lifecycle APIs
- **B.** Yes, every function component is automatically a boundary
- **C.** Yes, with <code>useState</code> alone
- **D.** No; React cannot render class components

**Answer: A.** A function component can provide fallback UI, but the built-in boundary mechanism needs a class boundary or a library abstraction.

### 17. If a boundary catches an error in one region, what should ideally remain usable?

- **A.** Unrelated page content and navigation outside that boundary
- **B.** Nothing else on the page
- **C.** Only the browser developer tools
- **D.** Only the failed descendant

**Answer: A.** The goal is to isolate the failure and preserve useful surrounding content.

### 18. If a child boundary fails while rendering its fallback, which boundary may handle that error?

- **A.** An ancestor boundary around the child boundary
- **B.** The same failing boundary
- **C.** A sibling boundary
- **D.** No React code can handle it

**Answer: A.** A boundary cannot catch itself, but an ancestor can catch errors from a descendant boundary.

### 19. Why should raw error details usually stay out of fallback UI?

- **A.** They can reveal sensitive data or internal implementation details
- **B.** They make the component render faster
- **C.** They are required for accessible names
- **D.** They prevent monitoring

**Answer: A.** Keep user messaging safe and report diagnostic detail through a controlled channel.

### 20. What should happen if the underlying error condition remains after a reset?

- **A.** The subtree may fail again and show the fallback again
- **B.** React must guarantee it succeeds
- **C.** The error boundary disables itself forever
- **D.** The reset changes the database schema

**Answer: A.** Resetting only remounts or clears boundary state; the underlying cause still matters.

## Short-answer and scenario questions

### 21. A child throws while calculating its JSX. What should a surrounding boundary render?

**Answer:** It should render its safe fallback in place of the failed subtree, while content outside the boundary can remain available.

### 22. A click handler throws while saving a course. Why might the surrounding boundary not show its fallback?

**Answer:** Event-handler errors are outside the usual errors caught by boundaries. The handler should catch the failure and update a safe error state or report it through the event flow.

### 23. A promise rejects after an API call. What is the right place to handle it?

**Answer:** Catch the rejection in the async request or event handler that owns it. Render a loading, success, or error state rather than expecting a normal rejected promise to reach a boundary.

### 24. A page has a course description and an independent recommendations widget. Where should the boundary go?

**Answer:** Around the recommendations widget so a failure does not hide the course description or the rest of the page.

### 25. What is the difference between the two common boundary lifecycle methods?

**Answer:** <code>getDerivedStateFromError</code> returns state for fallback rendering. <code>componentDidCatch</code> is a place for side effects such as reporting the error and component stack.

### 26. Why should <code>getDerivedStateFromError</code> not send telemetry?

**Answer:** It is used to derive render state and should remain pure. Reporting is a side effect and belongs in <code>componentDidCatch</code> or an explicitly handled callback.

### 27. A reset button remounts the same child with the same invalid input. What will likely happen?

**Answer:** The child can throw again and the fallback will reappear. Recovery must also change or reload the condition that caused the failure.

### 28. A developer puts the only page navigation inside the boundary's failed subtree. What is a usability problem?

**Answer:** When the subtree fails, users may lose the only way to navigate away. Keep important escape routes and navigation outside fragile feature boundaries where possible.

### 29. Why should a boundary fallback be simpler than the feature it replaces?

**Answer:** A complex fallback can have its own render failures or dependencies on the broken feature. A small fallback is more likely to remain available.

### 30. Should a production fallback show a database connection string to help debugging?

**Answer:** No. It can disclose credentials or infrastructure. Show a safe message and send appropriate diagnostics only to a controlled logging system.

### 31. The monitoring callback throws because the logging service is down. What should the boundary do?

**Answer:** Keep rendering the fallback. Protect the reporting call so telemetry failure does not replace one UI failure with another.

### 32. A lazy-loaded component is still loading. Which UI mechanism is appropriate for the pending state?

**Answer:** Suspense can render a loading fallback for a supported suspended resource. An error boundary handles a thrown error if loading or rendering fails.

### 33. A boundary wraps its own fallback in another boundary inside its render method. Does that make it catch its own error?

**Answer:** No. The error boundary cannot catch an error in itself. A separate ancestor boundary must surround the boundary if its fallback also needs protection.

### 34. A component throws during server-side rendering. Should the application rely on the client boundary to catch it?

**Answer:** No. Error boundaries do not handle server-rendering errors. The server renderer or framework needs its own error handling and response strategy.

### 35. A global boundary hides the entire application after a chart throws. What could improve the experience?

**Answer:** Add a more local boundary around the chart with a focused fallback, so page content and navigation remain available.

### 36. Why should reporting include feature context carefully?

**Answer:** Context can help identify which region failed, but it should be limited to useful, non-sensitive details and follow the application's privacy policy.

### 37. A boundary error is caught, but the user sees only “Something went wrong.” What can make the fallback more useful?

**Answer:** Identify the affected feature, explain what remains usable, and offer a real action such as retrying after resetting the data or navigating elsewhere.

### 38. Can an error boundary replace normal form validation messages?

**Answer:** No. Validation failures are expected input outcomes and should be rendered by the form's normal validation state. A boundary is for unexpected descendant render failures.

### 39. A test expects an error boundary to catch a timer callback exception. Is that a valid expectation?

**Answer:** Not for a normal timer callback. Catch errors in that async callback and represent them through component state or the relevant async error mechanism.

### 40. What should a test of a boundary verify besides that it renders an alert?

**Answer:** Verify that the failing region is replaced, the relevant surrounding content remains, the recovery action works when its cause changes, and raw internal error details are not exposed.

## Chapter navigation

| Previous chapter | Chapter lesson | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [083 - React performance and memoization](../lessons/083-react-performance-and-memoization.md) | [Lesson](../lessons/084-error-boundaries-and-recovery.md) | [Example](../examples/084-error-boundaries-and-recovery.md) | [085 - State management choices and tradeoffs](../lessons/085-state-management-choices-and-tradeoffs.md) |
