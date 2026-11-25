# 063 - JSX and rendering values

JSX lets you describe a React interface with HTML-like syntax inside JavaScript. JavaScript expressions can supply text, attributes, conditions, and repeated elements. JSX is transformed by the app's tooling; the browser does not treat the JSX source as an HTML string.

Understanding which values React can render and where JavaScript expressions belong helps prevent syntax errors, incorrect output, and unsafe HTML handling.

## Learning goals

By the end of this chapter, you should be able to:

- Write valid JSX with one root element and properly closed tags.
- Insert JavaScript expressions into JSX text and attributes.
- Render strings, numbers, elements, arrays, and empty values correctly.
- Choose readable patterns for conditional rendering.
- Render data collections with stable keys.
- Distinguish a string value from raw HTML.
- Avoid common JSX syntax and security mistakes.

## JSX is JavaScript syntax

JSX looks like markup but is syntax used in JavaScript files and transformed by the project's build tool. It is commonly used with React, but JSX syntax and the React library are separate concepts.

~~~jsx
function Welcome() {
    return <h1>Welcome to the catalog</h1>;
}
~~~

The component returns a description of the UI. JSX is not a string and does not ask you to manually create the corresponding DOM nodes.

## Return one root element

A component's returned JSX must have one enclosing root. If the output needs several sibling elements but no extra DOM wrapper, use a fragment:

~~~jsx
function PageTitle() {
    return (
        <>
            <h1>Products</h1>
            <p>Browse the current catalog.</p>
        </>
    );
}
~~~

The fragment groups JSX for React without adding an element to the browser DOM.

## Close tags and JSX attributes

JSX is stricter than browser HTML parsing:

- Close every element.
- Write an explicit closing tag for ordinary elements.
- Close void elements such as `img`, `input`, and `br` with `/>`.
- Use `className` for a CSS class and `htmlFor` for a label's `for` attribute.
- Use camelCase for many DOM properties and event props, such as `tabIndex` and `onClick`.
- Keep accessibility and custom data attribute names in their supported forms, such as `aria-label` and `data-testid`.

~~~jsx
function Avatar({ imageUrl, name }) {
    return (
        <img
            className="avatar"
            src={imageUrl}
            alt={name}
            width={48}
            height={48}
        />
    );
}
~~~

A string literal attribute uses quotes. A JavaScript value uses braces:

~~~jsx
<a className="product-link" href={product.href}>
    {product.name}
</a>
~~~

Do not put braces inside the quotes if the value should be evaluated. For example, `href="{product.href}"` is a literal string, not an expression.

## Insert JavaScript expressions with braces

Use a pair of braces to insert a JavaScript expression into JSX text:

~~~jsx
function Greeting({ name }) {
    return <h1>Hello, {name}</h1>;
}
~~~

Braces can contain expressions such as variables, property access, calculations, function calls, and conditional expressions:

~~~jsx
function Price({ priceCents, currency }) {
    const amount = (priceCents / 100).toFixed(2);

    return <p>{currency} {amount}</p>;
}
~~~

Expressions produce a value. A statement such as an `if` block or a `for` loop cannot be placed directly inside JSX braces. Put branching logic before the return, use a conditional expression, or calculate a value before returning.

~~~jsx
function Status({ isReady }) {
    if (!isReady) {
        return <p role="status">Preparing…</p>;
    }

    return <p>Ready</p>;
}
~~~

JavaScript can also supply an attribute value:

~~~jsx
function ProductImage({ product }) {
    return (
        <img
            src={product.imageUrl}
            alt={product.imageDescription}
        />
    );
}
~~~

For a style prop, provide a JavaScript object. CSS property names use camelCase and numeric values generally use the unit conventions of the React DOM style API:

~~~jsx
<p style={{ fontWeight: 700, marginTop: 12 }}>
    Featured product
</p>
~~~

The double braces are simply an object literal inside a JSX expression: the outer braces open the expression, and the inner braces create the object.

## Know which values appear

React can render text values, numbers, React elements, and arrays of renderable values. Empty values such as `null`, `undefined`, and booleans do not create visible text.

~~~jsx
function Values() {
    const label = "Items";
    const count = 3;
    const optionalNote = null;

    return (
        <p>
            {label}: {count} {optionalNote}
        </p>
    );
}
~~~

This displays `Items: 3`; the null value adds no text. A plain JavaScript object is not itself a valid visible child:

~~~jsx
// Invalid: a plain object is not a renderable child.
return <p>{product}</p>;

// Render a property or a component instead.
return <p>{product.name}</p>;
~~~

Format values deliberately before rendering them. For example, use an appropriate currency formatter rather than assuming that a stored integer represents a ready-to-display price.

A numeric zero is visible. This matters when using logical AND for conditional rendering:

