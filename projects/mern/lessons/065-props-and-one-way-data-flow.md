# 065 - Props and one-way data flow

## What props are

Props are the inputs a parent supplies to a child component. They let a component be configured with the data and behavior it needs, without requiring the parent to know the child's internal markup.

~~~jsx
function LearnerGreeting({ name }) {
    return <p>Welcome, {name}.</p>;
}

function CoursePage() {
    return <LearnerGreeting name="Ashish" />;
}
~~~

The parent sets <code>name</code> in JSX. The child receives it in its function parameter and uses it to render. React components receive one props object; destructuring makes the individual inputs convenient to read.

The same value can be written without destructuring:

~~~jsx
function LearnerGreeting(props) {
    return <p>Welcome, {props.name}.</p>;
}
~~~

Choose the style that makes the component easiest to follow. Destructuring does not change how props work.

## Props can carry JavaScript values

A prop can hold any JavaScript value that makes sense for the component:

~~~jsx
<CourseCard
    title="HTML forms"
    lesson={{ id: "forms", durationMinutes: 18 }}
    tags={["HTML", "accessibility"]}
    isComplete={false}
    onOpen={handleOpen}
/>
~~~

Use quotes for a literal string and braces for a JavaScript expression. Props can include:

- Strings and numbers.
- Booleans and null.
- Objects and arrays.
- Functions, such as event handlers.
- JSX elements, including nested content passed through <code>children</code>.

Give each prop a clear name that describes what it means. A prop interface is the contract between the component and its callers.

## Data flows from parent to child

React interfaces are commonly organized around one-way data flow:

~~~text
parent owns or receives data
            |
            | passes props down
            v
child renders from those props
~~~

The parent decides which values to provide. The child uses those values to render. When the parent renders again with different props, the child receives the new values and its output can change.

Props are therefore not just initial setup values. They describe the inputs for a component at a particular render. A child should not keep a second copy just because it received a prop; use the prop directly unless there is a clear reason to manage a separate local state.

## Props are read-only

A component must not assign to its props or mutate an object or array it receives through a prop.

Incorrect:

~~~jsx
function LessonTitle({ lesson }) {
    lesson.title = "Changed in the child";
    return <h2>{lesson.title}</h2>;
}
~~~

The child does not own that object. Mutating it can produce changes that are difficult to trace and can interfere with React's rendering model. Instead, derive a display value without changing the input:

~~~jsx
function LessonTitle({ lesson }) {
    const displayTitle = lesson.title.trim();
    return <h2>{displayTitle}</h2>;
}
~~~

If the user requests a change, the component should communicate that request to the owner of the data. The owner then creates and supplies the updated value. The next chapter focuses on event handling and state updates.

## Passing data down and intent back up

Data values flow from parent to child. A parent can also pass a function as a prop. The child can call that function to tell the parent that something happened or that the user intends a change.

~~~jsx
function LessonRow({ lesson, onSelect }) {
    return (
        <button
            type="button"
            onClick={() => onSelect(lesson.id)}
        >
            Open {lesson.title}
        </button>
    );
}
~~~

~~~jsx
function LessonList({ lessons, onLessonSelect }) {
    return (
        <ul>
            {lessons.map(lesson => (
                <li key={lesson.id}>
                    <LessonRow
                        lesson={lesson}
                        onSelect={onLessonSelect}
                    />
                </li>
            ))}
        </ul>
    );
}
~~~

The callback is passed down like any other prop. When the child calls it, the function body runs in the parent or other owner that supplied it. The child communicates an event or intent; it does not directly reach into a parent's variables or change the parent's state.

Names such as <code>onSelect</code>, <code>onSave</code>, and <code>onValueChange</code> communicate that a prop is a callback. Keep the payload specific and useful to the caller.

## Choose one owner for shared data

When multiple components need the same changing value, choose one component to own it and pass that value to the components that need it. This is often called a single source of truth for that particular value. It does not mean all application data must live in one component.

For example, if a page heading and a lesson list both need the selected course, the page can own that selection and pass it to both children. Avoid separate copies that can drift out of sync.

If two sibling components need to coordinate, move their shared changing data to their closest common parent, then pass the relevant values and callbacks down. This is commonly called lifting state up.

~~~text
                CoursePage
       owns selectedLessonId
              /       \
             v         v
       LessonList   LessonDetails
       gets value   gets same value
       and callback and callback
~~~

This keeps the decision about shared data in one place and makes the child components easier to reuse. Keep data local when only one component needs it; move it up when multiple components must agree on it.

## Controlled and uncontrolled components

