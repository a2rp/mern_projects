# 064 - Components and composition: Q&A

## Multiple-choice questions

### 1. What does a React component usually do?

A. It describes a part of the user interface.  
B. It stores application data in MongoDB.  
C. It starts the web server.  
D. It replaces JavaScript modules.

**Answer: A.** A component describes UI, commonly by returning JSX. Database access belongs on the server.

### 2. Which name can JSX use as a custom React component?

A. <code>lessonCard</code>  
B. <code>LessonCard</code>  
C. <code>lesson-card</code>  
D. <code>LESSON-CARD</code>

**Answer: B.** React component names begin with a capital letter. Lowercase JSX names are interpreted as built-in or custom HTML tags.

### 3. What is the usual way to render a component named <code>CourseHeader</code>?

A. <code>CourseHeader()</code>  
B. <code>&lt;CourseHeader /&gt;</code>  
C. <code>new CourseHeader()</code>  
D. <code>render CourseHeader</code>

**Answer: B.** Use the component in JSX and let React manage rendering.

### 4. What does composition mean in React UI development?

A. Combining smaller components to build a larger interface.  
B. Combining CSS files into one string at runtime.  
C. Inheriting every component from a shared page class.  
D. Writing all page markup in one component.

**Answer: A.** Composition assembles components and elements into larger UI.

### 5. What is the <code>children</code> prop for?

A. It contains content nested between a component's opening and closing tags.  
B. It lists the component's JavaScript source files.  
C. It stores all descendants as HTML strings.  
D. It is only available on DOM elements.

**Answer: A.** A component can render caller-provided nested content through <code>children</code>.

### 6. Which example demonstrates a named slot?

A. <code>&lt;Panel&gt;&lt;p&gt;Text&lt;/p&gt;&lt;/Panel&gt;</code>  
B. <code>&lt;Layout sidebar={&lt;Navigation /&gt;}&gt;Content&lt;/Layout&gt;</code>  
C. <code>function Layout() { return "Layout"; }</code>  
D. <code>&lt;div id="sidebar"&gt;</code>

**Answer: B.** The <code>sidebar</code> input names a specific content area; the children can provide another area.

### 7. Which is a good reason to extract a component?

A. Every HTML element must have its own component.  
B. The page has a meaningful section with its own responsibility.  
C. A component should always have a separate file, even if trivial.  
D. It makes every parent state-free automatically.

**Answer: B.** A clear UI responsibility is a useful boundary; extraction is not required for every wrapper.

### 8. Which is a common consequence of one giant page component?

A. It becomes easier to find every responsibility.  
B. Unrelated UI responsibilities become harder to scan and change.  
C. The browser stops downloading JavaScript.  
D. React no longer creates elements.

**Answer: B.** Splitting by meaningful responsibility can make a growing interface easier to navigate.

### 9. Which is an unhelpful component boundary?

A. A course navigation area used by several pages.  
B. A complex form with its own validation display.  
C. A component wrapping one plain <code>&lt;div&gt;</code> with no reusable or semantic purpose.  
D. A repeated lesson row.

**Answer: C.** Components should clarify responsibilities, not add indirection around every trivial element.

### 10. What is React's normal approach to UI reuse?

A. Component composition and reusable elements.  
B. Class inheritance for every shared visual behavior.  
C. Copying markup and editing each copy.  
D. Calling component functions directly.

**Answer: A.** React encourages composing components and passing inputs rather than relying on UI class inheritance.

### 11. A component is rendered from each item in a list. What should its element receive?

A. A stable <code>key</code>.  
B. A MongoDB password.  
C. A CSS selector string as its only input.  
D. A separate React root for every item.

**Answer: A.** Stable keys help React match list items when the list changes.

### 12. Is <code>key</code> passed to the component as a regular prop?

A. Yes, as <code>props.key</code>.  
B. No; it is a special React value.  
C. Only when the key is a string.  
D. Only in production builds.

**Answer: B.** Pass an identifier separately if the component needs to read it.

### 13. Which list key is generally safer when items can be reordered?

A. The item's stable database or data ID.  
B. The current array index.  
C. The current time.  
D. A random number generated during rendering.

**Answer: A.** Stable IDs preserve item identity across insertions, removals, and reordering.

### 14. A component needs the same ID used as its React key. What should the parent do?

A. Read it from <code>props.key</code>.  
B. Pass the ID as an ordinary prop in addition to using it as the key.  
C. Use the array index instead.  
D. Store the ID in a global variable.

**Answer: B.** The key is used by React; provide <code>lessonId</code> or another explicit prop for component logic.

### 15. Which export style suits a module that exposes a few related components?

A. Named exports.  
B. A CSS export only.  
C. No exports.  
D. A JSON export with JSX text.

**Answer: A.** Named exports allow multiple components to be imported by their exported names.

### 16. Which statement about a default export is correct?

A. It is commonly used for one primary export from a module.  
B. It requires importing with the exact same local variable name.  
C. It prevents the component from accepting props.  
D. It can only export CSS.

**Answer: A.** A default export represents the module's main export and can be imported under a chosen local name.

### 17. What is a useful role for a page-level component?

A. Arrange page sections and connect them to page-level data or actions.  
B. Run MongoDB queries from the browser.  
C. Store private server credentials in JSX.  
D. Replace all reusable components.

**Answer: A.** A page component can coordinate the page while smaller components handle their own UI responsibilities.

### 18. How should a browser component obtain protected database data?

A. Connect directly to MongoDB using credentials embedded in the component.  
B. Send an appropriate request to the application's server API.  
C. Read the database password from a public environment variable.  
D. Import the database collection into the React bundle.

**Answer: B.** The client communicates with the server; protected database access and secrets stay server-side.

