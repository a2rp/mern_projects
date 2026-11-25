# 086 - Build a reusable component system

A component system is a small set of shared interface rules and reusable building blocks. It helps teams create consistent screens without copying markup and styles into every feature.

A reusable component should represent a real repeated need. Do not turn every one-off element into a configurable abstraction. Start with a clear component API, preserve native HTML behavior, and add options only when a real use case needs them.

## Learning goals

After this chapter, you should be able to:

- Explain the difference between design tokens, primitives, patterns, and feature components.
- Build a reusable button with a small, typed-by-convention API.
- Use composition and children instead of adding many unrelated boolean props.
- Preserve native HTML and accessibility behavior.
- Define visual variants with shared CSS rules.
- Organize components by ownership and reuse scope.
- Document usage and avoid premature abstraction.
- Evolve a component API without breaking every consumer.

## What a component system contains

A small component system can include:

- Design tokens: shared color, spacing, typography, border, and motion values.
- Primitives: Button, TextField, Checkbox, Card, and other basic controls.
- Patterns: repeated compositions such as SearchField, EmptyState, and FormField.
- Feature components: course cards, account panels, or checkout flows owned by one feature.
- Guidance: examples that explain the intended props, accessibility, and composition.

Not every project needs a separate design-system package. A small application can keep shared components in its client source tree. Extract a package only when independent applications need the same stable system or a separate release cycle.

## Start from repeated use

Look for repeated UI that should behave and look consistently. Before extracting it, compare the instances:

- Do they share the same meaning and interaction?
- Are the differences meaningful variants or different components?
- Which props are truly needed by all consumers?
- Which markup should remain controlled by the caller?
- Does the abstraction preserve semantic HTML and keyboard behavior?

Two buttons with different text may be the same component. A button and a navigation link may look similar but have different behavior and should retain their native elements.

## Define design tokens before localizing visual values

Tokens provide shared design decisions through CSS custom properties:

~~~css
/* src/styles/tokens.css */
:root {
  --color-text: #1a2433;
  --color-muted: #526175;
  --color-surface: #fff;
  --color-page: #f4f6fa;
  --color-border: #cbd5e1;
  --color-primary: #155eef;
  --color-primary-hover: #1049bb;
  --color-danger: #b42318;

  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;

  --radius-control: 0.4rem;
  --radius-card: 0.75rem;
  --focus-ring: 0 0 0 3px rgb(21 94 239 / 30%);
}
~~~

A semantic token such as <code>--color-primary</code> describes purpose. It is more flexible than repeating a specific hex value or naming a token after a temporary shade. A token should represent a deliberate shared rule, not every one-off CSS value.

A theme can override semantic tokens at an application boundary, leaving component styles unchanged:

~~~css
[data-theme="dark"] {
  color-scheme: dark;
  --color-text: #eef2f8;
  --color-muted: #b5c0d0;
  --color-surface: #151b26;
  --color-page: #0c111b;
  --color-border: #374356;
  --color-primary: #9bbcff;
}
~~~

## Build a small Button primitive

A button should preserve the native button element and native attributes such as <code>type</code>, <code>disabled</code>, and <code>aria-*</code>. Avoid inventing a custom clickable <code>div</code>.

~~~jsx
// src/components/ui/Button.jsx
import './Button.css';

export function Button({
  variant = 'primary',
  size = 'medium',
  className = '',
  type = 'button',
  ...buttonProps
}) {
  const classes = [
    'button',
    'button--' + variant,
    'button--' + size,
    className
  ]
    .filter(Boolean)
    .join(' ');

  return <button className={classes} type={type} {...buttonProps} />;
}
~~~

The component accepts ordinary button props and forwards them to the native element. Its default <code>type="button"</code> prevents an accidental form submission when the caller does not specify a type. A form submit action should use <code>type="submit"</code> explicitly.

Add the shared styles in <code>src/components/ui/Button.css</code>:

~~~css
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  border: 1px solid transparent;
  border-radius: var(--radius-control);
  font: inherit;
  font-weight: 650;
  line-height: 1.2;
  cursor: pointer;
}

.button--small {
  min-height: 2rem;
  padding: 0.35rem 0.6rem;
  font-size: 0.875rem;
}

.button--medium {
  min-height: 2.6rem;
  padding: 0.55rem 0.85rem;
}

.button--primary {
  color: #fff;
  background: var(--color-primary);
}

.button--primary:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.button--secondary {
  border-color: var(--color-border);
  color: var(--color-text);
  background: var(--color-surface);
}

.button--danger {
  color: #fff;
  background: var(--color-danger);
}

.button:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

.button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}
~~~

Keep the variant set small and semantic. A component that supports dozens of visual combinations becomes harder to use than the repeated markup it replaced.

## Prefer composition to a boolean-prop explosion

Avoid APIs like <code>&lt;Button isPrimary isSmall isDanger hasIcon isOutlined isLoading&gt;</code> when combinations have unclear rules. Prefer a small variant prop for actual visual styles, and let the caller compose content:

~~~jsx
<Button variant="secondary" size="small">
  <span aria-hidden="true">+</span>
  Add course
</Button>
~~~

If the button is loading, decide whether the action is disabled and announce the state appropriately. The component should not guess the meaning of an operation or hide its label.

Composition with <code>children</code> lets the caller supply content while the primitive owns the shared structure and behavior. More complex compositions can use named subcomponents or slots, but add them only when use cases require them.

## Do not disguise different native elements

A navigation action should generally be a link, while an action should be a button. Styling can be shared without changing behavior:

~~~jsx
<a className="button button--secondary" href="/courses">
  Browse courses
</a>

<Button variant="primary" type="submit">
  Save changes
</Button>
~~~

If a router link needs the same visual treatment, style or compose the link component rather than rendering a button that performs navigation. Native semantics provide keyboard and browser behavior users expect.

## Organize shared and feature-specific components

A useful starting structure is:

~~~text
src/
  components/
    ui/
      Button.jsx
      Button.css
      TextField.jsx
      TextField.css
      Card.jsx
      EmptyState.jsx
  features/
    courses/
      CourseCard.jsx
      CourseList.jsx
      CoursePage.jsx
  styles/
    tokens.css
    global.css
~~~

A shared UI component belongs in <code>components/ui</code> when multiple features need the same contract. A course-specific card belongs with the course feature. Keep ownership explicit instead of placing every component in one large folder.

Do not extract a feature component into a shared package because it appears once in two adjacent screens. First determine whether the behavior and API are truly common.

## Keep the component API narrow

Prefer clear props:

~~~jsx
<TextField
  id="course-search"
  label="Search courses"
  value={query}
  onChange={setQuery}
  hint="Search by course title"
/>
~~~

A reusable field should connect its visible label to the input, support a description or error message, and forward relevant native input attributes. Avoid a vague configuration object when ordinary props explain the contract better.

Use controlled props when the parent must coordinate or validate the value. For isolated inputs, a component may keep temporary state internally. Document which behavior is controlled and what values the callback provides.

Avoid prop names that imply behavior the component cannot guarantee. For example, <code>isAccessible</code> cannot make arbitrary child markup accessible.

## Be careful with prop forwarding

A primitive should pass native attributes to its DOM element, but it should not leak component-only props into HTML:

~~~jsx
function Badge({ tone = 'neutral', children, ...spanProps }) {
  return (
    <span
      className={'badge badge--' + tone}
      {...spanProps}
    >
      {children}
    </span>
  );
}
~~~

The <code>tone</code> prop is consumed to choose a class; the other supported span attributes are forwarded. For more complex elements, explicitly separate internal props from native attributes.

## Document the contract and examples

For each shared component, explain:

- What semantic element it renders.
- Which props are required and which have defaults.
- What a callback receives and when it runs.
- Which variants are supported.
- Whether its value is controlled or internal.
- How labels, descriptions, and errors are connected.
- How the component handles disabled, loading, and invalid states.
- A short example of correct use.

A component catalog or storybook-style tool can help review many states, but it is optional. Keep usage examples close to the component if the project is small.

## Evolve APIs deliberately

When a component is used widely, changing its props can affect many features. Before a breaking change:

1. Search for all usages.
2. Define the desired contract and migration path.
3. Add or update examples.
4. Migrate consumers consistently.
5. Remove obsolete variants only after migration.
6. Verify keyboard, focus, and form behavior.

Avoid changing visual behavior through hidden global selectors. Shared tokens and explicit variants make changes easier to review.

## Common mistakes

- Building an abstraction for markup that has no real repeated use.
- Treating buttons and links as interchangeable.
- Using a clickable <code>div</code> instead of native controls.
- Adding many boolean props with overlapping combinations.
- Forwarding component-only props to DOM elements.
- Creating a shared package before multiple consumers need one.
- Putting feature-specific behavior in a generic primitive.
- Using non-semantic token names tied to temporary colors.
- Hiding visible focus or labels in pursuit of appearance.
- Storing too many one-off values as global tokens.
- Changing a shared API without checking its consumers.
- Assuming a component is accessible because its props include an accessibility-sounding name.

## Chapter checklist

Before publishing a reusable component:

- There is a genuine repeated use case.
- Its name and native element communicate the behavior.
- Props form a small and understandable contract.
- Variants represent intentional design choices.
- Composition handles content differences.
- Native attributes and event handlers behave predictably.
- Labels, focus, disabled state, and errors are accessible.
- Component-specific styles are owned by the component.
- Shared design values use semantic tokens.
- Examples show the intended use and important states.
- The API has been checked against its current consumers.

## Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [085 - State management choices and tradeoffs](085-state-management-choices-and-tradeoffs.md) | [Q&A](../qnas/086-build-a-reusable-component-system.md) | [Example](../examples/086-build-a-reusable-component-system.md) | [087 - Full-stack application architecture and folder structure](087-full-stack-application-architecture-and-folder-structure.md) |
