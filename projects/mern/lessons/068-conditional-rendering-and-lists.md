# 068 - Conditional rendering and lists

## Render different UI for different conditions

A component can use ordinary JavaScript control flow to decide what JSX to return. Use an early return when the whole component should show a different state:

~~~jsx
function LessonStatus({ isLoading, error, lesson }) {
    if (isLoading) {
        return <p role="status">Loading lesson...</p>;
    }

    if (error) {
        return <p role="alert">{error}</p>;
    }

    if (!lesson) {
        return <p>Lesson not found.</p>;
    }

    return <h1>{lesson.title}</h1>;
}
~~~

This approach works well for distinct loading, error, missing-data, and success states. Order conditions deliberately so that the most important state is handled first and the success UI is easy to read.

## Use a ternary for a small either-or choice

A conditional expression can select one of two values or JSX branches:

~~~jsx
function CompletionLabel({ completed }) {
    return (
        <p>
            {completed ? "Complete" : "In progress"}
        </p>
    );
}
~~~

A ternary is most readable for one short choice. For longer branches, use an ordinary <code>if</code> statement or calculate a named value before returning JSX.

Avoid deeply nested ternaries. They make it harder to see which condition selects each branch.

## Use logical AND for a simple optional section

The logical AND operator can include JSX when a boolean condition is true:

~~~jsx
function NotificationArea({ unreadCount }) {
    return (
        <section>
            {unreadCount > 0 && (
                <p>{unreadCount} unread messages</p>
            )}
        </section>
    );
}
~~~

If the left operand is truthy, JavaScript evaluates and returns the right operand. If it is falsy, JavaScript returns the left operand. React renders <code>false</code>, <code>null</code>, and <code>undefined</code> as no visible content, but it renders the number <code>0</code>.

This is a common mistake:

~~~jsx
{unreadCount && <p>Unread messages</p>}
~~~

When <code>unreadCount</code> is zero, this expression evaluates to <code>0</code>, so the page displays a zero. Use an explicit boolean condition such as <code>unreadCount &gt; 0</code>.

## Return null when a component should render nothing

A component can return <code>null</code> when it has no UI to show:

~~~jsx
function OptionalBadge({ show }) {
    if (!show) {
        return null;
    }

    return <span className="badge">New</span>;
}
~~~

Use this intentionally. If the parent can make the choice clearly, it may be simpler to include or omit the component in the parent's JSX.

An empty state is not always the same as rendering nothing. If the user needs feedback, show an explicit message such as "No lessons match this filter."

## Render a list from an array

Use JavaScript's <code>map()</code> method to turn data items into JSX elements:

~~~jsx
const lessons = [
    { id: "components", title: "Components and composition" },
    { id: "props", title: "Props and one-way data flow" }
];

function LessonList({ lessons }) {
    return (
        <ul>
            {lessons.map(lesson => (
                <li key={lesson.id}>{lesson.title}</li>
            ))}
        </ul>
    );
}
~~~

The array contains the data; <code>map()</code> creates one list item for each lesson. Keep semantic list elements together: use <code>&lt;ul&gt;</code> or <code>&lt;ol&gt;</code> as the parent of <code>&lt;li&gt;</code> elements.

A block-bodied callback needs an explicit return:

~~~jsx
{lessons.map(lesson => {
    return <li key={lesson.id}>{lesson.title}</li>;
})}
~~~

Without <code>return</code>, that callback returns <code>undefined</code> and no item is rendered.

## Give each list item a stable key

Every JSX element directly returned from a <code>map()</code> needs a key that is unique among its siblings:

~~~jsx
{lessons.map(lesson => (
    <li key={lesson.id}>{lesson.title}</li>
))}
~~~

A key helps React match each item with the same item in a later render when items are inserted, removed, or reordered. Use a stable ID from the data. Do not generate a random key while rendering.

Avoid using the array index as the key when items can change order or membership. If an item is removed, later items shift positions, and React may associate existing component state or DOM with the wrong data item. An index is only appropriate when the list is static and will never be reordered, inserted into, or filtered.

Keys are special to React and are not passed to a child component as an ordinary prop. If the child needs the identifier, pass it separately:

~~~jsx
{lessons.map(lesson => (
    <LessonRow
        key={lesson.id}
        lessonId={lesson.id}
        lesson={lesson}
    />
))}
~~~

## Filter data before rendering it

Use <code>filter()</code> to select the data to show, then <code>map()</code> to render that selection:

~~~jsx
const visibleLessons = lessons.filter(lesson => {
    return lesson.category === selectedCategory;
});

return (
    <ul>
        {visibleLessons.map(lesson => (
            <li key={lesson.id}>{lesson.title}</li>
        ))}
    </ul>
);
~~~