### 19. A container must support a header, a sidebar, and main content. What is a clear design?

A. Provide explicit header and sidebar slots and use children for the main content.  
B. Search all descendants for specific text and rearrange them.  
C. Make the container import each page's private markup.  
D. Put all content in one string.

**Answer: A.** Explicit slots make the layout contract visible and let callers compose the page.

### 20. Why should a component generally avoid rewriting arbitrary nested children?

A. Nested content is caller-owned composition; explicit slots or a clearer interface are easier to reason about.  
B. React does not allow any children to be rendered.  
C. JSX cannot be passed as a value.  
D. It makes list keys optional.

**Answer: A.** Treat children as content to render; define explicit component inputs when particular regions or behavior are needed.

## Short-answer questions

### 21. What is a React component?

**Answer:** A JavaScript function (or, in some codebases, a class) that describes a piece of UI by returning React elements. Modern application components are commonly functions that return JSX.

### 22. Why should a component name start with a capital letter?

**Answer:** JSX uses capitalization to distinguish custom JavaScript components from lowercase built-in or custom HTML tags.

### 23. Explain composition in one sentence.

**Answer:** Composition is assembling smaller components and elements into a larger interface, with each piece responsible for a meaningful part.

### 24. What does a <code>Panel</code> gain by rendering <code>{children}</code>?

**Answer:** Callers can provide different nested content while <code>Panel</code> retains control of its shared outer structure and styling.

### 25. Give one reason to keep a component in the same file as its parent and one reason to move it.

**Answer:** Keep a small, tightly related component nearby while the file remains easy to read; move it when it has a meaningful reusable boundary or the file becomes difficult to navigate.

### 26. Why is an array index often a poor key for a changing list?

**Answer:** When items are inserted, removed, or reordered, an index can refer to a different item. A stable data ID better preserves the identity React should track.

### 27. How can a component receive an ID if its parent already uses that ID as the element's key?

**Answer:** Pass the ID twice for two different purposes: use it as <code>key</code> and pass it as an ordinary prop such as <code>lessonId</code>.

### 28. When might explicit named slots be clearer than only using <code>children</code>?

**Answer:** When a layout has distinct regions, such as a header and sidebar, named inputs make each region's purpose clear to callers.

### 29. Why should database queries stay out of browser components?

**Answer:** Browser code is delivered to users and cannot protect database credentials. The client should call the server API, which can validate requests and access the database securely.

### 30. What is one sign that a component has too many responsibilities?

**Answer:** It mixes unrelated concerns or offers many unrelated configuration options, making its implementation and caller hard to understand. Consider splitting responsibilities or clarifying its interface.

## Application questions

### 31. A page component contains the site header, course navigation, lesson list, and help panel in one long return statement. What is a sensible refactor?

**Answer:** Extract meaningful sections such as <code>SiteHeader</code>, <code>CourseNavigation</code>, <code>LessonList</code>, and <code>HelpPanel</code>, then let the page component show how those sections are arranged.

### 32. Several pages use the same bordered panel but each page supplies different content. How can this be composed?

**Answer:** Create a reusable <code>Panel</code> that renders its children inside the shared section, then put each page's specific content inside <code>&lt;Panel&gt;...&lt;/Panel&gt;</code>.

### 33. A layout always needs a header and a sidebar, while its central content changes per page. Propose a component interface.

**Answer:** Accept explicit <code>header</code> and <code>sidebar</code> slots and render <code>children</code> as the central content. This keeps the layout's three regions explicit.

### 34. A developer created a component for every <code>&lt;span&gt;</code> and <code>&lt;div&gt;</code>, each with no behavior or semantic meaning. What should they reconsider?

**Answer:** Remove boundaries that add indirection without clarifying purpose. Keep components for meaningful responsibilities, useful reuse, or markup complex enough to improve readability.

### 35. A lesson list uses <code>&lt;LessonRow key={lesson.id} /&gt;</code>, and <code>LessonRow</code> tries to display <code>props.key</code>. Fix it.

**Answer:** Pass the identifier separately: <code>&lt;LessonRow key={lesson.id} lessonId={lesson.id} /&gt;</code>. The <code>key</code> remains for React's list handling; <code>lessonId</code> is a normal prop.

### 36. A component's file has become difficult to navigate and its form section is reused on two pages. What should you do?

**Answer:** Extract the form section into its own module with a clear export, then import it from the pages that use it. Keep the import path and filename casing accurate.

### 37. A team has a class called <code>BaseCard</code>, and every card extends it only to share markup. What React-oriented approach should they consider?

**Answer:** Use a reusable card component and compose its content through children or explicit props. UI sharing is usually clearer through composition than inheritance.

### 38. A React component contains a MongoDB URI so it can query the course collection directly. How should the design change?

**Answer:** Remove the credential and database connection from client code. Have the component request course data from a server endpoint; the server validates the request and queries MongoDB.

### 39. A reusable page layout uses nested-child inspection to find a component with a certain type and move it to the sidebar. What is a clearer alternative?

**Answer:** Define an explicit <code>sidebar</code> slot and have the caller pass the navigation component there. Explicit regions are easier to understand than rewriting arbitrary children.

### 40. A page has repeated course cards, but each card's content is slightly different. How can reuse avoid duplicating the card structure?

**Answer:** Create a <code>CourseCard</code> with a clear interface, such as course data or children for variable content, and render one card per course with a stable key. Keep the shared structure inside the card.

## Chapter navigation

| Previous chapter | Lesson | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [063 - JSX and rendering values](../lessons/063-jsx-and-rendering-values.md) | [Lesson](../lessons/064-components-and-composition.md) | [Example](../examples/064-components-and-composition.md) | [065 - Props and one-way data flow](../lessons/065-props-and-one-way-data-flow.md) |

