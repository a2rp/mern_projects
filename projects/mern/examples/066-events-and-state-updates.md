# 066 - Events and state updates: example

This example builds a small interactive task board. It demonstrates event handlers, a controlled form, state snapshots, updater functions, and immutable updates to an array of tasks.

The code is educational material and is not run. Place the files in the Vite React app created in the tooling chapter, then render <code>App</code> from the app entry. The example uses in-memory data only; reloading the page resets the tasks.

## What the example demonstrates

- Passing event handler functions to JSX without calling them during render.
- Handling a form's submit event and preventing its default page navigation.
- Keeping an input controlled by React state.
- Using updater functions when the next task array or ID depends on pending state.
- Adding, toggling, and removing tasks without mutating the existing array.
- Deriving visible tasks and the completed count from current state.
- Passing callbacks from the state-owning component to child components.

## Component and state outline

~~~text
App owns tasks, draft, filter, and nextTaskId
    |
    +-- TaskForm (draft value and handlers)
    |
    +-- FilterSelect (current filter and handler)
    |
    +-- TaskSummary (derived counts)
    |
    +-- TaskList
          +-- TaskRow (task and toggle/delete callbacks)
~~~

## Create the components

~~~jsx
// src/App.jsx
import { useState } from "react";
import "./App.css";

const initialTasks = [
    { id: 1, title: "Review component composition", completed: true },
    { id: 2, title: "Read about props", completed: false },
    { id: 3, title: "Practice event handlers", completed: false }
];

function TaskForm({ value, onValueChange, onSubmit }) {
    return (
        <form className="task-form" onSubmit={onSubmit}>
            <label htmlFor="new-task">New task</label>
            <div className="form-row">
                <input
                    id="new-task"
                    value={value}
                    onChange={event => onValueChange(event.target.value)}
                    placeholder="For example, practice a form event"
                />
                <button type="submit">Add task</button>
            </div>
        </form>
    );
}

function FilterSelect({ value, onFilterChange }) {
    return (
        <label className="filter-control">
            <span>Show</span>
            <select
                value={value}
                onChange={event => onFilterChange(event.target.value)}
            >
                <option value="all">All tasks</option>
                <option value="active">Active tasks</option>
                <option value="complete">Completed tasks</option>
            </select>
        </label>
    );
}

function TaskRow({ task, onToggle, onDelete }) {
    return (
        <li className={task.completed ? "task-row completed" : "task-row"}>
            <label className="task-label">
                <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => onToggle(task.id)}
                />
                <span>{task.title}</span>
            </label>
            <button
                type="button"
                className="delete-button"
                onClick={() => onDelete(task.id)}
                aria-label={"Delete " + task.title}
            >
                Delete
            </button>
        </li>
    );
}

function TaskList({ tasks, onToggle, onDelete }) {
    if (tasks.length === 0) {
        return <p className="empty-state">No tasks match this filter.</p>;
    }

    return (
        <ul className="task-list">
            {tasks.map(task => (
                <TaskRow
                    key={task.id}
                    task={task}
                    onToggle={onToggle}
                    onDelete={onDelete}
                />
            ))}
        </ul>
    );
}

function TaskSummary({ totalCount, completedCount }) {
    return (
        <p className="task-summary" aria-live="polite">
            {completedCount} of {totalCount} tasks completed
        </p>
    );
}

