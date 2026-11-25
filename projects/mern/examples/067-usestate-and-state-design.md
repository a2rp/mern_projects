# 067 - useState and state design: example

This example builds a small shopping cart to demonstrate a deliberate state shape. The cart stores its items and quantities; item count, subtotal, and empty state are derived from that data instead of being maintained as duplicate state.

The code is educational material and is not run. Place the files in the Vite React app created in the tooling chapter, then render <code>App</code> from the app entry. The cart is held in component memory only; a page reload restores the sample data.

## State model

| Value | Stored as state? | Reason |
| --- | --- | --- |
| Cart items, including each quantity | Yes | User actions change the contents and quantities. |
| Item count | No | Calculate it by summing the quantities. |
| Subtotal | No | Calculate it from each item's price and quantity. |
| Is the cart empty? | No | Check whether the item array has any entries. |
| Formatted price label | No | Format the calculated subtotal for display. |

## Component tree

~~~text
App
├── CartHeader
├── CartItemList
│   ├── CartItemRow
│   └── CartItemRow
└── CartSummary
~~~

## Create the components

~~~jsx
// src/App.jsx
import { useState } from "react";
import "./App.css";

const initialCartItems = [
    {
        id: "html-book",
        name: "HTML learning guide",
        unitPriceCents: 1800,
        quantity: 1
    },
    {
        id: "css-book",
        name: "CSS learning guide",
        unitPriceCents: 2200,
        quantity: 2
    }
];

function formatPrice(priceInCents) {
    return "$" + (priceInCents / 100).toFixed(2);
}

function CartHeader({ itemCount }) {
    return (
        <header className="cart-header">
            <p className="eyebrow">Learning shop</p>
            <h1>Your cart</h1>
            <p>{itemCount} items in your cart</p>
        </header>
    );
}

function CartItemRow({ item, onIncrease, onDecrease, onRemove }) {
    return (
        <li className="cart-item">
            <div className="item-description">
                <h2>{item.name}</h2>
                <p>{formatPrice(item.unitPriceCents)} each</p>
            </div>

            <div className="quantity-control" aria-label="Quantity controls">
                <button
                    type="button"
                    onClick={() => onDecrease(item.id)}
                    disabled={item.quantity <= 1}
                    aria-label={"Decrease quantity of " + item.name}
                >
                    -
                </button>
                <span aria-live="polite">{item.quantity}</span>
                <button
                    type="button"
                    onClick={() => onIncrease(item.id)}
                    aria-label={"Increase quantity of " + item.name}
                >
                    +
                </button>
            </div>

            <p className="line-total">
                {formatPrice(item.unitPriceCents * item.quantity)}
            </p>

            <button
                className="remove-button"
                type="button"
                onClick={() => onRemove(item.id)}
            >
                Remove
            </button>
        </li>
    );
}

function CartItemList({ items, onIncrease, onDecrease, onRemove }) {
    if (items.length === 0) {
        return (
            <p className="empty-state">
                Your cart is empty. Add an item to get started.
            </p>
        );
    }

    return (
        <ul className="cart-list">
            {items.map(item => (
                <CartItemRow
                    key={item.id}
                    item={item}
                    onIncrease={onIncrease}
                    onDecrease={onDecrease}
                    onRemove={onRemove}
                />
            ))}
        </ul>
    );
}

function CartSummary({ itemCount, subtotalCents }) {
    return (
        <aside className="summary" aria-labelledby="summary-heading">
            <h2 id="summary-heading">Order summary</h2>
            <p>
                <span>Items</span>
                <span>{itemCount}</span>
            </p>
            <p className="subtotal">
                <span>Subtotal</span>
                <strong>{formatPrice(subtotalCents)}</strong>
            </p>
            <button type="button" disabled={itemCount === 0}>
                Continue to checkout
            </button>
        </aside>
    );
}

export default function App() {
    const [cartItems, setCartItems] = useState(initialCartItems);

    const itemCount = cartItems.reduce(
        (total, item) => total + item.quantity,
        0
    );

    const subtotalCents = cartItems.reduce(
        (total, item) => total + item.unitPriceCents * item.quantity,
        0
    );

    function handleIncrease(itemId) {
        setCartItems(previousItems =>
            previousItems.map(item =>
                item.id === itemId
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            )
        );
    }

    function handleDecrease(itemId) {
        setCartItems(previousItems =>
            previousItems.map(item =>
                item.id === itemId
                    ? { ...item, quantity: Math.max(1, item.quantity - 1) }
                    : item
            )
        );
    }

    function handleRemove(itemId) {
        setCartItems(previousItems =>
            previousItems.filter(item => item.id !== itemId)
        );
    }

    return (
        <main className="cart-page">
            <CartHeader itemCount={itemCount} />

            <div className="cart-layout">
                <section className="items-section" aria-labelledby="items-heading">
                    <h2 id="items-heading">Cart items</h2>
                    <CartItemList
                        items={cartItems}
                        onIncrease={handleIncrease}
                        onDecrease={handleDecrease}
                        onRemove={handleRemove}
                    />
                </section>

                <CartSummary
                    itemCount={itemCount}
                    subtotalCents={subtotalCents}
                />
            </div>
        </main>
    );
}
~~~

## Add basic styling

~~~css
/* src/App.css */
:root {
    font-family: system-ui, sans-serif;
    color: #182033;
    background: #f3f5f8;
}

