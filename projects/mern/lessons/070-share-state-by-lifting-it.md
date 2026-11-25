# 070 - Share state by lifting it

When two or more components need to stay in sync, the state that coordinates them belongs in a component they share. Move that state to their closest common parent, pass its current value down as props, and pass event handlers down so children can request updates. React developers call this lifting state up.

This chapter explains how to choose a state owner, coordinate sibling components, and avoid keeping duplicate copies of the same information.

## Learning goals

By the end of this chapter, you should be able to:

- Identify the closest common parent of components that need shared state.
- Move a state variable from a child to that parent.
- Pass values down and callbacks down through props.
- Build controlled components whose important behavior is configured by their parent.
- Keep each unique piece of state in one authoritative place.
- Derive display values instead of storing duplicate state.
- Decide when local state, lifted state, or context is appropriate.

## The coordination problem

Suppose two search fields should always show the same text. If each field owns its own state, editing one does not update the other:

~~~jsx
function SearchBox() {
  const [query, setQuery] = useState("");

  return (
    <input
      value={query}
      onChange={(event) => setQuery(event.target.value)}
    />
  );
}

function SearchPanel() {
  return (
    <>
      <SearchBox />
      <SearchBox />
    </>
  );
}
~~~

Each <code>SearchBox</code> instance has a separate state variable. The two inputs are independent, even though their markup looks identical.

If both fields represent one shared query, one of them should not own a private copy. Their common parent should own the query and give each field the same value and update callback.

## The lifting pattern

Lifting shared state usually follows these steps:

1. Find the components that need to coordinate.
2. Find their closest common parent in the rendered component tree.
3. Move the shared state and its setter logic into that parent.
4. Pass the current value to each child as a prop.
5. Pass callbacks to children that need to request a change.
6. Render every coordinated view from the same state.

Data flows from parent to child through props. A child does not directly change its parent's state; it calls a callback the parent provided.

~~~text
Shared parent owns query
        |
        +-- passes query and onQueryChange to SearchBox A
        |
        +-- passes query and onQueryChange to SearchBox B
~~~

## A synchronized input example

~~~jsx
import { useState } from "react";

export default function SynchronizedSearch() {
  const [query, setQuery] = useState("");

  return (
    <section>
      <h1>Search the catalog</h1>
      <SearchInput
        label="Search from the toolbar"
        value={query}
        onValueChange={setQuery}
      />
      <SearchInput
        label="Search from the results panel"
        value={query}
        onValueChange={setQuery}
      />
      <p>Current search: {query || "Nothing entered"}</p>
    </section>
  );
}

function SearchInput({ label, value, onValueChange }) {
  return (
    <label>
      {label}
      <input
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
      />
    </label>
  );
}
~~~

Both children receive the same <code>value</code>. When either child calls <code>onValueChange</code>, the parent updates <code>query</code>. React renders the parent and both children with the new value, so both inputs stay synchronized.

The child does not need to know whether the parent uses <code>useState</code>, saves the query in a URL, or applies another update policy. It receives a value and a callback through its props.

## Controlled and uncontrolled components

A component is often called controlled when important behavior is determined by props supplied by its parent. A component is often called uncontrolled when it keeps that behavior in its own local state.

Here, <code>SearchInput</code> is controlled: the parent supplies the value and the callback. An input with its own <code>useState</code> inside <code>SearchInput</code> would be uncontrolled with respect to its parent.

These terms describe component design choices. A component can be partly controlled and partly uncontrolled. For example, a panel can receive whether it is open as a prop but keep local state for a temporary animation detail.

| Design | Where the important value lives | How a parent coordinates it |
| --- | --- | --- |
| Uncontrolled child | The child's local state | The parent cannot directly set that value |
| Controlled child | Parent state, passed as a prop | The parent provides the value and update callback |
| Mixed design | Some values in each place | Each value has a clear owner |

Controlled components are easier to coordinate, synchronize, reset, and test from their parent. Uncontrolled components can be simpler to reuse when the parent does not need to control their changing values. Choose based on the behavior the application needs.

## One active panel in an accordion

Independent panels can each store their own <code>isOpen</code> boolean. That is a reasonable local design if panels should open and close independently.

If the requirement changes so only one panel can be open at a time, those booleans now need coordination. A shared parent can instead own one <code>activeIndex</code>:

~~~jsx
import { useState } from "react";

const sections = [
  {
    title: "About the course",
    content: "The course follows a practical, chapter-based learning path.",
  },
  {
    title: "How to use the notes",
    content: "Read the lesson, review its questions, then work through the example.",
  },
];

export default function CourseAccordion() {
  const [activeIndex, setActiveIndex] = useState(null);

  return (
    <div>
      {sections.map((section, index) => (
        <AccordionPanel
          key={section.title}
          title={section.title}
          isOpen={activeIndex === index}
          onToggle={() =>
            setActiveIndex((currentIndex) =>
              currentIndex === index ? null : index
            )
          }
        >
          {section.content}
        </AccordionPanel>
      ))}
    </div>
  );
}

