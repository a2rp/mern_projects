# 071 - Effects and external synchronization

React rendering describes what should appear on screen from the current props and state. Sometimes a component must also keep something outside React in sync: a browser timer, event listener, document title, network request, subscription, or third-party widget. React Effects are for that work.

An Effect runs after React commits a render. It can return a cleanup function to undo or stop the external work. Effects are not a general-purpose way to calculate UI state; if a value can be calculated during rendering or an action belongs to a specific user event, keep it there.

## Learning goals

By the end of this chapter, you should be able to:

- Explain when an Effect is appropriate and when it is not.
- Write an Effect with <code>useEffect</code>.
- Declare every reactive value that an Effect reads.
- Explain the difference between no dependency array, an empty array, and a populated array.
- Pair subscriptions and timers with cleanup.
- Handle asynchronous work without allowing stale results to overwrite newer state.
- Recognize development-only Effect checks in Strict Mode.

## What an Effect is for

An Effect synchronizes a component with an external system after rendering. Examples include:

- Starting and stopping a timer.
- Subscribing and unsubscribing to browser events.
- Connecting and disconnecting from a chat service.
- Updating a non-React widget when a prop changes.
- Fetching data in a component when no framework or data layer handles the request.

Effects run after the screen update is committed. The component's render function should stay pure: given the same props and state, it should describe the same UI without changing external systems.

~~~text
React state and props
        |
        v
    render UI
        |
        v
React commits the UI
        |
        v
Effect synchronizes an external system
~~~

An Effect is caused by rendering. An event handler is caused by a particular interaction. Use an event handler for work that should happen because a person clicked, typed, or submitted something. Use an Effect when a component being displayed or a reactive value changing means an external system must be synchronized.

## Basic syntax

~~~jsx
import { useEffect } from "react";

useEffect(() => {
  // Set up or synchronize with an external system.

  return () => {
    // Undo or stop that work when it is no longer needed.
  };
}, [dependencies]);
~~~

The setup function runs after a commit when React decides the Effect should run. The optional cleanup function runs before the next setup for that Effect and when the component is removed. Dependencies tell React which reactive values the Effect reads so React knows when it needs to synchronize again.

## Dependency array behavior

| Form | When setup runs |
| --- | --- |
| <code>useEffect(() =&gt; { ... })</code> | After every committed render |
| <code>useEffect(() =&gt; { ... }, [])</code> | After the component first appears; development Strict Mode adds a setup-cleanup-setup check |
| <code>useEffect(() =&gt; { ... }, [roomId])</code> | After the first commit and when <code>roomId</code> changes |

Dependencies include props, state, and values declared in the component body that the Effect reads. React compares dependency values using <code>Object.is</code>. Include all required reactive dependencies; do not silence a missing-dependency warning by guessing or choosing a shorter list.

If an Effect re-runs too often because an object or function is recreated during rendering, first see whether you can move that object or function inside the Effect, or restructure the surrounding code. Do not omit a real dependency just to suppress re-running.

## An Effect that synchronizes a timer

A timer is an external browser system. The component can start an interval while a timer is running and clear it when the timer is paused or the component is removed.

~~~jsx
import { useEffect, useState } from "react";

function Timer() {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setSeconds((currentSeconds) => currentSeconds + 1);
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isRunning]);

  return (
    <section>
      <p>Elapsed: {seconds} seconds</p>
      <button
        type="button"
        onClick={() => setIsRunning((currentlyRunning) => !currentlyRunning)}
      >
        {isRunning ? "Pause" : "Start"}
      </button>
      <button
        type="button"
        onClick={() => {
          setIsRunning(false);
          setSeconds(0);
        }}
      >
        Reset
      </button>
    </section>
  );
}
~~~

When <code>isRunning</code> changes to true, React runs the Effect and starts an interval. When it changes to false, React first calls the prior cleanup to clear the interval, then runs the new Effect, which returns without starting another one.

The callback uses a functional state update. It does not need to read <code>seconds</code> from the render, so <code>seconds</code> is not a dependency. The interval only needs to be replaced when <code>isRunning</code> changes.

This simple interval is for teaching Effects. Browser timers can be delayed, especially in background tabs, so counting interval callbacks is not a precise way to measure elapsed wall-clock time.

## Setup and cleanup are a pair

Many external operations have a matching inverse:

| Setup | Cleanup |
| --- | --- |
| <code>setInterval</code> | <code>clearInterval</code> |
| <code>addEventListener</code> | <code>removeEventListener</code> |
| <code>connect</code> | <code>disconnect</code> |
| <code>subscribe</code> | <code>unsubscribe</code> |
| Start a request that can be aborted | Abort it or ignore an outdated result |

Example: subscribe to browser connectivity events and remove the same handlers during cleanup.

~~~jsx
import { useEffect, useState } from "react";

function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
    }

    function handleOffline() {
      setIsOnline(false);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}
~~~

The same function references are used to add and remove each listener. The dependency array is empty because this Effect reads no changing props or state; its handlers update state using values supplied by the browser event.

If this hook must render on a server, reading <code>navigator</code> during initialization needs a server-safe approach. Browser globals exist only in the browser. Server-rendered applications often provide an external-store integration or initialize with a safe default and subscribe on the client.

