# 063 - JSX and rendering values: example

This example renders a small learning dashboard from JavaScript data. It demonstrates JSX text expressions, dynamic attributes, style objects, conditional branches, arrays rendered with stable keys, and the difference between text and raw HTML.

The code is educational material and is not run. Place the component in the Vite React app created in the previous chapter, then render it from the app entry. The code uses no external data or assets.

## What the example demonstrates

- One JSX root element with nested semantic elements.
- Values inserted into text and attributes with braces.
- Calculated values displayed from data.
- A clear condition that handles a zero count.
- An array mapped into list items with stable IDs as keys.
- A null value selecting an explicit fallback.
- An HTML-like string from an API rendered as text.

## Create the component

~~~jsx
// src/App.jsx
const learner = {
    name: "Ashish",
    nextLesson: null,
    announcement: "<strong>New lesson notes are ready.</strong>"
};

const lessons = [
    { id: "jsx", title: "JSX and rendering values", completed: false },
    { id: "components", title: "Components and composition", completed: false },
    { id: "props", title: "Props and component inputs", completed: false }
];

export default function App() {
    const completedCount = lessons.filter(lesson => lesson.completed).length;
    const progressLabel =
        completedCount + " of " + lessons.length + " lessons complete";

    return (
        <main
            className="dashboard"
            aria-label={"Learning dashboard for " + learner.name}
            style={{
                maxWidth: 640,
                margin: "2rem auto",
                padding: "1.5rem",
                fontFamily: "system-ui, sans-serif"
            }}
        >
            <header>
                <p className="eyebrow">Learning notes</p>
                <h1>{learner.name}'s dashboard</h1>
                <p>{progressLabel}</p>
            </header>

            {completedCount === 0 ? (
                <p role="status">No completed lessons yet. Start with the first lesson.</p>
            ) : (
                <p role="status">
                    You have completed {completedCount} lessons. Keep going!
                </p>
            )}

            <section aria-labelledby="lesson-list-heading">
                <h2 id="lesson-list-heading">Lessons</h2>
                <ul>
                    {lessons.map(lesson => (
                        <li key={lesson.id}>
                            <span>{lesson.title}</span>
                            {" — "}
                            {lesson.completed ? (
                                <span>Complete</span>
                            ) : (
                                <span>In progress</span>
                            )}
                        </li>
                    ))}
                </ul>
            </section>

            <section aria-labelledby="next-lesson-heading">
                <h2 id="next-lesson-heading">Next</h2>
                {learner.nextLesson !== null ? (
                    <p>{learner.nextLesson}</p>
                ) : (
                    <p>No next lesson has been selected.</p>
                )}
            </section>

            <aside>
                <h2>Announcement</h2>
                <p>{learner.announcement}</p>
            </aside>
        </main>
    );
}
~~~

## Read the rendering decisions

### Text and calculated values

The expressions `{learner.name}` and `{progressLabel}` insert JavaScript values into the text content. The string concatenation builds a label before returning JSX, which keeps the markup readable.

### Dynamic attributes and styles

The `aria-label` attribute evaluates a JavaScript expression. The `style` attribute receives an object; CSS property names are written in camelCase, and numeric spacing values use the style API's unit behavior.

### Conditional values

The completion message uses a ternary because exactly one of two messages should appear. The condition compares the count with zero, producing a boolean. This avoids the common numeric-zero issue with an expression such as `{completedCount && <p>...</p>}`.

The next-lesson section explicitly checks whether its value is null and displays a fallback when it is. A null child by itself would display nothing, but explicit UI feedback is clearer here.

### List values and keys

`lessons.map()` returns one `li` for each data item. `lesson.id` is stable and unique among these sibling list items, so React can match each item when the list changes.

### HTML-like text is still text

The announcement value contains tags as characters. Since it is inserted as a normal text child, React displays the angle brackets and tag text rather than interpreting the string as markup. Do not switch to `dangerouslySetInnerHTML` to display ordinary API text.

## Expected output

The page shows:

- **Ashish's dashboard**
- **0 of 3 lessons complete**
- The status message **No completed lessons yet. Start with the first lesson.**
- A three-item list, each labeled **In progress**
- **No next lesson has been selected.**
- The announcement text literally includes `<strong>` and `</strong>` around **New lesson notes are ready.**

If one lesson's `completed` value changes to `true`, the calculated count and that row's status change when React renders the updated data. The code derives the count from the lesson list instead of storing a duplicate count.

## Common mistakes to compare

Incorrect: zero can become a visible text child.

~~~jsx
{completedCount && <p>Some lessons are complete.</p>}
~~~

Clearer:

~~~jsx
{completedCount > 0 && <p>Some lessons are complete.</p>}
~~~

Incorrect: a plain object cannot be displayed directly.

~~~jsx
<p>{learner}</p>
~~~

Render a field:

~~~jsx
<p>{learner.name}</p>
~~~

Incorrect: an array index is not a stable identity if the list can change.

~~~jsx
{lessons.map((lesson, index) => (
    <li key={index}>{lesson.title}</li>
))}
~~~

Use the item's stable data ID:

~~~jsx
{lessons.map(lesson => (
    <li key={lesson.id}>{lesson.title}</li>
))}
~~~

## Chapter navigation

| Previous chapter | Chapter Q&A | Next chapter |
| --- | --- | --- |
| [062 - Create a React app with modern tooling](../lessons/062-create-a-react-app-with-modern-tooling.md) | [Q&A](../qnas/063-jsx-and-rendering-values.md) | [064 - Components and composition](../lessons/064-components-and-composition.md) |
