# 077 - Loading, error, empty, and success states

An API-backed page has more than one meaningful UI state. Before data arrives, the page is loading. A request may fail. A successful response may contain no records. When records arrive, the page can show them.

Represent these states explicitly so users can understand what is happening and know what they can do next. This chapter builds on the Fetch API from the previous lesson.

## Learning goals

After this chapter, you should be able to:

- Distinguish loading, error, empty, and success states.
- Model request state so impossible combinations are harder to create.
- Preserve useful data while refreshing it.
- Give errors an appropriate recovery action.
- Make status updates available to assistive technology.
- Handle retry, cancellation, repeated requests, and stale results.
- Choose page-level or component-level feedback based on the failure scope.

## The four primary states

For a course list, these states mean different things:

| State | Meaning | Example UI |
| --- | --- | --- |
| Loading | No usable result is available yet and a request is in progress | “Loading courses…” |
| Error | The request failed and no usable result is available | A short explanation and a retry action |
| Empty | The request succeeded, but there are no records to show | “No courses have been published yet.” |
| Success | The request succeeded and returned one or more records | The course list |

A successful empty array is not an error. A failed request is not an empty list. Keep those meanings separate.

The page can also have a refresh state: existing data is visible while a new request runs. If that refresh fails, the UI can retain the previous results and explain that they may be out of date.

## Model states explicitly

Several independent booleans can allow contradictory combinations:

~~~js
const [isLoading, setIsLoading] = useState(false);
const [hasError, setHasError] = useState(false);
const [isEmpty, setIsEmpty] = useState(false);
~~~

For example, the component could accidentally set <code>isLoading</code> and <code>hasError</code> to <code>true</code> at the same time. A single status value makes the main states mutually exclusive:

~~~js
const [status, setStatus] = useState("loading");
// Later values: "error" or "success"
~~~

When the UI needs to preserve results during refresh, model that explicitly too. A discriminated union in TypeScript makes the relationship between a status and its available data clear:

~~~ts
type CourseState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; courses: Course[] }
  | { status: "refreshing"; courses: Course[] }
  | { status: "refresh-error"; courses: Course[]; message: string };
~~~

In plain JavaScript, follow the same structure with objects and a <code>status</code> field. Only read <code>courses</code> in states that contain it.

The empty state is a successful state whose data has zero records. That keeps the request lifecycle independent from the contents of the response.

## Render each state clearly

Use ordinary conditional rendering to select the appropriate UI:

~~~jsx
function CourseResults({ state, onRetry }) {
  if (state.status === "loading") {
    return <p role="status">Loading courses…</p>;
  }

  if (state.status === "error") {
    return (
      <div role="alert">
        <p>{state.message}</p>
        <button onClick={onRetry}>Try again</button>
      </div>
    );
  }

  if (state.status === "success" && state.courses.length === 0) {
    return <p>No courses have been published yet.</p>;
  }

  return <CourseList courses={state.courses} />;
}
~~~

A user should be able to tell:

- Whether the app is working or waiting.
- Whether the problem is temporary or requires another action.
- Whether there is no data or the request failed.
- What action is available, such as retrying or changing a filter.

Avoid exposing raw stack traces, database errors, or unhelpful internal messages. Log technical detail in the appropriate development or server logs; show the user a clear message.

## Loading feedback

Loading feedback is useful when the wait is noticeable. For a quick response, avoid flashing a full-page spinner for a fraction of a second. For a longer request, show a text label, progress indicator when progress can be measured, or a skeleton that resembles the content layout.

A decorative spinner alone does not explain what is loading. Include visible text such as “Loading courses…” and expose meaningful updates to assistive technology. For a region whose contents are being updated, <code>aria-busy</code> can communicate that the region is in progress:

~~~jsx
<section aria-busy={isLoading}>
  {isLoading ? <p role="status">Loading courses…</p> : <CourseList courses={courses} />}
</section>
~~~

Do not claim a percentage when the app cannot measure actual progress. A spinner's animation is not a progress measurement.

## Error feedback and recovery

An error should explain what failed in user terms and provide a next step when one is available:

- A temporary connection failure may offer a retry.
- A missing course may offer a link back to the course list.
- A permission failure may explain that the user needs access.
- A validation error should identify what the user needs to correct.
- A server error should not reveal internal stack traces or sensitive details.

Not every error is retryable. Retrying a bad request without changing its input will usually fail again. Do not automatically retry authorization failures as if they were network interruptions. For temporary failures, use bounded retries with a delay rather than an immediate retry loop.

An inline request error usually should not move keyboard focus unexpectedly. For a major navigation failure or modal workflow, manage focus as part of that interaction.

