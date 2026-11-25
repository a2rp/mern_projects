# 066 - Events and state updates: Q&A

## Multiple-choice questions

### 1. What should be passed to JSX as an event handler?

A. A function React can call when the event occurs.

B. The result of calling the function during render.

C. A string containing the function name.

D. A state variable name.

**Answer: A.** Pass the function reference. React calls it in response to the event.

### 2. Which expression calls <code>handleSave</code> immediately during rendering?

A. <code>onClick={handleSave}</code>

B. <code>onClick={() =&gt; handleSave()}</code>

C. <code>onClick={handleSave()}</code>

D. <code>onClick={event =&gt; handleSave(event)}</code>

**Answer: C.** The parentheses execute the function while JSX is being evaluated.

### 3. How should a button call <code>handleOpen</code> with a lesson ID only after a click?

A. <code>onClick={handleOpen(lesson.id)}</code>

B. <code>onClick={() =&gt; handleOpen(lesson.id)}</code>

C. <code>onClick="handleOpen(lesson.id)"</code>

D. <code>onClick={lesson.id}</code>

**Answer: B.** The wrapper function delays the call until React invokes the handler.

### 4. Which event prop name follows React's JSX convention?

A. <code>onclick</code>

B. <code>OnClick</code>

C. <code>onClick</code>

D. <code>on-click</code>

**Answer: C.** React event props use camelCase.

### 5. Which event is appropriate for handling a form submission?

A. <code>onSubmit</code> on the form.

B. <code>onClick</code> on the page body only.

C. <code>onLoad</code> on the input.

D. <code>onHover</code> on the submit button.

**Answer: A.** Handling the form's submit event supports both button activation and keyboard submission.

### 6. What does <code>event.preventDefault()</code> do?

A. Stops the browser's default action for that event.

B. Stops the event from bubbling to ancestors.

C. Immediately updates React state.

D. Calls every parent handler.

**Answer: A.** Preventing the default action is separate from stopping propagation.

### 7. What does <code>event.stopPropagation()</code> do?

A. Prevents the event from reaching ancestor handlers.

B. Prevents a form's default navigation automatically.

C. Changes the event target to the parent.

D. Schedules a component render.

**Answer: A.** It stops propagation; it does not itself cancel the browser's default behavior.

### 8. What happens after a state setter is called?

A. The current state variable changes immediately in the running handler.

B. React is asked to render using the updated state.

C. The component function is permanently replaced.

D. The browser reloads the page.

**Answer: B.** The current handler retains its render snapshot; the new state is used in a later render.

### 9. A handler calls <code>setCount(count + 1)</code> and then logs <code>count</code>. Which value does the log read?

A. The value from the render that created the handler.

B. Always the incremented value.

C. The value from the next render.

D. The string <code>"pending"</code>.

**Answer: A.** A state variable is a snapshot within that render's handler.

### 10. When is a functional state updater useful?

A. When the next state is calculated from the pending previous state.

B. Only when setting a string.

C. Only when a component has no parent.

D. When a render should be prevented.

**Answer: A.** An updater receives the pending state and returns the next value.

### 11. What is the result of calling <code>setCount(count + 1)</code> three times in one handler when <code>count</code> is 0?

A. 3.

B. 1.

C. 0.

D. It always throws an error.

**Answer: B.** Each expression uses the same current snapshot and requests replacement with 1.

### 12. What is the result of calling <code>setCount(n =&gt; n + 1)</code> three times in one handler when <code>count</code> is 0?

A. 1.

B. 2.

C. 3.

D. 0.

**Answer: C.** React processes the updater functions in order using the pending result from the previous update.

### 13. What should a state updater function do?

A. Purely calculate and return the next state.

B. Make a network request.

C. Update another state variable as a side effect.

D. Mutate the previous state object.

**Answer: A.** Updaters should be pure calculations; put side effects in appropriate event handlers or effects.

### 14. How should an object in state usually be updated?

A. Mutate its field directly.

B. Create a new object with the changed field and preserve other fields.

C. Convert the object to a string.

D. Change a DOM attribute instead.

**Answer: B.** Return a new object, commonly by copying existing fields and replacing the one that changed.

### 15. How should an item usually be added to an array in state?

A. Call <code>push</code> on the existing state array.

B. Create a new array containing the previous items and the new item.

C. Change the array's length manually.

D. Add it directly to a rendered list element.

**Answer: B.** State arrays should be treated immutably and replaced with a new array.

### 16. For a controlled text input, which pair is typically needed?

A. <code>value</code> and <code>onChange</code> that updates the value's state.

B. <code>key</code> and <code>ref</code> only.

C. <code>defaultValue</code> and no event handling.

D. <code>checked</code> and <code>onSubmit</code> only.

**Answer: A.** The displayed value comes from state; the change handler updates that state.

### 17. Which property should a checkbox change handler read?

A. <code>event.target.value</code> only.

B. <code>event.target.checked</code>.

C. <code>event.currentTarget.href</code>.

D. <code>event.target.children</code>.

**Answer: B.** Checkbox state is represented by its checked boolean.

### 18. What does a controlled input look like if its handler never updates the state supplying <code>value</code>?

A. It appears locked at the rendered value.

B. It submits the form repeatedly.

C. React deletes the input.

D. The value becomes a callback.

