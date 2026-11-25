# 080 - Accessible forms, navigation, and components: Q&A

These questions review semantic HTML, page landmarks, links and buttons, accessible forms, React component relationships, focus behavior, and keyboard testing.

## Multiple-choice questions

### 1. What is the main advantage of using semantic HTML elements?

- **A.** They communicate purpose and provide built-in browser behavior
- **B.** They automatically make every page visually attractive
- **C.** They eliminate the need for keyboard testing
- **D.** They replace all client-side JavaScript

**Answer: A.** Elements such as <code>main</code>, <code>nav</code>, <code>button</code>, and <code>label</code> expose meaning and useful behavior to browsers and assistive technology.

### 2. Which element should contain the primary content of a page?

- **A.** <code>main</code>
- **B.** <code>small</code>
- **C.** <code>label</code>
- **D.** <code>summary</code>

**Answer: A.** The <code>main</code> element identifies the page’s primary content. A page should generally have one main landmark.

### 3. What is the purpose of a skip link?

- **A.** Let keyboard users bypass repeated navigation and reach the main content
- **B.** Hide the page title
- **C.** Skip required fields during form submission
- **D.** Prevent direct navigation to a page

**Answer: A.** A visible-on-focus skip link saves keyboard users from tabbing through repeated navigation on every page.

### 4. If a page has primary navigation and breadcrumb navigation, what should help distinguish their landmarks?

- **A.** Give each navigation region a concise, distinct accessible name
- **B.** Give them both the same id and no name
- **C.** Add <code>role="menu"</code> to both
- **D.** Hide both from assistive technology

**Answer: A.** Names such as “Primary” and “Breadcrumb” help users distinguish multiple navigation regions.

### 5. Which element should be used to move to another page?

- **A.** A link with a destination
- **B.** A button with no behavior
- **C.** A clickable <code>div</code>
- **D.** A paragraph with a click handler

**Answer: A.** A link communicates navigation and supports expected keyboard and browser behavior.

### 6. Which element should perform an action such as opening a disclosure?

- **A.** A button
- **B.** A heading with an event handler
- **C.** A plain <code>span</code>
- **D.** An image with no name

**Answer: A.** A button is the native element for an action and provides keyboard activation and focus behavior.

### 7. What does <code>aria-current="page"</code> communicate on a navigation link?

- **A.** That this link represents the page currently displayed
- **B.** That the link is disabled
- **C.** That the link opens in a new window
- **D.** That the link has a form error

**Answer: A.** It identifies the active page in a navigation set. It should be applied only to the current page link.

### 8. For an ordinary site navigation list, what is usually preferable to an ARIA menu widget?

- **A.** A named <code>nav</code> landmark containing regular links
- **B.** A <code>div</code> with <code>role="menu"</code> and no keyboard logic
- **C.** A table with clickable cells
- **D.** A form with submit buttons for every destination

**Answer: A.** Native navigation links have familiar Tab and Enter behavior. ARIA menu widgets imply additional application-style keyboard interaction.

### 9. What does <code>aria-expanded</code> on a disclosure button describe?

- **A.** Whether the controlled content is currently shown
- **B.** Whether the button is a submit button
- **C.** Whether a text field is invalid
- **D.** Whether the current route is external

**Answer: A.** Keep this state synchronized with whether the controlled region is open or closed.

### 10. How should a label be associated with a form input in JSX?

- **A.** Match the label’s <code>htmlFor</code> to the input’s unique <code>id</code>
- **B.** Give the label and input the same placeholder
- **C.** Put the input inside a heading
- **D.** Set the label’s <code>href</code> to the input name

**Answer: A.** The matching attributes create a programmatic association and make the label clickable.

### 11. Which element provides a shared label for a related group of radio buttons?

- **A.** <code>legend</code> inside <code>fieldset</code>
- **B.** <code>caption</code> inside <code>main</code>
- **C.** <code>summary</code> inside <code>label</code>
- **D.** <code>title</code> inside each input

