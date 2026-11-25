# 063 - JSX and rendering values: Q&A

This chapter review contains 40 questions: 20 multiple-choice questions, 10 short-answer questions, and 10 application questions. Answers and explanations are included for self-study.

## Multiple-choice questions

### 1. What is JSX?

- A. A JavaScript syntax extension commonly used to describe React UI.
- B. A string format that the browser parses as HTML without transformation.
- C. A database query language.
- D. A CSS preprocessor.

**Answer: A.** JSX is HTML-like JavaScript syntax that a build tool transforms for use in an application.

### 2. What must a component return when it needs to display adjacent JSX elements?

- A. A single enclosing element or a fragment.
- B. A comma between each element.
- C. An HTML string.
- D. A JavaScript object as the child.

**Answer: A.** JSX expressions need one enclosing root; a fragment groups siblings without adding an extra DOM element.

### 3. Which JSX attribute is used for a CSS class?

- A. `class`
- B. `className`
- C. `cssClassName`
- D. `styleClass`

**Answer: B.** React DOM JSX uses `className` for the DOM class property.

### 4. Which JSX attribute connects a label to a form control?

- A. `for`
- B. `htmlFor`
- C. `labelFor`
- D. `controlId`

**Answer: B.** JSX uses `htmlFor` for the label's HTML `for` association.

### 5. How should a JavaScript variable be inserted into JSX text?

- A. `<h1>name</h1>`
- B. `<h1>{name}</h1>`
- C. `<h1>"{name}"</h1>`
- D. `<h1>$name</h1>`

**Answer: B.** Curly braces open a JavaScript expression inside JSX.

### 6. Which is a literal string attribute value?

- A. `src={imageUrl}`
- B. `src="image.png"`
- C. `src={image.url}`
- D. `src={getImage()}`

**Answer: B.** Quoted attribute text is a literal string; braces evaluate a JavaScript expression.

### 7. Which is the correct way to provide a dynamic image source?

- A. `src="imageUrl"`
- B. `src={imageUrl}`
- C. `src={{imageUrl}}`
- D. `src:[imageUrl]`

**Answer: B.** Put the variable expression in braces without quotes.

### 8. What happens to `null` rendered as a JSX child?

- A. It displays the word "null".
- B. It creates no visible text or element.
- C. It causes every component to unmount.
- D. It becomes an empty paragraph automatically.

**Answer: B.** Null, undefined, and booleans are empty React nodes and do not display visible text.

### 9. Which value is visibly rendered by React when included as a child?

- A. `false`
- B. `undefined`
- C. The number `0`
- D. A plain JavaScript object.

**Answer: C.** Numbers, including zero, render as text. False and undefined are empty, while a plain object is not a valid child.

### 10. What is a common issue with `{count && <Badge />}` when count is zero?

- A. It always displays the badge twice.
- B. It can render the number `0`.
- C. It changes count to true.
- D. It automatically hides the entire parent.

**Answer: B.** The `&&` expression evaluates to its left side when that value is falsy; numeric zero may appear as text.

### 11. What is a clear fix when a badge should appear only for a positive count?

- A. `{count > 0 && <Badge />}`
- B. `{count && 0}`
- C. `{count || <Badge />}`
- D. `{count = 1 && <Badge />}`

**Answer: A.** The comparison produces a boolean, so zero does not become a rendered child.

### 12. What should a list element's `key` represent?

- A. A stable identity for that item among its siblings.
- B. A random value generated on each render.
- C. The text color.
- D. A globally unique value across all applications.

**Answer: A.** A stable key helps React match an item as a list changes; uniqueness is required among siblings.

### 13. Why can an array index be a poor list key?

- A. It may cause items to be matched incorrectly after insertions, removals, or reordering.
- B. Indexes are not valid JavaScript numbers.
- C. It prevents JSX from compiling.
- D. It makes all strings disappear.

**Answer: A.** Position-based keys can associate an existing component with a different data item after the order changes.

### 14. What must a block-bodied arrow callback in `map()` do to return JSX?

- A. Include an explicit `return`.
- B. Use `break`.
- C. Add `await`.
- D. Declare a CSS class.

**Answer: A.** Braces create a function block, so the callback must explicitly return the element.

### 15. What is the correct way to pass an inline style object in JSX?

- A. `style="fontWeight: 700"`
- B. `style={{ fontWeight: 700 }}`
- C. `style={font-weight: 700}`
- D. `css={{ font-weight: 700 }}`

**Answer: B.** The outer braces begin the JSX expression and the inner braces create a JavaScript object.

### 16. Which is a correct JSX comment inside returned markup?

- A. `<!-- note -->`
- B. `// note`
- C. `{/* note */}`
- D. `<comment>note</comment>`

**Answer: C.** A JSX comment is written inside an expression using the JavaScript block-comment syntax.

### 17. How does React normally render a string child such as `userText`?

- A. As text, rather than interpreting it as an HTML markup string.
- B. Always as executable JavaScript.
- C. By parsing it as a CSS file.
- D. By sending it to MongoDB.

**Answer: A.** A normal string child is text. Raw HTML insertion is a separate, security-sensitive API.

### 18. What is the main risk of using `dangerouslySetInnerHTML` with untrusted markup?

