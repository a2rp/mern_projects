# 061 - React mental model and declarative UI

React is a JavaScript library for describing user interfaces as components. Instead of manually finding and changing DOM nodes after every interaction, you describe what the interface should look like for its current data and state. When inputs change, React renders the components again and commits the necessary DOM updates.

This mental model makes interfaces easier to split into reusable pieces and helps explain where data belongs, why state updates trigger rendering, and why rendering code should stay pure.

## Learning goals

By the end of this chapter, you should be able to:

- Explain declarative UI and how it differs from imperative DOM updates.
- Describe components, JSX, props, state, and event handlers.
- Understand the high-level render and commit process.
- Keep render logic pure and calculate derived values from current inputs.
- Choose component boundaries and state ownership deliberately.
- Recognize common React mistakes before building a larger app.

## Declarative UI: describe the result

Imperative code tells the browser each step to take:

~~~js
const message = document.querySelector("#message");
message.textContent = "Welcome back";
message.classList.add("visible");
~~~

Declarative React code describes the UI for the current values:

~~~jsx
function WelcomeMessage({ isSignedIn }) {
    return (
        <p className={isSignedIn ? "visible" : "hidden"}>
            {isSignedIn ? "Welcome back" : "Please sign in"}
        </p>
    );
}
~~~

The component does not manually search for the paragraph or patch its class. It returns a description. React handles rendering that description into the DOM and updating the DOM when the relevant inputs change.

Declarative does not mean that the browser DOM disappears. React still uses the DOM in a web app; React coordinates updates within the part of the page it manages. Avoid mixing unrelated code that manually changes the same DOM nodes behind React's back.

## Components describe pieces of the interface

A component is usually a JavaScript function that returns JSX:

~~~jsx
function ProductCard() {
    return (
        <article>
            <h2>Keyboard</h2>
            <p>Wireless mechanical keyboard</p>
            <button type="button">Add to cart</button>
        </article>
    );
}
~~~

Component names begin with a capital letter so JSX can distinguish a component from a built-in HTML element. Components can be composed:

~~~jsx
function ProductList() {
    return (
        <section aria-labelledby="products-heading">
            <h1 id="products-heading">Products</h1>
            <ProductCard />
            <ProductCard />
        </section>
    );
}
~~~

Each component should have a clear responsibility. Small components are useful when they clarify structure, behavior, reuse, or independent state. Splitting every HTML element into a component adds indirection without automatically improving the design.

## JSX is a syntax for describing UI

JSX looks similar to HTML, but it is JavaScript syntax transformed by build tooling. It lets markup-like structure and JavaScript expressions appear together.

~~~jsx
function Greeting({ name }) {
    const label = name ? "Hello, " + name : "Hello, guest";

    return <h1>{label}</h1>;
}
~~~

Some JSX differences to recognize:

- Return one enclosing element, or a fragment such as `<>...</>`.
- Use `className` for the CSS class attribute.
- Use camelCase for many DOM properties and event props, such as `tabIndex` and `onClick`.
- Put JavaScript expressions inside braces.
- Close tags, including elements that are empty in HTML, such as `<img />`.
- Use `htmlFor` for a label's `for` association.

JSX is not a string of HTML. Do not concatenate untrusted strings into markup or use `dangerouslySetInnerHTML` for ordinary UI rendering.

## Props pass information into components

Props are inputs provided by a parent. They allow one component to describe different data using the same structure:

~~~jsx
function ProductCard({ name, description, priceLabel }) {
    return (
        <article className="product-card">
            <h2>{name}</h2>
            <p>{description}</p>
            <p>{priceLabel}</p>
        </article>
    );
}

function FeaturedProducts() {
    return (
        <section>
            <ProductCard
                name="Keyboard"
                description="A compact mechanical keyboard."
                priceLabel="$24.99"
            />
            <ProductCard
                name="Monitor"
                description="A 27-inch display."
                priceLabel="$189.00"
            />
        </section>
    );
}
~~~

Treat props as read-only inputs. A child should not change the parent's props. If a child needs to request a change, the parent can pass a callback prop and keep ownership of the data.

Props can contain strings, numbers, booleans, arrays, objects, functions, and other React elements. Choose explicit names and shapes that make a component's needs clear.

## State represents information that changes over time

State is component-owned information that can change because of user interaction, network results, or other application events. Use a state hook when a change should cause React to render the component again.

~~~jsx
import { useState } from "react";

function LikeButton() {
    const [liked, setLiked] = useState(false);

    return (
        <button
            type="button"
            aria-pressed={liked}
            onClick={() => setLiked(!liked)}
        >
            {liked ? "Liked" : "Like"}
        </button>
    );
}
~~~

Calling the setter asks React to update state and render again. Assigning a new value to a local variable does not update component state:

~~~js
let count = 0;
count += 1; // React is not notified about this assignment.
~~~

State is a snapshot for the render that created the current event handler. When a new state value depends on the previous value, use the updater form:

~~~jsx
setCount(previousCount => previousCount + 1);
~~~

This is especially useful when multiple updates are queued. Do not mutate objects or arrays stored in state; create a new value that represents the update.

