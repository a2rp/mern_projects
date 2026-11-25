# 080 - Accessible forms, navigation, and components

Accessible interfaces help people understand what a page contains, move through it, enter information, and recover from mistakes. React does not change the browser’s HTML semantics: a real link still navigates, a real button still activates, and a labeled input still exposes its purpose to assistive technology.

Start with native HTML. Add ARIA only when a native element does not express the relationship or state the interface needs.

## Learning goals

After this chapter, you should be able to:

- Use headings and landmark elements to make page structure understandable.
- Provide a skip link and clearly named navigation regions.
- Choose links for navigation and buttons for actions.
- Show the current page and build a simple disclosure navigation.
- Associate form controls with visible labels, instructions, and errors.
- Use fieldsets and legends for related controls.
- Build reusable React components that preserve accessible behavior.
- Manage focus and announcements when an interaction changes the page.
- Review an interface with keyboard, screen reader, zoom, and automated checks.

## Use semantic page structure

Use elements according to their purpose:

- <code>header</code> for introductory or navigational content.
- <code>nav</code> for a group of navigation links.
- <code>main</code> for the page’s primary content.
- <code>section</code> for a named thematic section.
- <code>aside</code> for related, supporting content.
- <code>footer</code> for footer content.
- <code>button</code> for an action.
- <code>a</code> for navigation to another location.

A typical page has one main landmark:

~~~jsx
<>
  <a className="skip-link" href="#main-content">
    Skip to main content
  </a>

  <header>
    <PrimaryNavigation />
  </header>

  <main id="main-content">
    <h1>Courses</h1>
    {/* Current page content */}
  </main>

  <footer>{/* Site-wide information */}</footer>
</>
~~~

Use headings in a meaningful outline. Each page should have a clear main heading, followed by headings that describe their sections. Choose heading levels based on the content structure, not on their visual size. Use CSS for appearance rather than selecting a heading level because it looks smaller.

A skip link lets keyboard users bypass repeated navigation. Keep it available when focused:

~~~css
.skip-link {
  position: absolute;
  inset-block-start: 0.5rem;
  inset-inline-start: 0.5rem;
  z-index: 10;
  padding: 0.75rem 1rem;
  color: #fff;
  background: #14213d;
  transform: translateY(-160%);
}

.skip-link:focus {
  transform: translateY(0);
}
~~~

Make the destination focusable when necessary, especially when a browser does not move focus to a fragment target as expected:

~~~jsx
<main id="main-content" tabIndex="-1">
  <h1>Courses</h1>
</main>
~~~

Do not use a generic <code>div</code> as a landmark or interactive control when a native element already expresses the meaning.

## Make navigation understandable

Give each navigation landmark a distinct accessible name when a page has more than one:

~~~jsx
<nav aria-label="Primary">
  {/* Main site links */}
</nav>

<nav aria-label="Breadcrumb">
  {/* Current page trail */}
</nav>
~~~

A repeated label such as “Navigation” does not explain which link group a landmark contains. Keep the name concise and specific.

Use links to change location. Use buttons to perform actions such as opening a panel, submitting a form, or deleting a draft. Do not make a clickable <code>div</code> or <code>span</code>; it will not automatically provide keyboard interaction, focus behavior, or a meaningful role.

Represent the current page on its navigation link:

~~~jsx
<NavLink to="/courses">Courses</NavLink>
~~~

React Router’s <code>NavLink</code> marks the active link with <code>aria-current="page"</code> by default. With a plain link, set <code>aria-current="page"</code> yourself only on the link for the page currently displayed. Do not mark every parent or neighboring route as the current page.

### Use a disclosure for collapsible navigation

A compact site navigation can use a button to show and hide a list of ordinary links:

~~~jsx
<button
  type="button"
  aria-expanded={isOpen}
  aria-controls="primary-links"
  onClick={() => setIsOpen((open) => !open)}
