# 073 - Custom hooks

A custom Hook is a JavaScript function that uses React Hooks to package reusable stateful logic. It lets a component say what it needs, such as the browser's online status, without repeating how that value is tracked.

Custom Hooks share logic, not a single state instance. Each call to a custom Hook runs its own Hook state. If components need one shared value, lift that state to a common parent or use an appropriate shared-state mechanism.

## Learning goals

By the end of this chapter, you should be able to:

- Recognize when logic is suitable for a custom Hook.
- Name a custom Hook with the <code>use</code> prefix.
- Call Hooks only at the top level of components and custom Hooks.
- Reuse stateful logic without assuming separate calls share state.
- Design clear arguments and return values for a Hook.
- Keep Effects and their dependencies inside the Hook that owns the external synchronization.
- Avoid extracting a Hook when an ordinary function or a small amount of duplication is clearer.

## What a custom Hook is

A custom Hook is an ordinary JavaScript function whose name starts with <code>use</code> followed by a capital letter and that may call built-in or other custom Hooks.

~~~jsx
import { useEffect, useState } from "react";

function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Subscribe to the browser's online and offline events.
  }, []);

  return isOnline;
}
~~~

A component can call the Hook and use the returned value:

~~~jsx
function ConnectionBadge() {
  const isOnline = useOnlineStatus();

  return <p>{isOnline ? "Online" : "Offline"}</p>;
}
~~~

The custom Hook does not need to return JSX. It can return a boolean, object, array, callback, or any other useful value. Components remain responsible for rendering.

## Reuse logic, not a shared state instance

Each custom Hook call is independent. If two components call <code>useOnlineStatus()</code>, each call has its own state and Effect. The two values appear to stay in sync because both instances subscribe to the same browser online/offline events, not because the Hook created one shared state variable.

~~~jsx
function ConnectionBadge() {
  const isOnline = useOnlineStatus();
  return <p>{isOnline ? "Online" : "Offline"}</p>;
}

function SaveButton() {
  const isOnline = useOnlineStatus();
  return <button disabled={!isOnline}>Save</button>;
}
~~~

This is useful when each component can independently track the same external fact. If components need to coordinate one application value or avoid multiple subscriptions, call the Hook once in a shared parent and pass its result down, or use a suitable shared-state design.

| Requirement | Design |
| --- | --- |
| Reuse the same stateful behavior in separate components | Call the custom Hook in each component |
| Make several children use one authoritative React state value | Lift state to their common parent and pass props |
| Provide a value to many descendants in a subtree | Consider context when ordinary props become cumbersome |
| Share an external mutable store safely | Choose an API designed for subscribing to that store |

## Rules of Hooks apply inside custom Hooks

Hooks must be called at the top level of a function component or another custom Hook, in the same order on every render. Do not call them inside:

- A condition or loop.
- A nested function.
- An event handler.
- A callback that is not itself a Hook.
- A branch that runs only for certain props.

~~~jsx
function useFeature(enabled) {
  const [value, setValue] = useState(false);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Synchronize only while the feature is enabled.
  }, [enabled]);

  return [value, setValue];
}
~~~

The Hook calls stay at the top level. The condition is inside the Effect callback, not around the call to <code>useEffect</code>.

Component names start with a capital letter and components return something React can render. Hook names start with <code>use</code> followed by a capital letter and may return any value. A normal helper function that does not call Hooks should usually have a normal name such as <code>formatDate</code>, not a misleading <code>useFormatDate</code> name.

## Build a focused Hook

A useful custom Hook has a clear purpose and API. Name it after the behavior or external system it represents.

~~~jsx
useOnlineStatus()
useChatRoom({ serverUrl, roomId })
useWindowSize()
useDebouncedValue(value, delay)
~~~

Inputs should be ordinary arguments such as props, state values, or options. Return the values or functions that consumers need, and keep implementation details private when callers do not need them.

For example, <code>useOnlineStatus</code> returns a boolean. Components do not need to know which browser events are subscribed to or how cleanup is performed.

~~~jsx
const isOnline = useOnlineStatus();

if (!isOnline) {
  return <p role="status">You are offline.</p>;
}
~~~

The Hook runs as part of the component render and receives the latest arguments on each render. If the Hook has an Effect that reads a changing argument, include that reactive value in the Effect's dependencies.

## Complete online-status Hook

