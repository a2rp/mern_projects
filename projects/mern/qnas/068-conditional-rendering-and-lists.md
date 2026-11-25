# 068 - Conditional rendering and lists: Q&A

## Multiple-choice questions

### 1. Which JavaScript constructs can choose what JSX a component renders?

A. <code>if</code>, ternary expressions, and logical <code>&amp;&amp;</code>.

B. Only CSS selectors.

C. Only <code>switch</code> statements outside components.

D. Database queries inside JSX.

**Answer: A.** React rendering uses ordinary JavaScript control flow and expressions.

### 2. When is an early return with <code>if</code> especially clear?

A. When the whole component should show a distinct loading, error, or empty state.

B. When rendering a fixed word.

C. Only when mapping an array.

D. When adding a CSS declaration.

**Answer: A.** Early returns make separate page states explicit.

### 3. What is a ternary operator best suited for?

A. A small either-or choice.

B. A large nested decision tree.

C. Mutating an array during rendering.

D. Defining a React key.

**Answer: A.** Ternaries are clear for one short condition; complex branching is easier with statements or named variables.

### 4. What can <code>{count &amp;&amp; &lt;p&gt;New messages&lt;/p&gt;}</code> render when <code>count</code> is zero?

A. Nothing.

B. The number zero.

C. The word false.

D. An error in every case.

**Answer: B.** JavaScript returns the falsy left operand, zero, and React displays numeric zero.

### 5. Which expression avoids rendering zero for a message count?

A. <code>count &amp;&amp; &lt;p&gt;New messages&lt;/p&gt;</code>

B. <code>count &gt; 0 &amp;&amp; &lt;p&gt;New messages&lt;/p&gt;</code>

C. <code>count || &lt;p&gt;New messages&lt;/p&gt;</code>

D. <code>count = 0 &amp;&amp; &lt;p&gt;New messages&lt;/p&gt;</code>

**Answer: B.** The comparison produces a boolean condition before the optional JSX.

### 6. What does returning <code>null</code> from a component mean?

A. It renders no visible content for that component.

B. It renders the text "null".

C. It deletes the parent component.

D. It resets all state in the application.

**Answer: A.** React treats null as an empty place in the rendered tree.

### 7. Which array method is commonly used to create one JSX element per data item?

A. <code>map()</code>.

B. <code>push()</code>.

C. <code>splice()</code>.

D. <code>pop()</code>.

**Answer: A.** Map transforms each array item into a corresponding JSX element.

### 8. What must a block-bodied <code>map()</code> callback do to produce JSX?

A. Explicitly return the JSX.

B. Declare a class.

C. Call <code>preventDefault()</code>.

D. Return the array index only.

**Answer: A.** A callback with braces does not return implicitly.

### 9. Why does React need a stable key on each mapped sibling?

A. To match items across renders when list contents or order change.

B. To set the element's CSS class.

C. To make an array immutable.

D. To pass an ID automatically to component props.

**Answer: A.** Keys help React preserve each item's identity.

### 10. Which is usually the best key for a list that can change?

A. A stable unique ID from the item's data.

B. The current time at render.

C. A random value generated during render.

D. The visible row number.

**Answer: A.** A stable ID continues identifying the same item after insertion, removal, or reordering.

### 11. When might using an array index as a key be acceptable?

A. For a static list that will never be reordered, filtered, inserted into, or removed from.

B. For every list from a database.

C. Whenever items have local component state.

D. Whenever a random key is unavailable.

**Answer: A.** Index keys are risky when item positions can shift.

### 12. Is <code>key</code> available inside a component as an ordinary prop?

A. Yes, as <code>props.key</code>.

B. No; pass the ID separately if the component needs it.

C. Only if the key is numeric.

D. Only in development.

**Answer: B.** React uses key for reconciliation and does not forward it as a normal prop.

### 13. Where should the key be placed when a map returns a <code>LessonRow</code> component?

A. On the returned <code>LessonRow</code> element.

B. Only on the surrounding <code>ul</code>.

C. On the data object in the source array.

D. On the parent component that calls map.

**Answer: A.** The key belongs on the element directly returned for each mapped sibling.

### 14. How can several sibling elements for one mapped item be grouped without adding a DOM wrapper?

A. Use <code>Fragment</code> with a key.

B. Use an unkeyed short fragment in every case.

C. Put the key on the array itself.

D. Use <code>document.createElement</code>.

**Answer: A.** The explicit Fragment component accepts a key and does not add a DOM element.

### 15. What is a common way to display only items that match a category?

A. Filter the data, then map the filtered array.

B. Mutate the source array with <code>splice()</code> during render.

C. Render the entire source and hide items with random keys.

D. Store both arrays as separately synchronized state.

**Answer: A.** Filtering chooses data to render; mapping turns each chosen item into JSX.

### 16. What should a UI often display when a filtered list is empty?

A. A clear message that no items match.

B. The number zero from a careless <code>&amp;&amp;</code> expression.

C. An unrelated list.

D. A React key warning.

**Answer: A.** An explicit empty state explains the result to the user.

### 17. Which order is a reasonable pattern for a data screen's branches?

A. Loading, error, empty, then results.

B. Results, results, loading, error.

C. Empty only, regardless of status.

D. Random order on every render.

**Answer: A.** Explicitly ordered states make the screen's behavior understandable.

### 18. Which HTML structure is semantic for a list of lessons?

