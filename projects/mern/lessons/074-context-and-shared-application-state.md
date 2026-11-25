# 074 - Context and shared application state

Context lets a React component make a value available to components below it in the same rendered tree. It is useful when many distant descendants need the same information and passing it through every intermediate component would make the component interfaces harder to follow.

Context is a way to distribute a value. It does not, by itself, create state, persist data, or make an application value global across every render tree.

## Learning goals

After this chapter, you should be able to:

- Explain prop drilling and decide when context is a useful alternative.
- Create a context with an intentional default value.
- Provide and read a context value with <code>useContext</code>.
- Scope shared data to the part of the component tree that needs it.
- Combine context with <code>useState</code> or <code>useReducer</code> for changing application state.
- Separate state reads from update actions when that improves the design.
- Recognize context update behavior and avoid common provider mistakes.

## Prop drilling

Props make data flow explicit. A parent passes a value to a child, and that child can pass it to its own child:

~~~jsx
function App() {
  const theme = "dark";

  return <Page theme={theme} />;
}

function Page({ theme }) {
  return <Header theme={theme} />;
}

function Header({ theme }) {
  return <UserMenu theme={theme} />;
}

function UserMenu({ theme }) {
  return <button className={theme}>Account</button>;
}
~~~

Here, <code>Page</code> and <code>Header</code> only forward <code>theme</code>. This is often called prop drilling. A few levels of props are not a problem, and explicit props can make dependencies easy to see. It becomes awkward when many intermediate components pass a value they do not use.

Context allows a component near the top of a subtree to provide a value that a descendant can read directly. Intermediate components no longer need a forwarding prop.

## Create a context

Call <code>createContext</code> at module scope, outside components:

~~~jsx
import { createContext } from "react";

export const ThemeContext = createContext("light");
~~~

The argument is the fallback value used by a consumer when no matching provider exists above it. Treat it as a useful static default, not as the place to store changing state. A provider can supply a different value.

The context object identifies one particular context. The provider and consumer must use the same exported context object. Creating a second context with the same name or default value does not make it equivalent.

## Provide a value

Place a provider above the components that need the value:

~~~jsx
import { useState } from "react";
import { ThemeContext } from "./ThemeContext.js";

function App() {
  const [theme, setTheme] = useState("light");

  function toggleTheme() {
    setTheme((currentTheme) =>
      currentTheme === "light" ? "dark" : "light"
    );
  }

  return (
    <ThemeContext.Provider value={theme}>
      <button onClick={toggleTheme}>Change theme</button>
      <Page />
    </ThemeContext.Provider>
  );
}
~~~

The provider's <code>value</code> is the value descendants receive. A context provider can hold a string, object, function, state value, dispatch function, or another value appropriate to the problem. The context itself does not decide how the value changes; the component that owns the state does that.

In React 19, the context object can be rendered directly as a provider:

~~~jsx
<ThemeContext value={theme}>
  <Page />
</ThemeContext>
~~~

The <code>ThemeContext.Provider</code> form remains supported and is needed by earlier React versions. Use the syntax supported by the React version used in the project.

## Read a context value

A function component reads context with <code>useContext</code>:

~~~jsx
import { useContext } from "react";
import { ThemeContext } from "./ThemeContext.js";

function UserMenu() {
  const theme = useContext(ThemeContext);

  return <button className={theme}>Account</button>;
}
~~~

Call <code>useContext</code> at the top level of a function component or custom Hook. Do not call it inside a loop, condition, event handler, or nested ordinary function.

React looks upward from the component that calls <code>useContext</code> and returns the value from the nearest matching provider. If none is found, it returns the context's default value.

The provider must be above the consumer in the rendered tree. A component cannot read a provider that it returns below itself:

~~~jsx
function IncorrectBoundary() {
  const theme = useContext(ThemeContext); // Reads a provider above this component, if any.

  return (
    <ThemeContext.Provider value="dark">
      <Page />
    </ThemeContext.Provider>
  );
}
~~~

In this example, <code>IncorrectBoundary</code> reads from an outer provider or the default. Its returned provider supplies a value only to <code>Page</code> and other descendants.

## Context and changing state

To make a context value change over time, keep state in a component and pass that state through a provider:

~~~jsx
function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("light");

  function toggleTheme() {
    setTheme((currentTheme) =>
      currentTheme === "light" ? "dark" : "light"
    );
  }

  const value = { theme, toggleTheme };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}
~~~

A provider component gives the state a clear owner and makes it easy to wrap the subtree that needs the value. The provider can live near the application root for broadly shared data, or around one feature for narrowly shared data.

For a small application, this can be enough. If consumers only need to read a value, keep the provider value as simple as possible. If components need to update it, provide an action function or a dispatch function as well.

## Context with a reducer

When shared state has several related transitions, a reducer can keep update rules together:

~~~jsx
function progressReducer(courses, action) {
  switch (action.type) {
    case "course/toggled":
      return courses.map((course) =>
        course.id === action.courseId
          ? { ...course, completed: !course.completed }
          : course
      );

    default:
      return courses;
  }
}
~~~

The provider can own the reducer state and pass the state and its stable dispatch function through context. A consumer dispatches an action; the reducer returns the next state. Do not mutate the existing state array or its course objects.

For larger trees, separate read and write contexts can make dependencies clearer:

- A state context contains the current data.
- A dispatch context contains the reducer's dispatch function.

Components that only dispatch do not need to subscribe to the state context. Components that read state use the state context. This can avoid context-triggered updates for dispatch-only consumers, but it does not prevent state consumers from updating when the shared state changes.

## Context updates and rendering

When a provider receives a new value, components reading that context below it update to receive the new value. React compares the previous and next provider values with <code>Object.is</code>.

For primitive values, this is usually straightforward. For objects and functions, creating a new reference during each provider render means the value is considered changed, even when its fields or behavior appear unchanged:

~~~jsx
function Provider({ children }) {
  const [theme, setTheme] = useState("light");

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
~~~

If this provider renders again, the object literal creates a new object. Consumers of the context can update because the provider value has a new identity. Start with a clear provider and measure before adding memoization. When there is a demonstrated performance issue, stabilizing a value with <code>useMemo</code> and callbacks with <code>useCallback</code> may help, provided their dependencies are correct.

Wrapping a consumer with <code>memo</code> does not block an update caused by a context value that the consumer reads. Keep context values and subscriptions narrow when update behavior matters.

## Defaults, missing providers, and custom Hooks

A default value is used only when there is no matching provider above a consumer. A provider whose value is <code>null</code> provides <code>null</code>; React does not replace it with the default.

For a required context, using <code>null</code> as the default makes configuration mistakes easier to detect:

~~~jsx
const AccountContext = createContext(null);

export function useAccount() {
  const account = useContext(AccountContext);

  if (account === null) {
    throw new Error("useAccount must be used inside AccountProvider");
  }

  return account;
}
~~~

A custom Hook provides a friendly API and a useful error when a component is rendered outside its provider. For an optional context, a meaningful fallback can be more appropriate than throwing. Choose based on whether the provider is required by the feature.

## Scoping and nested providers

A provider affects consumers below it in its subtree. Two separate parts of an application can have separate provider instances and therefore separate state:

~~~jsx
<ReadingProvider>
  <CurrentLibrary />
</ReadingProvider>

<ReadingProvider>
  <SavedForLater />
</ReadingProvider>
~~~

A nested provider for the same context overrides the outer provider for its descendants. This can be useful for a local preview or an independently configured feature. Provider placement is therefore part of the state design: place it where the intended consumers share one state owner.

Context is scoped to a React tree. It is not automatically shared between separate React roots, browser tabs, server requests, or users. Use an appropriate storage, synchronization, or server mechanism when the requirement crosses those boundaries.

## Choosing between props, state, and context

Use props when:

- Only a component and its nearby children need a value.
- Explicit dependencies help a reusable component remain understandable.
- A parent should decide what a child displays.

Lift state to a common parent when several nearby siblings need to coordinate.

Use context when:

- Many descendants at different depths need the same value.
- Intermediate components would otherwise pass it only to forward it.
- A provider boundary is a natural owner for that shared value.

Use local state when a value belongs to one component or a small subtree. Context does not mean every value should be global. A large context with unrelated state can make dependencies and update behavior harder to understand. Split contexts by purpose when that makes ownership and subscriptions clearer.

For server data, context may carry a client or feature value, but it does not replace fetching, caching, request handling, or server-side authorization. Choose data-fetching and persistence mechanisms to match those requirements.

## Common mistakes

- Creating a context inside a component, which creates a different context identity on each render.
- Reading the context in the provider component and expecting it to see the provider returned by that component.
- Assuming the default value is used when a provider explicitly passes <code>null</code>.
- Using different context objects for the provider and consumer.
- Putting all application state into one context without considering ownership or update scope.
- Mutating arrays or objects in reducer state.
- Passing a newly created object as a provider value everywhere without first identifying an actual performance problem.
- Expecting context to share data across separate React roots or browser tabs.
- Using context for a value that is clearer as a regular prop.

## Chapter checklist

Before adding context:

- Identify which components need the value and whether they share a subtree.
- Decide who owns and updates the state.
- Choose an intentional default or a missing-provider check.
- Put the provider above every consumer that needs it.
- Keep the context value focused on one coherent purpose.
- Use immutable updates for state and reducers.
- Separate read and dispatch contexts when that improves the dependency boundary.
- Prefer props or local state when they are simpler.
- Measure before adding memoization for provider values.

## Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [073 - Custom hooks](073-custom-hooks.md) | [Q&A](../qnas/074-context-and-shared-application-state.md) | [Example](../examples/074-context-and-shared-application-state.md) | [075 - Client-side routing and route layouts](075-client-side-routing-and-route-layouts.md) |