~~~jsx
function UnreadCount({ count }) {
    return (
        <p>
            {count > 0 && <span>{count} unread messages</span>}
        </p>
    );
}
~~~

Writing `{count && <span>...</span>}` can render the number `0` when count is zero. Use a boolean condition such as `count > 0`, or a ternary when an explicit alternative is needed.

## Choose a conditional pattern that reads clearly

Use ordinary `if` statements when the branch is substantial:

~~~jsx
function ResultMessage({ isLoading, error, results }) {
    if (isLoading) {
        return <p role="status">Loading…</p>;
    }

    if (error) {
        return <p role="alert">Could not load results.</p>;
    }

    if (results.length === 0) {
        return <p>No results found.</p>;
    }

    return <p>Results are ready.</p>;
}
~~~

Use a ternary for a short either/or expression:

~~~jsx
<p>{isAvailable ? "In stock" : "Unavailable"}</p>
~~~

Use logical AND when a true condition should add a small item and a false condition should add nothing:

~~~jsx
{hasBadge && <span className="badge">New</span>}
~~~

Avoid deeply nested ternaries and long chains of inline conditions. Calculate a named value or return a simpler component branch when that improves readability.

## Render arrays and lists

Transform an array of data into elements with methods such as `map()`:

~~~jsx
const products = [
    { id: "p-101", name: "Keyboard" },
    { id: "p-102", name: "Mouse" }
];

function ProductList() {
    return (
        <ul>
            {products.map(product => (
                <li key={product.id}>{product.name}</li>
            ))}
        </ul>
    );
}
~~~

The `key` tells React which item a rendered element corresponds to across updates. Use a stable identifier from the data. Keys should be unique among siblings in that list; they do not need to be globally unique across the application.

Avoid array indexes when items may be inserted, removed, or reordered. Avoid generating random keys during rendering because a different key makes React treat an item as new each time.

If an arrow function uses a block body, return the JSX explicitly:

~~~jsx
{products.map(product => {
    return <li key={product.id}>{product.name}</li>;
})}
~~~

Without the `return`, a block-bodied callback produces `undefined` instead of the expected element.

## Keep dynamic text separate from raw HTML

A string inserted as a normal child is rendered as text rather than parsed as a markup string:

~~~jsx
function SearchResult({ userText }) {
    return <p>{userText}</p>;
}
~~~

Do not concatenate user-provided text into an HTML string and inject it. React's `dangerouslySetInnerHTML` sets raw HTML and can create a cross-site scripting vulnerability when the markup is untrusted or not sanitized. Use it only for a carefully reviewed need with a trusted sanitization process.

Also validate URL schemes and other security-sensitive attributes at the application boundary. Rendering text safely does not make every possible attribute value or external URL safe.

## JSX comments

A JavaScript comment in the middle of returned JSX must be inside a JSX expression:

~~~jsx
function Panel() {
    return (
        <section>
            {/* This comment is not displayed on the page. */}
            <h2>Account</h2>
        </section>
    );
}
~~~

A plain JavaScript comment can be used outside the JSX markup, such as before a return statement.

## Common mistakes

- Returning adjacent sibling elements without one root or a fragment.
- Forgetting to close a JSX tag.
- Using `class` or `for` instead of `className` or `htmlFor`.
- Writing a dynamic value inside quotes instead of braces.
- Putting statements directly inside a JSX expression.
- Trying to render a plain object as a child.
- Expecting `false`, `null`, or `undefined` to show visible text.
- Accidentally rendering zero with `count && <Element />`.
- Omitting a key or using unstable list keys.
- Forgetting an explicit return in a block-bodied `map()` callback.
- Treating dynamic text as an HTML string.
- Using `dangerouslySetInnerHTML` with untrusted markup.

## Review checklist

- [ ] Returned JSX has one root or a fragment.
- [ ] Every tag is closed and JSX attributes use the correct names.
- [ ] JavaScript expressions are inside braces; literal strings are quoted.
- [ ] Values are formatted before display, and objects are not rendered directly.
- [ ] Conditions handle numeric zero correctly.
- [ ] List items use stable keys from data.
- [ ] Untrusted input is rendered as text, not raw HTML.
- [ ] Branching and expressions remain readable.

## Summary

JSX is HTML-like JavaScript syntax transformed by the project's tooling. Use one root, close tags, put JavaScript expressions in braces, and render values that React understands. Choose clear conditions, use stable keys for lists, and treat raw HTML insertion as a security-sensitive escape hatch. JSX describes the UI; it is not a string-based replacement for careful data handling.

## Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [062 - Create a React app with modern tooling](062-create-a-react-app-with-modern-tooling.md) | [Q&A](../qnas/063-jsx-and-rendering-values.md) | [Example](../examples/063-jsx-and-rendering-values.md) | [064 - Components and composition](064-components-and-composition.md) |
