# 081 - CSS styling and responsive interface architecture: Q&A

These questions review CSS organization, design tokens, fluid layouts, responsive breakpoints, container queries, React styling, cascade management, and user preferences.

## Multiple-choice questions

### 1. What is CSS architecture in a React project?

- **A.** How styles are organized and owned as the interface grows
- **B.** A replacement for React components
- **C.** A database schema for CSS values
- **D.** A method for eliminating all global styles

**Answer: A.** CSS architecture defines where styles live, how they relate to components and pages, and how the project controls shared values and the cascade.

### 2. What is a useful responsibility for a design-token file?

- **A.** Defining shared colors, spacing, and other intentional design values
- **B.** Holding every one-off selector in the application
- **C.** Storing user passwords
- **D.** Replacing component styles

**Answer: A.** Tokens give repeated design decisions a clear shared source.

### 3. What makes a CSS custom property such as <code>--color-surface</code> semantic?

- **A.** Its name describes the role the value serves
- **B.** Its name contains the browser vendor
- **C.** It can only store colors
- **D.** It automatically creates a dark theme

**Answer: A.** Semantic names express purpose and make it easier to change the actual color without renaming its role.

### 4. What is the purpose of <code>box-sizing: border-box</code> on all elements?

- **A.** The declared width includes padding and border
- **B.** It disables all borders
- **C.** It makes every element a grid
- **D.** It prevents text from wrapping

**Answer: A.** With border-box sizing, padding and borders are included in the declared size, which makes dimensions easier to reason about.

### 5. Why should a document include a viewport meta declaration?

- **A.** It lets mobile browsers use the device width as the layout viewport
- **B.** It loads the stylesheet faster
- **C.** It adds an accessibility label to every control
- **D.** It forces a desktop layout

**Answer: A.** The device-width viewport helps responsive CSS match the actual narrow screen rather than a wider virtual layout.

### 6. Which layout technique often adapts a card collection without a breakpoint?

- **A.** CSS Grid with flexible columns such as <code>auto-fit</code> and <code>minmax()</code>
- **B.** An absolute position for every card
- **C.** A fixed width for the entire page
- **D.** A separate stylesheet for every device

**Answer: A.** Intrinsic Grid sizing can fit as many columns as the available space allows.

### 7. What is a good reason to add a media-query breakpoint?

- **A.** The content no longer fits comfortably and needs a layout change
- **B.** A specific phone model was released
- **C.** Every page must have exactly three breakpoints
- **D.** The stylesheet has reached 100 lines

**Answer: A.** Breakpoints should respond to the layout’s needs, not a list of device names.

### 8. How does a container query differ from a viewport media query?

- **A.** It can style descendants based on a containing element’s size
- **B.** It always styles the entire document
- **C.** It only works for color changes
- **D.** It disables responsive layout

**Answer: A.** Container queries are useful when a reusable component’s layout depends on its own available space.

### 9. What must an element do before descendants can use a size container query against it?

- **A.** Establish an appropriate container with <code>container-type</code> or the <code>container</code> shorthand
- **B.** Have an id named <code>container</code>
- **C.** Set <code>position: fixed</code>
- **D.** Use a React state variable

**Answer: A.** A size query needs an eligible query container. Naming the container can make the intended target explicit.

### 10. Which attribute does React use for a CSS class?

- **A.** <code>className</code>
- **B.** <code>class</code>
- **C.** <code>selector</code>
- **D.** <code>css</code>

**Answer: A.** In JSX, React uses <code>className</code> to set the DOM class attribute.

### 11. What is one benefit of CSS Modules?

- **A.** They scope class names to a stylesheet module in supported build systems
- **B.** They eliminate the CSS cascade
- **C.** They make server-side validation unnecessary
- **D.** They automatically choose media-query breakpoints

**Answer: A.** CSS Modules can reduce accidental global class-name collisions.

### 12. When is React’s inline <code>style</code> prop a good fit?

