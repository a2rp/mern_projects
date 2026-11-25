# 082 - Component tests with React: Q&A

These questions review React component testing, Vitest, jsdom, React Testing Library queries, user interactions, asynchronous states, mocks, accessibility, and the limits of DOM-based tests.

## Multiple-choice questions

### 1. What is the main purpose of a React component test?

- **A.** Verify user-observable component behavior in a DOM-like environment
- **B.** Verify the exact number of times every component function runs
- **C.** Replace all browser testing
- **D.** Test the production database directly

**Answer: A.** Component tests render the UI and check meaningful behavior such as labelled controls, user actions, and visible results.

### 2. Which assertion is most resilient to a harmless internal refactor?

- **A.** The user can find and activate a button named “Save course”
- **B.** The component calls a particular hook exactly twice
- **C.** The rendered tree contains a child component with a private name
- **D.** The button has a particular generated CSS class

**Answer: A.** It checks the public interface the user relies on instead of an implementation detail.

### 3. What does jsdom provide in a typical component test setup?

- **A.** A simulated DOM environment for JavaScript tests
- **B.** A full browser with real layout and rendering
- **C.** A production React server
- **D.** A mock MongoDB database

**Answer: A.** jsdom supports many DOM APIs, but it does not behave like a complete visual browser.

### 4. What does React Testing Library primarily help a test do?

- **A.** Render React and query the resulting DOM in a user-oriented way
- **B.** Bundle and deploy the frontend
- **C.** Replace the React state model
- **D.** Run SQL queries

**Answer: A.** It offers render and query helpers; a runner such as Vitest executes the tests.

### 5. What is Vitest in the example toolchain?

- **A.** A test runner and assertion framework that integrates with Vite
- **B.** A React component library
- **C.** A database driver
- **D.** A browser automation service

**Answer: A.** Vitest discovers and runs tests and provides test and assertion APIs.

### 6. Why configure a DOM environment for React component tests?

- **A.** Components need DOM APIs to render and respond to interactions
- **B.** It guarantees CSS pixels match a real browser
- **C.** It starts an Express server automatically
- **D.** It makes every test an end-to-end test

**Answer: A.** A DOM-like environment makes rendering and event interactions possible, but it does not emulate all browser behavior.

### 7. What is the preferred query for a button with the accessible name “Continue”?

- **A.** <code>getByRole('button', { name: 'Continue' })</code>
- **B.** <code>getByClass('continue')</code>
- **C.** <code>getByHook('useContinue')</code>
- **D.** <code>getByIndex(0)</code>

**Answer: A.** A role and accessible name express how a user or assistive technology can identify the button.

### 8. When should a test generally use <code>queryByRole</code>?

- **A.** When checking that an element is absent
- **B.** When waiting for an element to appear later
- **C.** When selecting by CSS class
- **D.** When sending a network request

**Answer: A.** <code>queryBy...</code> returns <code>null</code> when no match exists, which makes absence assertions possible.

### 9. When is <code>findByRole</code> useful?

- **A.** When one matching element is expected to appear asynchronously
- **B.** When checking that no element exists
- **C.** When accessing component state
- **D.** When querying a production database

**Answer: A.** <code>findBy...</code> retries until the element appears or the query times out.

### 10. What should a <code>waitFor</code> callback usually contain?

- **A.** An assertion that must eventually stop throwing
- **B.** A click that should run once
- **C.** A fixed sleep of several seconds
- **D.** A change to the component's private state

**Answer: A.** The callback can be retried, so keep it focused on an assertion rather than performing an interaction.

### 11. Why use <code>userEvent</code> for ordinary UI actions?

- **A.** It models user interactions such as typing and clicking
- **B.** It directly changes component state without rendering
- **C.** It replaces all accessibility checks
- **D.** It creates a real browser session

**Answer: A.** <code>userEvent</code> exercises the DOM through browser-like interaction sequences.

### 12. What should a test do after calling <code>userEvent.type</code>?

