# 086 - Build a reusable component system: Q&A

These questions review design tokens, shared primitives, semantic elements, component APIs, composition, prop forwarding, accessibility, project organization, and deliberate reuse.

## Multiple-choice questions

### 1. What is the main purpose of a component system?

- **A.** Provide consistent reusable interface rules and building blocks for real repeated needs
- **B.** Turn every HTML element into a React component
- **C.** Replace semantic HTML
- **D.** Force every screen to look identical

**Answer: A.** A component system makes shared UI behavior and design easier to reuse without removing appropriate feature differences.

### 2. What is a design token?

- **A.** A named shared design decision such as a semantic color or spacing value
- **B.** A user password
- **C.** A unique CSS selector for every page
- **D.** A React state update

**Answer: A.** Tokens give repeated design values clear names and a shared place to change them.

### 3. Which pair should usually keep its different native semantics?

- **A.** A navigation link and an action button
- **B.** Two buttons that both save a form
- **C.** Two text fields with the same behavior
- **D.** Two cards with the same structure

**Answer: A.** A link navigates and a button performs an action. Similar styling does not make their behavior interchangeable.

### 4. What is a useful default for the native button type in a reusable action button?

- **A.** <code>button</code>
- **B.** <code>submit</code> for every use
- **C.** <code>reset</code> for every use
- **D.** Omit the element

**Answer: A.** The default prevents an ordinary button from accidentally submitting a surrounding form. A submit action can specify <code>type="submit"</code>.

### 5. Why should a component system preserve native controls?

- **A.** Native elements provide expected browser semantics and keyboard behavior
- **B.** Native elements prevent users from using keyboards
- **C.** Native elements eliminate the need for labels
- **D.** Native elements automatically validate all business rules

**Answer: A.** A real button, link, input, or select supplies behavior that a custom clickable element would need to recreate.

### 6. What is composition with <code>children</code> useful for?

- **A.** Letting a caller provide content while the component owns shared structure or behavior
- **B.** Replacing all props with global state
- **C.** Persisting content between browser sessions
- **D.** Making every child automatically accessible

**Answer: A.** Composition handles content differences without adding a boolean prop for every combination.

### 7. What is a risk of adding many boolean props such as <code>isPrimary</code>, <code>isOutlined</code>, and <code>isDanger</code>?

- **A.** Their combinations can become unclear and inconsistent
- **B.** React cannot render booleans
- **C.** CSS stops working
- **D.** The component becomes a native link

**Answer: A.** A small set of meaningful variants is easier to understand than many overlapping flags.

### 8. Where should a course-specific card generally live?

- **A.** With the course feature unless multiple features truly share its contract
- **B.** In a global package before it is used
- **C.** In every feature as a copied file
- **D.** In the application root component

**Answer: A.** Feature-specific ownership keeps behavior near the domain that defines it.

### 9. What is a reason to extract a shared package?

- **A.** Independent applications need the same stable component API or release cycle
- **B.** One page has one button
- **C.** The repository uses React
- **D.** A component file is longer than ten lines

**Answer: A.** A separate package adds maintenance and versioning work, so its independent reuse should justify it.

### 10. What should happen to a component-only prop such as <code>tone</code>?

- **A.** Use it internally and do not accidentally forward it to an unrelated DOM attribute
- **B.** Always spread it directly onto the native element
- **C.** Save it in local storage
- **D.** Convert it into a database query

**Answer: A.** Separate component API props from the native attributes being forwarded.

### 11. Which query best describes a button to a user and a component test?

- **A.** Role and accessible name
- **B.** A private CSS class only
- **C.** The component's file line number
- **D.** The order of React Hooks

**Answer: A.** The role and name describe the button's user-facing contract.

### 12. Why should a reusable text field connect a visible label to its input?

- **A.** So users and assistive technology can identify the control
- **B.** So the input becomes a link
- **C.** So React stops updating its value
- **D.** So the input is automatically persisted

**Answer: A.** A programmatic label gives the field an accessible name and improves usability.

### 13. How should a navigation destination usually be rendered?

- **A.** As a link with an appropriate destination
- **B.** As a button that changes location through a click handler
- **C.** As a clickable <code>div</code>
- **D.** As an input without a label

**Answer: A.** Links express navigation and preserve browser behaviors such as opening in a new tab.

### 14. What does a semantic variant such as <code>primary</code> communicate?

- **A.** The component's intended visual role
- **B.** The exact browser engine
- **C.** A specific CSS pixel value
- **D.** A database collection name

**Answer: A.** Semantic variants describe purpose without requiring callers to know every underlying style value.

### 15. What is a drawback of creating a global token for every one-off CSS number?

- **A.** It adds indirection without representing a real shared decision
- **B.** It makes every value easier to understand
- **C.** It eliminates the cascade
- **D.** It automatically improves browser performance

**Answer: A.** Tokens are most useful when they express deliberate shared design rules.

### 16. What should a shared component's documentation explain?

- **A.** Its semantic element, props, variants, callbacks, and important states
- **B.** Only its file size
- **C.** The author's favorite editor
- **D.** Every implementation detail of React

**Answer: A.** Consumers need to understand the contract and how to use it accessibly.

### 17. How can a component expose a disabled state for an action button?

- **A.** Forward the native <code>disabled</code> attribute to the button
- **B.** Only lower opacity while leaving it fully active
- **C.** Remove its text
- **D.** Replace it with a paragraph

**Answer: A.** Native disabled behavior prevents activation and communicates the state to the browser and assistive technology.