- **A.** For a style value that genuinely depends on runtime data, such as progress width
- **B.** For every media query in the application
- **C.** For all focus and hover states
- **D.** For replacing the global stylesheet

**Answer: A.** Inline styles can carry data-driven values, but stylesheets are better for pseudo-classes, media queries, and reusable layout rules.

### 13. What is the usual role of a page stylesheet?

- **A.** Composing the page’s layout from components and shared primitives
- **B.** Defining every browser default
- **C.** Replacing component styles
- **D.** Storing API response data

**Answer: A.** Page styles own composition and page-level layout, while reusable component styles can remain with their components.

### 14. What is the mobile-first approach to media queries?

- **A.** Start with a useful narrow layout and add styles for wider layouts
- **B.** Start with a fixed desktop canvas and disable it on phones
- **C.** Use only pixel widths
- **D.** Create a separate application for each viewport

**Answer: A.** A narrow default layout uses normal flow and is progressively enhanced when more room is available.

### 15. Why should breakpoints not be named after individual device models?

- **A.** The layout should respond to content fit and can serve many device sizes
- **B.** Device names are required in CSS syntax
- **C.** Devices cannot use media queries
- **D.** Breakpoints are only for print

**Answer: A.** A content-driven breakpoint works for devices and windows that were not on a device list.

### 16. What does <code>clamp()</code> help express?

- **A.** A value that can grow or shrink between a minimum and maximum
- **B.** A value that is always zero
- **C.** A selector that matches a child
- **D.** A network request timeout

**Answer: A.** For example, a heading size can scale with available space while staying within readable bounds.

### 17. What does <code>prefers-reduced-motion: reduce</code> indicate?

- **A.** The user requested that non-essential motion be reduced
- **B.** The device has a narrow screen
- **C.** The user prefers a smaller font
- **D.** The page should disable all interaction

**Answer: A.** Styles can respect the user’s system preference by removing or reducing non-essential motion.

### 18. What is a common risk of deeply nested selectors?

- **A.** They create tight coupling and can make specificity conflicts harder to resolve
- **B.** They automatically generate accessible names
- **C.** They stop CSS from loading
- **D.** They make every rule local to a component

**Answer: A.** A long selector can depend on incidental DOM structure and be difficult to override cleanly.

### 19. Which style value should generally come from stable data identity instead of <code>useId</code>?

- **A.** A React list key
- **B.** An input’s label relationship
- **C.** An error message description id
- **D.** An input’s help text id

**Answer: A.** Use stable item identity for list keys. <code>useId</code> is intended for accessibility relationships.

### 20. What is the purpose of a clear keyboard focus style?

- **A.** It shows which interactive control currently receives keyboard input
- **B.** It hides the focused element
- **C.** It prevents pointer use
- **D.** It replaces visible labels

**Answer: A.** A visible focus indicator helps keyboard users track their position in an interface.

## Short-answer questions

### 21. What kinds of values are good candidates for shared CSS custom properties?

**Answer:** Repeated design decisions such as semantic colors, spacing steps, content widths, radii, and shadows. Avoid creating a token for every unrelated one-off number.

### 22. How do Grid and Flexbox differ at a high level?

**Answer:** Grid is useful for two-dimensional row-and-column layouts. Flexbox is useful for arranging items along a primary row or column, including wrapping and alignment.

### 23. What is intrinsic sizing, and why can it help responsiveness?

**Answer:** Intrinsic sizing lets a layout use content size and available space, for example with <code>minmax()</code> and flexible tracks. It can adapt without requiring a breakpoint for every width.

### 24. When should a component use a container query instead of a viewport media query?

**Answer:** When its layout should respond to the size of its own container, such as a card that can appear in a main column, sidebar, or modal.

### 25. Why should an interface avoid unnecessary fixed widths?

**Answer:** Fixed widths can overflow at narrow viewports, high zoom, or with longer translated text. Flexible constraints let content wrap and fit the available space.

### 26. What is one advantage of CSS Modules in a component-oriented project?

**Answer:** In a compatible build system, they scope class names to a stylesheet module and reduce accidental global name collisions.