* {
    box-sizing: border-box;
}

body {
    margin: 0;
}

button {
    font: inherit;
    cursor: pointer;
}

button:disabled {
    cursor: not-allowed;
    opacity: 0.5;
}

.cart-page {
    max-width: 1050px;
    margin: 0 auto;
    padding: 2rem 1.25rem;
}

.cart-header {
    margin-bottom: 1.5rem;
}

.cart-header h1,
.cart-header p {
    margin: 0.35rem 0;
}

.eyebrow {
    color: #53627a;
    font-size: 0.875rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
}

.cart-layout {
    display: grid;
    grid-template-columns: minmax(0, 1.6fr) minmax(240px, 0.8fr);
    gap: 1.25rem;
    align-items: start;
}

.items-section,
.summary {
    padding: 1.25rem;
    border: 1px solid #d6dce7;
    border-radius: 0.75rem;
    background: #fff;
}

.items-section > h2,
.summary h2 {
    margin-top: 0;
}

.cart-list {
    display: grid;
    gap: 0.25rem;
    margin: 0;
    padding: 0;
    list-style: none;
}

.cart-item {
    display: grid;
    grid-template-columns: minmax(150px, 1fr) auto auto auto;
    align-items: center;
    gap: 1rem;
    padding: 1rem 0;
    border-bottom: 1px solid #e5e8ef;
}

.cart-item:last-child {
    border-bottom: 0;
}

.item-description h2,
.item-description p,
.line-total {
    margin: 0.2rem 0;
}

.item-description p {
    color: #53627a;
    font-size: 0.9rem;
}

.quantity-control {
    display: flex;
    align-items: center;
    gap: 0.6rem;
}

.quantity-control button {
    width: 2rem;
    height: 2rem;
    border: 1px solid #aab4c3;
    border-radius: 0.35rem;
    background: #fff;
}

.line-total {
    min-width: 5.5rem;
    font-weight: 700;
    text-align: right;
}

.remove-button {
    padding: 0.4rem 0.55rem;
    border: 0;
    color: #8a2936;
    background: transparent;
}

.summary p {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
}

.summary .subtotal {
    padding-top: 0.8rem;
    border-top: 1px solid #d6dce7;
}

.summary > button {
    width: 100%;
    padding: 0.7rem 1rem;
    border: 0;
    border-radius: 0.4rem;
    color: #fff;
    background: #2457ad;
}

.empty-state {
    padding: 1rem;
    border: 1px dashed #aab4c3;
    border-radius: 0.5rem;
    color: #53627a;
}

@media (max-width: 740px) {
    .cart-layout {
        grid-template-columns: 1fr;
    }

    .cart-item {
        grid-template-columns: minmax(0, 1fr) auto;
    }

    .line-total {
        text-align: left;
    }
}
~~~

## How the state model works

The app stores only <code>cartItems</code>. Each entry contains the stable item ID, display name, unit price in cents, and quantity. Those values are the changing facts needed to render and update the cart.

The header and summary receive <code>itemCount</code>, which is calculated by summing quantities. The subtotal is calculated from each unit price and quantity. The empty state is determined from <code>cartItems.length</code>. None of these derived values needs a separate setter.

The increase and decrease handlers use functional updates because each new quantity depends on the latest item array. They return a new array and a new object for the changed item. The remove handler returns a filtered array. The original state is never mutated.

Each row receives its item and action callbacks as props. It does not own a second copy of the cart or calculate a competing subtotal.

## Expected result

The initial cart contains three total units across two products. The summary subtotal is $62.00. Use the plus and minus buttons to change quantities, or remove an item. The header count and subtotal update from the current cart. Removing both products displays the empty-cart message and disables checkout.

## Less useful state model

Avoid maintaining every display value separately:

~~~jsx
const [cartItems, setCartItems] = useState(initialCartItems);
const [itemCount, setItemCount] = useState(3);
const [subtotalCents, setSubtotalCents] = useState(6200);
const [isEmpty, setIsEmpty] = useState(false);
~~~

Every cart action would have to update four values consistently. A missed update could display a subtotal that does not match the cart. Keep the source data and derive the other values instead.

## Try these changes

1. Add a product to the cart using a new object and a functional array update.
2. Add a status such as "saving" or "saved" as one state value instead of separate booleans.
3. Store a selected item ID and derive its record from the cart array.
4. Add a discount and calculate the discounted total from the subtotal and discount.
5. If adding an item becomes expensive to initialize, create a pure initializer and pass the function to <code>useState</code>.

## Common mistakes to avoid

- Storing item count, subtotal, and empty status as state when they can be derived.
- Mutating an item or the cart array during an update.
- Updating only the changed item but forgetting to create a new object for that item.
- Copying the whole cart into several child components as separate state.
- Assuming the initial argument to <code>useState</code> is applied on every render.
- Calling <code>useState</code> only in one branch or inside a handler.
- Treating local React state as persistent server data.

## Chapter navigation

| Previous chapter | Chapter Q&A | Next chapter |
| --- | --- | --- |
| [066 - Events and state updates](../lessons/066-events-and-state-updates.md) | [Q&A](../qnas/067-usestate-and-state-design.md) | [068 - Conditional rendering and lists](../lessons/068-conditional-rendering-and-lists.md) |