**Answer: A.** A fieldset groups related controls, and its legend gives the group a shared question or name.

### 12. What is <code>useId</code> intended to help generate in React?

- **A.** Stable IDs for accessibility relationships such as labels and descriptions
- **B.** Stable database primary keys
- **C.** List keys for data rows
- **D.** Random session tokens

**Answer: A.** Use it for relationships between controls and their labels or descriptions. Use stable data identity for list keys.

### 13. How can an inline field error be connected to an input?

- **A.** Reference the error element’s id in <code>aria-describedby</code>
- **B.** Set the error as the input’s placeholder
- **C.** Put the error in an unrelated footer
- **D.** Change the input’s name to the error text

**Answer: A.** <code>aria-describedby</code> can associate help and error text with the control.

### 14. When should a custom validation error summary usually receive focus?

- **A.** After an invalid submit, when it helps users find and correct errors
- **B.** Every time a user types a character
- **C.** Whenever the page first loads
- **D.** Before the user reaches the form

**Answer: A.** Focus management can direct users to submission errors. Moving focus on each keystroke would interrupt typing.

### 15. Which live-region behavior is usually suitable for a non-urgent “Draft saved” message?

- **A.** A polite status announcement
- **B.** A modal dialog for every save
- **C.** No message and no visual indicator
- **D.** A permanent alert on every render

**Answer: A.** A polite status allows assistive technology to announce a useful update without interrupting the current task.

### 16. What should a reusable input component do with its accessible behavior?

- **A.** Preserve labels, ids, names, required state, and hint/error relationships
- **B.** Drop all native attributes
- **C.** Replace the input with a clickable <code>div</code>
- **D.** Generate a different id on every render

**Answer: A.** A reusable component should make it easy to provide a correctly labeled, named, and described control.

### 17. What should normally happen when a modal dialog closes?

- **A.** Focus should return to the control that opened it, if it still exists
- **B.** Focus should always disappear from the document
- **C.** The page should reload
- **D.** Focus should move to the browser address bar

**Answer: A.** Returning focus helps preserve the user’s place in the interface.

### 18. Why should a form button that only clears or toggles a field use <code>type="button"</code>?

- **A.** Buttons inside forms otherwise may submit the form by default
- **B.** It makes the button inaccessible
- **C.** It prevents keyboard use
- **D.** It turns the button into a link

**Answer: A.** Explicitly set the type of non-submit buttons so they do not accidentally submit the form.

### 19. What does an automated accessibility scan not prove by itself?

- **A.** That every keyboard, screen-reader, zoom, and interaction flow works correctly
- **B.** That the tool ran
- **C.** That some code was scanned
- **D.** That one page had a document title

**Answer: A.** Automated tools detect some issues, but manual keyboard and assistive-technology review is still needed.

### 20. What is the best reason to use a native button instead of a clickable <code>div</code>?

- **A.** A button already has an interactive role, focusability, and keyboard activation
- **B.** A button is always more colorful
- **C.** A <code>div</code> cannot contain text
- **D.** A button automatically checks server permissions

**Answer: A.** Native controls provide behavior that a generic element would otherwise require developers to recreate.

## Short-answer questions

### 21. Why should heading levels follow the content structure instead of visual styling?

**Answer:** Headings form a navigable outline for browsers and assistive technology. CSS can change their appearance without changing their structural level.

### 22. What does a visible label provide beyond a placeholder?

**Answer:** A visible label continues to identify the control after text is entered, provides a clickable target when associated, and helps people understand what information is expected.

### 23. Explain the difference between a link and a button.

**Answer:** A link navigates to a destination. A button performs an action in the current interface, such as opening a panel or submitting a form.

### 24. Why should multiple navigation landmarks have different names?

**Answer:** Their names let users distinguish groups such as primary navigation, breadcrumbs, and footer navigation when navigating by landmarks.

### 25. When should a fieldset and legend be used?

**Answer:** Use them when controls form a meaningful group, such as a set of radio choices sharing one question. The legend names the group and each control still needs its own label.

