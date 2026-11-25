# Chapter 070 example: Share state across a product catalog

Build a small catalog where a search field, category filter, product list, result count, and cart stay in sync. Their shared state lives in one parent component. The children receive values and callbacks through props.

This example uses local React state only. Adding a server, database, or global store is outside its scope.

## Component tree

~~~text
App
├── CatalogControls
│   ├── SearchInput
│   └── CategorySelect
├── ResultSummary
├── ProductList
│   └── ProductCard
└── CartSummary
~~~

## State ownership

| State or value | Owner | Why |
| --- | --- | --- |
| Search query | <code>App</code> | Controls the input and determines the visible products |
| Selected category | <code>App</code> | Controls the select and filters the product list |
| Cart quantities | <code>App</code> | Keeps product actions and the cart summary in sync |
| Visible products | Derived in <code>App</code> | Calculated from products, query, and category |
| Cart item count | Derived in <code>App</code> | Calculated from the cart quantities |

The input and select are controlled by props. They notify <code>App</code> of edits through callbacks. The product cards use the same pattern to request cart updates.

## React component

Save this as <code>App.jsx</code> in a React application:

~~~jsx
import { useState } from "react";
import "./App.css";

const products = [
  {
    id: "react-basics",
    name: "React Fundamentals",
    category: "frontend",
    description: "Build interfaces with components, props, and state.",
    price: 24,
  },
  {
    id: "accessible-ui",
    name: "Accessible UI Patterns",
    category: "frontend",
    description: "Create usable forms, menus, and interactive controls.",
    price: 19,
  },
  {
    id: "node-api",
    name: "Node API Starter",
    category: "backend",
    description: "Organize routes and build a small JSON API.",
    price: 29,
  },
  {
    id: "express-routing",
    name: "Express Routing",
    category: "backend",
    description: "Structure request handlers and route parameters.",
    price: 22,
  },
  {
    id: "mongo-modeling",
    name: "MongoDB Data Modeling",
    category: "database",
    description: "Plan documents and relationships for an application.",
    price: 26,
  },
  {
    id: "mongo-queries",
    name: "MongoDB Query Practice",
    category: "database",
    description: "Find, filter, and update documents in a collection.",
    price: 18,
  },
];

const categoryLabels = {
  all: "All categories",
  frontend: "Frontend",
  backend: "Backend",
  database: "Database",
};

function SearchInput({ value, onValueChange }) {
  return (
    <div className="control">
      <label htmlFor="catalog-search">Search courses</label>
      <input
        id="catalog-search"
        type="search"
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        placeholder="Try “React”"
      />
    </div>
  );
}

