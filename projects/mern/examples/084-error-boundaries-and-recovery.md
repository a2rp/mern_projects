# 084 - Error boundaries and recovery: example

This example isolates a failing course preview, reports the error through a callback, keeps surrounding page content visible, and lets a user reset the failed subtree after the cause is cleared.

The custom boundary demonstrates React's built-in class lifecycle API. A production application may use a maintained boundary library, especially if it needs reset-key behavior, but the recovery action must still address the underlying failure.

## What you will build

- A reusable class-based <code>ErrorBoundary</code>.
- A preview component that can demonstrate a render failure.
- A fallback with an alert and a working reset action.
- An error callback that reports diagnostics separately from user text.
- Tests for containment and recovery.

## File structure

~~~text
src/
  components/
    ErrorBoundary.jsx
    CoursePreview.jsx
    CourseBoundaryPage.jsx
    CourseBoundaryPage.test.jsx
  App.jsx
~~~

## 1. Create the error boundary

Create <code>src/components/ErrorBoundary.jsx</code>:

~~~jsx
import { Component } from 'react';

export class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    try {
      this.props.onError?.(error, errorInfo);
    } catch {
      // Keep fallback rendering available if diagnostics fail.
    }
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

The boundary uses <code>getDerivedStateFromError</code> to switch to fallback state and <code>componentDidCatch</code> for diagnostics. It does not display the raw error to the visitor.

## 2. Create a preview that can fail

Create <code>src/components/CoursePreview.jsx</code>:

~~~jsx
export function CoursePreview({ shouldFail }) {
  if (shouldFail) {
    throw new Error('Preview rendering failed');
  }

  return (
    <section aria-labelledby="preview-title">
      <h2 id="preview-title">Course preview</h2>
      <p>The preview is ready to read.</p>
    </section>
  );
}
~~~

The <code>shouldFail</code> prop is a demonstration switch. Real components should not include a production crash button; the switch exists only to make this example's error and recovery flow visible.

## 3. Add a page with a recovery action

Create <code>src/components/CourseBoundaryPage.jsx</code>:

~~~jsx
import { useState } from 'react';
import { CoursePreview } from './CoursePreview.jsx';
import { ErrorBoundary } from './ErrorBoundary.jsx';

function reportPreviewError(error, errorInfo) {
  console.error('Course preview failed', {
    error,
    componentStack: errorInfo.componentStack
  });
}

export function CourseBoundaryPage() {
  const [shouldFail, setShouldFail] = useState(false);
  const [boundaryVersion, setBoundaryVersion] = useState(0);

  function resetPreview() {
    setShouldFail(false);
    setBoundaryVersion((version) => version + 1);
  }

  return (
    <main>
      <h1>Course details</h1>
      <p>This page content stays visible if the preview fails.</p>

      <button type="button" onClick={() => setShouldFail(true)}>
        Simulate preview failure
      </button>

      <ErrorBoundary
        key={boundaryVersion}
        onError={reportPreviewError}
        fallback={
          <section role="alert" aria-labelledby="preview-error-title">
            <h2 id="preview-error-title">Preview unavailable</h2>
            <p>The preview could not be displayed.</p>
            <button type="button" onClick={resetPreview}>
              Reset preview
            </button>
          </section>
        }
      >
        <CoursePreview shouldFail={shouldFail} />
      </ErrorBoundary>
    </main>
  );
}
~~~

The page's heading, explanation, and simulate button are outside the boundary. When the preview throws, those controls remain. The reset button clears the demonstration failure and changes the boundary key, so React creates a fresh boundary and child subtree.

In a real page, replace the demonstration state change with the actual recovery action. It might reload data, select a different record, or remount a third-party widget. If the cause remains, a reset should be expected to fail again.

## 4. Render the page

Add the page to <code>src/App.jsx</code> or an existing route:

~~~jsx
import { CourseBoundaryPage } from './components/CourseBoundaryPage.jsx';

export default function App() {
  return <CourseBoundaryPage />;
}
~~~

Do not replace a project's real route configuration; put the page component at the route where the example should be viewed.

## 5. Test fallback and recovery

