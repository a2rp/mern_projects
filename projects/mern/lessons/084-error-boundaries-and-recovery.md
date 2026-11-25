# 084 - Error boundaries and recovery

A render error in one part of a React tree can otherwise remove that part of the interface. An error boundary lets an application replace a failed subtree with a safe fallback while leaving unrelated parts of the page available.

Error boundaries are for failures while rendering descendant components and related lifecycle work. They are not general-purpose exception handlers. They do not catch ordinary event-handler errors, most asynchronous callback errors, server-rendering errors, or errors thrown by the boundary itself. Handle those through their own error paths.

## Learning goals

After this chapter, you should be able to:

- Explain what an error boundary catches and what it does not catch.
- Add a boundary using React's class lifecycle APIs.
- Separate fallback rendering from error reporting.
- Place boundaries around meaningful parts of an interface.
- Show users safe, actionable recovery options.
- Reset a failed subtree when its inputs or retry state change.
- Distinguish an error boundary from Suspense and request-state handling.
- Avoid leaking stack traces, secrets, and internal diagnostics to users.

## What an error boundary does

A boundary wraps descendant components. If a descendant throws while React renders it, React switches the boundary into an error state and renders fallback UI instead of the failed subtree.

Without a boundary around that region, React may remove the broken UI from the screen. With a boundary, the application can preserve the rest of the page and explain that one region is temporarily unavailable.

Boundaries are useful around independent sections such as:

- A recommendation panel that should not blank the whole account page.
- A chart that can fail without hiding the report heading.
- A third-party widget with a local fallback.
- A route or major page region with a recovery action.

Do not wrap every tiny component automatically. Choose a boundary where the user can understand the partial failure and has a useful way to continue.

## Define a boundary with a class component

React's built-in error-boundary mechanism uses class lifecycle methods. A function component cannot currently define a boundary solely with a Hook.

~~~jsx
// src/components/ErrorBoundary.jsx
import { Component } from 'react';

export class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <section role="alert">
          <h2>This section is unavailable</h2>
          <p>Try again later or continue with another part of the page.</p>
        </section>
      );
    }

    return this.props.children;
  }
}
~~~

<code>getDerivedStateFromError</code> returns state used to render fallback UI. Keep it pure. <code>componentDidCatch</code> is where the app can report the error and component stack to an approved monitoring service. A boundary can receive an <code>onError</code> callback so reporting policy stays outside the fallback component.

Do not render the raw error message or stack trace by default. It can reveal file paths, infrastructure details, user data, or secrets. Show a safe explanation and record diagnostics only in a controlled logging system.

## Place boundaries around recoverable regions

Wrap a region whose failure should be isolated:

~~~jsx
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import { CourseRecommendations } from './components/CourseRecommendations.jsx';

function CoursePage({ course }) {
  return (
    <main>
      <h1>{course.title}</h1>
      <p>{course.description}</p>

      <ErrorBoundary
        fallback={
          <section role="alert" aria-labelledby="recommendation-error-title">
            <h2 id="recommendation-error-title">
              Recommendations are unavailable
            </h2>
            <p>You can still read the course information above.</p>
          </section>
        }
        onError={(error, errorInfo) => {
          reportUiError(error, errorInfo, { region: 'recommendations' });
        }}
      >
        <CourseRecommendations courseId={course.id} />
      </ErrorBoundary>
    </main>
  );
}
~~~

The page heading and description remain outside the boundary, so a failure in recommendations does not hide the core course content.

A single application-level boundary can provide a final safety net, but it is not a replacement for local boundaries around independent features. A route library may also provide route-level error elements; understand how those interact with component boundaries.

## Choose useful fallback content

A fallback should:

- Clearly state which part is unavailable.
- Keep the message calm and non-technical.
- Preserve surrounding navigation and useful content.
- Offer a meaningful next step, such as retrying or returning to a safe page.
- Use a heading and alert/status semantics appropriate to the situation.
- Avoid exposing raw errors and internal paths.
- Avoid placing the only way to escape inside the failed subtree.

A fallback is ordinary UI and should itself be simple and unlikely to throw. An error boundary cannot catch an error in its own fallback.

Do not use a generic “Something went wrong” screen when the user can safely recover by refreshing one panel. Conversely, do not offer a retry button if the boundary cannot actually reset or retry the failing work.

## Report errors without breaking the boundary

A reporting callback can forward details to a logging service:

~~~js
function reportUiError(error, errorInfo, context) {
  monitoringClient.captureException(error, {
    extra: {
      componentStack: errorInfo.componentStack,
      region: context.region
    }
  });
}
~~~