function AccordionPanel({ title, isOpen, onToggle, children }) {
  const panelId = title.toLowerCase().replaceAll(" ", "-");

  return (
    <section>
      <h2>
        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={onToggle}
        >
          {title}
        </button>
      </h2>
      {isOpen && <div id={panelId}>{children}</div>}
    </section>
  );
}
~~~

The parent stores one value, not a separate boolean for every panel. Each child receives a calculated <code>isOpen</code> prop and an <code>onToggle</code> callback. Because the parent decides the next active index, it can enforce the one-open-at-a-time rule.

The callback uses a functional state update so the next value is calculated from the previous value. This is useful when the update depends on the current state.

## Choosing the owner for each piece of state

For every piece of state, ask:

- Which components read this value?
- Which components can request changes to it?
- Do they need to agree on one value?
- What is their closest common parent?
- Can a child calculate what it needs from props instead of owning a copy?

The component that owns a state value is its source of truth. This does not mean that all application state belongs in the root component. Each state value should live in the lowest component that can coordinate all of its readers and writers.

A text input that only controls its own temporary typing detail can keep local state. A selected category used by a filter bar, result count, and product list belongs in their common parent. A cart shared across distant parts of an application may need a higher-level owner or a context-based design.

## Do not store the same fact twice

If a parent owns <code>query</code>, avoid adding another <code>query</code> state variable in each child. Duplicate state can disagree:

~~~jsx
// Avoid: each child maintains a separate copy of one shared query.
function SearchInput() {
  const [query, setQuery] = useState("");
  // ...
}
~~~

Instead, pass the one value and an update callback:

~~~jsx
function SearchInput({ query, onQueryChange }) {
  return (
    <input
      value={query}
      onChange={(event) => onQueryChange(event.target.value)}
    />
  );
}
~~~

Also avoid storing values that can be calculated from existing state. If a parent has <code>products</code>, <code>query</code>, and <code>category</code>, the visible product list can be derived during render:

~~~jsx
const visibleProducts = products.filter((product) => {
  const matchesQuery = product.name
    .toLowerCase()
    .includes(query.toLowerCase());
  const matchesCategory =
    category === "all" || product.category === category;

  return matchesQuery && matchesCategory;
});
~~~

Keeping <code>visibleProducts</code> in a second state variable would require synchronizing it whenever products, query, or category changed. Deriving it avoids stale or contradictory copies.

## Keep unrelated state close to its users

Lifting state has a cost: every state update rerenders its owner and normally its descendants. Do not move every state variable to the top of the application just because multiple components exist.

Lift only the value that must coordinate components. Keep unrelated temporary state local. For example, a shared selected tab can live in a common parent while a tooltip's open state remains inside the tooltip component.

A good owner is high enough to coordinate the relevant components, and low enough that unrelated parts of the application do not depend on it.

## Props and callback naming

Clear names make the direction of data easier to follow:

~~~jsx
<FilterSelect
  value={category}
  onValueChange={setCategory}
/>
~~~

The parent passes <code>value</code> down and passes <code>onValueChange</code> down. The child calls the callback after a user action. Names such as <code>onSelectCategory</code>, <code>onQueryChange</code>, and <code>onToggle</code> explain what the child is asking the parent to do.

Avoid passing a state setter when a narrower callback gives the child a clearer contract. A child that only changes a category does not need permission to change unrelated parent state.

## When state lifting is no longer enough

For a few nearby components, props and callbacks are usually direct and understandable. If many deeply nested components need the same value, passing it through every intermediate component can become cumbersome. That pattern is often called prop drilling.

Possible next steps include:

- Move the shared state to a more suitable parent if that parent is still easy to understand.
- Use context when a value is needed by many descendants across a subtree.
- Use a dedicated state-management approach when the application has broader coordination needs.

Context does not remove the need to choose state ownership or design updates carefully. Start with the simplest component tree that meets the coordination requirement.

## Common mistakes

- Leaving independent copies of shared state in sibling components.
- Lifting state higher than the components that need it.
- Passing a value down but forgetting to pass the callback needed to change it.
- Making a child display a prop while also keeping a conflicting local copy.
- Duplicating derived data in state and trying to synchronize it manually.
- Mutating an object or array instead of creating an updated value.
- Using an index as shared identity when items can be reordered or removed.
- Treating context as a replacement for deciding which component owns a value.
- Passing a broad state setter when a narrow callback is enough.

## Chapter checklist

Before sharing state between components, check that:

- The components truly need to agree on one value.
- You identified their closest common parent.
- That parent owns the shared state.
- Every child that needs the value receives it through props.
- Children request changes through clear callbacks.
- There is one authoritative copy of each shared fact.
- Derived values are calculated rather than duplicated in state.
- Unrelated state remains local where appropriate.
- State updates create new values instead of mutating existing ones.

## Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [069 - Forms and controlled inputs](069-forms-and-controlled-inputs.md) | [Q&A](../qnas/070-share-state-by-lifting-it.md) | [Example](../examples/070-share-state-by-lifting-it.md) | [071 - Effects and external synchronization](071-effects-and-external-synchronization.md) |
