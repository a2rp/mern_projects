# 069 - Forms and controlled inputs

## Forms collect user input

HTML form elements provide browser controls for text, choices, and submission. In React, a form can keep its current values in component state so the rendered controls and the data used by the application stay in sync.

A controlled input receives its current value from React and reports edits through an event handler. The state is the source of truth for what the control displays.

~~~jsx
import { useState } from "react";

function NameField() {
    const [name, setName] = useState("");

    return (
        <label>
            Name
            <input
                name="name"
                value={name}
                onChange={event => setName(event.target.value)}
            />
        </label>
    );
}
~~~

The input is controlled because it receives <code>value</code>. Its change handler synchronously copies the current DOM value into state. React renders again with that new value.

## Controlled and uncontrolled fields

A controlled text input receives a value and an <code>onChange</code> handler:

~~~jsx
<input value={name} onChange={handleNameChange} />
~~~

An uncontrolled input keeps its current value in the DOM. React can supply its initial value with <code>defaultValue</code>:

~~~jsx
<input name="nickname" defaultValue="Guest" />
~~~

<code>defaultValue</code> sets the starting value; it does not keep the field synchronized with later React state changes. For checkboxes and radio buttons, use <code>defaultChecked</code> to set the initial checked state.

Choose the approach that fits the form. Controlled fields are useful when the UI needs the current value while the user types, needs immediate validation or derived output, or needs to set or reset the value through React. Uncontrolled fields can be simpler when the value is only needed at submission time.

Do not give a field both a controlled prop such as <code>value</code> and an uncontrolled prop such as <code>defaultValue</code>. A field should not switch between controlled and uncontrolled during its lifetime.

## Keep controlled values in the correct shape

For a controlled text input, initialize state to a string, often the empty string. Do not pass <code>null</code> or <code>undefined</code> as its value; otherwise the field may switch between controlled and uncontrolled behavior.

~~~jsx
const [email, setEmail] = useState("");
~~~

Checkboxes and radio buttons are controlled with the boolean <code>checked</code> prop. Read the checkbox's checked state from <code>event.target.checked</code>, not its value:

~~~jsx
const [subscribed, setSubscribed] = useState(false);

<input
    type="checkbox"
    checked={subscribed}
    onChange={event => setSubscribed(event.target.checked)}
/>
~~~

For a number input, the DOM value is still read as a string. Convert it to a number when the application needs numeric calculations, and handle an empty field intentionally rather than accidentally turning it into zero.

## Textareas and select controls

For a controlled <code>textarea</code>, use the <code>value</code> prop and update it from <code>onChange</code>:

~~~jsx
<textarea
    name="message"
    value={message}
    onChange={event => setMessage(event.target.value)}
/>
~~~

For a controlled <code>select</code>, put <code>value</code> on the <code>select</code> element and update the state from <code>onChange</code>:

~~~jsx
<select
    name="role"
    value={role}
    onChange={event => setRole(event.target.value)}
>
    <option value="learner">Learner</option>
    <option value="mentor">Mentor</option>
</select>
~~~

Do not mark an individual option with React's <code>selected</code> prop. Control the selection on the parent <code>select</code> element.

Radio buttons that form one choice group share a <code>name</code>. Use a state value to identify the selected option and set each radio's <code>checked</code> prop from that value.

## Handle form submission on the form

Handle submission with <code>onSubmit</code> on the form, not only with a click handler on its submit button. This supports keyboard submission as well.

~~~jsx
function handleSubmit(event) {
    event.preventDefault();
    // Validate values and continue with the submission.
}

<form onSubmit={handleSubmit}>
    <button type="submit">Send</button>
</form>
~~~

Use <code>preventDefault()</code> when React handles the submission and the page should not perform the browser's default navigation. Buttons inside forms submit by default, so specify <code>type="button"</code> for actions that should not submit.

A field's <code>name</code> matters when using native form submission or reading the form with browser APIs. Use names that identify the values clearly.

## Manage several field values

For a small form, each field can have its own state variable. If the fields form one coherent editable record, a state object can make the form data easy to pass and submit:

~~~jsx
const [values, setValues] = useState({
    fullName: "",
    email: "",
    role: "learner",
    subscribed: false
});
~~~

A shared change handler can update a named field and choose the correct value type:

~~~jsx
function handleChange(event) {
    const { name, type, value, checked } = event.target;
    const nextValue = type === "checkbox" ? checked : value;

    setValues(previousValues => ({
        ...previousValues,
        [name]: nextValue
    }));
}
~~~

