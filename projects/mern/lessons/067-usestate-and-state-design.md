# 067 - useState and state design

## What state is

State is component memory for values that can change and affect what the interface renders. Examples include an input's current value, which tab is selected, whether a panel is open, or the items in a cart.

A regular local variable is recalculated when a component renders and does not tell React to render again when it changes. State is stored by React between renders.

## Add state with useState

Import <code>useState</code> from React and call it at the top level of a function component:

~~~jsx
import { useState } from "react";

function Counter() {
    const [count, setCount] = useState(0);

    return (
        <button type="button" onClick={() => setCount(count + 1)}>
            Count: {count}
        </button>
    );
}
~~~

<code>useState(0)</code> returns a pair:

1. The current state value for this render.
2. A setter function that asks React to store a new value and render again.

Array destructuring gives those values meaningful names. The initial value, here <code>0</code>, is used for the first render. On later renders, React supplies the current state value; it does not reset the state to the initial value.

Use a setter to update state. Assigning to the local variable does not update React's stored state or cause the component to render again.

## Call Hooks at the top level

Hooks such as <code>useState</code> must be called at the top level of a function component or a custom Hook. Do not call a Hook inside a condition, loop, nested function, or event handler.

Incorrect:

~~~jsx
function Profile({ showDetails }) {
    if (showDetails) {
        const [expanded, setExpanded] = useState(false);
    }

    return <p>Profile</p>;
}
~~~

Correct:

~~~jsx
function Profile({ showDetails }) {
    const [expanded, setExpanded] = useState(false);

    return showDetails
        ? <button onClick={() => setExpanded(!expanded)}>
              {expanded ? "Hide details" : "Show details"}
          </button>
        : <p>Profile</p>;
}
~~~

Calling Hooks in a consistent order lets React associate each Hook call with its state across renders.

## Choose state that represents changing facts

Before adding state, ask:

- Can this value change over time?
- Does the interface need to render differently when it changes?
- Which component should own it?
- Can it be calculated from props or other state instead?

Store the smallest set of changing facts needed to describe the interface. Values such as item counts, filtered lists, totals, and display labels can often be calculated from existing inputs during rendering.

## Avoid redundant state

Do not store a value separately if it can be calculated from current props or state. For example, if the state holds a list of cart items, the item count and subtotal can be derived from that list.

~~~jsx
const [items, setItems] = useState(initialItems);

const itemCount = items.reduce(
    (total, item) => total + item.quantity,
    0
);
~~~

Keeping a second state variable for <code>itemCount</code> would require every add, remove, and quantity change to update both values correctly. Deriving the count avoids that synchronization problem.

The same idea applies to filtered arrays:

~~~jsx
const visibleLessons = lessons.filter(lesson => {
    return filter === "all" || lesson.category === filter;
});
~~~

Store the selected filter; calculate the visible list from the current lessons and filter.

## Avoid contradictory state

Do not represent one fact with several independent booleans when some combinations are impossible or unclear. For a request status, separate <code>isLoading</code>, <code>hasError</code>, and <code>isComplete</code> booleans can accidentally represent "loading and complete" at the same time.

A single status value makes the possible states explicit:

~~~jsx
const [status, setStatus] = useState("idle");
// "idle", "loading", "success", or "error"
~~~

Use a string union in TypeScript or a documented set of constants in JavaScript when it helps prevent misspelled values. Keep the state model aligned with states the interface can actually show.

## Group values that change together

Related fields that describe one entity can live in one state object:

~~~jsx
const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: ""
});
~~~

A field update should create a new object and retain the other fields:

~~~jsx
function handleFirstNameChange(event) {
    const firstName = event.target.value;

    setProfile(previousProfile => ({
        ...previousProfile,
        firstName
    }));
}
~~~

Independent values can be separate state variables when they change for different reasons. Grouping every value into one large object is not automatically better; choose a shape that makes updates and ownership clear.

## Keep state as flat as practical

Deeply nested state can make updates verbose and easy to get wrong. Prefer a structure that makes the values you need to change easy to locate. For collections, stable IDs can connect related data without copying entire nested records into multiple places.

When updating nested data, make a new copy for each changed level. Copying only the outer object and then mutating a nested object still changes the previous state.

~~~jsx
setProfile(previousProfile => ({
    ...previousProfile,
    address: {
        ...previousProfile.address,
        city: nextCity
    }
}));
~~~

This returns a new profile and a new address while preserving the other fields.