export default function App() {
    const [tasks, setTasks] = useState(initialTasks);
    const [draft, setDraft] = useState("");
    const [filter, setFilter] = useState("all");
    const [nextTaskId, setNextTaskId] = useState(4);

    const visibleTasks = tasks.filter(task => {
        if (filter === "active") {
            return !task.completed;
        }

        if (filter === "complete") {
            return task.completed;
        }

        return true;
    });

    const completedCount = tasks.filter(task => task.completed).length;

    function handleSubmit(event) {
        event.preventDefault();

        const title = draft.trim();

        if (title === "") {
            return;
        }

        const newTask = {
            id: nextTaskId,
            title,
            completed: false
        };

        setTasks(previousTasks => [...previousTasks, newTask]);
        setNextTaskId(previousId => previousId + 1);
        setDraft("");
    }

    function handleToggle(taskId) {
        setTasks(previousTasks =>
            previousTasks.map(task =>
                task.id === taskId
                    ? { ...task, completed: !task.completed }
                    : task
            )
        );
    }

    function handleDelete(taskId) {
        setTasks(previousTasks =>
            previousTasks.filter(task => task.id !== taskId)
        );
    }

    return (
        <main className="task-board">
            <header className="page-heading">
                <p className="eyebrow">MERN learning notes</p>
                <h1>Task board</h1>
                <p>Add tasks, mark them complete, or remove them.</p>
            </header>

            <TaskForm
                value={draft}
                onValueChange={setDraft}
                onSubmit={handleSubmit}
            />

            <div className="task-toolbar">
                <TaskSummary
                    totalCount={tasks.length}
                    completedCount={completedCount}
                />
                <FilterSelect
                    value={filter}
                    onFilterChange={setFilter}
                />
            </div>

            <TaskList
                tasks={visibleTasks}
                onToggle={handleToggle}
                onDelete={handleDelete}
            />
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

button,
input,
select {
    font: inherit;
}

button {
    cursor: pointer;
}

.task-board {
    max-width: 760px;
    margin: 0 auto;
    padding: 2rem 1.25rem;
}

.page-heading {
    margin-bottom: 1.5rem;
}

.page-heading h1,
.page-heading p {
    margin: 0.35rem 0;
}

.eyebrow {
    color: #53627a;
    font-size: 0.875rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
}

.task-form,
.task-list {
    padding: 1.25rem;
    border: 1px solid #d6dce7;
    border-radius: 0.75rem;
    background: #fff;
}

.task-form label,
.filter-control {
    font-weight: 700;
}

.form-row {
    display: flex;
    gap: 0.65rem;
    margin-top: 0.5rem;
}

.form-row input {
    flex: 1;
    min-width: 0;
    padding: 0.65rem 0.75rem;
    border: 1px solid #aab4c3;
    border-radius: 0.4rem;
}

.form-row button {
    padding: 0.65rem 1rem;
    border: 0;
    border-radius: 0.4rem;
    color: #fff;
    background: #2457ad;
}

.task-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    margin: 1.25rem 0 0.75rem;
}

.task-summary {
    margin: 0;
    color: #53627a;
}

.filter-control {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.filter-control select {
    padding: 0.45rem 0.6rem;
    border: 1px solid #aab4c3;
    border-radius: 0.4rem;
    background: #fff;
}

.task-list {
    display: grid;
    gap: 0.25rem;
    margin: 0;
    list-style: none;
}

.task-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    padding: 0.7rem 0;
    border-bottom: 1px solid #e5e8ef;
}

.task-row:last-child {
    border-bottom: 0;
}

.task-label {
    display: flex;
    align-items: center;
    gap: 0.65rem;
}

.task-label input {
    width: 1rem;
    height: 1rem;
}

.task-row.completed .task-label span {
    color: #667085;
    text-decoration: line-through;
}

.delete-button {
    padding: 0.4rem 0.65rem;
    border: 1px solid #c4cad4;
    border-radius: 0.35rem;
    color: #7a2632;
    background: #fff;
}

.empty-state {
    padding: 1rem;
    border: 1px dashed #aab4c3;
    border-radius: 0.5rem;
}

@media (max-width: 560px) {
    .form-row,
    .task-toolbar {
        align-items: stretch;
        flex-direction: column;
    }

    .filter-control {
        justify-content: space-between;
    }
}
~~~

## How the updates work

<code>App</code> owns all four changing values. The child form receives the current <code>draft</code> and the <code>setDraft</code> callback. Typing reports the new input value; the owner stores it and renders the updated value back into the field.

Submitting the form calls <code>handleSubmit</code>. It prevents the browser's default form navigation, trims the draft, and ignores an empty title. It then queues a new task array, advances the ID, and clears the draft. The updater functions use their pending previous values and return new values.

Toggling a checkbox maps over the previous task array and returns a new array. For the matching task, it returns a new task object with the opposite completion value. Deleting filters the previous array into a new array. Neither handler mutates existing state.

The active/completed filter, visible task list, and completed count are derived from the current task data during render. They are not stored as duplicate state. React updates the displayed summary and list after the relevant state changes.

## Expected result

Initially, the board shows three tasks and reports one completed. You can type a task and press Enter or select Add task. The new task appears as active. Check a task to toggle its completion, use the filter to show a subset, and select Delete to remove a task.

The task list, filter, and summary update after each interaction without a page reload.

## Try these changes

1. Add a button that marks all tasks complete using a functional array updater.
2. Add a “Clear completed” button that filters completed tasks out of the previous array.
3. Add a validation message when the draft contains only whitespace.
4. Add an event handler that asks for confirmation before deleting, keeping the confirmation outside the state updater.
5. Change the summary text to show the number of active tasks, deriving it from <code>tasks</code>.

## Common mistakes to avoid

- Writing <code>onClick={handleDelete(task.id)}</code> and deleting during render.
- Forgetting <code>event.preventDefault()</code> when the React form handles submission.
- Calling <code>push</code> on the existing tasks state array.
- Mutating a task object instead of returning a copied object.
- Assuming <code>setDraft("")</code> changes the current <code>draft</code> variable in the same handler.
- Putting a confirmation dialog or API call inside an updater function.
- Saving the visible task list or completed count as duplicate state.
- Removing a task key or using the array index as the key.
- Omitting the input's change handler while supplying its controlled value.

## Chapter navigation

| Previous chapter | Chapter Q&A | Next chapter |
| --- | --- | --- |
| [065 - Props and one-way data flow](../lessons/065-props-and-one-way-data-flow.md) | [Q&A](../qnas/066-events-and-state-updates.md) | [067 - useState and state design](../lessons/067-usestate-and-state-design.md) |