~~~jsx
import { useEffect, useState } from "react";

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    function handleOnline() {
      setIsOnline(true);
    }

    function handleOffline() {
      setIsOnline(false);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}
~~~

This Hook encapsulates one concrete browser behavior:

1. It owns local React state for the current status.
2. After the component using it commits, it subscribes to browser events.
3. It reads the browser's current status in case it changed before the subscription.
4. It removes the exact listeners in cleanup.
5. It returns only the status value to the caller.

The initial value is a server-safe fallback. The Effect reads the browser's current value after the client commit. In a server-rendered app, consider the loading and hydration behavior required by the product and its rendering framework.

## Naming and extracting logic

Do not extract every repeated line into a custom Hook. A little duplication can be easier to understand than an abstraction that hides its purpose.

Good reasons to extract a Hook include:

- Multiple components need the same stateful behavior.
- An Effect synchronizes with an external system and the component should focus on intent.
- The Hook provides a clear domain-specific API.
- The logic can be changed independently from how callers render it.

An ordinary helper is often a better choice for pure calculations:

~~~js
function getDisplayName(user) {
  return user.firstName + " " + user.lastName;
}
~~~

This function does not call Hooks or manage component state, so it does not need the <code>use</code> prefix.

A simple wrapper around one state setter may not add much:

~~~jsx
// Consider whether this abstraction adds useful behavior.
function useName(initialName) {
  return useState(initialName);
}
~~~

Extract it when the Hook gives the application a clearer reusable behavior, not just to move a line into another file.

## Avoid lifecycle-style Hooks

Avoid generic wrappers whose names imitate component lifecycle events:

~~~jsx
// Avoid lifecycle-style wrappers such as these:
useMount(callback);
useEffectOnce(callback);
useUpdateEffect(callback);
~~~

Such wrappers hide Effect dependencies and can encourage callers to omit reactive values. Prefer a Hook named for the actual purpose, such as <code>useChatRoom</code>, <code>useOnlineStatus</code>, or <code>useDocumentTitle</code>, and let it express the synchronization it owns.

## Custom Hooks and Effects

An Effect inside a custom Hook follows the same rules as an Effect inside a component:

- Use it only when synchronizing with an external system.
- Include every reactive value it reads.
- Return cleanup for subscriptions, timers, or other work that must stop.
- Do not use it to derive values that can be calculated during render.
- Do not use it to respond to a particular click or submit when an event handler is the right place.

A focused custom Hook can make this responsibility clear. For example, a component can call <code>useOnlineStatus()</code> without knowing the listener setup and cleanup details.

## Testing and using custom Hooks

A custom Hook is called while React renders a component. It cannot be called as an ordinary function at the top level of a module or inside an event handler. To exercise a Hook, render a component that calls it or use a Hook testing tool provided by the project's test setup.

This chapter's example can also be checked manually by toggling the browser's network connection and watching both consumers update. Do not call the Hook directly from the browser console.

## Common mistakes

- Naming a Hook without the <code>use</code> prefix.
- Calling a Hook inside a condition, loop, handler, or nested helper.
- Thinking two calls to one custom Hook share one state variable.
- Putting a Hooks call inside a condition instead of putting the condition inside the Effect.
- Leaving out a reactive argument from an Effect dependency list.
- Extracting a tiny wrapper that makes the code harder to understand.
- Naming a pure helper with the <code>use</code> prefix even though it calls no Hooks.
- Building generic lifecycle wrappers that obscure dependencies and purpose.
- Forgetting to clean up an event listener or subscription.
- Treating a custom Hook as a component; Hooks return data or functions and do not need to return JSX.

## Chapter checklist

Before extracting a custom Hook, check that:

- It represents reusable stateful behavior or a clear synchronization purpose.
- Its name starts with <code>use</code> followed by a capital letter.
- Every Hook inside it is called at the top level.
- Its arguments and return value are clear to callers.
- Each call's state ownership is understood.
- Shared state is lifted or provided through a shared-state mechanism when required.
- Effects include the required dependencies and cleanup.
- A regular helper function would not be simpler.
- Browser-specific work is safe for the application's rendering environment.

## Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [072 - Refs and DOM access](072-refs-and-dom-access.md) | [Q&A](../qnas/073-custom-hooks.md) | [Example](../examples/073-custom-hooks.md) | [074 - Context and shared application state](074-context-and-shared-application-state.md) |
