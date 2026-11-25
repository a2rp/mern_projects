# 066 - Events and state updates

## Responding to a user event

A React component can attach an event handler to a JSX element. An event handler is a function that React calls when the user interacts with that element.

~~~jsx
function SaveButton() {
    function handleSave() {
        console.log("Save requested");
    }

    return (
        <button type="button" onClick={handleSave}>
            Save
        </button>
    );
}
~~~

React event prop names use camelCase, such as <code>onClick</code>, <code>onChange</code>, and <code>onSubmit</code>. Pass a function as the handler. Do not call it while rendering:

~~~jsx
// Correct: React calls handleSave after a click.
<button type="button" onClick={handleSave}>Save</button>

// Incorrect: this calls handleSave immediately during rendering.
<button type="button" onClick={handleSave()}>Save</button>
~~~

If the handler needs an argument, pass a function that calls it when the event occurs:

~~~jsx
<button type="button" onClick={() => handleOpen(lesson.id)}>
    Open lesson
</button>
~~~

## Name handlers after the action

Names such as <code>handleSubmit</code>, <code>handleDelete</code>, and <code>handleNameChange</code> describe what the function does. A component can define a handler inside its body and use it in JSX:

~~~jsx
function SearchForm() {
    function handleSubmit(event) {
        event.preventDefault();
        console.log("Search submitted");
    }

    return (
        <form onSubmit={handleSubmit}>
            <button type="submit">Search</button>
        </form>
    );
}
~~~

Putting submission behavior on the form supports both the submit button and keyboard submission. Use the correct button type: <code>submit</code> for a form submission, <code>button</code> for an action that should not submit the surrounding form, and <code>reset</code> only when resetting the form is intended.

## Use the event object when needed

React passes an event object to an event handler. It contains information about the event and the element involved. For a controlled text input, the handler can read the current input value:

~~~jsx
function handleNameChange(event) {
    setName(event.target.value);
}
~~~

You do not need to name the parameter <code>event</code>; <code>e</code> is also common. Choose a name that keeps the code clear.

The event's <code>target</code> is the element where the event originated. <code>currentTarget</code> is the element whose handler is currently running. This distinction matters when an event bubbles from a nested element to a parent handler.

## Form events and browser defaults

Some browser actions have a default behavior. Submitting a basic HTML form can navigate or reload the page. In a client-side React form, call <code>event.preventDefault()</code> when the app is handling the submission itself:

~~~jsx
function handleSubmit(event) {
    event.preventDefault();
    saveForm();
}
~~~

Only prevent a default when the application intends to replace it. Do not call <code>preventDefault()</code> automatically for every event.

Events can bubble from a nested element to an ancestor. If a child click and a parent click both handle the same interaction, both handlers may run. Prefer markup and handlers that match the intended behavior. Use <code>event.stopPropagation()</code> only when the event should not continue to an ancestor handler; it does not cancel the browser's default action.

## State makes an interface respond

A normal local variable does not persist as component memory across renders. When an interaction must change what the component displays, React state is one way to store that changing value.

~~~jsx
import { useState } from "react";

function LikeButton() {
    const [liked, setLiked] = useState(false);

    function handleClick() {
        setLiked(!liked);
    }

    return (
        <button
            type="button"
            aria-pressed={liked}
            onClick={handleClick}
        >
            {liked ? "Liked" : "Like"}
        </button>
    );
}
~~~

Calling a state setter requests a render with the updated state. React calls the component again, and the returned JSX reflects the new value. The next chapter studies state itself, including how to choose and organize it.

## State is a snapshot for one render

When React renders a component, the state values and event handlers created for that render form a snapshot. Calling a setter does not rewrite the value in the currently running function.

~~~jsx
function handleAddOne() {
    setCount(count + 1);
    console.log(count); // This is the current render's count.
}
~~~

The log uses the value captured by this handler. The new state will be available on the next render. Avoid writing code that assumes a setter immediately changes the variable in the current handler.

This also applies to asynchronous callbacks created by a handler: they close over the values from the render that created them. If code needs the latest state to calculate the next state, use an updater function.

## Update from the previous value

When the next state depends on the previous state, pass a pure updater function to the setter:

~~~jsx
setCount(previousCount => previousCount + 1);
~~~

The updater receives the pending state and returns the next state. This form is reliable when several updates are queued or when the calculation depends on the previous value.