### 26. How should help text and an inline error relate to the control?

**Answer:** Give each description a stable id and reference the relevant ids in the control’s <code>aria-describedby</code>. Mark the control invalid only while it has an error.

### 27. What is the difference between a status message and an alert?

**Answer:** A status is generally a polite, non-urgent update. An alert is for important information that may need immediate attention. Use the least interruptive announcement that fits.

### 28. Why should a component not generate new ids on every render?

**Answer:** Labels, hints, and errors depend on stable references. Changing ids can break those associations and make updates confusing to assistive technology.

### 29. Where is <code>useId</code> useful, and where is it not a substitute?

**Answer:** It is useful for unique accessibility relationships such as input labels and descriptions. It is not a substitute for stable data keys in rendered lists.

### 30. Name two kinds of manual accessibility review that should accompany automated checks.

**Answer:** Navigate the complete interface with a keyboard only, and inspect it with a screen reader. Testing zoom, reflow, and visible focus is also useful.

## Applied scenarios

### 31. A navigation bar contains three links, but it is built from clickable <code>div</code> elements. Keyboard users cannot activate them. What should change?

**Answer:** Render destinations as links with valid destinations. The browser will provide focus and keyboard activation. Keep the set inside a named <code>nav</code> landmark.

### 32. A page has a site navigation region and a breadcrumb navigation region, but both are unnamed. How can users distinguish them?

**Answer:** Give the landmarks concise distinct names, such as <code>aria-label="Primary"</code> and <code>aria-label="Breadcrumb"</code>.

### 33. A form input is labeled “Email” visually, but clicking the label does not focus the input and a screen reader does not announce it. What should be checked?

**Answer:** Verify that the label’s <code>htmlFor</code> exactly matches the input’s unique <code>id</code>, or wrap the control with its label. Also ensure a component has not dropped or duplicated the id.

### 34. A responsive navigation button visually opens links, but it always announces “collapsed.” What needs fixing?

**Answer:** Keep <code>aria-expanded</code> synchronized with the actual open state and point <code>aria-controls</code> to the controlled region’s id. The button must also be operable by keyboard.

### 35. A developer adds <code>role="menu"</code> to a list of ordinary site links but does not implement arrow-key navigation. What is the problem?

**Answer:** The menu role implies application-style keyboard behavior that is missing. Remove the role and use a named navigation landmark with normal links, or implement a complete, appropriate menu pattern if that interaction is genuinely required.

### 36. Every keystroke in a form moves focus to an error summary. What should change?

**Answer:** Move focus only after an invalid submit or another deliberate action that requires attention. Keep focus in the field while users type and update inline feedback without stealing focus.

### 37. A reusable input works visually but drops the caller’s <code>name</code> and <code>required</code> props. Why is that a problem?

**Answer:** The control may no longer participate correctly in form submission or native validation. The component should forward relevant native attributes and preserve labels and descriptions.

### 38. A delete confirmation dialog closes after a user activates Delete, but focus moves to the top of the document. What would be more predictable?

**Answer:** After closing, move focus to the next sensible control, such as the next item or a status message. If the dialog was cancelled, return focus to the opener when it still exists.

### 39. An error message is shown only by changing an input border to red. What should be added?

**Answer:** Add visible text explaining what is wrong and how to correct it. Associate the text with the control, mark it invalid while appropriate, and avoid relying on color alone.

### 40. An accessibility scanner reports no issues, but a user cannot tell where keyboard focus is while tabbing through the page. Is the page ready?

**Answer:** No. Provide a visible focus indicator and test the entire flow with a keyboard. Automated scans do not replace manual interaction checks.

## Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [079 - Authentication user experience](../lessons/079-authentication-user-experience.md) | [Lesson](../lessons/080-accessible-forms-navigation-and-components.md) | [Example](../examples/080-accessible-forms-navigation-and-components.md) | [081 - CSS styling and responsive interface architecture](../lessons/081-css-styling-and-responsive-interface-architecture.md) |