The key belongs on the element produced by the <code>map()</code>, not on the data object or the outer list. Filtering does not change the identity of a lesson; its stable key remains the same.

If the filter is stored in state, derive the visible items during render from the current data and filter value. Do not store a second filtered array in state unless there is a specific reason to manage it independently.

## Handle empty filtered lists explicitly

After filtering, there may be no items to show. Render a useful message instead of an empty list when that better explains the result:

~~~jsx
function LessonResults({ lessons }) {
    if (lessons.length === 0) {
        return <p>No lessons match this filter.</p>;
    }

    return (
        <ul>
            {lessons.map(lesson => (
                <li key={lesson.id}>{lesson.title}</li>
            ))}
        </ul>
    );
}
~~~

The length check is safe here because it is an ordinary JavaScript <code>if</code>. If using <code>&amp;&amp;</code> in JSX, compare the length to zero explicitly so an empty array's length does not render as visible text.

## Return several elements for one item

If each data item needs to produce multiple sibling elements, give the group a key. The short fragment syntax cannot receive a key, so use the explicit <code>Fragment</code> component:

~~~jsx
import { Fragment } from "react";

function LessonDetails({ lessons }) {
    return (
        <dl>
            {lessons.map(lesson => (
                <Fragment key={lesson.id}>
                    <dt>{lesson.title}</dt>
                    <dd>{lesson.summary}</dd>
                </Fragment>
            ))}
        </dl>
    );
}
~~~

Use a wrapper element when it has semantic meaning or is useful for styling. Use a keyed fragment when the group needs no extra DOM element.

## Combine loading, error, empty, and result branches

A data-driven screen often has several possible states. Make the branches explicit and keep their order consistent with the application behavior:

~~~jsx
function LessonResults({ status, error, lessons }) {
    if (status === "loading") {
        return <p role="status">Loading lessons...</p>;
    }

    if (status === "error") {
        return <p role="alert">{error}</p>;
    }

    if (lessons.length === 0) {
        return <p>No lessons are available.</p>;
    }

    return (
        <ul>
            {lessons.map(lesson => (
                <li key={lesson.id}>{lesson.title}</li>
            ))}
        </ul>
    );
}
~~~

A distinct status value helps avoid ambiguous combinations such as loading and error being true at the same time. The next chapter covers forms; later data-fetching chapters can apply these states to server responses.

## Common mistakes

- Using a nested ternary for a complex set of UI states.
- Writing <code>count &amp;&amp; &lt;Message /&gt;</code> when count can be zero.
- Forgetting to return JSX from a block-bodied <code>map()</code> callback.
- Missing a key on an element directly produced by <code>map()</code>.
- Using array indexes as keys for lists that can change or be reordered.
- Generating a different random key during each render.
- Putting the key on a parent wrapper instead of the mapped element.
- Expecting a child component to read <code>props.key</code>.
- Using a key that is not unique among sibling items.
- Rendering <code>&lt;li&gt;</code> elements without a semantic list parent.
- Showing a blank area when the user should be told that no filtered results exist.
- Forgetting a key on a fragment returned from <code>map()</code>.
- Storing a filtered copy of data when it can be derived from current state.

## Review checklist

- [ ] Conditions use <code>if</code>, ternaries, or <code>&amp;&amp;</code> according to their complexity.
- [ ] Numeric conditions compare explicitly to avoid rendering zero.
- [ ] Loading, error, empty, and success states are clear and ordered.
- [ ] Arrays are rendered with <code>map()</code> and block callbacks return their JSX.
- [ ] Each mapped sibling has a stable, unique key from its data.
- [ ] Keys are placed on the elements returned by the map callback.
- [ ] Any ID needed by a child is passed separately from its key.
- [ ] List markup uses appropriate <code>ul</code>, <code>ol</code>, and <code>li</code> elements.
- [ ] Empty filtered results provide useful feedback when appropriate.
- [ ] Multi-element mapped output uses a keyed fragment or meaningful wrapper.

## Summary

Use JavaScript conditions to choose what a component renders, keeping branches clear and avoiding nested ternaries. Use <code>&amp;&amp;</code> only when its left side is truly boolean or explicitly compared, because zero renders as text. Build lists with <code>map()</code>, filter the source data as needed, and give each mapped sibling a stable key from its data. Show clear empty and loading states, and use a keyed fragment when one list item produces multiple sibling elements.

## Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [067 - useState and state design](067-usestate-and-state-design.md) | [Q&A](../qnas/068-conditional-rendering-and-lists.md) | [Example](../examples/068-conditional-rendering-and-lists.md) | [069 - Forms and controlled inputs](069-forms-and-controlled-inputs.md) |
