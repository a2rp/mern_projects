# 078 - Client-side form validation and user experience: Q&A

These questions review semantic form controls, browser validation, React input state, error feedback, submission behavior, and server-side validation.

## Multiple-choice questions

### 1. What is client-side validation primarily for?

- **A.** Helping users correct input before or during submission
- **B.** Replacing all server security checks
- **C.** Preventing anyone from calling an API directly
- **D.** Encrypting form values

**Answer: A.** Client validation improves feedback and can catch common mistakes early. The API still validates all submitted data.

### 2. What does the HTML <code>required</code> attribute do?

- **A.** Marks a control as requiring a value for native form validation
- **B.** Creates a server database column
- **C.** Hides the field from keyboard users
- **D.** Guarantees the value is safe

**Answer: A.** It participates in browser constraint validation and communicates that the control is required. It does not enforce server-side rules.

### 3. What does <code>type="email"</code> generally check?

- **A.** Whether the entered value has an email-like syntax
- **B.** Whether the mailbox exists and belongs to the user
- **C.** Whether the user is authorized
- **D.** Whether the email server is online

**Answer: A.** The browser can check syntax, but only a separate verification process can establish that a mailbox is reachable or controlled by the user.

### 4. How should an explicit label be associated with an input in JSX?

- **A.** Match <code>htmlFor</code> on the label to the input's <code>id</code>
- **B.** Give both elements the same placeholder
- **C.** Put the input's type in the label's <code>href</code>
- **D.** Use CSS to display the label

**Answer: A.** The matching <code>htmlFor</code> and <code>id</code> create a programmatic label association.

### 5. What happens when a React input receives a string <code>value</code>?

- **A.** It is controlled and should synchronously update state in <code>onChange</code>
- **B.** It becomes a database record
- **C.** It becomes uncontrolled automatically
- **D.** It cannot receive keyboard input

**Answer: A.** A controlled input's displayed value comes from React. Its change handler must synchronously update the backing state.

### 6. Which value should update the React state for a controlled text input?

- **A.** The current input value from the change event
- **B.** The input's id
- **C.** The submit button text
- **D.** A delayed old value from another render

**Answer: A.** Update state from the current event value synchronously. Otherwise React may restore the previous value and cause typing or caret problems.

### 7. What does <code>new FormData(form)</code> provide?

- **A.** The submitted values of named form controls
- **B.** A Mongoose model
- **C.** An API authorization token
- **D.** The browser's full history

**Answer: A.** FormData reads values from successful named controls in the form and can be used when handling submit.

### 8. What type should a Cancel button inside a form normally use?

- **A.** <code>type="button"</code>
- **B.** No type, so the browser guesses
- **C.** <code>type="submit"</code>
- **D.** <code>type="input"</code>

**Answer: A.** A button inside a form defaults to submit behavior unless its type says otherwise. Use <code>type="button"</code> for a non-submit action.

### 9. When is it often useful to show a full set of validation errors?

- **A.** After the user submits an invalid form
- **B.** Before the form is rendered
- **C.** On every initial page load for all fields
- **D.** Only after a server has been restarted

**Answer: A.** Showing errors after submission avoids overwhelming users before they have had a chance to complete the fields. A form may also validate touched fields on blur.

### 10. What should a helpful field error include?

- **A.** The field context and a clear correction
- **B.** Only a red border
- **C.** A raw stack trace
- **D.** A vague message such as “Wrong”

**Answer: A.** Errors should identify the problem and explain how to fix it. Do not rely on color alone.

### 11. Which attribute can associate an input with help text and an inline error?

- **A.** <code>aria-describedby</code>
- **B.** <code>aria-hidden</code>
- **C.** <code>autofocus</code>
- **D.** <code>target</code>

**Answer: A.** Point <code>aria-describedby</code> to the ids of the relevant help and error text.

### 12. What does <code>aria-invalid="true"</code> communicate?

- **A.** The current input value is invalid
- **B.** The input is disabled
- **C.** The form was successfully submitted
- **D.** The value is confidential

