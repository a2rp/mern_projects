# 081 - CSS styling and responsive interface architecture

CSS architecture is the way a project organizes styles so that layouts remain understandable as the interface grows. Responsive design makes those layouts work across available space, input types, zoom levels, and user preferences.

React does not replace CSS. A React component produces elements and state; CSS controls their visual presentation and layout. Start with a small set of clear global rules, then keep component-specific styles close to the component that owns them.

## Learning goals

After this chapter, you should be able to:

- Separate design tokens, global styles, layout rules, and component styles.
- Use CSS custom properties for shared design values.
- Choose between global CSS, CSS Modules, and inline dynamic styles.
- Build fluid layouts with Grid, Flexbox, and intrinsic sizing.
- Add breakpoints based on content rather than specific devices.
- Use container queries when a component depends on its own available space.
- Support reduced motion, narrow viewports, and zoom.
- Avoid common cascade and specificity problems.
- Review a responsive React interface across realistic viewports.

## Start with a small, clear CSS structure

A project can organize shared and component-specific styling like this:

~~~text
src/
├── styles/
│   ├── tokens.css
│   ├── global.css
│   └── layout.css
├── components/
│   ├── CourseCard.jsx
│   └── CourseCard.module.css
└── pages/
    ├── CourseDashboard.jsx
    └── CourseDashboard.css
~~~

Typical responsibilities:

- <code>tokens.css</code> holds shared colors, spacing, typography, and shape values.
- <code>global.css</code> sets document-wide defaults such as box sizing, body text, and focus styles.
- <code>layout.css</code> holds reusable page containers or layout primitives.
- A component stylesheet holds styles that belong to that component.
- A page stylesheet holds composition for one route or screen.

Do not split every selector into a separate file. Keep a file small enough to understand, but group rules that change together. A useful boundary is ownership: styles for one reusable component belong with that component; page layout belongs with the page.

## Define design tokens with custom properties

CSS custom properties give a project one place to define repeated design decisions:

~~~css
:root {
  color-scheme: light;
  --color-text: #172033;
  --color-muted: #4d5b70;
  --color-surface: #fff;
  --color-page: #f4f6fa;
  --color-border: #ccd4df;
  --color-brand: #155eef;
  --color-danger: #b42318;

  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;

  --content-width: 72rem;
  --radius-card: 0.75rem;
  --shadow-card: 0 0.5rem 1.5rem rgb(23 32 51 / 8%);
}
~~~

Use tokens for values that are intentionally shared. A token should represent a design decision, not every number in the stylesheet. Local one-off values can stay local.

A dark theme can override semantic tokens rather than rewriting every component rule:

~~~css
[data-theme="dark"] {
  color-scheme: dark;
  --color-text: #eef2f8;
  --color-muted: #b5c0d0;
  --color-surface: #151b26;
  --color-page: #0c111b;
  --color-border: #374356;
  --color-brand: #8bb4ff;
}
~~~

Name tokens by purpose, such as <code>--color-surface</code>, rather than by a temporary value such as <code>--blue-500</code>. Semantic names make later theme changes easier.

## Set predictable global styles

Set box sizing consistently and preserve useful keyboard focus:

~~~css
*,
*::before,
*::after {
  box-sizing: border-box;
}

html {
  font-family: system-ui, sans-serif;
  line-height: 1.5;
  color: var(--color-text);
  background: var(--color-page);
}

body {
  min-width: 0;
  margin: 0;
}

img,
svg,
video {
  max-width: 100%;
}

button,
input,
select,
textarea {
  font: inherit;
}

:focus-visible {
  outline: 3px solid var(--color-brand);
  outline-offset: 3px;
}
~~~

Avoid global selectors that unexpectedly style every element. A small reset is useful, but a reset should not remove visible focus or erase all native distinctions without replacing them.

Use a viewport declaration in the HTML document so mobile browsers lay out the page at the device width:

~~~html
<meta name="viewport" content="width=device-width, initial-scale=1" />
~~~

Without it, a narrow device may use a wider virtual layout viewport and media queries may not match the expected width.

## Use fluid layout before adding breakpoints

Modern layout systems can adapt naturally to the space available. Use Grid for two-dimensional page composition and Flexbox for a row or column of items:

~~~css
.page-container {
  width: min(100% - 2rem, var(--content-width));
  margin-inline: auto;
}

.course-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 17rem), 1fr));
  gap: var(--space-6);
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
}
~~~

The course grid fits as many cards as the available width permits. Flex wrapping lets toolbar actions move to another line instead of overflowing. Prefer these intrinsic behaviors when they solve the layout without a breakpoint.

Use relative units such as <code>rem</code>, percentages, and flexible fractions for most sizes. Constrain long text so lines do not become difficult to read. Use <code>min()</code>, <code>max()</code>, and <code>clamp()</code> when a value should adapt within limits:

~~~css
.page-title {
  font-size: clamp(1.75rem, 1.2rem + 2vw, 3rem);
}

.page-container {
  width: min(100% - 2rem, 72rem);
  margin-inline: auto;
}
~~~

A fixed width can cause horizontal scrolling when text is enlarged or a translated label is longer. Let content wrap, and test with browser zoom.

## Add mobile-first media queries for real needs

Write a readable narrow layout first. Add a breakpoint only when the content no longer fits comfortably:

~~~css
.dashboard-layout {
  display: grid;
  gap: var(--space-6);
}

@media (min-width: 48rem) {
  .dashboard-layout {
    grid-template-columns: 15rem minmax(0, 1fr);
  }
}

@media (min-width: 72rem) {
  .dashboard-layout {
    gap: var(--space-8);
  }
}
~~~

The values above are examples, not universal device categories. Resize the content and choose breakpoints where the layout itself needs to change.

Media queries can also respond to user or environment preferences:

~~~css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
~~~

This is a broad fallback for non-essential motion. Prefer avoiding unnecessary animation in the first place. If an animation communicates important state, provide an equivalent static cue rather than hiding that information.

## Use container queries for reusable components

A card may appear in a wide main column, a sidebar, or a narrow modal. Its layout should respond to the space it receives, not only to the viewport width:

~~~css
.course-card {
  container: course-card / inline-size;
}

.course-card__content {
  display: grid;
  gap: var(--space-3);
}

@container course-card (min-width: 30rem) {
  .course-card__content {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
  }
}
~~~

The card establishes an inline-size query container. Its descendants can change layout when the card has enough space. Use viewport media queries for page-level changes and container queries for component-level changes.

Keep a useful default layout for browsers or contexts where an enhancement is unavailable. Grid, Flexbox, and normal flow often provide a suitable fallback.

## Organize styles in React

React uses <code>className</code> to apply CSS classes:

~~~jsx
function CourseCard({ course }) {
  return (
    <article className="course-card">
      <h2>{course.title}</h2>
      <p>{course.description}</p>
    </article>
  );
}
~~~

With ordinary CSS, class names are global, so choose names that describe the component or purpose. Avoid short generic names such as <code>.title</code> that may collide across a growing project.

CSS Modules scope class names to a module in build tools that support them:

~~~jsx
import styles from "./CourseCard.module.css";

function CourseCard({ course }) {
  return (
    <article className={styles.card}>
      <h2 className={styles.title}>{course.title}</h2>
      <p className={styles.description}>{course.description}</p>
    </article>
  );
}
~~~

Use a small helper or explicit conditions to combine classes. Avoid building class names directly from arbitrary user input. Keep class selection predictable:

~~~jsx
const className = isSelected
  ? "course-card course-card--selected"
  : "course-card";

return <article className={className}>{/* ... */}</article>;
~~~

Use the <code>style</code> prop for values that truly depend on runtime data, such as a progress percentage. Keep reusable visual rules in CSS:

~~~jsx
<div
  className="progress-bar"
  role="progressbar"
  aria-label="Course progress"
  aria-valuemin={0}
  aria-valuemax={100}
  aria-valuenow={course.progress}
>
  <span style={{ width: course.progress + "%" }} />
</div>
~~~

Do not use a large inline style object as a replacement for a stylesheet. Inline styles do not provide media queries, pseudo-classes, or the full cascade.

## Keep the cascade manageable

The cascade considers origin, importance, layers, specificity, and source order. Avoid escalating specificity every time a style conflicts:

- Prefer one clear component class over deeply nested selectors.
- Avoid styling based on a long chain of DOM descendants.
- Remove obsolete overrides instead of stacking new ones at the end.
- Keep interactive states near the component’s base rules.
- Use CSS Modules or naming conventions where project-wide collisions become hard to track.
- Introduce cascade layers only when a project benefits from an explicit ordering strategy.

An example of a predictable layer order is:

~~~css
@layer reset, tokens, base, layout, components, utilities;
~~~

A project should define layers consistently. Unlayered declarations have precedence rules that can surprise a partial migration, so do not add one isolated layer without understanding the rest of the stylesheet.

## Common mistakes

- Designing only for one fixed screen width.
- Choosing breakpoints by device model instead of where content stops fitting.
- Using fixed widths that overflow at zoom or with longer text.
- Adding media queries before trying Grid, Flexbox, and intrinsic sizing.
- Writing component styles in a global file with collision-prone names.
- Creating a separate CSS file for every tiny selector.
- Using inline styles for all layout and interaction states.
- Building class names from unsanitized content.
- Increasing selector specificity to cover up conflicting rules.
- Removing keyboard focus styles.
- Ignoring reduced-motion preferences.
- Using container queries without establishing a query container.
- Assuming every browser supports an enhancement without a fallback.
- Testing only at one viewport size.

## Chapter checklist

Before shipping a responsive React interface:

- Confirm the document has a device-width viewport declaration.
- Use semantic design tokens for repeated color, space, and shape decisions.
- Set global defaults in one clear place.
- Keep component and page styles close to their owners.
- Use Grid, Flexbox, and fluid sizing for layouts that can adapt naturally.
- Add breakpoints when the content requires a layout change.
- Use container queries when a component depends on its container.
- Keep CSS Modules or global class naming consistent with the project.
- Use inline styles only for genuinely data-driven values.
- Preserve visible focus and support reduced motion.
- Check narrow, wide, zoomed, and long-content layouts for overflow.
- Remove stale overrides and keep the cascade understandable.

## Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [080 - Accessible forms, navigation, and components](080-accessible-forms-navigation-and-components.md) | [Q&A](../qnas/081-css-styling-and-responsive-interface-architecture.md) | [Example](../examples/081-css-styling-and-responsive-interface-architecture.md) | [082 - Component tests with React](082-component-tests-with-react.md) |