A component is often called controlled when important behavior or displayed values are specified by props. Its parent can decide what value it shows. A component is often called uncontrolled when it manages that information internally.

For example, a controlled selection component receives both its current value and a callback:

~~~jsx
function LessonFilter({ value, onValueChange }) {
    return (
        <select
            value={value}
            onChange={event => onValueChange(event.target.value)}
        >
            <option value="all">All lessons</option>
            <option value="incomplete">Incomplete</option>
            <option value="complete">Complete</option>
        </select>
    );
}
~~~

The component displays <code>value</code>. When a user makes a selection, it calls <code>onValueChange</code>. The owner decides whether and how to update the value, then passes the new value back down.

Controlled components are useful when a parent needs to coordinate or inspect a value. An uncontrolled component can be simpler when its parent does not need to control that value. A component can also mix parent-controlled props with local details; these terms describe design choices rather than a requirement that all state live in one place.

## Default values for optional props

A function parameter can give a prop a default value:

~~~jsx
function Badge({ tone = "neutral", children }) {
    return <span className={"badge badge-" + tone}>{children}</span>;
}
~~~

~~~jsx
<Badge>Draft</Badge>
<Badge tone="success">Published</Badge>
~~~

The default is used when the prop is omitted or its value is undefined. It is not used when the caller explicitly passes null, false, or 0. Choose defaults that represent a sensible behavior, and do not hide required inputs behind misleading fallbacks.

## Avoid opaque prop forwarding

A wrapper can forward a set of props with JSX spread syntax:

~~~jsx
function ProfileCard(props) {
    return <Avatar {...props} />;
}
~~~

This can be useful when the wrapper intentionally forwards the same interface and does not need to interpret the values. But repeated or broad prop spreading can make it unclear which inputs a component accepts and where they go. Prefer explicit props when they make the component's contract easier to understand:

~~~jsx
function ProfileCard({ person, size }) {
    return <Avatar person={person} size={size} />;
}
~~~

Be especially careful when forwarding arbitrary props to a DOM element. Only pass values appropriate for that element, and avoid leaking component-only inputs into rendered markup.

## Keep state derived from props intentional

Do not copy a prop into state just to render it again. That creates two values that can disagree.

Usually this is enough:

~~~jsx
function CourseProgress({ completedCount, totalCount }) {
    const percentage = Math.round((completedCount / totalCount) * 100);

    return <p>{percentage}% complete</p>;
}
~~~

Create separate state from a prop only when the component intentionally needs an independent, editable snapshot with defined synchronization behavior. That is a special design choice, not the default way to receive data.

Likewise, if a value can be calculated from the current props during rendering, calculate it instead of storing another copy. This keeps the component's inputs and output easier to reason about.

## Common mistakes

- Reading a prop name that the parent never supplied.
- Forgetting braces when passing a variable or expression in JSX.
- Mutating a prop or a nested object received through a prop.
- Treating props as state that a child can directly update.
- Copying every prop into local state and creating duplicate sources of truth.
- Passing a callback without the data the parent needs to handle the event.
- Expecting a callback prop to run merely because it was passed; the child must call it.
- Using ambiguous names such as <code>data</code> or <code>fn</code> when a specific name is clearer.
- Providing a default that masks missing required data.
- Spreading every prop through multiple wrapper components without a clear contract.
- Forwarding component-only props to a DOM element.
- Giving sibling components independent copies of a value that must stay synchronized.

## Review checklist

- [ ] Each prop has a clear meaning and a component that owns its value.
- [ ] Parent components pass values using JSX attributes and braces for expressions.
- [ ] Child components read props without mutating them.
- [ ] Callback props communicate user intent to the owner of the data.
- [ ] Shared changing data has one owner and is passed to components that need it.
- [ ] Values are derived during rendering when they do not need their own state.
- [ ] Defaults are used only for genuinely optional inputs.
- [ ] Prop spreading is limited to cases where the forwarding contract is clear.
- [ ] Component-only props are not accidentally forwarded to DOM elements.

## Summary

Props are read-only inputs passed from a parent to a child. They can carry values, objects, arrays, JSX, and callbacks. Data flows down; a child can call a callback prop to communicate an event or intent back to the owner, which decides whether to provide updated data. Give shared values one owner, lift them to a common parent when siblings must coordinate, and avoid mutating or duplicating props.

## Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [064 - Components and composition](064-components-and-composition.md) | [Q&A](../qnas/065-props-and-one-way-data-flow.md) | [Example](../examples/065-props-and-one-way-data-flow.md) | [066 - Events and state updates](066-events-and-state-updates.md) |