Text fields, selects, and radio inputs use <code>value</code>. A checkbox uses <code>checked</code>. The handler therefore reads <code>checked</code> for a checkbox and <code>value</code> for other controls.

Use the state shape that makes the form easiest to understand. A large unrelated form may be clearer when split into sections or child components. When updating an object, return a new object rather than mutating the previous state.

## Validate input and show useful errors

Browser constraints such as <code>required</code>, <code>type="email"</code>, <code>minLength</code>, and <code>maxLength</code> can provide basic validation. They improve usability, but client-side validation is not a security boundary. The server must validate submitted data independently.

For custom validation, keep validation logic separate from the JSX where practical. Associate an error with its field and make it perceivable to assistive technology:

~~~jsx
<label htmlFor="email">Email</label>
<input
    id="email"
    name="email"
    type="email"
    value={values.email}
    onChange={handleChange}
    aria-invalid={Boolean(errors.email)}
    aria-describedby={errors.email ? "email-error" : undefined}
/>
{errors.email && (
    <p id="email-error" role="alert">
        {errors.email}
    </p>
)}
~~~

Validate on submission or at a deliberate point in the interaction. Avoid changing a controlled text value asynchronously or to a different string on every keystroke unless formatting is carefully designed; doing so can disturb the user's caret position.

Do not rely on an error color alone. Provide text, connect it to the control, and preserve a visible label.

## Submit data safely

A submit handler can prevent page navigation, validate the current form state, and call an application function or API:

~~~jsx
async function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = validate(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
        return;
    }

    await saveProfile(values);
}
~~~

Only send data after client-side checks pass, but still validate and authorize the request on the server. Never trust client-side values or place secrets in the browser bundle.

If the submit operation is asynchronous, represent its status clearly, for example with a single state such as <code>"idle"</code>, <code>"submitting"</code>, <code>"success"</code>, or <code>"error"</code>. Disable duplicate submission when appropriate and show a result message.

## File inputs and other special controls

A file input is generally uncontrolled because browsers do not let application code set an arbitrary local file path as its value. Read the selected file from the event or the form when needed, and upload it through an appropriate server endpoint.

Different input types expose different useful event properties. Text controls and selects commonly use <code>event.target.value</code>; checkboxes use <code>event.target.checked</code>; file inputs expose files through <code>event.target.files</code>.

## Common mistakes

- Supplying <code>value</code> but not updating its state synchronously in <code>onChange</code>.
- Initializing a controlled text field with <code>null</code> or <code>undefined</code>.
- Controlling a checkbox with <code>value</code> instead of <code>checked</code>.
- Reading <code>event.target.value</code> for a checkbox instead of <code>event.target.checked</code>.
- Mixing <code>value</code> with <code>defaultValue</code> or switching modes after mount.
- Putting a <code>selected</code> prop on an option instead of controlling the select.
- Forgetting to call <code>preventDefault()</code> when React handles form submission.
- Attaching submission only to a button's click instead of the form's submit event.
- Forgetting that a button inside a form submits by default.
- Showing an error without associating it with its field or providing text.
- Treating browser or client validation as a replacement for server validation.
- Trying to control a file input's selected path.
- Storing a number input as a number without handling the empty string case.

## Review checklist

- [ ] Every controlled field has a state value and a synchronous change handler.
- [ ] Text values are strings; checkbox checked values are booleans.
- [ ] Select value is controlled on the <code>select</code> element.
- [ ] Radio options use a shared name and a clear selected value.
- [ ] Fields have labels and meaningful <code>name</code> attributes.
- [ ] The form handles <code>onSubmit</code> and prevents default navigation when appropriate.
- [ ] Non-submit buttons specify <code>type="button"</code>.
- [ ] Validation feedback is connected to the affected control.
- [ ] Client validation improves feedback, and the server validates independently.
- [ ] File inputs are handled without trying to set their local path.

## Summary

A controlled form field displays a React value and synchronously reports edits through <code>onChange</code>. Use strings for text values, booleans for checkbox state, and control selects and radio groups from state. Handle submission on the form, validate input accessibly, and keep server validation authoritative. Use uncontrolled fields when React does not need to track their live values, and treat file inputs as a special case.

## Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [068 - Conditional rendering and lists](068-conditional-rendering-and-lists.md) | [Q&A](../qnas/069-forms-and-controlled-inputs.md) | [Example](../examples/069-forms-and-controlled-inputs.md) | [070 - Share state by lifting it](070-share-state-by-lifting-it.md) |