### 18. What is a benefit of keeping a component's stylesheet close to the component?

- **A.** The owner of the component's visual rules is clear
- **B.** It disables CSS completely
- **C.** It forces all styles to be inline
- **D.** It makes unrelated feature rules global

**Answer: A.** Co-location makes ownership and changes easier to track.

### 19. What should you check before changing a widely used component prop?

- **A.** Its current consumers and a migration plan
- **B.** Only the component's filename
- **C.** The browser's history length
- **D.** The database table count

**Answer: A.** A shared API change can affect many consumers, so search and migrate them deliberately.

### 20. Does naming a prop <code>isAccessible</code> make arbitrary child markup accessible?

- **A.** No; accessibility depends on semantics, labels, focus, and interaction behavior
- **B.** Yes, the prop automatically fixes every issue
- **C.** Yes, if the value is true
- **D.** Only in a development build

**Answer: A.** A reassuring prop name cannot substitute for correct markup and interaction design.

## Short-answer and scenario questions

### 21. Two save buttons share the same behavior and styling but have different labels. Should they probably be one shared component?

**Answer:** Yes, if they have the same semantic action and contract. Let the caller provide the label as children while the shared component owns the common button behavior and styles.

### 22. A “Go to courses” element changes routes. Why should it not be implemented as a generic action button?

**Answer:** It is navigation, so an anchor or router link preserves link semantics and browser behaviors. A button represents an action.

### 23. A form contains a cancel button and a submit button. What types should they use?

**Answer:** The cancel action should use <code>type="button"</code> so it does not submit the form. The save action should use <code>type="submit"</code>.

### 24. A button's API has seven booleans and allows contradictory combinations. What is a better direction?

**Answer:** Identify the real visual variants and replace the combinations with a small semantic variant API. Use children for content and a separate component if behavior is genuinely different.

### 25. A single feature uses a complex CourseCard. Should it immediately move to a shared UI package?

**Answer:** No. Keep it with the course feature until other independent features need the same stable behavior and API.

### 26. Two different features need a button with the same disabled, focus, and variant behavior. What could be extracted?

**Answer:** A shared Button primitive that preserves the native button and exposes a small semantic variant API.

### 27. A reusable Button accepts a <code>variant</code> prop and spreads every prop onto the native element. What should it change?

**Answer:** Consume <code>variant</code> internally to select a class and forward only appropriate native button attributes. Do not leak component-only props to the DOM.

### 28. A TextField has a placeholder but no visible label. What should be improved?

**Answer:** Add a visible label and associate it with the input using matching <code>htmlFor</code> and <code>id</code>, or use a correctly nested label. A placeholder is not a substitute for a persistent label.

### 29. A dark theme requires rewriting every component's selectors. What design choice could simplify it?

**Answer:** Use semantic CSS custom properties for shared roles such as text, surface, border, and primary color, then override those tokens at the theme boundary.

### 30. A design system has 40 color tokens, most used once. What should the team review?

**Answer:** Determine which values are real shared design decisions. Remove or localize one-off values instead of making every number a global token.

### 31. A consumer needs an icon and a label inside a Button. Should the component add separate icon-name and label-text boolean combinations?

**Answer:** Usually not. Let the consumer compose the icon and label as children, while the Button provides the native semantics and shared styles.

### 32. An icon is decorative beside visible button text. What should its accessibility treatment be?

**Answer:** Mark the decorative icon as hidden from the accessibility tree, such as with <code>aria-hidden="true"</code>, while keeping the button's visible text as its accessible name.

### 33. A shared button is visually disabled but remains clickable. What is missing?

**Answer:** The visual class alone is not enough. Forward the native <code>disabled</code> attribute when the action is unavailable and ensure the state is communicated accessibly.

### 34. A reusable TextField renders an error message. What relationships should it establish?

**Answer:** The control needs an accessible label, and the error text should be connected to it with an appropriate description relationship. The invalid state should be conveyed when applicable.

### 35. A router link and a button need identical colors and padding. Must they be the same component?

**Answer:** No. They can share CSS classes or a style primitive while preserving their distinct native behavior and element semantics.

### 36. A reusable component has no usage example and unclear callback arguments. What will consumers struggle with?

**Answer:** They may not know which values are required, what events produce, or which states are handled. Document the contract and show a short correct example.

### 37. A component library update renames a widely used prop. What is a safe migration process?

**Answer:** Search all consumers, document the new contract, migrate them consistently, update examples, and remove the old prop after the consumers have moved.

### 38. The generic Button contains course enrollment business logic. What should change?

**Answer:** Move feature-specific behavior into a course feature component or event handler. The shared Button should provide generic button semantics and styling.

### 39. An application has a dozen shared primitives but only one frontend. Is a separate npm package required?

**Answer:** No. Keeping the components inside the frontend source tree can be simpler until there is an independent consumer or release need.

### 40. What makes a component abstraction successful?

**Answer:** It removes meaningful duplication, has a clear and small contract, preserves semantics and accessibility, and stays easier to use than repeating the original markup.

## Chapter navigation

| Previous chapter | Chapter lesson | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [085 - State management choices and tradeoffs](../lessons/085-state-management-choices-and-tradeoffs.md) | [Lesson](../lessons/086-build-a-reusable-component-system.md) | [Example](../examples/086-build-a-reusable-component-system.md) | [087 - Full-stack application architecture and folder structure](../lessons/087-full-stack-application-architecture-and-folder-structure.md) |