## Empty states

An empty state answers “what does zero data mean here?” It may explain what to do next:

- A new account with no saved items can offer a way to add the first item.
- A search with no matches can suggest changing or clearing the filter.
- An empty administrator-managed catalog can explain that content has not been added yet.

Distinguish an empty dataset from an empty filtered result. The first may mean no records exist. The second means records exist but none match the current filter. A clear-filter action is useful for the latter.

Keep empty states honest. Do not render “No results” when the request failed before the app learned the result.

## Success states

When data arrives, display the content in a predictable structure. If the request was triggered by a user action, a short success message may be useful:

~~~jsx
<p role="status">Course saved.</p>
~~~

A successful page load usually does not need an extra announcement if the content itself is already clear. Avoid repeating messages on every render. Status messages that update without moving focus should be programmatically identifiable; use an appropriate status role for non-urgent updates. Reserve interruptive alerts for errors that need immediate attention, and avoid making the page excessively chatty.

## Refresh while keeping existing data

Replacing a useful list with a full-page loading screen every time the user refreshes can make the interface feel unstable. Keep the old results visible while the refresh runs:

~~~jsx
{state.status === "refreshing" ? (
  <p role="status">Refreshing courses…</p>
) : null}

{state.status === "refresh-error" ? (
  <div role="alert">
    <p>Could not refresh. Showing the previous course list.</p>
    <button onClick={onRetry}>Try again</button>
  </div>
) : null}

<CourseList courses={state.courses} />
~~~

This pattern is appropriate only when showing the previous data is safe and useful. If permissions have changed or the data is sensitive, clear it or revalidate access rather than displaying potentially unauthorized stale content.

## Retry behavior

A retry should repeat the operation with a clear user action. For GET requests, a retry button can trigger the same read again:

~~~jsx
<button type="button" onClick={reload} disabled={isLoading}>
  {isLoading ? "Loading…" : "Try again"}
</button>
~~~

For automatic retries:

- Limit the number of attempts.
- Wait between attempts, often with exponential backoff and jitter.
- Retry only errors likely to be temporary.
- Do not retry a mutation unless it is safe to repeat or protected by an idempotency strategy.
- Let the user cancel or navigate away when appropriate.

A timeout or aborted request should be distinguished from an ordinary server failure. An abort during component cleanup is expected and should not be announced as a user-facing error.

## Avoid stale responses

If a user changes the selected item quickly, requests can finish out of order. A response for the old selection must not overwrite the current selection's data.

Use an <code>AbortController</code> or an ignore-result guard in Effect cleanup. The request's inputs belong in the Effect dependency list. When they change, clean up the old request before applying new data.

React Strict Mode may run an extra Effect setup and cleanup cycle in development. Make the setup and cleanup safe instead of hiding the behavior with a “run once” ref. A GET should be safe to repeat; a mutation belongs in the user action that caused it.

## Keep request state near the right boundary

A page-level request may control a page-level loading or error message. A dashboard with several independent panels may let each panel load and fail independently so one unavailable widget does not hide all useful content.

Choose a boundary based on how the user understands the data:

- If all content depends on one request, a shared page state may fit.
- If panels use independent endpoints, give them independent state.
- If one child action is pending, use local state for that action.
- If the app needs caching and coordinated revalidation across routes, use the data layer already chosen by the project rather than duplicating cache logic in every component.

## Common mistakes

- Treating a successful empty response as a network error.
- Treating a failed request as if it returned an empty list.
- Rendering a blank page while waiting.
- Displaying a spinner without text that explains what is loading.
- Showing a raw server error or stack trace to the user.
- Offering retry for an error that needs corrected input or permission.
- Replacing useful existing content with a full-page spinner during every refresh.
- Announcing every small state change assertively to assistive technology.
- Updating React state from a request after that request became obsolete.
- Showing stale or protected data after access conditions may have changed.
- Using multiple booleans that allow contradictory request states.

## Chapter checklist

For every API-backed view, decide:

- What does the initial loading state look like?
- What does a failed request say, and what can the user do?
- What does a successful response with zero records mean?
- How does the successful data state render?
- Is there a refresh state that should keep the current data visible?
- Which messages need an accessible status or alert role?
- Which errors are retryable?
- How are obsolete requests cancelled or ignored?
- Can independent parts of the page fail independently?

## Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [076 - Fetch data from an API](076-fetch-data-from-an-api.md) | [Q&A](../qnas/077-loading-error-empty-and-success-states.md) | [Example](../examples/077-loading-error-empty-and-success-states.md) | [078 - Client-side form validation and user experience](078-client-side-form-validation-and-user-experience.md) |