~~~jsx
function handleAddThree() {
    setCount(count => count + 1);
    setCount(count => count + 1);
    setCount(count => count + 1);
}
~~~

React processes the queued updater functions in order. Keep updater functions pure: calculate and return the next state, and do not perform side effects such as logging, requests, or another state update inside them.

If the next value is a complete replacement that does not depend on the previous value, passing that value directly is appropriate:

~~~jsx
setStatus("saved");
~~~

## Update objects and arrays without mutation

Treat state objects and arrays as immutable. Create a new object or array for the next value rather than changing the existing one.

For an object, copy the existing fields and replace the field that changed:

~~~jsx
setProfile(previousProfile => ({
    ...previousProfile,
    name: nextName
}));
~~~

For an array, create a new array with the added item:

~~~jsx
setLessons(previousLessons => [
    ...previousLessons,
    newLesson
]);
~~~

To remove an item, create a filtered array:

~~~jsx
setLessons(previousLessons =>
    previousLessons.filter(lesson => lesson.id !== removedId)
);
~~~

Do not call mutating methods such as <code>push</code>, <code>pop</code>, or <code>splice</code> on an array held in state. Copying only the outer object is not enough when you mutate a nested object; create new objects along the path that changed.

## Controlled form fields

A controlled field receives its displayed value from React state and reports edits through an event handler:

~~~jsx
function NameField() {
    const [name, setName] = useState("");

    function handleChange(event) {
        setName(event.target.value);
    }

    return (
        <label>
            Your name
            <input value={name} onChange={handleChange} />
        </label>
    );
}
~~~

The state value is the source of truth for what the input displays. When the user types, <code>onChange</code> sends the new value to the handler, and the handler updates state. If a controlled text input is given a value but its change handler never updates that value, React keeps rendering the old value and the input appears locked.

For checkboxes, use the <code>checked</code> prop and read <code>event.target.checked</code>. For selects, use <code>value</code> and read <code>event.target.value</code>. Keep each field label associated with its control.

## Keep side effects in event handlers or effects

An event handler is an appropriate place to start work caused by a particular user action, such as submitting a form or requesting deletion. An updater function is not: it must only calculate a state value. Do not issue network requests or modify external systems while rendering.

For an asynchronous save, the handler can prevent a browser form navigation, call the API, and then update UI state based on the result. Keep server validation authoritative; client-side checks improve feedback but cannot replace server checks.

## Common mistakes

- Calling a handler during render instead of passing the function reference.
- Forgetting to wrap a handler when it needs an argument.
- Using the wrong button type inside a form.
- Forgetting to prevent the form's default navigation when React handles submission.
- Calling <code>preventDefault()</code> when the browser behavior should remain.
- Assuming a setter changes the current render's state variable immediately.
- Using a value-based update when several updates depend on the pending previous value.
- Putting side effects inside a state updater function.
- Mutating an object or array stored in state.
- Controlling an input with a value but failing to update it in <code>onChange</code>.
- Reading <code>target</code> when <code>currentTarget</code> is needed for a bubbled event.
- Using <code>stopPropagation()</code> as though it also prevents the browser's default action.

## Review checklist

- [ ] Event prop names use React's camelCase names.
- [ ] JSX receives a handler function rather than the result of calling it.
- [ ] Event handlers use the event object only when needed.
- [ ] Forms use submit events and prevent default navigation when appropriate.
- [ ] State setters are used when an interaction needs to change rendered UI.
- [ ] Code does not expect a state variable to change inside the current render.
- [ ] Previous-state calculations use a pure updater when needed.
- [ ] State objects and arrays are replaced with new values instead of mutated.
- [ ] Controlled fields update the state that supplies their value.
- [ ] Network or other side effects run in response handlers, not inside updater functions.

## Summary

React event handlers are functions passed to JSX event props. When an interaction changes rendered UI, a state setter requests a new render; the current handler still sees its render's state snapshot. Use updater functions for calculations based on pending state, create new objects and arrays instead of mutating state, and control form values with matching change handlers. Keep event-driven side effects out of updater functions.

## Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [065 - Props and one-way data flow](065-props-and-one-way-data-flow.md) | [Q&A](../qnas/066-events-and-state-updates.md) | [Example](../examples/066-events-and-state-updates.md) | [067 - useState and state design](067-usestate-and-state-design.md) |
