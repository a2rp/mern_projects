# Chapter 072 example: Notes composer with refs

Build a small notes composer that uses DOM refs for focus, text selection, and scrolling. The note list and draft remain React state because they affect the rendered UI. A ref stores the next id because that counter is only needed when creating a note.

## What this example demonstrates

- Attaching object refs to DOM elements with <code>useRef</code>.
- Calling <code>focus()</code>, <code>select()</code>, and <code>scrollIntoView()</code> from event handlers.
- Keeping visible data in state and an internal id counter in a ref.
- Letting React add and remove its own rendered DOM.
- Handling a ref that may be <code>null</code>.

## React component

Save this as <code>App.jsx</code> in a React application:

~~~jsx
import { useRef, useState } from "react";
import "./App.css";

const initialNotes = [
  {
    id: 1,
    text: "Refs can focus an input without storing its DOM node in state.",
  },
  {
    id: 2,
    text: "Use state for data that changes the rendered interface.",
  },
  {
    id: 3,
    text: "Let React add and remove the elements it renders.",
  },
];

export default function App() {
  const [draft, setDraft] = useState("");
  const [notes, setNotes] = useState(initialNotes);
  const [feedback, setFeedback] = useState("");

  const draftRef = useRef(null);
  const notesHeadingRef = useRef(null);
  const nextNoteIdRef = useRef(4);

  function handleDraftChange(event) {
    setDraft(event.target.value);
    setFeedback("");
  }

  function handleAddNote(event) {
    event.preventDefault();

    const text = draft.trim();

    if (text.length === 0) {
      setFeedback("Write a note before adding it.");
      draftRef.current?.focus();
      return;
    }

    const newNote = {
      id: nextNoteIdRef.current,
      text,
    };

    nextNoteIdRef.current += 1;
    setNotes((currentNotes) => [newNote, ...currentNotes]);
    setDraft("");
    setFeedback("Note added.");
    draftRef.current?.focus();
  }

  function handleDeleteNote(noteId) {
    setNotes((currentNotes) =>
      currentNotes.filter((note) => note.id !== noteId)
    );
    setFeedback("Note deleted.");
  }

  function handleClearNotes() {
    setNotes([]);
    setFeedback("All notes cleared.");
  }

  function handleFocusDraft() {
    draftRef.current?.focus();
  }

  function handleSelectDraft() {
    draftRef.current?.select();
  }

  function handleScrollToNotes() {
    notesHeadingRef.current?.scrollIntoView({ block: "start" });
  }

  return (
    <main className="page">
      <header className="page-header">
        <p className="eyebrow">MERN learning path</p>
        <h1>Quick notes</h1>
        <p>
          Add notes, move focus to the editor, select its text, or jump to the
          saved list.
        </p>
      </header>

      <section className="composer-card" aria-labelledby="composer-title">
        <h2 id="composer-title">Write a note</h2>
        <form onSubmit={handleAddNote}>
          <label htmlFor="note-draft">Note text</label>
          <textarea
            id="note-draft"
            ref={draftRef}
            name="draft"
            onChange={handleDraftChange}
            placeholder="Write something worth remembering…"
            rows={5}
            value={draft}
          />

          <div className="actions">
            <button className="primary-button" type="submit">
              Add note
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={handleFocusDraft}
            >
              Focus editor
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={handleSelectDraft}
            >
              Select text
            </button>
          </div>
        </form>

        <p className="feedback" role="status">
          {feedback}
        </p>
      </section>

      <section className="notes-section" aria-labelledby="notes-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Saved locally in React state</p>
            <h2 id="notes-heading" ref={notesHeadingRef}>
              Your notes
            </h2>
          </div>
          <span className="note-count">
            {notes.length} {notes.length === 1 ? "note" : "notes"}
          </span>
        </div>

        <div className="list-actions">
          <button
            className="secondary-button"
            type="button"
            onClick={handleScrollToNotes}
          >
            Scroll to notes
          </button>
          <button
            className="secondary-button"
            type="button"
            onClick={handleClearNotes}
            disabled={notes.length === 0}
          >
            Clear all
          </button>
        </div>

        {notes.length === 0 ? (
          <p className="empty-state">No notes yet. Add one above.</p>
        ) : (
          <ul className="notes-list">
            {notes.map((note) => (
              <li className="note-card" key={note.id}>
                <p>{note.text}</p>
                <button
                  className="delete-button"
                  type="button"
                  aria-label={"Delete note " + note.id}
                  onClick={() => handleDeleteNote(note.id)}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
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

button {
  min-height: 2.7rem;
  padding: 0.55rem 0.9rem;
  border: 1px solid transparent;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 700;
}

button:focus-visible,
textarea:focus-visible {
  outline: 3px solid #79a8ff;
  outline-offset: 2px;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.page {
  width: min(100% - 2rem, 52rem);
  margin-inline: auto;
  padding-block: 2.5rem;
}

.page-header {
  margin-bottom: 1.5rem;
}

h1,
h2,
p {
  overflow-wrap: anywhere;
}

h1 {
  margin: 0;
  font-size: clamp(2rem, 6vw, 3rem);
}

h2 {
  margin: 0;
}

.page-header > p:last-child {
  color: #536176;
  line-height: 1.6;
}

.eyebrow {
  margin: 0 0 0.4rem;
  color: #4e6390;
  font-size: 0.78rem;
  font-weight: 750;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.composer-card,
.note-card {
  border: 1px solid #d5dce7;
  border-radius: 0.8rem;
  background: #fff;
  box-shadow: 0 0.5rem 1.5rem rgb(23 32 51 / 6%);
}

.composer-card {
  padding: clamp(1rem, 4vw, 1.5rem);
}

.composer-card h2 {
  margin-bottom: 1rem;
}

.composer-card form {
  display: grid;
  gap: 0.6rem;
}

.composer-card label {
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

.actions,
.list-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
}

.primary-button {
  color: #fff;
  background: #214da0;
}

.primary-button:hover {
  background: #173b80;
}

.secondary-button {
  border-color: #aab5c4;
  color: #172033;
  background: #fff;
}

.secondary-button:hover:not(:disabled) {
  background: #f2f5f9;
}

.feedback {
  min-height: 1.5em;
  margin: 0.75rem 0 0;
  color: #365d35;
}

.notes-section {
  margin-top: 2.25rem;
  scroll-margin-top: 1rem;
}

.section-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 1rem;
}

.note-count {
  color: #536176;
  font-weight: 650;
}

.list-actions {
  margin: 1rem 0;
}

.notes-list {
  display: grid;
  gap: 0.8rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.note-card {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem;
}

.note-card p {
  margin: 0;
  line-height: 1.6;
  white-space: pre-wrap;
}

.delete-button {
  flex: 0 0 auto;
  border-color: #e1b4b4;
  color: #9d2727;
  background: #fff;
}

.delete-button:hover {
  background: #fff4f4;
}

.empty-state {
  padding: 1.5rem;
  border: 1px dashed #aab5c4;
  border-radius: 0.75rem;
  color: #536176;
  text-align: center;
}

@media (max-width: 34rem) {
  .page {
    width: min(100% - 1.25rem, 52rem);
    padding-block: 1.5rem;
  }

  .section-heading,
  .note-card {
    align-items: flex-start;
    flex-direction: column;
  }

  .actions,
  .list-actions {
    display: grid;
  }
}
~~~

## How the refs work

1. <code>draftRef</code> points to the textarea DOM node. The focus and select buttons call browser methods on that node from event handlers.
2. <code>notesHeadingRef</code> points to the notes heading. The scroll button asks the browser to bring that heading into view.
3. <code>nextNoteIdRef</code> retains the next id between renders. Incrementing it does not cause a render; adding a note changes <code>notes</code> state, which does.
4. <code>draft</code>, <code>notes</code>, and <code>feedback</code> are state because they affect the displayed interface.
5. The notes list uses React state and stable note ids. The delete button does not remove a DOM node directly; it updates the notes state and lets React render the new list.
6. Optional chaining handles the case where a referenced DOM element is not mounted.

## Try these changes

- Click “Focus editor” and verify keyboard focus moves to the textarea.
- Type some text and click “Select text”.
- Add a note and verify the textarea receives focus again.
- Click “Scroll to notes” from the top of a long page.
- Delete a note and confirm React updates the list.
- Replace <code>nextNoteIdRef</code> with state and observe that the interface does not need to render just because the next id changed.
- Put the note draft in a ref instead of state and consider what would be lost: React would not render the typed value or use it for validation.

## Common mistakes to avoid

- Expecting <code>nextNoteIdRef.current</code> to trigger a visible update.
- Using a ref instead of state for the draft or notes list.
- Calling <code>focus()</code> during render rather than in an event handler.
- Assuming a ref is always non-null.
- Removing a note element with a DOM method instead of updating the list state.
- Using the list position as a key when each note already has a stable id.
- Reading the DOM ref before React has attached the node.
- Expecting the notes to survive a reload; this example only stores them in component state.
- Assuming refs should be passed through custom components the same way in every React version.

## Chapter navigation

| Previous chapter | Chapter Q&A | Next chapter |
| --- | --- | --- |
| [071 - Effects and external synchronization](../lessons/071-effects-and-external-synchronization.md) | [Q&A](../qnas/072-refs-and-dom-access.md) | [073 - Custom hooks](../lessons/073-custom-hooks.md) |
