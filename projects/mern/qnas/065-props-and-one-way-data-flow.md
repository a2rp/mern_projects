# 065 - Props and one-way data flow: Q&A

## Multiple-choice questions

### 1. What are props in React?

A. Inputs passed to a component by its parent.

B. A database collection format.

C. A CSS-only feature.

D. A way to start the Node.js server.

**Answer: A.** Props configure a child with values and behavior supplied by its parent.

### 2. How does a function component receive its props?

A. As one object argument, often destructured in the parameter list.

B. As separate positional arguments supplied by React.

C. Through a global variable named <code>props</code>.

D. From the DOM after the component renders.

**Answer: A.** React calls a component with a props object; destructuring is a convenient way to read its fields.

### 3. Which JSX passes a variable named <code>course</code> to the child?

A. <code>&lt;CourseCard course /&gt;</code>

B. <code>&lt;CourseCard course={course} /&gt;</code>

C. <code>&lt;CourseCard "course" /&gt;</code>

D. <code>&lt;CourseCard {course} /&gt;</code>

**Answer: B.** Braces evaluate a JavaScript expression, and the attribute name becomes the prop name.

### 4. Which value can be passed through a prop?

A. Only strings.

B. Strings, numbers, booleans, objects, arrays, functions, and JSX values.

C. Only DOM nodes.

D. Only data fetched from MongoDB.

**Answer: B.** Props can carry JavaScript values suitable for the component.

### 5. Which direction do props normally flow?

A. From child to parent automatically.

B. From parent to child.

C. From CSS to JavaScript.

D. Directly between unrelated components without an owner.

**Answer: B.** The parent passes values down to its children.

### 6. What should a child do if it needs the parent to change a value?

A. Mutate the parent's variable directly.

B. Call a callback function supplied as a prop.

C. Change its own copy of the parent's object.

D. Put the value in a DOM attribute and read it later.

**Answer: B.** A callback communicates an event or intent to the owner, which can decide how to update the value.

### 7. What is wrong with assigning to a prop?

A. Props are read-only inputs; changing them breaks ownership and data-flow expectations.

B. React props can only contain strings.

C. JSX forbids all assignment statements.

D. Props are deleted after every render.

**Answer: A.** A component should not mutate the inputs it receives.

### 8. A child receives an object prop. Which action also violates the read-only rule?

A. Reading a field from the object.

B. Deriving a formatted string from a field.

C. Mutating a nested field on the received object.

D. Rendering a field in a heading.

**Answer: C.** Nested objects passed as props are still input data and must not be mutated.

### 9. When is lifting state up useful?

A. When sibling components need to coordinate around the same changing value.

B. Whenever a component receives any string.

C. To move all app state into one global component.

D. To avoid passing props at all.

**Answer: A.** Put shared state in a common parent and pass the needed values and callbacks down.

### 10. What does “single source of truth” mean for a piece of shared state?

A. One component owns that value; other components use values it passes to them.

B. The entire app stores all data in one file.

C. Every component keeps its own synchronized copy.

D. The database is the only place state can live.

**Answer: A.** One owner avoids conflicting copies; different pieces of state can have different owners.

### 11. What is a controlled component?

A. A component whose important value or behavior is driven through props.

B. A component that cannot receive callbacks.

C. A component with no parent.

D. A component that directly mutates props.

**Answer: A.** Its parent can determine its displayed value or behavior through inputs.

### 12. Which pair is typical for a controlled selection input?

A. <code>value</code> and a callback such as <code>onValueChange</code>.

B. <code>key</code> and <code>ref</code> only.

C. <code>className</code> and <code>id</code> only.

D. <code>children</code> and <code>defaultValue</code> in all cases.

**Answer: A.** The current value flows down and the callback communicates the user's choice to the owner.

### 13. When does a destructured default value apply?

A. When the prop is missing or is <code>undefined</code>.

B. When the prop is any falsy value.

C. When the prop is <code>null</code> only.

D. On every render regardless of the passed value.

**Answer: A.** A parameter default does not replace an explicit <code>null</code>, <code>false</code>, or <code>0</code>.

### 14. What is a drawback of copying a prop into state without a specific need?

A. It creates two values that can drift out of sync.

B. It prevents the parent from rendering.

C. It automatically changes the prop.

D. It eliminates the need for callbacks.

**Answer: A.** Use the prop directly or derive a value during rendering unless an independent editable snapshot is intentional.

### 15. When is a calculated value usually best derived during rendering?

A. When it can be calculated from current props and does not need independent state.

B. When the data is secret.

C. Only when it is a string.

D. Never; every calculation belongs in state.

**Answer: A.** Avoiding redundant stored values keeps the data model simpler.

### 16. When is JSX spread syntax for forwarding props most appropriate?

A. When the wrapper intentionally forwards the same clear interface without needing to interpret it.

B. In every component so no prop names need to be known.

C. To forward arbitrary component-only props onto DOM tags.

D. To bypass one-way data flow.

**Answer: A.** Spread syntax can be concise, but broad forwarding can obscure a component's contract.

### 17. What can happen when a component repeatedly forwards every prop through many wrappers?

A. The interface becomes harder to understand and component boundaries may be unclear.

B. React stops rendering children.

C. All props become immutable strings.

D. The server loses its database connection.

**Answer: A.** Explicit interfaces or composition can make ownership and data needs clearer.

### 18. Where should private database credentials be used in a MERN app?

A. In client-side props so React can query MongoDB.

