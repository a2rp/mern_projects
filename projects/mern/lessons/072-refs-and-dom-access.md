# 072 - Refs and DOM access

React should normally control the DOM through state and JSX. Sometimes an interaction needs an imperative browser operation, such as focusing an input, selecting its text, scrolling an element into view, measuring its size, or calling a method on a browser API. A ref gives a component a way to retain a value between renders and, commonly, to access a DOM node.

Refs are an escape hatch. Use them when a value does not determine the rendered UI or when you need a DOM operation React does not express declaratively. Use state for information that should change what React renders.

## Learning goals

By the end of this chapter, you should be able to:

- Create a ref with <code>useRef</code>.
- Attach a ref to a DOM element and use its browser methods.
- Explain why changing <code>ref.current</code> does not trigger a render.
- Choose between state and a ref.
- Read or update a DOM ref at a safe time.
- Avoid destructive DOM changes that conflict with React.
- Pass refs to reusable components using the API for the React version in use.

## What is a ref?

<code>useRef(initialValue)</code> returns a stable object with a mutable <code>current</code> property.

~~~jsx
import { useRef } from "react";

function SearchForm() {
  const inputRef = useRef(null);

  // ...
}
~~~

On the first render, <code>inputRef.current</code> contains <code>null</code>. If the ref is attached to a DOM element, React assigns that element to <code>current</code> during the commit. When the element is removed, React resets the ref to <code>null</code>.

A ref object remains the same between renders. Changing <code>ref.current</code> does not tell React to render again.

## Attach a ref to a DOM element

Pass the ref to a built-in element's <code>ref</code> prop:

~~~jsx
import { useRef } from "react";

export default function SearchForm() {
  const inputRef = useRef(null);

  function handleFocus() {
    inputRef.current?.focus();
  }

  return (
    <form>
      <label htmlFor="site-search">Search</label>
      <input id="site-search" ref={inputRef} />
      <button type="button" onClick={handleFocus}>
        Focus search
      </button>
    </form>
  );
}
~~~

After the input is committed to the DOM, <code>inputRef.current</code> refers to its HTML input element. The click handler can call its browser <code>focus()</code> method.

Other useful non-destructive DOM operations include:

- <code>focus()</code> to move keyboard focus.
- <code>select()</code> to select text in a text control.
- <code>scrollIntoView()</code> to bring an element into view.
- Reading layout measurements when necessary.

## Refs and state

Both state and refs persist between renders, but they serve different purposes.

| Use state when… | Use a ref when… |
| --- | --- |
| A value affects what should appear on screen | A value is needed between renders but does not affect rendered output |
| A change should cause React to render again | A change should not cause React to render again |
| You are modeling UI state or application data | You need a DOM node, timer id, or other imperative handle |

For example, an input's visible text usually belongs in state when the UI uses it to filter a list. A DOM ref to that input can separately be used to focus it. The ref does not replace the input's state.

~~~jsx
const [query, setQuery] = useState("");
const inputRef = useRef(null);

<input
  ref={inputRef}
  value={query}
  onChange={(event) => setQuery(event.target.value)}
/>;
~~~

Do not put a value in a ref if changing it should update the screen. React does not observe changes to <code>current</code>.

## Store non-rendering values

A ref can also retain mutable information that does not belong in rendered output, such as an interval id or an imperative object created once.

~~~jsx
const intervalIdRef = useRef(null);

function start() {
  intervalIdRef.current = window.setInterval(doWork, 1000);
}

function stop() {
  window.clearInterval(intervalIdRef.current);
  intervalIdRef.current = null;
}
~~~

If the UI must show whether the interval is running, store that status in state as well. The ref can own the id; state can own the visible status.

Do not use a ref as a substitute for state just because it is mutable. Keep each value in the place that matches how it is used.

## When it is safe to access a ref

Do not read or write a DOM ref during rendering. During the render phase, React may not have created or updated the corresponding DOM node. On the first render it is still <code>null</code>. During an update, the DOM can still represent the previous commit.

Common safe places to access a DOM ref include:

- An event handler, such as after the user presses a button.
- An Effect, when synchronization should happen after a commit and is not tied to a particular event.
- A callback ref when React attaches or detaches a node.

~~~jsx
function handleSelectText() {
  inputRef.current?.select();
}
~~~

If an imperative action is caused by a click, perform it in that event handler. Do not add an Effect that watches a flag set only to indicate that the click happened.

A narrow exception for render-time ref initialization is creating a stable value only when <code>current</code> is <code>null</code> and the initialization is predictable. Avoid other reads and writes to refs during render.

## Callback refs

A callback ref is a function passed to a DOM element's <code>ref</code> prop. React calls it with the node when attaching it. This is useful when a ref needs to respond to a node appearing or when managing a collection of nodes.

~~~jsx
function Heading() {
  function setHeadingNode(node) {
    if (node) {
      node.dataset.ready = "true";
    }
  }

  return <h1 ref={setHeadingNode}>Welcome</h1>;
}
~~~