function CategorySelect({ value, onValueChange }) {
  return (
    <div className="control">
      <label htmlFor="category-filter">Filter by category</label>
      <select
        id="category-filter"
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
      >
        {Object.entries(categoryLabels).map(([category, label]) => (
          <option key={category} value={category}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}

function CatalogControls({
  query,
  onQueryChange,
  category,
  onCategoryChange,
}) {
  return (
    <div className="controls">
      <SearchInput value={query} onValueChange={onQueryChange} />
      <CategorySelect value={category} onValueChange={onCategoryChange} />
    </div>
  );
}

function ResultSummary({ count, query, category }) {
  const resultLabel = count === 1 ? "course" : "courses";
  const categoryLabel = categoryLabels[category];

  return (
    <p className="result-summary" aria-live="polite">
      Showing <strong>{count}</strong> {resultLabel}
      {category !== "all" ? (
        <> in <strong>{categoryLabel}</strong></>
      ) : null}
      {query.trim() ? (
        <> matching <strong>“{query.trim()}”</strong></>
      ) : null}
      .
    </p>
  );
}

function ProductCard({ product, onAddToCart }) {
  return (
    <article className="product-card">
      <div>
        <p className="product-category">{categoryLabels[product.category]}</p>
        <h3>{product.name}</h3>
        <p className="product-description">{product.description}</p>
      </div>
      <div className="product-footer">
        <p className="price">{"$"}{product.price.toFixed(2)}</p>
        <button type="button" onClick={() => onAddToCart(product.id)}>
          Add to cart
        </button>
      </div>
    </article>
  );
}

function ProductList({ items, onAddToCart }) {
  if (items.length === 0) {
    return (
      <div className="empty-state">
        <h3>No courses found</h3>
        <p>Change the search text or choose another category.</p>
      </div>
    );
  }

  return (
    <ul className="product-grid" aria-label="Courses">
      {items.map((product) => (
        <li key={product.id}>
          <ProductCard product={product} onAddToCart={onAddToCart} />
        </li>
      ))}
    </ul>
  );
}

function CartSummary({ items, itemCount, onClear }) {
  return (
    <aside className="cart" aria-labelledby="cart-title">
      <div className="cart-heading">
        <h2 id="cart-title">Your cart</h2>
        <p>
          {itemCount} {itemCount === 1 ? "item" : "items"}
        </p>
      </div>

      {items.length === 0 ? (
        <p className="cart-empty">Add a course to see it here.</p>
      ) : (
        <>
          <ul className="cart-list">
            {items.map((item) => (
              <li key={item.id}>
                <span>{item.name}</span>
                <span>× {item.quantity}</span>
              </li>
            ))}
          </ul>
          <button className="clear-button" type="button" onClick={onClear}>
            Clear cart
          </button>
        </>
      )}
    </aside>
  );
}

export default function App() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [cart, setCart] = useState({});

  const normalizedQuery = query.trim().toLowerCase();

  const visibleProducts = products.filter((product) => {
    const matchesQuery =
      normalizedQuery === "" ||
      product.name.toLowerCase().includes(normalizedQuery) ||
      product.description.toLowerCase().includes(normalizedQuery);

    const matchesCategory =
      category === "all" || product.category === category;

    return matchesQuery && matchesCategory;
  });

  const cartItems = products
    .filter((product) => (cart[product.id] ?? 0) > 0)
    .map((product) => ({
      id: product.id,
      name: product.name,
      quantity: cart[product.id],
    }));

  const cartItemCount = Object.values(cart).reduce(
    (total, quantity) => total + quantity,
    0
  );

  function handleAddToCart(productId) {
    setCart((currentCart) => ({
      ...currentCart,
      [productId]: (currentCart[productId] ?? 0) + 1,
    }));
  }

  function handleClearCart() {
    setCart({});
  }

  return (
    <main className="page">
      <header className="page-header">
        <p className="eyebrow">MERN learning path</p>
        <h1>Course catalog</h1>
        <p>Search the catalog, filter it, and add courses to your cart.</p>
      </header>

      <CatalogControls
        query={query}
        onQueryChange={setQuery}
        category={category}
        onCategoryChange={setCategory}
      />

      <div className="catalog-layout">
        <section className="catalog" aria-labelledby="catalog-title">
          <div className="section-heading">
            <h2 id="catalog-title">Available courses</h2>
            <ResultSummary
              count={visibleProducts.length}
              query={query}
              category={category}
            />
          </div>
          <ProductList
            items={visibleProducts}
            onAddToCart={handleAddToCart}
          />
        </section>

        <CartSummary
          items={cartItems}
          itemCount={cartItemCount}
          onClear={handleClearCart}
        />
      </div>
    </main>
  );
}
~~~

## Stylesheet

Save this as <code>App.css</code> beside <code>App.jsx</code>:

~~~css
:root {
  font-family: system-ui, sans-serif;
  color: #172033;
  background: #f3f6fb;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  min-width: 320px;
  min-height: 100vh;
  margin: 0;
}

button,
input,
select {
  font: inherit;
}

button {
  min-height: 2.7rem;
  padding: 0.55rem 0.9rem;
  border: 1px solid #214da0;
  border-radius: 0.45rem;
  color: #fff;
  background: #214da0;
  cursor: pointer;
  font-weight: 700;
}

button:hover {
  background: #173b80;
}

button:focus-visible,
input:focus-visible,
select:focus-visible {
  outline: 3px solid #79a8ff;
  outline-offset: 2px;
}

.page {
  width: min(100% - 2rem, 76rem);
  margin-inline: auto;
  padding-block: 2.5rem;
}

.page-header {
  margin-bottom: 1.75rem;
}

.eyebrow {
  margin: 0 0 0.4rem;
  color: #4a5e85;
  font-size: 0.8rem;
  font-weight: 750;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

h1,
h2,
h3,
p {
  overflow-wrap: anywhere;
}

h1 {
  margin: 0;
  font-size: clamp(2rem, 5vw, 3rem);
}

.page-header > p:last-child {
  margin-bottom: 0;
  color: #536176;
  line-height: 1.6;
}

.controls {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(12rem, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  border: 1px solid #d7deea;
  border-radius: 0.75rem;
  background: #fff;
}

.control {
  display: grid;
  gap: 0.45rem;
}

.control label {
  font-weight: 700;
}

.control input,
.control select {
  width: 100%;
  min-height: 2.8rem;
  padding: 0.6rem 0.7rem;
  border: 1px solid #aab5c4;
  border-radius: 0.45rem;
  color: inherit;
  background: #fff;
}

.catalog-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 18rem;
  align-items: start;
  gap: 1.25rem;
}

.catalog,
.cart {
  min-width: 0;
}

.section-heading {
  margin-bottom: 1rem;
}

.section-heading h2,
.cart-heading h2 {
  margin: 0;
}

.result-summary {
  margin: 0.4rem 0 0;
  color: #536176;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.product-card {
  display: flex;
  min-height: 13rem;
  flex-direction: column;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid #d7deea;
  border-radius: 0.75rem;
  background: #fff;
  box-shadow: 0 0.4rem 1.2rem rgb(23 32 51 / 5%);
}

.product-category {
  margin: 0 0 0.35rem;
  color: #536c9d;
  font-size: 0.78rem;
  font-weight: 750;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.product-card h3 {
  margin: 0;
  font-size: 1.1rem;
}

.product-description {
  margin: 0.5rem 0 0;
  color: #536176;
  line-height: 1.5;
}

.product-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.price {
  margin: 0;
  font-weight: 750;
  white-space: nowrap;
}

.cart {
  padding: 1rem;
  border: 1px solid #d7deea;
  border-radius: 0.75rem;
  background: #fff;
}

.cart-heading {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
}

.cart-heading p,
.cart-empty {
  color: #536176;
}

.cart-heading p {
  margin: 0;
}

.cart-list {
  display: grid;
  gap: 0.7rem;
  margin: 1rem 0;
  padding: 0;
  list-style: none;
}

.cart-list li {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  padding-bottom: 0.65rem;
  border-bottom: 1px solid #e3e8f0;
}

.cart-list li span:first-child {
  overflow-wrap: anywhere;
}

.clear-button {
  width: 100%;
  border-color: #aab5c4;
  color: #172033;
  background: #fff;
}

.clear-button:hover {
  background: #f3f6fb;
}

.empty-state {
  padding: 2rem 1rem;
  border: 1px dashed #aab5c4;
  border-radius: 0.75rem;
  text-align: center;
}

.empty-state h3 {
  margin: 0;
}

.empty-state p {
  margin-bottom: 0;
  color: #536176;
}

@media (max-width: 52rem) {
  .catalog-layout {
    grid-template-columns: 1fr;
  }

  .cart {
    grid-row: 1;
  }
}

@media (max-width: 38rem) {
  .page {
    width: min(100% - 1.25rem, 76rem);
    padding-block: 1.5rem;
  }

  .controls,
  .product-grid {
    grid-template-columns: 1fr;
  }

  .product-card {
    min-height: 0;
  }
}
~~~

## How the state is shared

1. <code>App</code> owns <code>query</code>, <code>category</code>, and <code>cart</code> because multiple child components need to read or change those values.
2. <code>CatalogControls</code> passes the query and category props to the smaller controlled input components.
3. When a visitor types or selects a category, the child calls its change callback. The callback updates state in <code>App</code>.
4. <code>App</code> derives <code>visibleProducts</code> from the source product data and current filters. The count and list both use this same result.
5. A <code>ProductCard</code> calls <code>onAddToCart</code> with the product id. The parent updates the cart with a functional state update.
6. <code>CartSummary</code> receives cart items and the total count derived from the same cart state. Clearing the cart also goes through a callback to the owner.

## Try these changes

- Add a new product and verify the result count updates automatically.
- Add a category and update <code>categoryLabels</code>; the select options derive from that object.
- Make the search match product names only, then compare it with searching names and descriptions.
- Add a quantity decrement action by passing another callback from <code>App</code>.
- Move a small display-only detail into local state, then decide whether any sibling truly needs to coordinate it.
- Temporarily put separate query state inside each search component and observe how they stop synchronizing.

## Common mistakes to avoid

- Keeping a separate query or category state in multiple siblings when they should agree.
- Passing a value but no callback to a controlled child that must allow edits.
- Letting a child mutate the cart prop.
- Storing the filtered product list as another state value when it can be derived from the source data and filters.
- Replacing cart state directly instead of creating an updated object.
- Updating state from a captured cart value when a functional updater is clearer.
- Lifting every UI detail to <code>App</code> even when it is local to one child.
- Passing props through many intermediate components without considering whether the tree or context design should change.

## Chapter navigation

| Previous chapter | Chapter Q&A | Next chapter |
| --- | --- | --- |
| [069 - Forms and controlled inputs](../lessons/069-forms-and-controlled-inputs.md) | [Q&A](../qnas/070-share-state-by-lifting-it.md) | [071 - Effects and external synchronization](../lessons/071-effects-and-external-synchronization.md) |