### 27. Why are inline styles not a complete replacement for CSS files?

**Answer:** Inline styles do not express media queries, pseudo-classes, or full reusable cascade behavior. They are best for genuinely data-driven values.

### 28. What should a reduced-motion stylesheet do?

**Answer:** Reduce or remove non-essential animation and transitions when the user has requested reduced motion, while preserving the information those effects might have conveyed.

### 29. Why should you remove obsolete overrides instead of continually adding stronger selectors?

**Answer:** Stacked overrides create an increasingly complex cascade. Removing stale rules makes ownership and the effective style easier to understand.

### 30. Name four viewport or content conditions to review before shipping a responsive interface.

**Answer:** Narrow and wide viewports, browser zoom, longer text, and keyboard focus are useful checks. Also review text resizing, translated content, and reduced-motion preferences.

## Applied scenarios

### 31. A card appears in a wide dashboard column and in a narrow sidebar. A viewport media query makes the card’s text layout wrong in the sidebar. What should change?

**Answer:** Make the card respond to its own available width with a container query. Keep a sensible default layout and establish a named size container on the card.

### 32. The course grid overflows at a width between two hard-coded breakpoints. How could it adapt more naturally?

**Answer:** Use a fluid Grid definition such as <code>repeat(auto-fit, minmax(min(100%, 17rem), 1fr))</code>. Add a media query only if the content still requires a structural change.

### 33. A heading uses <code>width: 1100px</code> and creates horizontal scrolling at 200% zoom. What should be reconsidered?

**Answer:** Replace the fixed width with a flexible width and a maximum, such as a centered container constrained by <code>min(100% - 2rem, 72rem)</code>. Test with zoom and longer text.

### 34. A button’s disabled state is styled by adding a global rule for every disabled element. The design becomes inconsistent across components. How can ownership improve?

**Answer:** Keep the state rule with the component or its shared button style. Use semantic variables and component classes rather than a broad global selector that changes unrelated controls.

### 35. A stylesheet has selectors such as <code>.page .content main .card h2 span</code> and developers keep adding <code>!important</code>. What should be done?

**Answer:** Simplify the selectors around component or purpose classes, remove stale overrides, and make ownership clear. Review the cascade before adding more specificity or importance.

### 36. A React component renders <code>class="card"</code> and no style is applied as expected. What JSX change is needed?

**Answer:** Use <code>className="card"</code>. React uses <code>className</code> in JSX for the DOM class attribute.

### 37. A course card shows progress from a value returned by the API. Should every card receive a different generated CSS class?

**Answer:** No. Keep shared visual rules in CSS and pass the progress value as a dynamic style value, custom property, or semantic progress element. Validate the value range and expose progress accessibly.

### 38. An animation slides a panel into view. A user’s system requests reduced motion, but the animation continues. What should change?

**Answer:** Respect <code>prefers-reduced-motion: reduce</code> and remove or shorten non-essential motion. Ensure the panel’s open state remains understandable without the animation.

### 39. A mobile navigation works at 390px but overflows at 320px because buttons have fixed widths. What is a good first response?

**Answer:** Let controls and text wrap or grow fluidly, reduce unnecessary fixed dimensions, and inspect the content at widths where it fails. Choose a breakpoint only if the layout needs a structural change.

### 40. A project adds a <code>tokens</code> cascade layer to one new file, while most existing styles remain unlayered. A token override unexpectedly loses. What should the team do?

**Answer:** Understand the cascade-layer precedence across the entire project before mixing layered and unlayered styles. Establish a consistent layer order and migrate intentionally, or keep the current architecture until a coherent migration is planned.

## Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [080 - Accessible forms, navigation, and components](../lessons/080-accessible-forms-navigation-and-components.md) | [Lesson](../lessons/081-css-styling-and-responsive-interface-architecture.md) | [Example](../examples/081-css-styling-and-responsive-interface-architecture.md) | [082 - Component tests with React](../lessons/082-component-tests-with-react.md) |