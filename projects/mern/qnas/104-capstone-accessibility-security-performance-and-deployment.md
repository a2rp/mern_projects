# 104 - Capstone: accessibility, security, performance, and deployment: Q&A

### 1. What is the purpose of the final capstone review?

**Answer:** It verifies that important user journeys are accessible, protected, performant, and deployable with monitoring, backup, and recovery plans.

### 2. Why review complete user journeys instead of only isolated components?

**Answer:** A journey crosses the browser, API, session, database, and deployment boundary. A component can work alone while the complete flow fails.

### 3. What does WCAG organize its accessibility guidance around?

**Answer:** The four principles are perceivable, operable, understandable, and robust.

### 4. What does targeting WCAG 2.2 AA mean for a project?

**Answer:** It means using WCAG 2.2 Level AA criteria as a technical review target. A checklist alone does not certify conformance or determine every formal obligation that may apply.

### 5. Why is an automated accessibility scan insufficient by itself?

**Answer:** It cannot fully judge whether content alternatives are meaningful, labels are understandable, focus is logical, or a real workflow is usable with assistive technology.

### 6. What should a keyboard review verify?

**Answer:** Every interactive control is reachable in a logical order, visible focus is clear, actions work without a mouse, dialogs manage focus, and no keyboard trap exists.

### 7. What is a useful behavior for a modal dialog?

**Answer:** Move focus into the dialog when it opens, keep keyboard interaction usable inside it, and return focus to the triggering control when it closes.

### 8. Why should buttons and links be used according to their purpose?

**Answer:** Buttons perform actions while links navigate. Correct semantics provide expected keyboard and assistive-technology behavior.

### 9. What makes a form input accessible?

**Answer:** It has a useful accessible name, clear visible label, understandable instructions, and error text programmatically associated with the relevant field.

### 10. Why should an error not be conveyed only by color?

**Answer:** Users who cannot perceive the color difference would miss the error. Include text or another clear semantic indication.

### 11. What should happen to focus after a form submission fails?

**Answer:** The user should be able to find and understand the error summary or the first relevant field error without losing context.

### 12. What is an accessible asynchronous status update?

**Answer:** It communicates an important change, such as save success or a loading result, to assistive technology without unexpectedly moving focus.

### 13. Why test zoom and reflow?

**Answer:** Users may enlarge content or use narrow viewports. The interface should remain usable without losing information or required functionality.

### 14. Why reserve space for images and asynchronous content?

**Answer:** Stable dimensions reduce unexpected layout movement and help users keep their place while content loads.

### 15. How should an application handle reduced-motion preferences?

**Answer:** Avoid unnecessary motion or reduce it when the user requests reduced motion, while keeping important information and function available.

### 16. Why does client-side route protection not secure an API?

**Answer:** A user can call the API directly or change browser code. The server must independently authenticate and authorize each protected operation.

### 17. What should authorize a private note update?

**Answer:** The server should identify the user from the authenticated session and scope the database operation to both the note identifier and that user's owner identifier.

### 18. Why is a role submitted in a registration request untrusted?

**Answer:** The client can alter the request body. The server must control role assignment and check administrator privileges for each operation.

### 19. What is the purpose of CSRF protection in a cookie-session application?

**Answer:** It helps ensure that state-changing requests made with automatically attached cookies originate from the intended application flow.

### 20. Is CORS a replacement for authentication, authorization, or CSRF protection?

**Answer:** No. CORS controls browser access to cross-origin responses. The API still needs authentication, authorization, input validation, and appropriate CSRF defenses.

### 21. Why validate request size as well as data shape?

**Answer:** A structurally valid request can still be excessively large or expensive to process. Bound body size, search length, page size, and costly operations.

### 22. What is mass assignment?

**Answer:** It occurs when arbitrary client-supplied fields are copied directly into a data update, potentially changing protected fields such as role or owner.

### 23. How should application data be rendered in HTML?

**Answer:** Encode or render it safely for the target context and avoid injecting untrusted strings as raw HTML.

### 24. What does a Content Security Policy contribute?

**Answer:** It can restrict where scripts and other resources load from, reducing some injection impact. It should match the actual application and be tested before enforcement.

### 25. Why is an OWASP ASVS version useful in a security review?

**Answer:** A versioned requirement set provides a traceable technical verification baseline. Recording the version and selected requirements makes the review reproducible.

### 26. Which current Core Web Vitals relate to loading, interactivity, and visual stability?

**Answer:** Largest Contentful Paint measures loading, Interaction to Next Paint measures responsiveness, and Cumulative Layout Shift measures visual stability.

### 27. What are the commonly recommended good Core Web Vitals targets at the 75th percentile?

**Answer:** LCP at or below 2.5 seconds, INP at or below 200 milliseconds, and CLS at or below 0.1. The targets can evolve and should be checked against current guidance.

### 28. Why measure field performance as well as a local development build?

**Answer:** Real users have different devices, networks, and interactions. Laboratory results alone may not reflect their production experience.

### 29. Why benchmark before tuning?

**Answer:** A baseline identifies the actual bottleneck and lets the team see whether a change improved the same journey under comparable conditions.

### 30. Why should a large API list be bounded?

**Answer:** An unbounded list can consume memory, database connections, bandwidth, and browser rendering time. Use validated pagination and a maximum page size.

### 31. Why not add an index for every query?

**Answer:** Indexes consume storage and add work to writes and maintenance. Add and verify indexes for measured query patterns and integrity requirements.

### 32. Why review MongoDB connection pools during performance work?

**Answer:** Pool saturation can increase wait time and API latency. Capacity planning must include the maximum instances and all separate database clients.

### 33. What cache policy is suitable for a content-hashed frontend asset?

**Answer:** It can generally use long-lived immutable caching because a content change produces a new filename. The HTML entry document and runtime configuration should revalidate more frequently.

### 34. Why should CI and deployment use protected secrets?

**Answer:** Untrusted pull-request code or public browser assets should not be able to read production credentials or mutate production resources.

### 35. What makes a release artifact traceable?

**Answer:** It is tied to a reviewed source revision or artifact identifier and can be correlated with the deployment and monitoring signals.

### 36. Why verify backup restoration rather than only backup creation?

**Answer:** Only a restore rehearsal demonstrates that the chosen data can be recovered, validated, and made usable within the application's recovery targets.

### 37. What should determine whether a release continues or stops?

**Answer:** Pre-agreed signals such as user-impacting errors, readiness, latency objectives, data integrity, accessibility blockers, or secret exposure should trigger a pause or mitigation.

### 38. What is the difference between rolling back code and restoring data?

**Answer:** A code rollback changes the application artifact. A data restore rewinds database content and can discard later writes, so it requires a separate impact and reconciliation plan.

### 39. Why record evidence and open risks in the final review?

**Answer:** It distinguishes a verified control from an assumption, assigns follow-up ownership, and makes remaining uncertainty visible to the release decision-maker.

### 40. What evidence supports a capstone release sign-off?

**Answer:** Key journeys pass accessibility and authorization review, relevant checks and builds pass, production configuration is safe, performance is measured, monitoring and recovery are ready, and remaining issues have documented owners and decisions.