**Answer: A.** It exposes invalid state programmatically. Pair it with a clear textual explanation and a label.

### 13. What should happen to form values if an API request fails after client validation passes?

- **A.** Usually keep the entered values so the user can retry
- **B.** Always clear all fields
- **C.** Convert them to empty strings and hide the form
- **D.** Save the database password in the form

**Answer: A.** A network or server error should not erase user work. Preserve the values and explain the failure.

### 14. Why disable or otherwise guard a submit button while a request is pending?

- **A.** To reduce accidental duplicate submissions and show pending state
- **B.** To avoid server-side validation
- **C.** To make the form inaccessible
- **D.** To change the request from POST to GET

**Answer: A.** Pending feedback and duplicate-submission protection improve the interaction. The server should still handle duplicate operations appropriately.

### 15. Where should a create or purchase request be initiated?

- **A.** In the user-triggered submit or action handler
- **B.** In an Effect that runs whenever the form mounts
- **C.** In a CSS rule
- **D.** In the input's placeholder

**Answer: A.** A write should follow explicit user intent. A rendering Effect can run again independently of that intent.

### 16. What is the role of the server in validation?

- **A.** Revalidate every request and enforce authorization
- **B.** Trust the React form's state
- **C.** Accept any payload if it is JSON
- **D.** Use CORS as a substitute for validation

**Answer: A.** A caller can bypass the UI. The server must enforce data rules and access permissions itself.

### 17. What does <code>novalidate</code> on a form do?

- **A.** Disables the browser's automatic interactive constraint-validation UI on submit
- **B.** Disables all JavaScript
- **C.** Makes every field required
- **D.** Validates only on the server

**Answer: A.** It lets an app provide its own submit-time validation experience. The application must then ensure it actually validates the input.

### 18. What should code do after calling <code>setCustomValidity</code> when the field becomes valid?

- **A.** Set the custom validity message to an empty string
- **B.** Leave the old message in place
- **C.** Delete the form
- **D.** Set the message to <code>null</code>

**Answer: A.** A non-empty custom validity message keeps the control invalid. Clear it with an empty string once the value satisfies the custom rule.

### 19. What is a useful response structure for server-side field validation errors?

- **A.** A safe form-level message plus an object mapping field names to messages
- **B.** A database password and a stack trace
- **C.** An HTML document with no field information
- **D.** A success message for every error

**Answer: A.** A predictable mapping lets the client associate server errors with fields and show a general message for the overall submission.

### 20. Why should an error not be communicated only by turning a field border red?

- **A.** Users may not perceive color, and the problem is not explained in text
- **B.** CSS cannot style borders
- **C.** Red borders make the API return 500
- **D.** The browser blocks all form submissions

**Answer: A.** Use visible text and programmatic associations in addition to visual styling.

## Short-answer questions

### 21. What is the difference between controlled and uncontrolled inputs in React?

**Answer:** A controlled input gets its current value from React state and updates that state through an event handler. An uncontrolled input keeps its current value in the DOM and can be read at submit time, for example with FormData.

### 22. Why should a form use a real <code>form</code> element and submit event?

**Answer:** It provides semantic form behavior, supports keyboard submission, and gives the app a single submission handler for validation and sending data. It also offers progressive behavior when JavaScript is unavailable if the form is configured for normal submission.

### 23. Why is placeholder text not a replacement for a visible label?

**Answer:** Placeholder text disappears when a user types and may be less persistent or legible. A label provides a stable name and an explicit association to the control.

### 24. What is one benefit of validating on submit and then revalidating after corrections?

**Answer:** It avoids showing errors before a user has attempted the form, then gives responsive feedback while they fix fields that were already identified as invalid.

### 25. What does <code>aria-describedby</code> contribute to field-error feedback?

**Answer:** It associates the input with explanatory text such as help and error messages, allowing assistive technology to present that information with the field.

### 26. Why should a client preserve values after a failed API submission?

