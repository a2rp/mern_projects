# Chapter 069: Forms and controlled inputs — Q&A

This Q&A reviews how React forms capture, validate, and submit user input. The examples focus on React state and browser form behavior.

## Multiple-choice questions

### 1. What makes a text input controlled in React?

- **A.** Giving it an <code>id</code> attribute
- **B.** Giving it a <code>value</code> from React state and updating that state in <code>onChange</code>
- **C.** Placing it inside a <code>form</code>
- **D.** Adding a placeholder

**Answer: B.** React supplies the displayed value, and the change handler updates the state that supplies it.

### 2. What does <code>defaultValue</code> do on an input?

- **A.** Keeps the input synchronized with state after every keystroke
- **B.** Sets its initial value while leaving subsequent edits to the browser
- **C.** Submits the input automatically
- **D.** Makes the input read-only

**Answer: B.** <code>defaultValue</code> provides an initial value for an uncontrolled input. It does not keep the displayed value synchronized with changing React state.

### 3. Which prop controls whether a checkbox is selected?

- **A.** <code>value</code>
- **B.** <code>selected</code>
- **C.** <code>checked</code>
- **D.** <code>defaultValue</code>

**Answer: C.** A checkbox's selected state is represented by <code>checked</code>. The <code>value</code> prop instead describes the value submitted when it is checked.

### 4. In a checkbox change handler, which property gives the new checked state?

- **A.** <code>event.target.value</code>
- **B.** <code>event.target.checked</code>
- **C.** <code>event.checked</code>
- **D.** <code>event.currentValue</code>

**Answer: B.** Read <code>event.target.checked</code> to get a boolean representing the checkbox state.

### 5. How should a group of radio buttons that represent one choice be connected?

- **A.** Give each radio a different <code>name</code>
- **B.** Give them the same <code>name</code> and distinct <code>value</code> attributes
- **C.** Give them the same <code>id</code>
- **D.** Put each radio in a separate form

**Answer: B.** The shared name forms one radio group, while each distinct value identifies an option.

### 6. What is the controlled value prop for a <code>textarea</code>?

- **A.** <code>text</code>
- **B.** <code>children</code>
- **C.** <code>value</code>
- **D.** <code>content</code>

**Answer: C.** React controls a textarea through its <code>value</code> prop, just like a text input.

### 7. How do you control which option is selected in a React <code>select</code>?

- **A.** Put <code>selected</code> on each option
- **B.** Set the <code>value</code> on the <code>select</code>
- **C.** Set <code>checked</code> on each option
- **D.** Use <code>defaultChecked</code> on the select

**Answer: B.** A controlled select receives its current selection through the select element's <code>value</code> prop.

### 8. What should an input's <code>onChange</code> handler usually do for a controlled field?

- **A.** Update the state that supplies the input's value
- **B.** Call the server directly on every keystroke
- **C.** Remove the input from the page
- **D.** Call <code>preventDefault()</code> on every event

**Answer: A.** Updating the source state keeps the UI in sync with the user's edits.

### 9. Why can a controlled input appear frozen?

- **A.** It has a <code>name</code>
- **B.** Its handler does not update the state used by its <code>value</code>
- **C.** It has a label
- **D.** It is inside a component

**Answer: B.** If the supplied value never changes, React keeps rendering the same value.

### 10. What is a common way to prevent a browser's default full-page form submission?

- **A.** Call <code>event.preventDefault()</code> in the form's submit handler
- **B.** Set the form's <code>value</code> to an empty string
- **C.** Put <code>onChange</code> on the form
- **D.** Use <code>type="text"</code> on the submit button

**Answer: A.** Preventing the default submit action lets the application handle submission, such as by sending a request with JavaScript.

### 11. Which event handler should normally handle submitting a form?

- **A.** The form's <code>onClick</code>
- **B.** The form's <code>onSubmit</code>
- **C.** The input's <code>onFocus</code>
- **D.** The label's <code>onChange</code>

**Answer: B.** Form-level <code>onSubmit</code> handles submission consistently, including keyboard submission.

### 12. What type should a button use when it submits its containing form?

- **A.** <code>type="reset"</code>
- **B.** <code>type="button"</code>
- **C.** <code>type="submit"</code>
- **D.** <code>type="form"</code>

**Answer: C.** A submit button triggers the form's submit behavior.