**Answer: A.** React continues rendering the same state value.

### 19. Where should an API request caused by clicking “Save” usually be initiated?

A. Inside a state updater function.

B. In the event handler for the save action.

C. During every render.

D. Inside a render-time calculation.

**Answer: B.** The request is a side effect caused by a user action; an updater should remain a pure calculation.

### 20. In a bubbled event, what does <code>currentTarget</code> refer to?

A. The element whose handler is currently running.

B. Always the innermost element clicked.

C. The React root.

D. The last rendered state value.

**Answer: A.** <code>target</code> is where the event originated; <code>currentTarget</code> is the element with the active handler.

## Short-answer questions

### 21. Why should <code>onClick={handleDelete()}</code> usually be changed?

**Answer:** It invokes <code>handleDelete</code> during rendering. Pass <code>onClick={handleDelete}</code>, or use a wrapper such as <code>onClick={() =&gt; handleDelete(id)}</code> when arguments are needed.

### 22. What is the event object's <code>target</code>?

**Answer:** The element where the event originated, which may be a nested element inside the element whose handler is running.

### 23. What is the difference between preventing default and stopping propagation?

**Answer:** <code>preventDefault()</code> cancels the browser's default action. <code>stopPropagation()</code> prevents the event from continuing to ancestor handlers.

### 24. What does calling a state setter request?

**Answer:** It queues a state update and asks React to render the component again with the resulting state.

### 25. Why can a handler still read the old state after calling its setter?

**Answer:** The handler belongs to a particular render and sees that render's state snapshot. The updated value is supplied in a later render.

### 26. When should you use a functional updater such as <code>setCount(previous =&gt; previous + 1)</code>?

**Answer:** When the next value depends on the previous or pending state, especially if multiple updates may be queued.

### 27. Why must a state updater be pure?

**Answer:** React may process or re-run updater calculations as part of rendering behavior. Side effects inside an updater can happen unpredictably; it should only calculate and return the next state.

### 28. Show an immutable way to remove an item with a matching ID from a state array.

**Answer:** For example: <code>setItems(previousItems =&gt; previousItems.filter(item =&gt; item.id !== removedId))</code>. It creates a new array without mutating the existing one.

### 29. How does a controlled text field keep its display in sync with React?

**Answer:** It receives its current state through <code>value</code>; its <code>onChange</code> handler reads <code>event.target.value</code> and updates that state.

### 30. Why use <code>onSubmit</code> on a form instead of only a click handler on its button?

**Answer:** The form submit event also covers keyboard submission and other valid submit paths, so the form behavior has one handler.

## Application questions

### 31. A button logs “clicked” immediately on page load. Its JSX is <code>&lt;button onClick={handleClick()}&gt;Save&lt;/button&gt;</code>. Fix it.

**Answer:** Use <code>&lt;button onClick={handleClick}&gt;Save&lt;/button&gt;</code>. If arguments are needed, pass a wrapper function that calls the handler.

### 32. A form reloads the page when its React submit handler runs. What should the handler do if React owns the submission?

**Answer:** Accept the event and call <code>event.preventDefault()</code> before running the client-side submission logic.

### 33. A card click handler and a nested delete button's click handler both run when Delete is pressed. Name a targeted fix.

**Answer:** If the delete action should not also activate the card, call <code>event.stopPropagation()</code> in the delete handler. Keep default-action handling separate.

### 34. A counter starts at 0 and a handler calls <code>setCount(count + 1)</code> three times. The result is 1. How can it increment by three?

**Answer:** Use three functional updates such as <code>setCount(n =&gt; n + 1)</code>. React applies them to the pending values in sequence.

### 35. A handler sets <code>isSaved</code> to true and immediately reads <code>isSaved</code>, which is still false. Is the setter broken?

**Answer:** No. The handler reads the state snapshot from its render. The new value appears after React processes the update and renders again.

### 36. A developer uses <code>lessons.push(newLesson)</code> on an array in state and then calls its setter with that same array. What should they do instead?

**Answer:** Create a new array, such as <code>setLessons(previous =&gt; [...previous, newLesson])</code>, and pass that new value to the setter.

### 37. A checkbox handler stores <code>event.target.value</code> and the UI behaves incorrectly. What value should it normally store?

**Answer:** Read <code>event.target.checked</code>, which is the checkbox's boolean state.

### 38. A controlled input has <code>value={name}</code>, but typing does not change the field. What is the likely issue?

**Answer:** The <code>onChange</code> handler is missing or does not update <code>name</code>. React keeps rendering the same value until its owner supplies an updated one.

### 39. A request to delete a lesson is started inside <code>setLessons(previous =&gt; ...)</code>. Where should the request go?

**Answer:** Start the request in the delete event handler. Keep the updater pure and use its result only to calculate the next state array.

### 40. A submit button inside a form only changes a local tab and should not submit the form. What button type should it use?

**Answer:** Use <code>type="button"</code>. A button inside a form defaults to submit behavior unless a different type is specified.

## Chapter navigation

| Previous chapter | Lesson | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [065 - Props and one-way data flow](../lessons/065-props-and-one-way-data-flow.md) | [Lesson](../lessons/066-events-and-state-updates.md) | [Example](../examples/066-events-and-state-updates.md) | [067 - useState and state design](../lessons/067-usestate-and-state-design.md) |