- A. It may create a cross-site scripting vulnerability.
- B. It disables every component.
- C. It encrypts the page.
- D. It makes the text inaccessible to the browser.

**Answer: A.** Untrusted raw HTML can execute attacker-controlled markup or scripts if not safely sanitized.

### 19. Can a JavaScript `if` statement be placed directly inside JSX braces?

- A. Yes, all statements are valid JSX expressions.
- B. No; use branching before the return or an expression such as a ternary.
- C. Only when the page has one root.
- D. Only inside a CSS attribute.

**Answer: B.** JSX braces accept JavaScript expressions, not statement blocks such as an `if` statement.

### 20. Which statement about JSX and React is accurate?

- A. JSX and React are separate concepts, though they are often used together.
- B. JSX is the database layer of React.
- C. React cannot work with any syntax other than JSX.
- D. JSX is a browser-only HTML tag.

**Answer: A.** JSX is syntax; React is a library. JSX is common but not the only way to describe UI.

## Short-answer questions

### 21. Why does JSX require a single root element?

**Answer:** A JSX return expression needs one enclosing value. A wrapper element or fragment groups multiple sibling elements into that one return value.

### 22. What is the purpose of curly braces inside JSX?

**Answer:** They open a JavaScript expression context so a component can insert variables, calculations, property values, function results, or other expressions.

### 23. Explain the difference between `src="imageUrl"` and `src={imageUrl}`.

**Answer:** The first passes the literal text `imageUrl`; the second evaluates the JavaScript variable and passes its value.

### 24. Name four values that do not produce visible text when rendered directly as children.

**Answer:** `null`, `undefined`, `true`, and `false` are empty children. (Any four mentions of these empty values are sufficient.)

### 25. Why can a plain object not be rendered as a React child?

**Answer:** A plain object is not a displayable React node. Render a specific property, map an array to elements, or pass the object to a component that renders its fields.

### 26. What is the difference between a ternary and logical AND for conditional rendering?

**Answer:** A ternary chooses between two expressions. Logical AND includes the right-side expression when the condition is truthy and otherwise returns the left-side value; be careful with numeric zero.

### 27. What makes a key stable?

**Answer:** Its value remains tied to the same data item across renders, such as a persistent product ID, instead of changing with position or being regenerated each render.

### 28. Why must a block-bodied `map()` callback explicitly return JSX?

**Answer:** The braces create a function body. Without a `return`, the callback returns undefined rather than the JSX element.

### 29. Why is `dangerouslySetInnerHTML` security-sensitive?

**Answer:** It inserts raw markup into the DOM. If untrusted or improperly sanitized content is used, it can enable cross-site scripting.

### 30. What is one limit of normal string rendering as a security measure?

**Answer:** It displays a string as text rather than parsing it as markup, but it does not validate every security-sensitive URL or attribute value. Those require their own checks.

## Application questions

### 31. A component returns an `h1` followed by a `p` as adjacent top-level JSX. How can it be fixed without adding a DOM wrapper?

**Answer:** Wrap the siblings in a fragment: `<><h1>...</h1><p>...</p></>`.

### 32. An image displays a broken source because the component uses `src="product.imageUrl"`. What should change?

**Answer:** Use `src={product.imageUrl}` so JSX evaluates the property rather than passing the literal text.

### 33. An inventory badge displays `0` when there are no items. The code uses `{stock && <Badge />}`. How can it be fixed?

**Answer:** Use a boolean condition, such as `{stock > 0 && <Badge />}`, or a ternary that explicitly returns null when stock is zero.

### 34. A list renders but React warns about missing keys. Each record has an immutable `id`. What should change?

**Answer:** Add `key={record.id}` to the element returned for each record, ensuring the key is stable and unique among that list's siblings.

### 35. An array can be reordered, but its `map()` callback uses the array index as the key. What should the developer do?

**Answer:** Use a stable identifier from each item. An index can make React reuse an element for a different item after reordering.

### 36. This callback renders nothing: `items.map(item => { <li key={item.id}>{item.name}</li> })`. Why?

**Answer:** The arrow function has a block body and no return statement. Add `return` or use an expression body with parentheses.

### 37. A developer expects `<p>{product}</p>` to show an object. How should it be corrected?

**Answer:** Render a display property such as `<p>{product.name}</p>`, or pass the product to a component that renders its fields.

### 38. The component needs to show either an error message or a success message. Which rendering pattern is suitable?

**Answer:** Use a clear ternary for a small either/or choice, or use an `if` branch before the return when the states need more logic or markup.

### 39. A comment written as `<!-- explanation -->` appears as invalid syntax in returned JSX. What syntax should be used?

**Answer:** Use a JSX expression comment: `{/* explanation */}`.

### 40. An app displays user-authored HTML by passing a raw string to `dangerouslySetInnerHTML`. What should the team do?

**Answer:** Prefer rendering the content as ordinary text or structured React elements. If raw HTML is a real requirement, use a reviewed sanitization process and treat the insertion as security-sensitive.

## Chapter navigation

| Previous chapter | Lesson | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [062 - Create a React app with modern tooling](../lessons/062-create-a-react-app-with-modern-tooling.md) | [Lesson](../lessons/063-jsx-and-rendering-values.md) | [Example](../examples/063-jsx-and-rendering-values.md) | [064 - Components and composition](../lessons/064-components-and-composition.md) |
