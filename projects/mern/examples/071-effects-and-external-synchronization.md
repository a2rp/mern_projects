# Chapter 071 example: Synchronize a focus timer with the browser

This example builds a small elapsed-time tracker. React state controls the timer display, an Effect starts and clears a browser interval, and another Effect keeps the browser tab title in sync.

The interval is intentionally simple for learning. Browser timers can be delayed in background tabs, so this is not a precision stopwatch.

## What this example demonstrates

- An Effect that starts external work when a component is running.
- Cleanup that clears the interval when the timer pauses or the component is removed.
- A functional state update inside the interval callback.
- An Effect that synchronizes the browser document title with React state.
- Cleanup that restores the document title that was in place before this page mounted.
- Event handlers for start, pause, and reset actions.

## React component

Save this as <code>App.jsx</code> in a client-side React application:

~~~jsx
import { useEffect, useState } from "react";
import "./App.css";

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0");
}

export default function App() {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const formattedTime = formatTime(elapsedSeconds);

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setElapsedSeconds((currentSeconds) => currentSeconds + 1);
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isRunning]);

  useEffect(() => {
    const originalTitle = document.title;

    return () => {
      document.title = originalTitle;
    };
  }, []);

  useEffect(() => {
    const timerStatus = isRunning ? "Running" : "Paused";
    document.title = formattedTime + " · " + timerStatus + " focus timer";
  }, [formattedTime, isRunning]);

  function handleStartPause() {
    setIsRunning((currentlyRunning) => !currentlyRunning);
  }

  function handleReset() {
    setIsRunning(false);
    setElapsedSeconds(0);
  }

  return (
    <main className="page">
      <section className="timer-card" aria-labelledby="timer-title">
        <p className="eyebrow">MERN learning path</p>
        <h1 id="timer-title">Focus timer</h1>
        <p className="intro">
          Start the timer and watch the page and browser tab title stay in sync.
        </p>

        <output className="timer" aria-label="Elapsed time">
          {formattedTime}
        </output>

        <p className="status">
          Status: <strong>{isRunning ? "Running" : "Paused"}</strong>
        </p>

        <div className="actions">
          <button
            className="primary-button"
            type="button"
            onClick={handleStartPause}
          >
            {isRunning ? "Pause timer" : "Start timer"}
          </button>
          <button
            className="secondary-button"
            type="button"
            onClick={handleReset}
          >
            Reset
          </button>
        </div>

        <p className="hint">
          The timer uses a browser interval while running. Pausing clears that
          interval. Resetting is handled directly by the button event.
        </p>
      </section>
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
  background: #eef2f8;
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

button {
  font: inherit;
  cursor: pointer;
}

button:focus-visible {
  outline: 3px solid #77a5ff;
  outline-offset: 3px;
}

.page {
  display: grid;
  min-height: 100vh;
  padding: 1.25rem;
  place-items: center;
}

.timer-card {
  width: min(100%, 36rem);
  padding: clamp(1.5rem, 6vw, 3rem);
  border: 1px solid #d6deeb;
  border-radius: 1.25rem;
  background: #fff;
  box-shadow: 0 1.25rem 3.5rem rgb(23 32 51 / 12%);
  text-align: center;
}

.eyebrow {
  margin: 0 0 0.5rem;
  color: #4b6190;
  font-size: 0.8rem;
  font-weight: 750;
  letter-spacing: 0.09em;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  font-size: clamp(2rem, 8vw, 3rem);
}

.intro {
  max-width: 28rem;
  margin: 0.85rem auto 2rem;
  color: #526174;
  line-height: 1.6;
}

.timer {
  display: block;
  margin: 0.5rem 0 1rem;
  color: #173b80;
  font-size: clamp(4rem, 18vw, 7rem);
  font-variant-numeric: tabular-nums;
  font-weight: 750;
  letter-spacing: 0.04em;
  line-height: 1;
}

.status {
  margin: 0 0 1.5rem;
  color: #526174;
}

.status strong {
  color: #172033;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.75rem;
}

.actions button {
  min-height: 2.9rem;
  padding: 0.65rem 1.1rem;
  border: 1px solid transparent;
  border-radius: 0.55rem;
  font-weight: 700;
}

.primary-button {
  color: #fff;
  background: #214da0;
}

.primary-button:hover {
  background: #173b80;
}

.secondary-button {
  border-color: #aab5c4 !important;
  color: #172033;
  background: #fff;
}

.secondary-button:hover {
  background: #f2f5f9;
}

.hint {
  max-width: 28rem;
  margin: 1.75rem auto 0;
  color: #526174;
  font-size: 0.9rem;
  line-height: 1.55;
}

@media (max-width: 28rem) {
  .page {
    padding: 0.75rem;
  }

  .actions {
    display: grid;
  }
}
~~~

## How the Effects work

### The interval Effect

The first Effect synchronizes with the browser's timer API:

1. When <code>isRunning</code> is false, the Effect does not create an interval.
2. When the user starts the timer, React changes <code>isRunning</code> and renders again.
3. After that render commits, the Effect creates one interval.
4. Each interval callback updates elapsed time with a functional state update.
5. When the user pauses, <code>isRunning</code> changes. React runs cleanup for the old Effect and clears its interval before running the paused Effect.
6. If the component is removed while running, cleanup clears the interval too.

The Effect depends on <code>isRunning</code>, the only reactive value it reads. It does not depend on <code>elapsedSeconds</code> because the callback uses a functional updater rather than a captured render value.

### The document title Effects

The title cleanup Effect remembers the original browser title and restores it when the timer page is removed. The synchronization Effect sets the current title from <code>formattedTime</code> and <code>isRunning</code>. Those values are its dependencies, so the title updates after the display changes.

These Effects interact with the browser's document object, which is outside React's rendered component tree. They are appropriate synchronization work.

### The button event handlers

Starting, pausing, and resetting happen because a person pressed a button, so those actions belong in event handlers. The interval itself belongs in an Effect because it must exist only while the component is in the running state.

## Try these changes

- Start the timer, then pause it. Confirm the displayed time stops changing.
- Reset while the timer is running. Confirm the count returns to zero and the interval is cleared.
- Run the app inside React Strict Mode in development. Confirm the timer still advances by one second at a time instead of creating duplicate intervals.
- Change the document title in the synchronization Effect to include the timer status.
- Add an effect for an external browser event and remove its listener in cleanup.
- Navigate away from the component and confirm its original document title is restored.

## Common mistakes to avoid

- Starting an interval during render instead of in an Effect.
- Forgetting to clear the interval in cleanup.
- Reading <code>elapsedSeconds</code> from a stale closure when a functional update is sufficient.
- Omitting <code>isRunning</code> from the timer Effect dependencies.
- Starting one interval in an Effect and another in a click handler.
- Using an Effect to reset the timer when the reset button can do that directly.
- Using an Effect to derive <code>formattedTime</code>; it is calculated during render.
- Treating a browser interval as a precise clock. Background timers can be throttled or delayed.
- Assuming Strict Mode's extra setup-cleanup cycle in development means production creates two permanent intervals.
- Accessing <code>document</code> during render in a server-rendered application. Effects run on the client; browser-only work belongs in an appropriate client boundary.

## Chapter navigation

| Previous chapter | Chapter Q&A | Next chapter |
| --- | --- | --- |
| [070 - Share state by lifting it](../lessons/070-share-state-by-lifting-it.md) | [Q&A](../qnas/071-effects-and-external-synchronization.md) | [072 - Refs and DOM access](../lessons/072-refs-and-dom-access.md) |