>
  {isOpen ? "Close navigation" : "Open navigation"}
</button>

<nav id="primary-links" aria-label="Primary" hidden={!isOpen}>
  <a href="/courses">Courses</a>
  <a href="/about">About</a>
</nav>
~~~

The button exposes whether the controlled content is expanded. The links remain normal links, so Tab, Enter, and browser navigation work as expected. Close the disclosure after a route is selected; support Escape when useful, returning focus to the disclosure button.

Do not add <code>role="menu"</code> to ordinary website navigation. ARIA menu widgets have application-style keyboard behavior that site navigation usually does not need. Native links inside a named <code>nav</code> landmark are more predictable.

### Distinguish links from buttons

- Use a link when activating it changes the URL or moves to another resource.
- Use a button when it performs an action on the current interface.
- Use a submit button for a form’s primary submission.
- Give non-submit buttons inside a form <code>type="button"</code>.

An element’s visible text should describe its destination or action. Avoid vague link labels such as “Click here” when the link can say “Read the course outline.”

## Label and group form controls

Give each input a persistent visible label. An associated <code>label</code> provides the control’s accessible name and makes the label clickable:

~~~jsx
<label htmlFor="course-title">Course title</label>
<input id="course-title" name="title" />
~~~

In reusable components, generate unique IDs and connect hints and errors to the control. React’s <code>useId</code> is designed for stable accessibility relationships:

~~~jsx
import { useId } from "react";

function TextField({ label, hint, error, ...inputProps }) {
  const generatedId = useId();
  const id = inputProps.id ?? generatedId;
  const hintId = id + "-hint";
  const errorId = id + "-error";
  const descriptionIds = [
    hint ? hintId : null,
    error ? errorId : null,
  ].filter(Boolean);

  return (
    <div>
      <label htmlFor={id}>
        {label}
        {inputProps.required ? " (required)" : ""}
      </label>

      {hint && <p id={hintId}>{hint}</p>}

      <input
        {...inputProps}
        id={id}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={descriptionIds.length ? descriptionIds.join(" ") : undefined}
      />

      {error && <p id={errorId}>{error}</p>}
    </div>
  );
}
~~~

The visible label names the field. Help text can explain the expected format. An error should identify the problem and say how to fix it. The input’s <code>aria-describedby</code> can reference both its hint and its current error.

Use <code>required</code> for native required behavior and show “(required)” or another visible indicator in the label or form instructions. Do not communicate required status only through color or a screen-reader-only attribute.

Group related controls with <code>fieldset</code> and <code>legend</code>:

~~~jsx
<fieldset>
  <legend>Course visibility</legend>

  <label>
    <input type="radio" name="visibility" value="private" />
    Private
  </label>

  <label>
    <input type="radio" name="visibility" value="public" />
    Public
  </label>
</fieldset>
~~~

The legend gives the radio group a shared question. Each option still needs its own label. Use a fieldset for controls that form a meaningful group, not as a generic styling wrapper.

## Give useful validation feedback

Prefer native input types and constraints where they match the requirements. If custom validation is needed, show text feedback close to the relevant input, set <code>aria-invalid</code> on invalid controls, and associate the error with <code>aria-describedby</code>.

After an invalid submission, a long form can show an error summary:

~~~jsx
<div ref={summaryRef} tabIndex="-1" aria-labelledby="error-title">
  <h2 id="error-title">There is a problem</h2>
  <ul>
    <li><a href="#course-title">Enter a course title.</a></li>
  </ul>
</div>
~~~

The link takes the user to the relevant control. Move focus to the summary or the first invalid field after submission when it helps users locate the problem. Do not move focus after every keystroke; that interrupts typing.

For status messages:

- Use a polite live region for non-urgent updates such as “Draft saved.”
- Use an alert for important errors that need prompt attention.
- Avoid announcing the same message repeatedly.
- Do not announce a full page of changing content for every small update.

