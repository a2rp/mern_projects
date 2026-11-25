# 086 - Build a reusable component system: example

This example creates three small shared components—Button, TextField, and EmptyState—and composes them in a course-search feature. The shared components keep native semantics and consistent styles; the feature owns course-specific filtering and actions.

The goal is a practical starting point, not a large design-system package. Keep these components inside the React app until another independent consumer needs the same stable API.

## What you will build

- A Button with a small set of semantic variants and forwarded native attributes.
- A TextField with an associated label, optional hint, and optional error.
- An EmptyState that supports a caller-provided action.
- A course-search feature that composes the shared components.
- CSS tokens and component-owned styles.

## File structure

~~~text
src/
  components/
    ui/
      Button.jsx
      Button.css
      TextField.jsx
      TextField.css
      EmptyState.jsx
      EmptyState.css
  features/
    courses/
      CourseSearchPanel.jsx
      CourseSearchPanel.css
  App.jsx
  main.jsx
  styles/
    tokens.css
~~~

## 1. Define a few shared tokens

Create <code>src/styles/tokens.css</code>:

~~~css
:root {
  --color-text: #172033;
  --color-muted: #526175;
  --color-page: #f4f6fa;
  --color-surface: #fff;
  --color-border: #cbd5e1;
  --color-primary: #155eef;
  --color-primary-hover: #1049bb;
  --color-danger: #b42318;
  --color-focus: rgb(21 94 239 / 32%);

  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;

  --radius-control: 0.4rem;
  --radius-card: 0.75rem;
}
~~~

Import this file once from the application entry point so components can use the same values.

~~~js
// src/main.jsx
import './styles/tokens.css';
~~~

## 2. Build a reusable Button

Create <code>src/components/ui/Button.jsx</code>:

~~~jsx
import './Button.css';

const variants = ['primary', 'secondary', 'danger'];
const sizes = ['small', 'medium'];

export function Button({
  variant = 'primary',
  size = 'medium',
  className = '',
  type = 'button',
  ...buttonProps
}) {
  const safeVariant = variants.includes(variant) ? variant : 'primary';
  const safeSize = sizes.includes(size) ? size : 'medium';

  const classes = [
    'ui-button',
    'ui-button--' + safeVariant,
    'ui-button--' + safeSize,
    className
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      className={classes}
      type={type}
      {...buttonProps}
    />
  );
}
~~~

The component uses a native button, defaults its type to <code>button</code>, consumes its visual props, and forwards ordinary button attributes such as <code>disabled</code>, <code>aria-pressed</code>, and event handlers.

Create <code>src/components/ui/Button.css</code>:

~~~css
.ui-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  min-height: 2.65rem;
  border: 1px solid transparent;
  border-radius: var(--radius-control);
  padding: 0.55rem 0.85rem;
  font: inherit;
  font-weight: 650;
  line-height: 1.2;
  cursor: pointer;
}

.ui-button--small {
  min-height: 2rem;
  padding: 0.35rem 0.6rem;
  font-size: 0.875rem;
}

.ui-button--medium {
  font-size: 1rem;
}

.ui-button--primary {
  color: #fff;
  background: var(--color-primary);
}

.ui-button--primary:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.ui-button--secondary {
  border-color: var(--color-border);
  color: var(--color-text);
  background: var(--color-surface);
}

.ui-button--danger {
  color: #fff;
  background: var(--color-danger);
}

.ui-button:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 2px;
}

.ui-button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}
~~~

## 3. Build a labelled TextField

Create <code>src/components/ui/TextField.jsx</code>:

~~~jsx
import './TextField.css';