- **A.** Await the interaction
- **B.** Call the component function directly
- **C.** Sleep for a fixed five seconds
- **D.** Read React's private state

**Answer: A.** User-event interactions are asynchronous and should be awaited.

### 13. What does <code>toHaveBeenCalledWith('react')</code> verify on a mock callback?

- **A.** The callback received the argument <code>'react'</code>
- **B.** The callback was rendered as a button
- **C.** The React Router path changed
- **D.** The component rendered exactly once

**Answer: A.** It checks the arguments passed to the callback when it was invoked.

### 14. Which dependency is reasonable to mock in a focused component test?

- **A.** An API service at a clear boundary
- **B.** React's <code>useState</code> for every test
- **C.** The component being tested
- **D.** Every DOM method

**Answer: A.** Controlling a service boundary lets the test focus on component behavior without replacing the UI under test.

### 15. What does test coverage percentage tell you?

- **A.** Which code locations were executed by tests, not whether the behavior is correct
- **B.** That every user journey works in every browser
- **C.** That the application is secure
- **D.** That the deployment succeeded

**Answer: A.** Coverage is a clue about exercised code, not proof of test quality or product correctness.

### 16. Which behavior is outside jsdom's reliable scope?

- **A.** Real responsive layout and visual rendering
- **B.** Finding a labelled textbox
- **C.** Checking visible text in the DOM
- **D.** Activating a button handler

**Answer: A.** Use a real browser test or browser review for layout and rendering behavior.

### 17. What should component tests assert about render counts?

- **A.** Usually nothing; assert outcomes rather than exact render counts
- **B.** Every component must render exactly once
- **C.** Every state update must render exactly twice
- **D.** Only parent render counts matter

**Answer: A.** React may render for framework reasons, and render counts are usually implementation details.

### 18. Why can an effect run more than once during development checks?

- **A.** React Strict Mode may repeat development checks to expose unsafe behavior
- **B.** jsdom always duplicates effects
- **C.** Testing Library randomizes the component tree
- **D.** Vitest runs all tests twice by default

**Answer: A.** Do not make a component's correctness depend on a development render or effect occurring exactly once.

### 19. What is the main value of test cleanup?

- **A.** It prevents rendered DOM and resources from leaking into later tests
- **B.** It resets the production database
- **C.** It improves CSS layout
- **D.** It deletes the source component

**Answer: A.** Cleanup keeps tests isolated and can unmount components and their subscriptions.

### 20. Does a passing component test prove the interface is fully accessible?

- **A.** No; it can catch some semantic issues but does not replace broader accessibility review
- **B.** Yes, if it uses jsdom
- **C.** Yes, if code coverage is 100 percent
- **D.** Yes, if every query uses a test ID

**Answer: A.** Tests can verify labels and roles, but accessibility also needs keyboard, assistive technology, and browser review where appropriate.

## Short-answer and scenario questions

### 21. A test needs to verify that a “Delete” confirmation is not shown before the user clicks. Which query variant should it use?

**Answer:** Use <code>queryByRole</code> or another <code>queryBy...</code> variant and assert that the result is not in the document. <code>getBy...</code> throws when the element is absent, so it is the wrong tool for that assertion.

### 22. A textbox can only be found by its placeholder. What should you check first?

**Answer:** Check whether it has a visible, programmatically associated label. Prefer querying it by accessible role and name or by label text; a placeholder is not a reliable substitute for a persistent label.

### 23. A request completes after the component initially renders “Loading courses.” How should the test wait for the results heading?

**Answer:** Use <code>await screen.findByRole('heading', { name: 'Your courses' })</code>. It waits for the expected user-visible element rather than guessing how many milliseconds the request takes.

### 24. The question is whether the application can navigate from a product page, call the API, and show the saved item in a browser. Is a component test enough?

**Answer:** No. That is a multi-layer journey. Use an end-to-end test in a real browser, and use focused component and integration tests for the individual behaviors.

### 25. Why should a test await <code>user.type(input, 'react')</code>?