Keep validation forgiving where the data allows it. Explain accepted formats and avoid imposing constraints the application does not actually need. Server-side validation remains required; client feedback is for usability.

## Build accessible reusable components

A reusable component should make the accessible behavior easy to use correctly:

- Preserve a native semantic element by default.
- Render a visible label or accept a clear accessible name for controls.
- Forward relevant attributes such as <code>id</code>, <code>name</code>, <code>required</code>, and <code>disabled</code>.
- Connect hints and error messages to the right control.
- Keep the DOM order aligned with the visual and reading order.
- Use stable, unique IDs for relationships.
- Make button types explicit.
- Document required props and expected behavior.

For example, a button component can default to a safe non-submit action:

~~~jsx
function Button({ type = "button", children, ...props }) {
  return (
    <button type={type} {...props}>
      {children}
    </button>
  );
}
~~~

Callers then opt into form submission with <code>&lt;Button type="submit"&gt;</code>. Avoid polymorphic “render as anything” APIs unless their behavior and accessibility requirements are clear. A component rendered as an anchor needs a destination; a button needs a button name and activation behavior.

Use <code>useId</code> for accessibility relationships, not as a list key. List keys should come from stable data identity. Avoid generating a new ID on every render; changing IDs breaks label and description references.

## Manage focus when the interface changes

Focus should remain predictable:

- When a disclosure opens, focus can stay on its button; the next Tab moves into the links.
- When a dialog opens, move focus into it and keep keyboard focus within it until it closes.
- When a dialog closes, return focus to the element that opened it if that element still exists.
- After client-side navigation, ensure the new page has a clear heading and that keyboard and screen-reader users can find it.
- After an invalid form submission, focus a useful error summary or the first invalid field.
- After deleting an item, move focus to a sensible remaining control or status message.

Do not use <code>autoFocus</code> indiscriminately. Unexpected focus changes can disorient users and may move them away from content they were reading. Choose focus behavior based on the interaction and test it with keyboard and assistive technology.

## Common mistakes

- Using clickable <code>div</code> elements instead of links or buttons.
- Removing the visible keyboard focus outline without an equally clear replacement.
- Using heading levels for visual styling instead of document structure.
- Providing multiple unnamed navigation landmarks.
- Marking every link in a navigation group as current.
- Using ARIA menu roles for an ordinary list of site links.
- Using a placeholder as the only field label.
- Styling a label visually but failing to associate it with its control.
- Showing errors by color alone.
- Moving focus on every input change.
- Reusing the same explicit id in multiple component instances.
- Using <code>useId</code> for list keys.
- Creating a reusable input that drops <code>name</code>, <code>required</code>, or descriptions.
- Using a button with no accessible name, such as an unlabeled icon-only control.
- Hiding content visually while leaving it confusingly available in the reading order.
- Assuming one automated scan proves that the whole interface is accessible.

## Chapter checklist

Before shipping a form or navigation component:

- Use semantic HTML and a logical heading hierarchy.
- Include a working skip link and a primary content landmark.
- Give multiple navigation landmarks distinct names.
- Use links for destinations and buttons for actions.
- Indicate the current route with <code>aria-current</code>.
- Make collapsible navigation operable by keyboard and expose its expanded state.
- Give every form control an associated visible label.
- Group related controls with fieldsets and legends.
- Associate hints and errors with the correct controls.
- Provide text feedback and predictable focus after invalid submission.
- Make reusable components preserve ids, names, states, labels, and descriptions.
- Test at zoom, with keyboard only, and with a screen reader.
- Combine automated checks with manual interaction testing.

## Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [079 - Authentication user experience](079-authentication-user-experience.md) | [Q&A](../qnas/080-accessible-forms-navigation-and-components.md) | [Example](../examples/080-accessible-forms-navigation-and-components.md) | [081 - CSS styling and responsive interface architecture](081-css-styling-and-responsive-interface-architecture.md) |