export function TextField({
  id,
  label,
  hint,
  error,
  className = '',
  ...inputProps
}) {
  const describedBy = [
    inputProps['aria-describedby'],
    hint ? id + '-hint' : null,
    error ? id + '-error' : null
  ]
    .filter(Boolean)
    .join(' ') || undefined;

  const invalid = error ? true : inputProps['aria-invalid'];

  return (
    <div className="ui-field">
      <label className="ui-field__label" htmlFor={id}>
        {label}
      </label>
      <input
        {...inputProps}
        id={id}
        className={['ui-field__input', className].filter(Boolean).join(' ')}
        aria-describedby={describedBy}
        aria-invalid={invalid}
      />
      {hint && (
        <p className="ui-field__hint" id={id + '-hint'}>
          {hint}
        </p>
      )}
      {error && (
        <p className="ui-field__error" id={id + '-error'} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
~~~

The input needs a stable unique <code>id</code> and a visible <code>label</code>. The hint and error get IDs that are included in <code>aria-describedby</code>. The caller can also supply an existing description ID.

Create <code>src/components/ui/TextField.css</code>:

~~~css
.ui-field {
  display: grid;
  gap: var(--space-2);
}

.ui-field__label {
  color: var(--color-text);
  font-weight: 650;
}

.ui-field__input {
  width: 100%;
  min-height: 2.65rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  padding: 0.55rem 0.7rem;
  color: var(--color-text);
  background: var(--color-surface);
  font: inherit;
}

.ui-field__input:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 2px;
}

.ui-field__input[aria-invalid="true"] {
  border-color: var(--color-danger);
}

.ui-field__hint,
.ui-field__error {
  margin: 0;
  font-size: 0.9rem;
}

.ui-field__hint {
  color: var(--color-muted);
}

.ui-field__error {
  color: var(--color-danger);
}
~~~

## 4. Build a composable EmptyState

Create <code>src/components/ui/EmptyState.jsx</code>:

~~~jsx
import { useId } from 'react';
import './EmptyState.css';

export function EmptyState({ title, description, action }) {
  const titleId = useId();

  return (
    <section className="ui-empty-state" aria-labelledby={titleId}>
      <h2 className="ui-empty-state__title" id={titleId}>
        {title}
      </h2>
      <p className="ui-empty-state__description">{description}</p>
      {action && <div className="ui-empty-state__action">{action}</div>}
    </section>
  );
}
~~~

The feature supplies the action as a child element. The empty state owns its heading and layout without needing to know what “clear filters” means.

Create <code>src/components/ui/EmptyState.css</code>:

~~~css
.ui-empty-state {
  display: grid;
  justify-items: start;
  gap: var(--space-3);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-card);
  padding: var(--space-6);
  background: var(--color-surface);
}

.ui-empty-state__title,
.ui-empty-state__description {
  margin: 0;
}

.ui-empty-state__description {
  color: var(--color-muted);
}

.ui-empty-state__action {
  margin-block-start: var(--space-1);
}
~~~

## 5. Compose the shared components in a feature

Create <code>src/features/courses/CourseSearchPanel.jsx</code>:

~~~jsx
import { useState } from 'react';
import { Button } from '../../components/ui/Button.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { TextField } from '../../components/ui/TextField.jsx';
import './CourseSearchPanel.css';

export function CourseSearchPanel({ courses, onOpenCourse }) {
  const [query, setQuery] = useState('');
  const normalizedQuery = query.trim().toLocaleLowerCase();

  const visibleCourses = courses.filter((course) =>
    (course.title + ' ' + course.summary)
      .toLocaleLowerCase()
      .includes(normalizedQuery)
  );

  return (
    <main className="course-search">
      <header className="course-search__header">
        <p className="course-search__eyebrow">Learning library</p>
        <h1>Courses</h1>
        <p>Find a course and open its details.</p>
      </header>

      <TextField
        id="course-search"
        label="Search courses"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        hint="Search by title or description."
      />

      <p className="course-search__count" role="status" aria-live="polite">
        Showing {visibleCourses.length} of {courses.length} courses
      </p>

      {visibleCourses.length === 0 ? (
        <EmptyState
          title="No matching courses"
          description="Try a different search or clear the current search."
          action={
            <Button
              variant="secondary"
              onClick={() => setQuery('')}
              disabled={query === ''}
            >
              Clear search
            </Button>
          }
        />
      ) : (
        <ul className="course-search__list" aria-label="Course results">
          {visibleCourses.map((course) => (
            <li key={course.id}>
              <article className="course-search__card">
                <div>
                  <p className="course-search__category">{course.category}</p>
                  <h2>{course.title}</h2>
                  <p>{course.summary}</p>
                </div>
                <Button
                  variant="primary"
                  size="small"
                  aria-label={'Open ' + course.title}
                  onClick={() => onOpenCourse(course)}
                >
                  Open
                </Button>
              </article>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
~~~

The shared Button handles appearance and native button behavior. The courses feature owns search filtering and the meaning of opening a course. The EmptyState accepts an action without taking on feature-specific state.

## 6. Add feature styles

Create <code>src/features/courses/CourseSearchPanel.css</code>:

~~~css
.course-search {
  display: grid;
  gap: var(--space-4);
  width: min(100% - 2rem, 58rem);
  margin-inline: auto;
  padding-block: 2rem;
  color: var(--color-text);
  font-family: system-ui, sans-serif;
}

.course-search__header h1,
.course-search__header p {
  margin: 0;
}

.course-search__header {
  display: grid;
  gap: var(--space-2);
}

.course-search__eyebrow,
.course-search__category {
  color: var(--color-muted);
  font-size: 0.9rem;
  font-weight: 650;
  text-transform: uppercase;
}

.course-search__count {
  margin: 0;
  color: var(--color-muted);
}

.course-search__list {
  display: grid;
  gap: var(--space-3);
  margin: 0;
  padding: 0;
  list-style: none;
}

.course-search__card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  padding: var(--space-4);
  background: var(--color-surface);
}

.course-search__card h2,
.course-search__card p {
  margin-block: 0 var(--space-2);
}

@media (max-width: 36rem) {
  .course-search__card {
    align-items: stretch;
    flex-direction: column;
  }
}
~~~

## 7. Render the feature

Use the panel from an existing route. For a small standalone walkthrough, <code>src/App.jsx</code> can provide sample data:

~~~jsx
import { CourseSearchPanel } from './features/courses/CourseSearchPanel.jsx';

const courses = [
  {
    id: 'html',
    title: 'HTML fundamentals',
    category: 'Frontend',
    summary: 'Build structured pages with semantic HTML.'
  },
  {
    id: 'react',
    title: 'React interfaces',
    category: 'Frontend',
    summary: 'Compose interactive user interfaces.'
  }
];

export default function App() {
  function openCourse(course) {
    window.alert('Selected: ' + course.title);
  }

  return <CourseSearchPanel courses={courses} onOpenCourse={openCourse} />;
}
~~~

In an application, replace <code>window.alert</code> with the route or feature action that opens the course. Keep navigation as a link if it is a destination rather than an in-place action.

## Expected behavior

- Search input has the visible accessible label “Search courses.”
- Search results update as the user types.
- Each course can be opened with a native button and a useful accessible name.
- No matches show a reusable EmptyState with a feature-provided clear action.
- Clearing search restores the complete list.
- Component styles use shared tokens and keep feature layout with the feature.

## Try these changes

- Add an optional TextField error and confirm the message is associated with the input.
- Add a danger button variant to a destructive action and make the label explicit.
- Use the shared Button to render a submit action with <code>type="submit"</code>.
- Add a new EmptyState use case from a different feature without teaching it course behavior.
- Change the theme token values and confirm shared controls use the new values.
- Review whether a link is more appropriate than an action button for opening a separate route.

## Common mistakes

- Adding a new generic prop for every one-off screen difference.
- Using the shared Button for navigation instead of a link.
- Forgetting to forward <code>disabled</code> or accessible state attributes.
- Rendering a field without a visible label.
- Leaking a style-only prop onto a DOM element.
- Putting the clear-search behavior inside the generic EmptyState.
- Creating a separate design-system package before there is a second independent consumer.
- Using tokens for every arbitrary spacing value instead of real shared decisions.

## Key takeaways

- Build components around repeated behavior and a clear contract.
- Use children to compose content and variants for a small set of visual choices.
- Keep native semantics and accessibility behavior intact.
- Let shared primitives own shared behavior; let features own domain meaning.
- Keep styles and tokens organized by responsibility.

## Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Next chapter |
| --- | --- | --- | --- |
| [085 - State management choices and tradeoffs](../lessons/085-state-management-choices-and-tradeoffs.md) | [Lesson](../lessons/086-build-a-reusable-component-system.md) | [Q&A](../qnas/086-build-a-reusable-component-system.md) | [087 - Full-stack application architecture and folder structure](../lessons/087-full-stack-application-architecture-and-folder-structure.md) |