### 13. What type should a button use for an action that must not submit its containing form?

- **A.** <code>type="button"</code>
- **B.** <code>type="submit"</code>
- **C.** <code>type="input"</code>
- **D.** <code>type="none"</code>

**Answer: A.** An explicit button type avoids accidental form submission.

### 14. How can a visible label be programmatically associated with an input?

- **A.** Give the label a <code>name</code> matching the input's <code>name</code>
- **B.** Give the label a <code>htmlFor</code> matching the input's <code>id</code>
- **C.** Put the input's value in the label's <code>title</code>
- **D.** Give both elements the same <code>id</code>

**Answer: B.** In JSX, <code>htmlFor</code> connects a label to the input whose <code>id</code> matches it.

### 15. Why give form controls a <code>name</code>?

- **A.** It makes the control a React component
- **B.** It identifies the field in native form submission and tools such as <code>FormData</code>
- **C.** It automatically validates the field
- **D.** It creates a visible label

**Answer: B.** A name identifies a control's submitted data. It is separate from React state and from the label association.

### 16. What does the <code>required</code> attribute provide?

- **A.** A native browser constraint that the field have a value before submission
- **B.** A guarantee that the server will accept the value
- **C.** An automatic database record
- **D.** A React state variable

**Answer: A.** Native required validation helps in the browser, but the server must still validate submitted data.

### 17. What is the main reason to validate submitted data on the server too?

- **A.** React cannot render errors
- **B.** Client-side checks can be bypassed or the request can be constructed outside the UI
- **C.** Browsers do not support forms
- **D.** Server validation prevents all network errors

**Answer: B.** The server is the trust boundary and must validate data independently of client behavior.

### 18. What does <code>aria-invalid="true"</code> communicate on a field?

- **A.** That the field is currently invalid
- **B.** That the field is disabled
- **C.** That the field is required
- **D.** That the field is hidden

**Answer: A.** It exposes the field's invalid state to assistive technologies. It should match the actual validation state.

### 19. How can an input refer to visible help or error text for assistive technologies?

- **A.** Set <code>aria-describedby</code> to the referenced element's id
- **B.** Copy the text into the input's <code>name</code>
- **C.** Put a heading inside the input
- **D.** Set <code>aria-label</code> to the error element's id

**Answer: A.** <code>aria-describedby</code> references the id or ids of descriptive text associated with the field.

### 20. What is a good way to represent a group of related checkbox selections?

- **A.** One boolean per option, or an array/set of selected option values
- **B.** One shared string that is never updated
- **C.** A separate form for every checkbox
- **D.** The checkbox labels as DOM ids

**Answer: A.** Choose a state shape that makes adding and removing selections predictable.

### 21. What value does a text input usually produce through <code>event.target.value</code>?

- **A.** Always a number
- **B.** A string
- **C.** A boolean
- **D.** An array

**Answer: B.** Even an input with <code>type="number"</code> exposes its edited value as a string through <code>value</code>.

### 22. Why should numeric input conversion account for an empty string?

- **A.** Empty input is always the number zero
- **B.** Converting an empty string with <code>Number</code> produces zero, which may not mean “no value”
- **C.** React rejects all number values
- **D.** The browser submits empty strings as booleans

**Answer: B.** Model “no value” deliberately; do not accidentally turn it into zero or another misleading value.

### 23. Why should a controlled input not switch between controlled and uncontrolled during its lifetime?

- **A.** React expects a stable ownership model for the input's value
- **B.** HTML forbids input values
- **C.** Forms only support one field
- **D.** It disables keyboard input

**Answer: A.** Initialize state to a defined value, such as an empty string, and keep the field controlled consistently.

### 24. What should be used for a file input in a typical browser form?

- **A.** A controlled text <code>value</code> containing the local file path
- **B.** The browser-managed file input, reading selected files from its files collection
- **C.** A radio input
- **D.** <code>defaultChecked</code>

**Answer: B.** Browsers restrict setting a file input's local selection programmatically. Read selected files from the input's <code>files</code> collection.

### 25. When is <code>FormData</code> useful?

- **A.** When collecting named form controls for a request or inspecting their submitted values
- **B.** When rendering a component without props
- **C.** When replacing all labels with placeholders
- **D.** When turning checkboxes into radio buttons