**Answer:** The user may have spent time entering the data. Preserving it lets them correct a field or retry a temporary server or network failure without starting over.

### 27. What should the app do after a valid form is submitted but before the API responds?

**Answer:** Show a pending state, prevent accidental duplicate activation where appropriate, and keep the user informed. On failure, preserve the values; on success, confirm completion and reset or navigate as appropriate.

### 28. Why is a server-side duplicate check still necessary if the client checks uniqueness first?

**Answer:** The client can be bypassed and its check may become stale before submission. The server and database must enforce uniqueness and report conflicts.

### 29. Name two things that should not appear in a validation response to the user.

**Answer:** Stack traces and private internal details such as database queries, filesystem paths, or secrets. Give a safe explanation and keep diagnostic detail in logs.

### 30. When might uncontrolled fields and FormData be simpler than controlled fields?

**Answer:** When the UI does not need to react to each keystroke and only needs the values at submission. Controlled state is useful when rendering depends on current values, such as live validation or conditional fields.

## Applied questions

### 31. A controlled text input renders <code>value={title}</code> but has no <code>onChange</code>. What will the user experience?

**Answer:** The input will behave as read-only because React keeps forcing the rendered value. Add an <code>onChange</code> handler that synchronously stores <code>event.target.value</code>, or use <code>defaultValue</code> for an uncontrolled field.

### 32. A developer puts a Cancel button inside a form without specifying its type. It submits the form. Why?

**Answer:** A button inside a form defaults to submit behavior. Set <code>type="button"</code> on Cancel and reserve <code>type="submit"</code> for the intended submission button.

### 33. How should an email field use built-in browser constraints?

**Answer:** Give it a visible associated label, <code>type="email"</code>, and <code>required</code> if required. The browser can check a basic email-like syntax and missing input, but the app must not claim this proves the mailbox exists.

### 34. A form shows a red border for invalid fields but no text. What should be improved?

**Answer:** Add a concise text error that identifies the field and explains how to fix it. Associate it with the control using <code>aria-describedby</code>, set <code>aria-invalid</code> when invalid, and keep a visible label.

### 35. A failed server request clears every field even though the entered values were valid. What should change?

**Answer:** Keep the field values when the request fails. Show a safe form-level error and offer an appropriate retry or correction path. Reset values only after a successful submission or when the user explicitly resets the form.

### 36. The client checks that a course title is unique, but two users can submit the same title concurrently. What should the backend do?

**Answer:** Enforce uniqueness in the database and handle duplicate-key conflicts in the API. A client-side pre-check can improve feedback but cannot enforce the invariant.

### 37. After an invalid submit, a long form displays three errors. How can keyboard and screen-reader users reach the problems efficiently?

**Answer:** Show a concise error summary, associate each inline error with its control, set invalid state, and move focus to the summary or first invalid field when appropriate. Summary entries can link to the corresponding controls.

### 38. A submit request is still pending, and the user clicks Submit several times. What should the UI and server consider?

**Answer:** Show pending feedback and guard against duplicate activations in the UI. The server should handle duplicate operations safely, using idempotency or conflict handling where the operation requires it.

### 39. The frontend uses <code>noValidate</code> to replace browser popups with inline errors. What responsibility does that create?

**Answer:** The app must perform its own submit-time validation, render understandable errors, associate them accessibly with fields, and prevent invalid data from being submitted. The server still validates independently.

### 40. A user changes a request payload in developer tools and submits it despite the React form's validation. What protects the application?

**Answer:** Server-side validation and authorization. The API must treat all client input as untrusted and enforce its rules regardless of the browser UI.

## Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [077 - Loading, error, empty, and success states](../lessons/077-loading-error-empty-and-success-states.md) | [Lesson](../lessons/078-client-side-form-validation-and-user-experience.md) | [Example](../examples/078-client-side-form-validation-and-user-experience.md) | [079 - Authentication user experience](../lessons/079-authentication-user-experience.md) |
