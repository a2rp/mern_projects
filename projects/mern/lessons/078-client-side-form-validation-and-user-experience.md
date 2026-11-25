# 078 - Client-side form validation and user experience

Forms collect data, but a useful form does more than reject invalid input. It tells users what is expected, identifies problems clearly, preserves what they entered, and confirms what happened after submission.

Client-side validation helps users correct mistakes before a request is sent. It is a usability feature, not a security boundary. The server must validate every submitted value again.

## Learning goals

After this chapter, you should be able to:

- Use semantic HTML controls and native constraint validation.
- Choose controlled or uncontrolled inputs based on the form's needs.
- Validate at a useful time and show actionable field-level feedback.
- Associate labels and error messages with their controls.
- Handle invalid submission, pending submission, server errors, and success.
- Keep entered values available when submission fails.
- Validate and authorize submitted data again on the server.

## Start with semantic HTML

Use a real <code>form</code>, meaningful labels, appropriate input types, and explicit buttons:

~~~jsx
<form onSubmit={handleSubmit}>
  <label htmlFor="title">Course title</label>
  <input id="title" name="title" type="text" required />

  <button type="submit">Create course</button>
  <button type="button" onClick={handleCancel}>Cancel</button>
</form>
~~~

A label gives the control an accessible name and a larger click target. Use a unique <code>id</code> and associate it with <code>htmlFor</code>, or put the control inside its label.

Buttons inside forms default to submit behavior unless their type says otherwise. Use <code>type="submit"</code> for the main form action and <code>type="button"</code> for other actions such as Cancel or Show password.

Do not use placeholder text as the only label. Placeholder text disappears as the user types and may not provide a persistent description of the field.

## Use native browser constraints

HTML provides useful validation attributes:

- <code>required</code> prevents submission when a value is missing.
- <code>type="email"</code> checks that the value has an email-like syntax.
- <code>minlength</code> and <code>maxlength</code> limit text length.
- <code>min</code>, <code>max</code>, and <code>step</code> constrain numbers and dates.
- <code>pattern</code> applies a regular-expression constraint to supported inputs.

~~~html
<label for="email">Email address</label>
<input
  id="email"
  name="email"
  type="email"
  autocomplete="email"
  required
/>

<label for="seats">Seats</label>
<input id="seats" name="seats" type="number" min="1" max="12" required />
~~~

Native constraints provide a useful baseline and integrate with browser form behavior. Browser messages and presentation differ across browsers, so use custom feedback when the form needs consistent field-level instructions or a specific interaction.

The Constraint Validation API exposes validity information and methods such as <code>checkValidity()</code>, <code>reportValidity()</code>, and <code>setCustomValidity()</code>. If you set a custom validity message, clear it with an empty string when the value becomes valid; otherwise the control remains invalid.

## Controlled and uncontrolled inputs in React

A controlled input gets its current value from React state. Its change handler should synchronously update that state:

~~~jsx
const [title, setTitle] = useState("");

<input
  name="title"
  value={title}
  onChange={(event) => setTitle(event.target.value)}
/>
~~~

Use a controlled input when the UI needs the current value before submit, such as for live validation, conditional fields, or a character count. Initialize text values to strings so the input does not switch between uncontrolled and controlled modes.

An uncontrolled input keeps its current value in the DOM. Give it a <code>name</code> and read values with <code>FormData</code> when submitting:

~~~jsx
function handleSubmit(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const title = formData.get("title");
}
~~~

Uncontrolled inputs can be simpler when the form only needs values at submission. Choose one approach per field; do not provide both a React <code>value</code> and an uncontrolled <code>defaultValue</code>.

## Decide when to validate

Validation timing affects whether the form feels helpful or nagging:

- **On submit:** show the errors after the user attempts the form.
- **On blur:** validate a field after the user has left it.
- **On change after an error:** update feedback as the user corrects the field.
- **While typing from the first character:** use carefully; it can show an error before the user has had a chance to finish.

A common pattern is to validate the whole form on submit, show errors beside their fields, and then update each field's error as the user corrects it. Another is to validate a field after it is touched. Keep validation rules consistent between client and server.

## Write useful field errors

An error should name the field and explain how to fix it. “Invalid” is not enough. Prefer a message such as “Enter a course title with at least 3 characters.”

Use text as well as visual styling. Do not communicate an error with color alone. Associate the field with its help and error text using <code>aria-describedby</code>, and set <code>aria-invalid</code> when the current value is invalid:

~~~jsx
<label htmlFor="title">Course title</label>
<input
  id="title"
  name="title"
  aria-invalid={Boolean(error)}
  aria-describedby={error ? "title-help title-error" : "title-help"}
/>
<p id="title-help">Use 3 to 100 characters.</p>
{error ? <p id="title-error">{error}</p> : null}
~~~

For a failed submission with several invalid fields:

- Show a concise summary near the form.
- Show the matching error next to each field.
- Link summary items to fields when the form is long.
- Move focus to the first invalid field or the summary when appropriate.
- Preserve the user's entered values.

Avoid announcing the same error repeatedly on every keystroke. Use accessible status or alert behavior for meaningful changes, and let focus and labels provide context.

## Handle submission as a user action

A form submission is caused by a user action, so an event handler is the natural place to validate and send it:

~~~jsx
async function handleSubmit(event) {
  event.preventDefault();

  const errors = validate(values);
  setErrors(errors);

  if (Object.keys(errors).length > 0) {
    focusFirstInvalidField(errors);
    return;
  }

  await sendToApi(values);
}
~~~

Use <code>event.preventDefault()</code> when the React client handles the request and should not navigate through a normal browser form submission. Keep the form's submit button explicit so keyboard users can submit with Enter where appropriate.

Do not send a mutation from an Effect that runs because the form component appeared. A save, purchase, or create request should run only after the user's submission event.

## Represent pending and result states

While submission is in flight, prevent accidental duplicate activation and give feedback:

~~~jsx
<button type="submit" disabled={isSubmitting}>
  {isSubmitting ? "Saving…" : "Create course"}
</button>
~~~

A disabled button alone may not explain the pending operation. Include a status message when the wait is noticeable. After success, confirm what happened and optionally reset the form. After failure, keep the user's values so they can correct or retry them.

A network failure is different from validation feedback. The input values may be valid, but the server could be unavailable. Provide an appropriate retry path without clearing the form.

## Map server validation errors back to fields

The API may reject data for rules the client cannot know, such as a duplicate title. Return a predictable error structure:

~~~json
{
  "message": "Please correct the highlighted fields.",
  "errors": {
    "title": "A course with this title already exists."
  }
}
~~~

The frontend can map each server field error to its input and display a form-level message for errors that do not belong to one field. Use stable field names or API error codes rather than trying to parse arbitrary server prose.

Do not expose stack traces, database queries, or other internal details in validation responses.

## Client validation is not security

Users can disable JavaScript, change the page, or send requests without using your React form. The API must validate all input and enforce authorization independently.

The server should:

- Check required fields, types, lengths, formats, and allowed values.
- Normalize values consistently where appropriate.
- Reject unexpected or malformed data.
- Check the caller's permissions for protected changes.
- Return useful status codes and safe error messages.
- Avoid trusting client-side role checks or browser validity results.

Client and server validation may share rules in a well-designed project, but the server remains authoritative.

## Common mistakes

- Using a placeholder as the only label.
- Leaving a non-submit button without <code>type="button"</code> inside a form.
- Showing every error before the user has attempted to complete the form.
- Showing only a red border without text explaining the problem.
- Failing to associate field errors with their controls.
- Passing a React <code>value</code> without updating it synchronously in <code>onChange</code>.
- Switching an input between controlled and uncontrolled values.
- Clearing all fields after a failed network request.
- Letting the submit button trigger duplicate requests while saving.
- Trusting client validation instead of validating again in the API.
- Revealing raw server errors to the user.
- Putting a mutation request in an Effect instead of the submit handler.

## Chapter checklist

Before shipping a form:

- Use semantic controls, persistent labels, and explicit button types.
- Add appropriate native constraints.
- Decide when field errors should appear.
- Explain errors in text and associate them with fields.
- Show a summary and focus an invalid field when useful.
- Represent pending, server failure, and success clearly.
- Preserve values after a failed request.
- Validate and authorize again on the server.
- Test with keyboard navigation and assistive technology.

## Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [077 - Loading, error, empty, and success states](077-loading-error-empty-and-success-states.md) | [Q&A](../qnas/078-client-side-form-validation-and-user-experience.md) | [Example](../examples/078-client-side-form-validation-and-user-experience.md) | [079 - Authentication user experience](079-authentication-user-experience.md) |