**Answer: A.** <code>FormData</code> works with form controls that have names and can be useful for native-style submission or file uploads.

## Short-answer questions

### 26. Explain the difference between a controlled and uncontrolled input.

**Answer:** A controlled input gets its displayed value from React state, and an event handler updates that state. An uncontrolled input keeps its current value in the DOM; React may provide an initial value with <code>defaultValue</code> or <code>defaultChecked</code>.

### 27. Show the basic state and handler pattern for a controlled text field.

**Answer:** Keep a string in state, pass it as <code>value</code>, and update that state synchronously in <code>onChange</code>.

~~~jsx
const [name, setName] = useState("");

<input
  value={name}
  onChange={(event) => setName(event.target.value)}
/>
~~~

### 28. Why is checkbox handling different from ordinary text input handling?

**Answer:** A text field's edited content is read from <code>event.target.value</code>. A checkbox's selection is read from <code>event.target.checked</code>, a boolean. Its <code>value</code> is the data associated with the checked option.

### 29. What is the difference between <code>value</code> and <code>name</code> on a form field?

**Answer:** <code>value</code> is the field's current or submitted data. <code>name</code> is the key under which that data is identified in form submission and APIs such as <code>FormData</code>.

### 30. Why use a form's submit event rather than only a button click?

**Answer:** The form's submit event handles both clicking a submit button and submitting through the keyboard. It also gives one place to prevent default navigation, validate, and continue the submission flow.

### 31. Describe one accessible way to show a validation error.

**Answer:** Show readable error text near the field, connect it using <code>aria-describedby</code>, and set <code>aria-invalid</code> while that field is invalid. Use a visible label for the field and make the error clear enough to fix the problem.

### 32. Why should a change handler update controlled input state immediately?

**Answer:** React uses that state to render the controlled value. Delaying or omitting the update can make typing feel broken, cause the displayed value to revert, or move the caret unexpectedly.

### 33. Where should business-critical validation happen?

**Answer:** On the server, even if the client also validates for fast feedback. The server must treat all incoming data as untrusted.

### 34. What is one useful state design for a multi-field form?

**Answer:** Use one state object with a clear property for each field, such as <code>{ name, email, plan }</code>, or separate state variables when that makes the component easier to understand. Keep each field's type and initial value consistent.

### 35. When might an uncontrolled field be a reasonable choice?

**Answer:** When the application only needs the value at submission, when integrating with browser-native form behavior, or for file inputs. A ref or <code>FormData</code> can read values without synchronizing every keystroke to React state.

## Applied questions

### 36. A controlled input renders <code>value={email}</code>, but typing has no effect. What should you inspect?

**Answer:** Inspect its <code>onChange</code> handler and confirm it updates the same state variable used by <code>value</code>. Also make sure the initial value is a defined string rather than <code>null</code> or <code>undefined</code>.

### 37. A checkbox handler stores <code>event.target.value</code> in a boolean state variable. What is wrong?

**Answer:** The handler is reading the option's value, not whether it is checked. Store <code>event.target.checked</code> for the checked state. Use <code>value</code> only to identify what the checked option represents.

### 38. A form has a “Show preview” button and a “Save” button. How should their types be set?

**Answer:** Give the preview button <code>type="button"</code> so it does not submit the form. Give the save button <code>type="submit"</code> so the form's <code>onSubmit</code> handler runs.

### 39. You store a numeric field as a number, but the user must be able to clear it while editing. What design can avoid losing the empty state?

**Answer:** Keep the editing value as a string, including the empty string, and parse or validate it at the appropriate boundary, such as on blur or submit. Alternatively, model the empty state explicitly rather than treating it as zero.

### 40. A form shows “Email is required” visually, but screen-reader users do not hear it. What should you change?

**Answer:** Give the error message a stable id, connect the input with <code>aria-describedby</code>, and set <code>aria-invalid="true"</code> while invalid. Ensure the message is rendered as text and that the input has a programmatically associated label.

## Chapter navigation

| Previous chapter | Lesson | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [068 - Conditional rendering and lists](../lessons/068-conditional-rendering-and-lists.md) | [Lesson](../lessons/069-forms-and-controlled-inputs.md) | [Example](../examples/069-forms-and-controlled-inputs.md) | [070 - Share state by lifting it](../lessons/070-share-state-by-lifting-it.md) |