## Fetching data and handling stale results

A request started for an old prop value can finish after a request started for a new value. Clean up the old request so it cannot overwrite current data.

~~~jsx
import { useEffect, useState } from "react";

function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const controller = new AbortController();

    async function loadUser() {
      setStatus("loading");
      setError(null);
      setUser(null);

      try {
        const response = await fetch("/api/users/" + userId, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("The user request failed.");
        }

        const nextUser = await response.json();
        setUser(nextUser);
        setStatus("success");
      } catch (requestError) {
        if (requestError.name === "AbortError") {
          return;
        }

        setError(requestError.message);
        setStatus("error");
      }
    }

    loadUser();

    return () => {
      controller.abort();
    };
  }, [userId]);

  if (status === "loading") {
    return <p>Loading profile…</p>;
  }

  if (status === "error") {
    return <p role="alert">{error}</p>;
  }

  return <h1>{user.name}</h1>;
}
~~~

The Effect reads <code>userId</code>, so it is a dependency. When the id changes, React runs cleanup for the old Effect and aborts its request before starting the new one. Aborting can prevent unnecessary work; for APIs that cannot be canceled, use a cleanup flag or request identity check so stale results are ignored.

A production application may use framework data loading or a request cache instead of fetching directly in Effects. Such tools can handle caching, deduplication, server rendering, and request coordination.

## Effects and Strict Mode

In development, React Strict Mode runs an additional setup and cleanup cycle for each Effect when a component first appears. The sequence is conceptually:

~~~text
setup → cleanup → setup
~~~

This is a development check that helps reveal missing cleanup and non-repeatable setup logic. It does not mean the production app permanently creates two subscriptions. Make setup and cleanup symmetrical so the extra cycle has the same user-visible result as one clean setup.

Do not try to “fix” the extra development cycle with a ref that suppresses the second setup. That hides lifecycle bugs rather than making the external work safe.

## When an Effect is unnecessary

If there is no external system to synchronize with, an Effect is often unnecessary.

### Derive values during render

Avoid copying a filtered or transformed value into state with an Effect:

~~~jsx
// Avoid synchronizing derived data through another state variable.
const [visibleItems, setVisibleItems] = useState([]);

useEffect(() => {
  setVisibleItems(items.filter((item) => item.active));
}, [items]);
~~~

Instead, calculate it during render:

~~~jsx
const visibleItems = items.filter((item) => item.active);
~~~

Use a memoization tool only if there is a measured performance need. Do not add an Effect just to avoid a calculation that belongs in rendering.

### Respond to user events in the event handler

If a purchase should be recorded because a user pressed a button, do it in that button's handler. Do not set a state flag and then add an Effect that watches the flag to perform the purchase. The event handler already identifies why the work should happen.

### Reset or adjust state with the state design

If changing a selected item should reset a child's local state, consider giving the child a different React <code>key</code> so its state is recreated, or redesign the state shape. Do not reflexively add an Effect that copies props into state after every render.

## Avoiding infinite Effect loops

An Effect can create a loop when it updates state and that update changes one of its dependencies:

~~~jsx
// Avoid: this runs after every render and schedules another render.
useEffect(() => {
  setCount(count + 1);
});
~~~

Before adding state updates to an Effect, ask whether it is genuinely synchronizing with an external system. If the Effect only calculates something from React state, derive that value during render or update related state in the event handler.

An object or function created during rendering also has a new identity on each render. If it is an Effect dependency, it can cause repeated synchronization. Structure the code so the Effect depends on the actual values it needs.

## Effect callback rules

- Call <code>useEffect</code> at the top level of a function component or custom Hook, never inside a loop, condition, or nested function.
- The function passed to <code>useEffect</code> should not itself be declared <code>async</code>, because an Effect may return a cleanup function, not a Promise. Declare an inner async function and call it instead.
- Include every reactive value the Effect reads.
- Keep rendering pure and free of browser mutations.
- Return cleanup when setup creates work that should stop or be undone.
- Prefer event handlers for work caused by a specific user action.

## useEffect and useLayoutEffect

<code>useEffect</code> is the usual choice for synchronizing after a render. <code>useLayoutEffect</code> runs earlier, before the browser repaints, and can be useful for layout measurement that must happen before the user sees the screen. It can block painting, so use it only when that timing is necessary.

## Chapter checklist

Before keeping an Effect, check that:

- It synchronizes React with a real external system.
- It is not merely deriving a value that could be calculated during render.
- It is not work that belongs directly in an event handler.
- Its dependency list includes every reactive value it reads.
- Its cleanup reverses subscriptions, timers, or other ongoing work.
- Its async work handles cancellation or ignores stale results.
- It behaves correctly through setup-cleanup-setup in development Strict Mode.
- Browser-only APIs are not accessed during server rendering.
- Any state updates in the Effect do not create an avoidable render loop.

## Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [070 - Share state by lifting it](070-share-state-by-lifting-it.md) | [Q&A](../qnas/071-effects-and-external-synchronization.md) | [Example](../examples/071-effects-and-external-synchronization.md) | [072 - Refs and DOM access](072-refs-and-dom-access.md) |