## Render and commit at a high level

A simplified update cycle has three ideas:

1. **Trigger:** React starts an initial render or schedules another render after a state update or parent update.
2. **Render:** React calls component functions to calculate the next UI description.
3. **Commit:** React applies the needed changes to the DOM.

A re-render does not mean React rebuilds every DOM node. React calculates the next UI and commits the changes needed for the displayed result. Component functions may run more than once, including additional calls in development Strict Mode to expose impure logic.

## Keep rendering pure

Rendering should calculate UI from current props, state, and context. For the same inputs, it should return the same JSX and avoid changing existing values outside the component.

~~~jsx
function CartSummary({ items }) {
    const itemCount = items.reduce((total, item) => total + item.quantity, 0);

    return <p>{itemCount} items in your cart</p>;
}
~~~

Avoid side effects during render:

~~~jsx
function BadExample() {
    document.title = "Products"; // Do not mutate the DOM during render.
    return <h1>Products</h1>;
}
~~~

Respond to a click in an event handler. Use an Effect only when a component needs to synchronize with something outside React, such as a browser API or external subscription. Do not use an Effect just to calculate a value that can be computed during render.

Pure rendering lets React repeat or prioritize rendering without unexpected external changes. It also makes a component easier to reason about because its output follows its inputs.

## Derive values instead of duplicating state

If a value can be calculated from current props or state, usually calculate it during render instead of storing a second copy.

~~~jsx
function Cart({ items }) {
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotalCents = items.reduce(
        (sum, item) => sum + item.priceCents * item.quantity,
        0
    );

    return (
        <p>
            {itemCount} items — subtotal {subtotalCents} cents
        </p>
    );
}
~~~

Keeping both `items` and a separately updated `itemCount` state can create mismatches. Store the minimal changing data and derive totals, labels, and filtered views from it.

## Put state where it is needed

Keep state in the closest common parent that needs to read or change it:

- If only one component needs a value, keep it local.
- If sibling components need the same value, move it to their nearest shared parent and pass it down.
- Pass callbacks down when a child interaction should update state owned by the parent.
- Avoid placing every value in a global store before the application needs shared global state.

This pattern is often called lifting state up. It makes the data flow explicit: parents pass values down as props, and children communicate requests through callbacks.

## Handle conditional and repeated UI from data

A component can describe different visual states with normal JavaScript conditions:

~~~jsx
function Results({ isLoading, error, products }) {
    if (isLoading) return <p role="status">Loading products…</p>;
    if (error) return <p role="alert">Could not load products.</p>;
    if (products.length === 0) return <p>No products found.</p>;

    return (
        <ul>
            {products.map(product => (
                <li key={product.id}>
                    <strong>{product.name}</strong>
                    <span>{product.priceLabel}</span>
                </li>
            ))}
        </ul>
    );
}
~~~

Repeated elements need a stable `key` so React can match an item across updates. Use a stable identifier from the data. Avoid array indexes as keys when items can be reordered, inserted, or deleted; an index may cause component state or DOM state to follow the wrong item.

## React in a MERN application

React owns the client interface and its client-side interaction state. Express exposes server APIs, and MongoDB stores persisted application data through the backend. A React state update does not automatically save anything to MongoDB; the client must call an API and handle the response.

Client-side checks improve user feedback, but they do not secure data. The server must authenticate and authorize requests, validate input, and enforce business rules independently.

## Common mistakes

- Treating JSX as an HTML string and manually editing the same DOM nodes React controls.
- Changing props or mutating state objects and arrays.
- Expecting assignment to a local variable to trigger a render.
- Performing network requests, DOM mutations, or other side effects inside render.
- Storing values that can be derived from existing state.
- Keeping shared state separately in multiple sibling components.
- Using unstable list keys such as indexes for reorderable data.
- Assuming a component renders exactly once.
- Assuming a React state change is automatically persisted by the backend.
- Treating frontend validation as a replacement for backend validation.

## Review checklist

- [ ] Components describe UI from their current inputs.
- [ ] Props are treated as read-only values.
- [ ] State is used only for values that change and affect UI.
- [ ] State updates create new arrays or objects instead of mutating them.
- [ ] Derived values are calculated rather than kept in duplicate state.
- [ ] Render logic is pure and side effects are handled elsewhere.
- [ ] Shared state is owned by the nearest common parent that needs it.
- [ ] Repeated elements use stable keys.
- [ ] React and the backend have clear responsibilities.

## Summary

React lets you describe the UI for the current props and state. Components compose those descriptions, event handlers request state changes, and React renders and commits the necessary DOM updates. Keep rendering pure, treat props as read-only, store minimal state, derive values where possible, and make data ownership clear. In a MERN app, React handles the interface while the backend remains responsible for trusted validation, authorization, and persistence.

## Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [060 - Search, filtering, sorting, and pagination APIs](060-search-filtering-sorting-and-pagination-apis.md) | [Q&A](../qnas/061-react-mental-model-and-declarative-ui.md) | [Example](../examples/061-react-mental-model-and-declarative-ui.md) | [062 - Create a React app with modern tooling](062-create-a-react-app-with-modern-tooling.md) |