## Store identifiers instead of duplicate objects when useful

Suppose a page has a list of lessons and a selected lesson. Storing both the entire lesson list and a second copied selected lesson can let the copies disagree after a lesson changes.

Instead, store the selected lesson ID and derive the matching lesson:

~~~jsx
const [selectedLessonId, setSelectedLessonId] = useState("props");

const selectedLesson =
    lessons.find(lesson => lesson.id === selectedLessonId) ?? null;
~~~

This pattern is useful when the selected entity is already present in another state or data source. If the entity is not available in that source, storing the needed value directly may be more appropriate.

## Initial values and lazy initialization

The value passed to <code>useState</code> is used only for the initial render. It does not synchronize state with a prop that changes later.

~~~jsx
function Message({ initialText }) {
    const [text, setText] = useState(initialText);
    // This component intentionally starts with initialText.
    // Later changes to initialText do not replace text.
}
~~~

Use a name such as <code>initialText</code> or <code>defaultValue</code> when the component intentionally uses a prop only as its starting value. If the display should always reflect the current prop, use the prop directly instead of copying it into state.

If calculating an initial state is expensive, pass a pure initializer function rather than calling it on every render:

~~~jsx
const [items, setItems] = useState(createInitialItems);
~~~

React calls the initializer to obtain the starting value. Pass the function itself, not <code>createInitialItems()</code>. Initializers should be pure and safe to run during rendering.

## Update state immutably

For numbers, strings, and booleans, a setter replaces the current value:

~~~jsx
setPage(2);
setSearchText("forms");
setIsOpen(false);
~~~

For objects and arrays, create new values instead of mutating the existing ones:

~~~jsx
setSettings(previousSettings => ({
    ...previousSettings,
    theme: "dark"
}));
~~~

~~~jsx
setItems(previousItems => [
    ...previousItems,
    newItem
]);
~~~

~~~jsx
setItems(previousItems =>
    previousItems.filter(item => item.id !== removedId)
);
~~~

Use a functional updater when the new state depends on the previous state. Use a direct value when replacing the state with a value that does not depend on the old one.

## State is local to a component instance

A state variable belongs to one mounted instance of a component. If the same component is rendered in two places, each instance has its own state unless a parent coordinates them through props and callbacks.

If multiple parts of the UI must stay in sync, choose a common owner and pass data down. If only one component needs a value, keeping that state nearby usually makes the component tree simpler.

State is not automatically saved to a database or retained after a page reload. Persisting application data requires an explicit storage or server strategy; React state describes the current UI during the component's lifetime.

## Common mistakes

- Using a normal local variable for a value that must survive renders and update the UI.
- Calling a state setter by assigning to its state variable.
- Calling <code>useState</code> in a condition, loop, event handler, or nested function.
- Storing values that can be derived from existing props or state.
- Maintaining duplicate copies of a selected record or calculated count.
- Representing mutually exclusive statuses with booleans that allow contradictory combinations.
- Mutating an object or array held in state.
- Copying an outer object but mutating a nested object shared with the previous state.
- Expecting a new initial prop value to reset state automatically.
- Passing an initializer function's result when a pure initializer function should be passed.
- Moving every state value to the top-level app even when one local component owns it.
- Assuming React state is persisted to a server or survives a full reload.

## Review checklist

- [ ] State contains values that change and affect rendered UI.
- [ ] Hooks are called at the top level in a consistent order.
- [ ] Each piece of state has one clear owner.
- [ ] Calculated values are derived instead of duplicated in state.
- [ ] The state shape avoids impossible combinations and needless nesting.
- [ ] Related fields are grouped when they change together.
- [ ] Objects and arrays are updated by creating new values.
- [ ] A selected ID is used instead of a duplicate selected object when appropriate.
- [ ] Initial props are treated as initial values only when that is intentional.
- [ ] Persistence is handled explicitly outside of ordinary component state.

## Summary

<code>useState</code> gives a component a value that survives renders and a setter that requests an updated render. Call Hooks at the top level, then model only the changing facts the UI needs. Keep each value in one appropriate owner, derive totals and filtered views from existing state, avoid contradictory or deeply nested structures, and replace objects and arrays instead of mutating them.

## Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [066 - Events and state updates](066-events-and-state-updates.md) | [Q&A](../qnas/067-usestate-and-state-design.md) | [Example](../examples/067-usestate-and-state-design.md) | [068 - Conditional rendering and lists](068-conditional-rendering-and-lists.md) |