**Answer:** <code>userEvent</code> models multiple input events asynchronously. Awaiting it ensures those events have been processed before the test checks the filtered result.

### 26. A test fails because the component's hook call count changed, but users see the same correct UI. What is wrong with the test?

**Answer:** It is coupled to a private implementation detail. Replace it with assertions about the rendered behavior and interactions a user can observe.

### 27. When is an HTTP interception tool a better choice than mocking the whole API module?

**Answer:** In an integration test where the real request construction, response parsing, and UI state transitions should run. Intercepting at the network boundary keeps application request code real while making responses deterministic.

### 28. A child component must tell its parent which course was selected. How can a component test check this contract?

**Answer:** Pass a mock callback as the prop, activate the visible course button with a user interaction, and assert the callback was called with that course's identifier.

### 29. What should a useful loading-state test check?

**Answer:** It should render the component while its request is pending and assert that a meaningful progress message or status is visible. It can then resolve the controlled request and assert that the loaded content appears.

### 30. A React error boundary test prints an expected warning. Should the entire test suite silence <code>console.warn</code>?

**Answer:** No. Limit any suppression to that one expected diagnostic and restore the original method. Broad suppression can hide unrelated warnings and real regressions.

### 31. A test uses fake timers to check a debounced search. What cleanup is important?

**Answer:** Advance timers deliberately for the debounce assertion, then restore real timers after the test. Also flush or cancel pending work so it cannot affect another test.

### 32. A test sometimes observes the old search result immediately after typing. What should it do?

**Answer:** Ensure the typing interaction is awaited and wait for the updated user-visible result with an appropriate <code>findBy...</code> query or focused <code>waitFor</code> assertion. Do not add an arbitrary long sleep.

### 33. When is a test ID acceptable?

**Answer:** As an escape hatch when the element has no useful role, label, or visible text that provides a stable user-facing query. Do not use test IDs as the default way to locate every control.

### 34. Why is adding <code>role="button"</code> to a clickable <code>&lt;div&gt;</code> usually not the best fix?

**Answer:** It does not automatically provide native button keyboard behavior. Prefer a real <code>&lt;button&gt;</code> so semantics, focus, and keyboard activation work by default.

### 35. What kind of error does a React error boundary normally catch?

**Answer:** It catches rendering errors from descendant components in the part of the tree it surrounds and can show fallback UI. It does not generally catch ordinary event-handler errors, timer errors, or server-side rendering errors.

### 36. An API returns a stack trace with internal paths. Should an error component show it to the user?

**Answer:** No. Show a safe, actionable message and keep diagnostic details in appropriate server-side logs. Never reveal secrets or sensitive internals in public UI.

### 37. The repository already has Vite plugins, aliases, and environment configuration. Should a lesson's test setup replace the whole config?

**Answer:** No. Add the test environment and setup-file options to the existing configuration while preserving the app's plugins and aliases.

### 38. Which command is useful for running a test suite once in a continuous integration job?

**Answer:** A non-watch command such as <code>vitest run</code>, usually exposed through a package script like <code>npm run test:run</code>. Use the project's actual package manager and script names.

### 39. Does jsdom automatically prove that browser APIs, CSS, and HTTP all behave exactly like production?

**Answer:** No. jsdom provides a useful DOM-like environment, not a complete browser or live production stack. Test browser-dependent behavior at the appropriate level.

### 40. A component test passes, but the built application fails because a production environment variable is missing. What coverage is missing?

**Answer:** A component test does not validate production configuration or deployment. Add configuration checks and deployment or smoke tests, and exercise critical user journeys in a suitable integration or end-to-end environment.

## Chapter navigation

| Previous chapter | Chapter lesson | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [081 - CSS styling and responsive interface architecture](../lessons/081-css-styling-and-responsive-interface-architecture.md) | [Lesson](../lessons/082-component-tests-with-react.md) | [Example](../examples/082-component-tests-with-react.md) | [083 - React performance and memoization](../lessons/083-react-performance-and-memoization.md) |