B. On the server, with the browser communicating through an API.

C. In a public HTML data attribute.

D. Inside a button callback shipped to the browser.

**Answer: B.** Browser code is public to users; protected database access stays server-side.

### 19. A child receives an <code>onSave</code> function but never invokes it. What happens?

A. Passing the callback alone does not run it.

B. React invokes it automatically on every render.

C. The function becomes local state.

D. The parent is notified automatically.

**Answer: A.** A child must call the callback, usually in response to an event.

### 20. What is a useful purpose of a well-named prop such as <code>onLessonSelect</code>?

A. It makes the component interface and callback purpose easier to understand.

B. It runs the callback during import.

C. It makes the function private.

D. It changes one-way data flow into two-way binding.

**Answer: A.** Specific names clarify the event or intent the callback represents.

## Short-answer questions

### 21. Show the basic syntax for reading a <code>title</code> prop in a function component.

**Answer:** For example: <code>function Heading({ title }) { return &lt;h1&gt;{title}&lt;/h1&gt;; }</code>. The function receives a props object and destructures its <code>title</code> field.

### 22. What is the difference between <code>title="Course"</code> and <code>title={courseTitle}</code> in JSX?

**Answer:** The first passes the literal string <code>Course</code>; the second evaluates the JavaScript variable <code>courseTitle</code> and passes its value.

### 23. Why are props described as read-only?

**Answer:** They are inputs owned by the parent or another data owner. A child should render from them, not mutate the values it was given.

### 24. How does a callback prop fit into one-way data flow?

**Answer:** The parent passes the function down as a prop. The child invokes it to report an event or intent; the owner decides what to do and may render again with updated props.

### 25. What does lifting state up mean?

**Answer:** Move shared changing data from sibling children into their closest common parent, then pass the needed value and callbacks down.

### 26. Does “single source of truth” mean every piece of application state belongs in the root component?

**Answer:** No. Each particular shared value should have one appropriate owner; separate values can be owned by different components near where they are needed.

### 27. Explain controlled and uncontrolled components briefly.

**Answer:** A controlled component has important values or behavior driven through props. An uncontrolled component manages that information internally. A component can combine both patterns for different concerns.

### 28. How does a destructuring default behave when the caller passes <code>null</code>?

**Answer:** The default is not used. It applies when the property is omitted or is <code>undefined</code>; an explicit <code>null</code> remains <code>null</code>.

### 29. Why is derived data often better calculated during render than copied to state?

**Answer:** It avoids maintaining duplicate values and the synchronization rules they would require. The derived result reflects the current props.

### 30. Name one risk of forwarding every prop through JSX spread syntax.

**Answer:** It can hide which inputs a component accepts or leak component-only props to a DOM element.

## Application questions

### 31. A child component does <code>props.course.title = "New title"</code>. How should this be redesigned?

**Answer:** Keep the prop unchanged. If the child needs to request a title change, call a callback such as <code>onTitleChange(newTitle)</code>; the data owner creates the updated course value and passes it down.

### 32. A page heading and a list of course cards must always use the same selected course. Where should the selected course live?

**Answer:** In their closest common parent. Pass the selected course or ID to both children so they render from the same authoritative value.

### 33. A <code>LessonFilter</code> receives <code>value="all"</code> and <code>onValueChange</code>. What should it do when the user chooses “Complete”?

**Answer:** Call <code>onValueChange</code> with the chosen value. Its owner decides whether to update the selection, then passes the current value back through <code>value</code>.

### 34. A child has copied <code>props.lesson</code> into state just to display its title. What should change?

**Answer:** Render <code>lesson.title</code> from the prop directly. Copying it creates redundant state that can become stale when the parent supplies a different lesson.

### 35. A card's <code>size</code> should default to 120 only when omitted. Write the function signature.

**Answer:** Use <code>function Card({ size = 120 }) { ... }</code>. An explicit <code>size={0}</code> or <code>size={null}</code> does not use the default.

### 36. A component receives a callback called <code>fn</code> whose purpose is to notify the parent that a course was selected. Improve the interface.

**Answer:** Rename it to a specific callback prop such as <code>onCourseSelect</code>. If useful, invoke it with the selected course ID or object.

### 37. A nested child must ask the parent to save a form. Should it import and mutate the parent's state variable?

**Answer:** No. The owner should pass a callback such as <code>onSave(formData)</code> down. The child invokes the callback and the owner handles the request.

### 38. A card wrapper passes all props to a <code>div</code>, including <code>isSelected</code>, a component-only flag. What should be improved?

**Answer:** Destructure and use component-only values inside the wrapper, and forward only DOM-appropriate attributes. Do not blindly spread the whole component interface onto a DOM element.

### 39. Two sibling tabs each store their own copy of the selected tab and sometimes disagree. How should they coordinate?

**Answer:** Lift the selected-tab value to their common parent. Pass the active value and a selection callback to both tabs.

### 40. A component receives <code>items</code> and displays “5 items” plus a list. Should it store the item count in separate state?

**Answer:** Usually no. Calculate <code>items.length</code> from the current prop during render so the count and list cannot drift apart.

## Chapter navigation

| Previous chapter | Lesson | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [064 - Components and composition](../lessons/064-components-and-composition.md) | [Lesson](../lessons/065-props-and-one-way-data-flow.md) | [Example](../examples/065-props-and-one-way-data-flow.md) | [066 - Events and state updates](../lessons/066-events-and-state-updates.md) |