Create <code>src/components/CourseBoundaryPage.test.jsx</code>:

~~~jsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CoursePreview } from './CoursePreview.jsx';
import { ErrorBoundary } from './ErrorBoundary.jsx';
import { CourseBoundaryPage } from './CourseBoundaryPage.jsx';

describe('ErrorBoundary', () => {
  it('replaces a failing child and preserves content outside the boundary', async () => {
    const user = userEvent.setup();

    render(<CourseBoundaryPage />);

    expect(screen.getByRole('heading', { name: 'Course preview' }))
      .toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'Simulate preview failure' })
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Preview unavailable');
    expect(
      screen.getByText('This page content stays visible if the preview fails.')
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Course preview' })
    ).not.toBeInTheDocument();
  });

  it('can reset after the failure condition has been cleared', async () => {
    const user = userEvent.setup();

    render(<CourseBoundaryPage />);

    await user.click(
      screen.getByRole('button', { name: 'Simulate preview failure' })
    );
    await user.click(screen.getByRole('button', { name: 'Reset preview' }));

    expect(
      screen.getByRole('heading', { name: 'Course preview' })
    ).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('reports the render error through the supplied callback', () => {
    const onError = vi.fn();

    render(
      <ErrorBoundary
        onError={onError}
        fallback={<p role="alert">This panel is unavailable.</p>}
      >
        <CoursePreview shouldFail />
      </ErrorBoundary>
    );

    expect(screen.getByRole('alert'))
      .toHaveTextContent('This panel is unavailable.');
    expect(onError).toHaveBeenCalledOnce();
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(onError.mock.calls[0][1].componentStack).toEqual(
      expect.any(String)
    );
  });
});
~~~

React may log a diagnostic when a test deliberately renders a throwing child. Do not silence diagnostics globally. If the test runner output needs a targeted adjustment, use the supported option for the exact React and Testing Library versions in the project, and restore any mock immediately.

## 6. Observe the behavior

1. Start the app and open the course details page.
2. Confirm the preview is visible.
3. Select “Simulate preview failure.”
4. Confirm the preview is replaced by “Preview unavailable.”
5. Confirm the course heading and the explanatory page text remain.
6. Select “Reset preview.”
7. Confirm the preview appears again and the fallback disappears.
8. Check the development console or configured monitoring tool for the diagnostic callback.

## Expected behavior

- A render error in the preview does not remove the rest of the page.
- The alert explains which region is unavailable without exposing the thrown error.
- Diagnostics receive the error and component stack separately.
- The reset clears the demonstration failure and remounts the subtree.
- Event-handler and API errors still need their own error handling.

## Adapt the example

- Send diagnostics through the application's approved monitoring service rather than leaving <code>console.error</code> as the production reporting strategy.
- Remove the artificial failure control from the real interface.
- Make the retry button call the actual data reload or recovery action.
- Place boundaries around independently useful regions, not every tiny component.
- Keep important navigation outside a region that can fail.
- If using a router or framework error boundary, understand which errors it catches and how it works with this component boundary.

## Common mistakes

- Expecting the boundary to catch the simulate button's handler itself. The handler changes state; the later child render is what throws.
- Showing the error message or stack directly to a visitor.
- Resetting the boundary without clearing the failing input.
- Hiding the whole page when one panel can fail independently.
- Allowing the error reporting callback to break fallback rendering.
- Assuming the boundary catches rejected requests, timers, or server-rendering failures.
- Testing only that fallback text exists without checking surrounding content and recovery.

## Key takeaways

- Error boundaries isolate descendant render failures.
- Keep the fallback safe, local, and actionable.
- Report diagnostics separately from user-facing content.
- Recovery must reset the subtree and address the cause.
- Handle event and asynchronous errors in their own code paths.

## Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Next chapter |
| --- | --- | --- | --- |
| [083 - React performance and memoization](../lessons/083-react-performance-and-memoization.md) | [Lesson](../lessons/084-error-boundaries-and-recovery.md) | [Q&A](../qnas/084-error-boundaries-and-recovery.md) | [085 - State management choices and tradeoffs](../lessons/085-state-management-choices-and-tradeoffs.md) |