A callback ref should be stable when practical. If a new callback function is created on every render, React may detach the previous callback and attach the new one again.

In React 19, a callback ref may return a cleanup function, which React calls when detaching the node. In earlier React versions, React calls the callback with <code>null</code> when the node detaches. Strict Mode also performs an extra development-only setup and cleanup cycle for callback refs to help expose missing cleanup.

For a single DOM node, an object ref from <code>useRef</code> is usually simpler.

## Refs on custom components

A ref attached to a built-in DOM element points to that DOM node. A custom function component does not automatically expose its internal DOM node in the same way.

In React 19, a function component can receive <code>ref</code> as a prop and pass it to a DOM element:

~~~jsx
function SearchInput({ ref, label }) {
  return (
    <label>
      {label}
      <input ref={ref} />
    </label>
  );
}
~~~

In React 18 and earlier, use <code>forwardRef</code> to pass a ref through a function component:

~~~jsx
import { forwardRef } from "react";

const SearchInput = forwardRef(function SearchInput({ label }, ref) {
  return (
    <label>
      {label}
      <input ref={ref} />
    </label>
  );
});
~~~

Use the API supported by the React version in the project. Prefer exposing a normal prop-based interface when possible; parent access to a child's entire DOM node can make that child harder to change.

## Expose a small imperative API

Sometimes a reusable component needs to expose one or two actions, such as <code>focus()</code>, without giving the parent direct access to its entire DOM node. <code>useImperativeHandle</code> can define that limited API.

This is an advanced pattern. Prefer props and state for ordinary data flow. Use an imperative handle for genuine imperative actions such as focusing a custom input or controlling a media player.

~~~jsx
import { forwardRef, useImperativeHandle, useRef } from "react";

const SearchInput = forwardRef(function SearchInput(props, ref) {
  const inputRef = useRef(null);

  useImperativeHandle(ref, () => ({
    focus() {
      inputRef.current?.focus();
    },
    select() {
      inputRef.current?.select();
    },
  }));

  return <input ref={inputRef} {...props} />;
});
~~~

A parent holding this ref can call only the methods exposed by the component, rather than manipulating its internal element directly.

## DOM changes that can conflict with React

React expects to manage the DOM it renders. Imperatively removing a React-rendered node or changing its children can make the actual DOM disagree with React's next render.

Prefer state-driven changes:

~~~jsx
const [isVisible, setIsVisible] = useState(true);

return (
  <>
    {isVisible && <p>Welcome back</p>}
    <button type="button" onClick={() => setIsVisible(false)}>
      Hide message
    </button>
  </>
);
~~~

Avoid calling <code>remove()</code> on that paragraph or rewriting its text with <code>innerHTML</code>. React still believes it owns the markup and may later update or recreate it.

Non-destructive operations such as focusing or scrolling do not usually conflict with React's rendering because they do not change the structure React manages.

## Managing a list of refs

When you render a list, an array of refs created once may not stay aligned if items are inserted, removed, or reordered. Use stable item ids to associate nodes with data, and manage the node map with callback refs when you need direct access to many elements.

~~~jsx
const itemNodesRef = useRef(new Map());

function setItemNode(itemId, node) {
  if (node) {
    itemNodesRef.current.set(itemId, node);
  } else {
    itemNodesRef.current.delete(itemId);
  }
}

return items.map((item) => (
  <li
    key={item.id}
    ref={(node) => setItemNode(item.id, node)}
  >
    {item.label}
  </li>
));
~~~

If the callback changes every render, React may detach and reattach it. For a large or frequently changing list, use a stable callback per item and include cleanup as appropriate for the React version. If you only need to scroll to a particular item, declarative state or browser-native element navigation may be simpler.

## Common mistakes

- Using a ref for a value that should cause a render.
- Expecting a ref change to update the UI.
- Reading <code>ref.current</code> during render before React attaches the node.
- Assuming a DOM ref can never be <code>null</code>.
- Directly removing or rewriting React-managed nodes.
- Using a DOM query when a ref can point directly to the target.
- Using array indexes to keep refs aligned with a reorderable list.
- Passing a custom component ref without using the API supported by that React version.
- Creating a callback ref repeatedly without considering detach/attach behavior.
- Exposing an entire DOM node when a small imperative API would be enough.

## Chapter checklist

Before using a ref, ask:

- Does this value affect rendered output? If yes, use state.
- Is the action an imperative DOM or browser operation?
- Can a user event handler perform it directly?
- Is the element mounted at the time the ref is read?
- Can the operation be done without changing React-managed DOM structure?
- Is the ref correctly attached, and can it be <code>null</code>?
- If this is a custom component, does it expose refs using the correct React-version API?
- If the ref is a callback, is its attach and cleanup behavior clear?

## Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [071 - Effects and external synchronization](071-effects-and-external-synchronization.md) | [Q&A](../qnas/072-refs-and-dom-access.md) | [Example](../examples/072-refs-and-dom-access.md) | [073 - Custom hooks](073-custom-hooks.md) |