A. <code>&lt;ul&gt;</code> containing <code>&lt;li&gt;</code> elements.

B. <code>&lt;li&gt;</code> elements without a list parent.

C. <code>&lt;title&gt;</code> containing buttons.

D. A <code>&lt;dl&gt;</code> for every unordered collection.

**Answer: A.** Use an unordered or ordered list as the parent for its list items.

### 19. If an item's content is filtered out and later becomes visible again, what should its key be based on?

A. Its stable item identity, which remains unchanged.

B. Its new position in the filtered list.

C. A random number.

D. The count of visible items.

**Answer: A.** A data-based key represents the item independently of its current position.

### 20. What does the expression <code>false &amp;&amp; &lt;span&gt;Done&lt;/span&gt;</code> render?

A. The span.

B. Nothing visible.

C. The word false.

D. The number zero.

**Answer: B.** React treats false as an empty hole in JSX.

## Short-answer questions

### 21. Explain how an early return helps with conditional rendering.

**Answer:** It lets a component return a complete alternative UI for a condition, such as loading or error, before reaching the main success markup.

### 22. When should you prefer an <code>if</code> statement to a ternary inside JSX?

**Answer:** When the logic is complex, contains several branches, or a ternary would be nested and hard to read.

### 23. Why can <code>items.length &amp;&amp; &lt;List /&gt;</code> display an unexpected value?

**Answer:** An empty array has length zero, and JavaScript returns that numeric zero as the left operand of <code>&amp;&amp;</code>; React renders it.

### 24. What is a stable key?

**Answer:** A key that uniquely identifies the same item among its siblings and does not change as the item's position changes.

### 25. Why are random keys generated during rendering harmful?

**Answer:** They change every render, so React cannot match items across renders and may recreate components and lose their local input state.

### 26. What is the difference between a key and a normal prop?

**Answer:** A key is used by React to track sibling identity and is not passed to the component. A normal prop is available to the component.

### 27. How can a mapped component receive its identifier if the key is not forwarded?

**Answer:** Supply both, for example <code>&lt;LessonRow key={lesson.id} lessonId={lesson.id} /&gt;</code>.

### 28. What should a mapped callback with braces include?

**Answer:** An explicit <code>return</code> statement that returns the element for that item.

### 29. Why render an empty-state message after filtering?

**Answer:** It tells the user that the filter produced no matches instead of leaving an unexplained blank area.

### 30. When is a keyed Fragment useful?

**Answer:** When each array item should produce multiple sibling elements without adding a wrapper element to the DOM.

## Application questions

### 31. An unread count can be zero. Write a safe conditional expression for showing a message.

**Answer:** Use <code>unreadCount &gt; 0 &amp;&amp; &lt;p&gt;New messages&lt;/p&gt;</code> so the left side is boolean.

### 32. A list uses <code>items.map(item =&gt; { &lt;li&gt;{item.name}&lt;/li&gt; })</code> and nothing appears. What is missing?

**Answer:** The block-bodied callback needs an explicit <code>return</code>, or use an expression-bodied callback with parentheses.

### 33. A user can reorder lesson cards, but the keys are their array indexes. What should replace the index?

**Answer:** Use a stable unique field from the lesson data, such as <code>lesson.id</code>.

### 34. A card needs to render a title and paragraph for each item. The map returns a short fragment with no key. How should it be fixed?

**Answer:** Import <code>Fragment</code> and return <code>&lt;Fragment key={item.id}&gt;...&lt;/Fragment&gt;</code>, or use a meaningful wrapper with that key.

### 35. A mapped <code>LessonRow</code> needs to show its lesson ID but reads <code>props.key</code>. Correct the caller.

**Answer:** Pass the key for React and the ID separately: <code>&lt;LessonRow key={lesson.id} lessonId={lesson.id} /&gt;</code>.

### 36. A screen displays "0" above an empty list because it uses <code>visibleItems.length &amp;&amp; &lt;ul&gt;...</code>. Give a clearer approach.

**Answer:** Use an explicit branch: if length is zero, render a no-results message; otherwise render the list. Or compare with <code>visibleItems.length &gt; 0</code>.

### 37. A block-bodied <code>filter()</code> callback logs a decision but forgets to return a boolean. What is the result?

**Answer:** It returns <code>undefined</code> for each item, so no items pass the filter. Return the condition that determines whether each item should remain.

### 38. A data page can be loading, have an error, contain no items, or contain results. What branch sequence is clear?

**Answer:** Check loading first, then error, then the empty result, then render the successful list.

### 39. A filtered item is hidden and later shown again, but its row state resets because its key was its filtered position. What should change?

**Answer:** Use the item's stable ID as its key so its identity does not depend on the filtered position.

### 40. A developer renders lesson names inside <code>&lt;div&gt;</code> elements and wants them to be a semantic list. What structure should they use?

**Answer:** Put the mapped <code>&lt;li&gt;</code> elements inside a <code>&lt;ul&gt;</code> or <code>&lt;ol&gt;</code>, according to the list's meaning.

## Chapter navigation

| Previous chapter | Lesson | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [067 - useState and state design](../lessons/067-usestate-and-state-design.md) | [Lesson](../lessons/068-conditional-rendering-and-lists.md) | [Example](../examples/068-conditional-rendering-and-lists.md) | [069 - Forms and controlled inputs](../lessons/069-forms-and-controlled-inputs.md) |
