# Chapter 073 example: Reuse browser online status with a custom Hook

Build a small save panel that responds to the browser's online/offline status. The event subscription lives in a custom Hook. The app calls that Hook once and passes its value to two child components, so they use one shared status value.

The save action is a local demonstration only. It does not send a request or persist data.

## File structure

~~~text
src/
├── hooks/
│   └── useOnlineStatus.js
├── App.jsx
└── App.css
~~~

## Custom Hook

Create <code>src/hooks/useOnlineStatus.js</code>:

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

The Hook owns the browser subscription and returns only the boolean its callers need. Its initial <code>true</code> value is a safe fallback for server rendering; after the client commit, it reads the browser's current status.

## App component

Create <code>src/App.jsx</code>:

~~~jsx
import { useState } from "react";
import { useOnlineStatus } from "./hooks/useOnlineStatus.js";
import "./App.css";

function ConnectionBadge({ isOnline }) {
  return (
    <p
      className={isOnline ? "connection connection--online" : "connection connection--offline"}
      role="status"
    >
      <span className="connection__dot" aria-hidden="true" />
      {isOnline ? "You are online" : "You are offline"}
    </p>
  );
}

function SavePanel({ isOnline }) {
  const [draft, setDraft] = useState("");
  const [savedDraft, setSavedDraft] = useState("");
  const [message, setMessage] = useState("");

  function handleDraftChange(event) {
    setDraft(event.target.value);
    setMessage("");
  }

  function handleSave(event) {
    event.preventDefault();

    if (!isOnline) {
      setMessage("Reconnect before saving this draft.");
      return;
    }

    const nextDraft = draft.trim();

    if (!nextDraft) {
      setMessage("Write something before saving.");
      return;
    }

    setSavedDraft(nextDraft);
    setMessage("Demo saved in local React state. No server was contacted.");
  }

  function handleClear() {
    setDraft("");
    setSavedDraft("");
    setMessage("");
  }

  return (
    <section className="save-panel" aria-labelledby="save-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Custom Hook consumer</p>
          <h2 id="save-title">Progress note</h2>
        </div>
        <span className="availability">
          {isOnline ? "Ready to save" : "Saving unavailable"}
        </span>
      </div>

      <form onSubmit={handleSave}>
        <label htmlFor="progress-draft">Draft</label>
        <textarea
          id="progress-draft"
          value={draft}
          onChange={handleDraftChange}
          placeholder="Write a short learning note…"
          rows={5}
        />

        <div className="actions">
          <button className="primary-button" type="submit" disabled={!isOnline}>
            Save progress
          </button>
          <button className="secondary-button" type="button" onClick={handleClear}>
            Clear
          </button>
        </div>
      </form>

      <p className="message" role="status">{message}</p>

      {savedDraft && (
        <div className="saved-preview">
          <h3>Saved draft</h3>
          <p>{savedDraft}</p>
        </div>
      )}
    </section>
  );
}

export default function App() {
  const isOnline = useOnlineStatus();

  return (
    <main className="page">
      <header className="page-header">
        <p className="eyebrow">MERN learning path</p>
        <h1>Connection-aware notes</h1>
        <p>
          One custom Hook reads browser connectivity. Its returned value is
          shared with the status badge and save panel.
        </p>
      </header>

      <ConnectionBadge isOnline={isOnline} />
      <SavePanel isOnline={isOnline} />

      <p className="explanation">
        The Hook hides the browser event details. The child components only
        receive the status they need through props.
      </p>
    </main>
  );
}
~~~

## Stylesheet

Create <code>src/App.css</code>:

~~~css
:root {
  font-family: system-ui, sans-serif;
  color: #182230;
  background: #f1f4f8;
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
textarea {
  font: inherit;
}

.page {
  width: min(100% - 2rem, 48rem);
  margin-inline: auto;
  padding-block: 2.5rem;
}

.page-header {
  margin-bottom: 1.5rem;
}

h1,
h2,
h3,
p {
  overflow-wrap: anywhere;
}

h1 {
  margin: 0;
  font-size: clamp(2rem, 6vw, 3rem);
}

.page-header > p:last-child,
.explanation {
  color: #526174;
  line-height: 1.6;
}

.eyebrow {
  margin: 0 0 0.4rem;
  color: #4b6190;
  font-size: 0.78rem;
  font-weight: 750;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.connection {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  margin: 0 0 1rem;
  padding: 0.85rem 1rem;
  border: 1px solid;
  border-radius: 0.6rem;
  font-weight: 700;
}

.connection--online {
  border-color: #9ac8a5;
  color: #205a30;
  background: #f0faf2;
}

.connection--offline {
  border-color: #e2b4a8;
  color: #8b2c1d;
  background: #fff4f1;
}

.connection__dot {
  width: 0.65rem;
  height: 0.65rem;
  flex: 0 0 auto;
  border-radius: 50%;
  background: currentColor;
}

.save-panel {
  padding: clamp(1rem, 4vw, 1.5rem);
  border: 1px solid #d5dce7;
  border-radius: 0.85rem;
  background: #fff;
  box-shadow: 0 0.6rem 1.8rem rgb(24 34 48 / 7%);
}

.panel-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.panel-heading h2 {
  margin: 0;
}

.availability {
  color: #526174;
  font-size: 0.9rem;
  text-align: right;
}

.save-panel form {
  display: grid;
  gap: 0.6rem;
}

.save-panel label {
  font-weight: 700;
}

textarea {
  width: 100%;
  min-height: 8rem;
  padding: 0.75rem;
  border: 1px solid #aab5c4;
  border-radius: 0.5rem;
  color: inherit;
  background: #fff;
  line-height: 1.5;
  resize: vertical;
}

button:focus-visible,
textarea:focus-visible {
  outline: 3px solid #79a8ff;
  outline-offset: 2px;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.7rem;
  margin-top: 0.25rem;
}

.actions button {
  min-height: 2.8rem;
  padding: 0.6rem 0.95rem;
  border: 1px solid transparent;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 700;
}

.actions button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.primary-button {
  color: #fff;
  background: #214da0;
}

.primary-button:hover:not(:disabled) {
  background: #173b80;
}

.secondary-button {
  border-color: #aab5c4 !important;
  color: #182230;
  background: #fff;
}

.secondary-button:hover {
  background: #f2f5f9;
}

.message {
  min-height: 1.5em;
  margin: 0.75rem 0 0;
  color: #43536b;
}

.saved-preview {
  margin-top: 1rem;
  padding: 1rem;
  border: 1px solid #c8d7f1;
  border-radius: 0.6rem;
  background: #f5f8ff;
}

.saved-preview h3 {
  margin: 0;
}

.saved-preview p {
  margin-bottom: 0;
  line-height: 1.6;
  white-space: pre-wrap;
}

.explanation {
  margin-top: 1rem;
  font-size: 0.92rem;
}

@media (max-width: 32rem) {
  .page {
    width: min(100% - 1.25rem, 48rem);
    padding-block: 1.5rem;
  }

  .panel-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .availability {
    text-align: left;
  }

  .actions {
    display: grid;
  }
}
~~~

## How the example works

1. <code>useOnlineStatus</code> subscribes to the browser's <code>online</code> and <code>offline</code> events and removes those listeners during cleanup.
2. <code>App</code> calls the Hook once. This creates one status state value for this part of the UI.
3. <code>App</code> passes <code>isOnline</code> down to both <code>ConnectionBadge</code> and <code>SavePanel</code>. Their display stays in sync because they receive the same prop.
4. <code>SavePanel</code> owns its own draft and saved preview because those values belong to that component and affect its UI.
5. The save button is disabled while offline. When online, submitting updates local React state to demonstrate the interaction; it does not contact a server.

If another component called <code>useOnlineStatus()</code> directly, that call would create its own state and subscription. To give many consumers one authoritative React value, keep the Hook call in their shared owner and pass the result down.

## Try these changes

- Disconnect and reconnect the browser's network using the browser's developer tools; watch both consumers update.
- Move <code>useOnlineStatus()</code> from <code>App</code> into both child components. Observe that each Hook call sets up its own listener and local state.
- Add a child that displays a different message based on <code>isOnline</code>.
- Move the Hook file to another folder and update its import path.
- Change the save panel to accept an <code>onSave</code> callback prop, keeping persistence decisions in a parent.

## Common mistakes to avoid

- Calling <code>useOnlineStatus()</code> inside an event handler or conditional.
- Assuming a second call to the Hook shares the first call's state.
- Forgetting to remove event listeners in the Hook's Effect cleanup.
- Putting the <code>use</code> prefix on a helper that calls no Hooks.
- Returning JSX from a Hook when the component should decide what to render.
- Adding an Effect solely to derive data from other React state.
- Treating the local save demonstration as server persistence.
- Reading browser globals during rendering in a server-rendered application.

## Chapter navigation

| Previous chapter | Chapter Q&A | Next chapter |
| --- | --- | --- |
| [072 - Refs and DOM access](../lessons/072-refs-and-dom-access.md) | [Q&A](../qnas/073-custom-hooks.md) | [074 - Context and shared application state](../lessons/074-context-and-shared-application-state.md) |
