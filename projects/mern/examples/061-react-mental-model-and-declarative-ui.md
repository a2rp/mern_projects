# 061 - React mental model and declarative UI: example

This example builds a small product catalog with a search field and a cart summary. It demonstrates how JSX describes UI from current props and state, how event handlers request updates, how state can be shared by a parent, and how totals can be derived instead of duplicated.

The code is educational material and is not run. It uses a modern React function component and JSX, so use it inside a React application configured by the next chapter's tooling setup. The catalog and cart are local component state for this demonstration; a real MERN application would load products from an API and persist cart changes through its backend.

## What the example demonstrates

- Component composition with `ProductCard` and `CartSummary`.
- Read-only props passed from a parent.
- Local state for search text and cart contents.
- Event handlers that call state setters.
- Functional state updates when the new value depends on the previous value.
- Immutable array and object updates.
- Search results and totals derived during render.
- Stable keys for repeated product and cart elements.
- Different UI for empty search results and an empty cart.

## Create the example component

~~~jsx
// App.jsx
import { useState } from "react";

const products = [
    {
        id: "keyboard",
        name: "Compact Keyboard",
        description: "A compact keyboard for everyday work.",
        priceCents: 2499
    },
    {
        id: "mouse",
        name: "Wireless Mouse",
        description: "A wireless mouse with adjustable sensitivity.",
        priceCents: 1899
    },
    {
        id: "monitor",
        name: "HD Monitor",
        description: "A clear display for study and office work.",
        priceCents: 15900
    }
];

function formatPrice(priceCents) {
    return "$" + (priceCents / 100).toFixed(2);
}

function ProductCard({ product, onAdd }) {
    return (
        <article className="product-card">
            <h3>{product.name}</h3>
            <p>{product.description}</p>
            <p>{formatPrice(product.priceCents)}</p>
            <button type="button" onClick={() => onAdd(product)}>
                Add to cart
            </button>
        </article>
    );
}

function CartSummary({ items }) {
    const itemCount = items.reduce(
        (total, item) => total + item.quantity,
        0
    );

    const subtotalCents = items.reduce(
        (total, item) => total + item.priceCents * item.quantity,
        0
    );

    if (items.length === 0) {
        return (
            <section aria-labelledby="cart-heading">
                <h2 id="cart-heading">Cart</h2>
                <p>Your cart is empty.</p>
            </section>
        );
    }

    return (
        <section aria-labelledby="cart-heading">
            <h2 id="cart-heading">Cart ({itemCount} items)</h2>
            <ul>
                {items.map(item => (
                    <li key={item.id}>
                        {item.name} × {item.quantity}
                        {" — "}
                        {formatPrice(item.priceCents * item.quantity)}
                    </li>
                ))}
            </ul>
            <p>Subtotal: {formatPrice(subtotalCents)}</p>
        </section>
    );
}

export default function App() {
    const [query, setQuery] = useState("");
    const [cartItems, setCartItems] = useState([]);

    const normalizedQuery = query.trim().toLowerCase();
    const visibleProducts = products.filter(product =>
        product.name.toLowerCase().includes(normalizedQuery)
    );

    function handleAdd(product) {
        setCartItems(currentItems => {
            const alreadyInCart = currentItems.some(
                item => item.id === product.id
            );

            if (!alreadyInCart) {
                return [
                    ...currentItems,
                    { ...product, quantity: 1 }
                ];
            }

            return currentItems.map(item =>
                item.id === product.id
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            );
        });
    }

    return (
        <main>
            <header>
                <h1>Desk Essentials</h1>
                <p>Search the catalog and add products to your cart.</p>
            </header>

            <section aria-labelledby="products-heading">
                <h2 id="products-heading">Products</h2>

                <label htmlFor="product-search">Search products</label>
                <input
                    id="product-search"
                    type="search"
                    value={query}
                    onChange={event => setQuery(event.target.value)}
                    placeholder="Try keyboard"
                />

                {visibleProducts.length === 0 ? (
                    <p role="status">No products match your search.</p>
                ) : (
                    <div className="product-list">
                        {visibleProducts.map(product => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                onAdd={handleAdd}
                            />
                        ))}
                    </div>
                )}
            </section>

            <CartSummary items={cartItems} />
        </main>
    );
}
~~~

## Follow the data flow

1. `App` owns the search query and cart items because it coordinates the product list and cart summary.
2. Typing in the input calls `setQuery()`. React renders again with the new query.
3. `visibleProducts` is calculated from the current query and static product data. It does not need a separate state variable.
4. `App` passes a product and callback to each `ProductCard` through props.
5. Clicking **Add to cart** invokes `handleAdd(product)`.
6. The updater receives the current cart state and returns a new array. It does not mutate the existing array or item.
7. `CartSummary` receives the latest cart as props and calculates item count and subtotal during rendering.
8. React commits the changes needed for the product list and cart display.

The child card does not edit the cart itself. It raises an event through the callback, while the parent remains the owner of the shared state.

## Expected UI

On first display, the page shows:

- The **Desk Essentials** heading.
- A search input with the placeholder **Try keyboard**.
- Three product cards.
- A cart section that says **Your cart is empty.**

If the user types `mouse`, only the **Wireless Mouse** card remains. If the user adds it twice, the cart shows **Cart (2 items)**, **Wireless Mouse × 2**, and **Subtotal: $37.98**. Clearing the search restores all three product cards; the cart remains because its state belongs to `App`.

## Why this is declarative

The component never queries the DOM to hide products or rewrite the cart text. Instead, it computes `visibleProducts` and returns one of the relevant JSX descriptions. When `query` or `cartItems` changes, React calls the components again and updates the DOM to match their new output.

Avoid adding code like this to the component:

~~~js
document.querySelector(".product-card").remove();
~~~

That manual DOM change is not represented in React state. A later render can produce a different result and overwrite it. Describe the desired state in JSX and let React manage the nodes it owns.

## What should not happen during render

The component calculations are pure: filtering products and reducing cart values do not change the inputs. Network calls, logging that changes external state, DOM mutations, and subscriptions do not belong directly in rendering.

For a real application, load remote products through the data-fetching approach used by the app, and handle loading, error, and success states explicitly. Synchronize with external systems using the appropriate event or Effect. Keep API authorization and price validation on the server; this local interface is not a trusted source of persisted cart data.

## Common mistakes shown by contrast

- Do not update `cartItems.push(product)`; that mutates the existing state array.
- Do not keep a separate `subtotal` state if it can be calculated from cart items.
- Do not make `ProductCard` assign to `product.name`; props are read-only.
- Do not use the array index as a key for these reorderable or filterable product results.
- Do not assume adding an item here saved it to MongoDB; this example only updates client state.
- Do not call a state setter while rendering; call it from an event handler or another appropriate update path.

## Chapter navigation

| Previous chapter | Chapter Q&A | Next chapter |
| --- | --- | --- |
| [060 - Search, filtering, sorting, and pagination APIs](../lessons/060-search-filtering-sorting-and-pagination-apis.md) | [Q&A](../qnas/061-react-mental-model-and-declarative-ui.md) | [062 - Create a React app with modern tooling](../lessons/062-create-a-react-app-with-modern-tooling.md) |