Treat error reporting as sensitive. The logging service should be configured for the application, avoid collecting secrets, and follow the product's privacy and retention policy. The boundary should continue showing its fallback if logging fails; protect the reporting call if the client can throw:

~~~js
componentDidCatch(error, errorInfo) {
  try {
    this.props.onError?.(error, errorInfo);
  } catch {
    // Keep the user-facing fallback working even if reporting fails.
  }
}
~~~

A local console message can help during development. Production diagnostics should use the project's approved reporting path, not a user-visible stack trace.

## Recover by resetting the failed subtree

When an error is caused by data or state that can change, the application needs to reset the failed subtree after the underlying condition changes. One simple pattern is to change the boundary's React key after recovery:

~~~jsx
import { useState } from 'react';
import { ErrorBoundary } from './ErrorBoundary.jsx';

function PreviewDemo() {
  const [shouldFail, setShouldFail] = useState(false);
  const [boundaryVersion, setBoundaryVersion] = useState(0);

  function recover() {
    setShouldFail(false);
    setBoundaryVersion((version) => version + 1);
  }

  return (
    <section>
      <button type="button" onClick={() => setShouldFail(true)}>
        Simulate preview failure
      </button>

      <ErrorBoundary
        key={boundaryVersion}
        fallback={
          <div role="alert">
            <p>The preview failed.</p>
            <button type="button" onClick={recover}>
              Reset preview
            </button>
          </div>
        }
      >
        <CoursePreview shouldFail={shouldFail} />
      </ErrorBoundary>
    </section>
  );
}
~~~

Changing the key creates a fresh boundary and subtree. The example also clears the condition that caused the error. If the failure is still present, a reset will only show the fallback again.

For production apps, a maintained boundary library can provide reset keys and reset callbacks. Check its behavior and keep the recovery action connected to the real cause, such as reloading data or selecting a different record.

## Handle event and asynchronous errors separately

An error boundary is not a replacement for try/catch in an event handler:

~~~jsx
async function handleSave() {
  setStatus('saving');

  try {
    await saveCourse(course);
    setStatus('saved');
  } catch {
    setStatus('error');
  }
}
~~~

The component can render the request error as an inline message or alert. A rejected promise inside an event handler does not automatically become a render error for the boundary.

Likewise, a timer or ordinary asynchronous callback should handle its own failure. If the error should affect the UI, store a safe error state and render it. Some React APIs and framework integrations have specialized error handling; follow the contract of the specific API rather than assuming a boundary catches every thrown value.

## Error boundaries and Suspense are different

Suspense displays fallback UI while a descendant suspends for a supported resource, such as a lazy-loaded component. An error boundary displays fallback UI after a descendant throws an error during rendering.

They can be nested together. A lazy component can suspend while loading and later fail; the Suspense fallback handles the pending state, while a surrounding error boundary handles an error.

Do not use a Suspense fallback to report a failed network request unless the data-loading system explicitly represents that failure through an error boundary.

## Common mistakes

- Expecting a boundary to catch errors thrown by a button click handler.
- Expecting a boundary to catch an arbitrary rejected promise or timer callback.
- Wrapping the boundary itself in the boundary and expecting it to catch its own fallback error.
- Putting the entire application in a tiny local boundary and losing useful context.
- Adding a retry button that does not reset the child or retry its data.
- Resetting the boundary while the underlying error condition is unchanged.
- Showing stack traces, raw server messages, or secrets in fallback UI.
- Calling a fallible monitoring service without protecting the fallback.
- Using Suspense as though it were an error boundary.
- Swallowing errors without reporting or showing a recovery path.
- Creating a separate boundary around every leaf component without a user-centered reason.

## Chapter checklist

Before shipping a boundary:

- The boundary surrounds the smallest meaningful region that can fail independently.
- Important page content and navigation remain available outside it.
- The fallback explains the problem and offers a real next action.
- Error reporting is separated from user-facing text and avoids sensitive data.
- Event handlers and async requests manage their own errors.
- Retry resets the failed subtree and addresses the underlying failure where possible.
- The fallback itself is simple and does not depend on the failed feature.
- A route-level error mechanism and Suspense behavior are understood.
- Tests verify fallback and recovery behavior.

## Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [083 - React performance and memoization](083-react-performance-and-memoization.md) | [Q&A](../qnas/084-error-boundaries-and-recovery.md) | [Example](../examples/084-error-boundaries-and-recovery.md) | [085 - State management choices and tradeoffs](085-state-management-choices-and-tradeoffs.md) |
