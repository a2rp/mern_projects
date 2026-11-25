# 077 - Loading, error, empty, and success states: Q&A

These questions review API request states, empty results, retry behavior, stale responses, and accessible status feedback.

## Multiple-choice questions

### 1. What does an empty state usually mean for a list request?

- **A.** The request failed before returning data
- **B.** The request succeeded and returned zero records
- **C.** The browser could not connect
- **D.** The server returned an authorization error

**Answer: B.** Empty is a successful result with no records. A failed request should be represented as an error, not as an empty list.

### 2. What is one problem with storing <code>isLoading</code>, <code>hasError</code>, and <code>isEmpty</code> as unrelated booleans?

- **A.** They can represent contradictory combinations
- **B.** They cannot be used in React
- **C.** They automatically retry requests
- **D.** They prevent rendering lists

**Answer: A.** Multiple independent booleans can accidentally say a request is loading and failed at the same time. A status value or explicit state union makes allowed states clearer.

### 3. Why should an app distinguish a successful empty result from an API error?

- **A.** They have different meanings and often need different next actions
- **B.** An empty list is always a server crash
- **C.** Errors are always successful responses
- **D.** The browser requires a different CSS file

**Answer: A.** An empty result may invite creating or searching for data. An error may call for retry, reauthentication, or another recovery path.

### 4. What is a good message for an initial request that has not completed yet?

- **A.** “No courses exist”
- **B.** “Loading courses…”
- **C.** “Request failed”
- **D.** A blank page with no status

**Answer: B.** A concise loading message tells the user what the page is doing. Do not claim there are no records until a successful response confirms that.

### 5. What should a retry button usually do?

- **A.** Re-run the appropriate request after the user activates it
- **B.** Reload the entire user's operating system
- **C.** Delete previous data
- **D.** Repeatedly send requests without delay until one works

**Answer: A.** A retry gives the user an explicit recovery action. Automatic retries should be limited and reserved for errors likely to be temporary.

### 6. Which error is least likely to succeed if retried without changing anything?

- **A.** A malformed request that receives 400
- **B.** A brief temporary network interruption
- **C.** A transient 503 service error
- **D.** A connection that dropped while reading a response

**Answer: A.** Correct the invalid input before repeating a 400 request. A retry loop cannot fix a request that is consistently malformed.

### 7. What should a request cleanup do when a component starts a newer request for a different item?

- **A.** Abort or ignore the obsolete request so its result cannot replace newer data
- **B.** Change every response to empty
- **C.** Retry the old request forever
- **D.** Remove the route from the browser

**Answer: A.** Cancelling or ignoring stale work prevents an older response from overwriting the state for the current selection.

### 8. What does <code>aria-busy="true"</code> communicate on an updating region?

- **A.** The region is currently being updated
- **B.** The request has definitely failed
- **C.** The user has no permission
- **D.** The content is empty

**Answer: A.** It marks the region as busy while its contents are being updated. It should accompany meaningful visible status feedback when appropriate.

### 9. Which role is generally appropriate for a non-urgent status update such as “Refreshing results…”?

- **A.** <code>role="status"</code>
- **B.** <code>role="button"</code>
- **C.** <code>role="navigation"</code>
- **D.** No visible text

**Answer: A.** A status role is intended for advisory status messages and has polite live-region behavior. Announcements should still be used thoughtfully.

### 10. When is <code>role="alert"</code> more appropriate?

- **A.** For an important error that needs attention
- **B.** For every course title
- **C.** For every render of a page heading
- **D.** For decorative animation frames

**Answer: A.** Alerts can interrupt assistive technology users, so reserve them for meaningful, time-sensitive messages rather than routine updates.

### 11. A refresh request fails while valid old results remain. What might a useful interface do?

- **A.** Keep the old data visible and explain that refresh failed
- **B.** Pretend the old data is fresh with no indication
- **C.** Replace the list with “No data exists”
- **D.** Delete the old data automatically

**Answer: A.** Retaining useful data can reduce disruption, but the UI should explain that it may be stale. Clear sensitive data when access conditions require it.

### 12. Which is the best representation for a successful list request returning an empty array?

- **A.** Success state with an empty data array
- **B.** Network error
- **C.** Loading state forever
- **D.** Authentication failure

**Answer: A.** The request succeeded; the list happens to have no records. Render the appropriate empty state from that success result.

### 13. Why should an app avoid showing a percentage for a request when it cannot measure completed work?

- **A.** It would suggest precision or progress the app does not know
- **B.** Percentages cannot be styled
- **C.** It automatically disables keyboard navigation
- **D.** It changes the server status

**Answer: A.** A spinner is indeterminate. Do not present a fabricated percentage as if it measured real progress.

### 14. Why might a full-page spinner be a poor choice for a background refresh?

- **A.** It hides useful content the user already has
- **B.** It makes the network faster
- **C.** It changes a 200 response to 404
- **D.** It always causes a CORS error

**Answer: A.** When old results remain useful, a small refreshing indicator can keep the page stable and preserve context.

### 15. What should happen to an aborted request caused by unmount cleanup?

- **A.** It usually should not be shown as an ordinary user-facing failure
- **B.** It should trigger a 500 response
- **C.** It should be announced as a critical alert
- **D.** It should retry immediately forever

**Answer: A.** An abort during cleanup is expected because the page no longer needs the result. Distinguish it from a real request failure.

### 16. Why should retrying a mutation be more cautious than retrying a GET?

- **A.** A repeated mutation could create duplicate or irreversible effects
- **B.** GET cannot be requested twice
- **C.** Mutations do not use HTTP
- **D.** Buttons cannot send requests

**Answer: A.** A retried create, payment, or delete operation may repeat an effect. Use explicit confirmation and server-side idempotency strategies where the domain requires them.

### 17. What is the main difference between an empty dataset and an empty search result?

- **A.** A search may have records available but none matching the current filter
- **B.** They always mean the API failed
- **C.** A search result cannot be empty
- **D.** An empty dataset always contains one hidden record

**Answer: A.** A clear-filter action can help when the current query matches nothing. An empty dataset may instead offer an add-first-item action.

### 18. What should a page do if one dashboard panel fails but other panels loaded successfully?

- **A.** Consider keeping the working panels visible and show an error within the failed panel
- **B.** Hide the entire dashboard every time
- **C.** Show the failed panel as empty success
- **D.** Retry every panel on every render

**Answer: A.** Independent sections can often own their own request states, so a partial failure does not erase useful content.

### 19. Why should an error message avoid exposing a stack trace?

- **A.** It may reveal internal implementation details and is not useful recovery guidance
- **B.** Screen readers cannot read punctuation
- **C.** It changes the HTTP status
- **D.** It prevents retry from working

**Answer: A.** Show a concise, actionable explanation and keep detailed diagnostics in appropriate logs.

### 20. What should be considered when adding automatic retries?

- **A.** Attempt limits, delay, error type, and whether repeating the request is safe
- **B.** Only the color of the retry button
- **C.** Whether the page contains a footer
- **D.** Whether the browser is in dark mode

**Answer: A.** Unbounded immediate retries can overload a service and produce noisy failures. Retry only suitable errors with a bounded strategy.

## Short-answer questions

### 21. Name the four primary data-view states and explain the empty state.

**Answer:** Loading, error, empty, and success. Empty means the request succeeded and returned no records; it is a kind of successful result, not a failed request.

### 22. Why can a single status value be clearer than three booleans?

**Answer:** A single status value makes the primary request phases mutually exclusive and prevents combinations such as “loading and failed” from being represented accidentally. A TypeScript discriminated union can also restrict which data is available in each state.

### 23. When is it useful to keep old data visible while a refresh is pending?

**Answer:** Keep it when the old data is still useful and safe to display. Show a refreshing indicator and explain if the refresh fails; do not preserve sensitive or no-longer-authorized data.

### 24. What is the difference between a loading indicator and a progress indicator?

**Answer:** A loading indicator communicates that work is ongoing, often without a measurable completion value. A progress indicator should show measured progress; do not invent a percentage for an indeterminate request.

### 25. How should an aborted request from component cleanup be handled?

**Answer:** Recognize the abort and avoid presenting it as a normal user-facing error. Cleanup means the result is no longer needed, not necessarily that the service failed.

### 26. Why is the empty state based on the success result rather than the initial data array?

**Answer:** An initial empty array may only mean data has not loaded yet. Wait for a successful response before concluding that the server returned zero records.

### 27. Give one example of a useful action in a filtered-empty state.

**Answer:** Offer a **Clear filters** or **Change search** action so the user can see the unfiltered dataset. A filtered-empty state means nothing matched the current criteria.

### 28. What makes an error message actionable?

**Answer:** It explains what failed in user-facing language and gives a reasonable next step, such as retrying a temporary failure, correcting input, signing in, or returning to a safe page.

### 29. What is an appropriate role for a polite, non-urgent status announcement?

**Answer:** <code>role="status"</code> is suitable for a non-urgent status update such as a refresh message. Use alerts selectively because assertive announcements can interrupt assistive technology users.

### 30. When should a dashboard give each panel its own request state?

**Answer:** When panels depend on independent requests and one panel can fail without making all other content unusable. The UI can preserve successful panels and show recovery feedback only where needed.

## Applied questions

### 31. A page initializes <code>courses</code> to an empty array and immediately renders “No courses found” while the request is pending. What is wrong?

**Answer:** The page confuses its initial local value with a successful empty response. Track request status separately and show loading until a successful response confirms that the array is empty.

### 32. Design the state values for a list that shows previous results during refresh.

**Answer:** One option is a discriminated union:

~~~ts
type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; courses: Course[] }
  | { status: "refreshing"; courses: Course[] }
  | { status: "refresh-error"; courses: Course[]; message: string };
~~~

The refresh states retain data; the initial error state has no list to preserve.

### 33. A slow response for user A arrives after the user navigates to user B. What should the UI do?

**Answer:** Keep B's view based on B's request. Cancel A's request or ignore its result during cleanup so it cannot overwrite the state for the current user.

### 34. A temporary network error appears with a Retry button. The user clicks it twice quickly. What should the app consider?

**Answer:** Prevent duplicate in-flight retries or intentionally deduplicate them, provide visible pending feedback, and ensure the request is safe to repeat. Disable the retry control while the same retry is active if that matches the interaction.

### 35. A request returns an empty list successfully. What should be rendered?

**Answer:** Render an empty-state message that explains what zero records mean and, when useful, an action such as adding the first item. Do not show a network error.

### 36. A search completes with zero matches while the unfiltered catalog contains many courses. What should the empty state say or offer?

**Answer:** Explain that no items matched the current search and offer to clear or change the filter. Do not describe the entire catalog as empty.

### 37. A request fails while the user is viewing cached course results. What is a reasonable refresh-error response?

**Answer:** Keep the old courses visible if they remain safe and useful, clearly state that refresh failed or the data may be stale, and provide a retry action.

### 38. A screen reader user cannot tell when an in-place search finishes. What should be added?

**Answer:** Provide a concise visible status such as “5 results returned” in an appropriate programmatically identifiable status region, such as one with <code>role="status"</code>. Avoid announcing every low-value change assertively.

### 39. A page shows a spinner and a fake “90%” indicator for a request whose duration is unknown. What should change?

**Answer:** Remove the invented percentage. Use an indeterminate loading indicator with explanatory text unless the application can measure real progress.

### 40. A temporary 503 error triggers an immediate infinite retry loop. How should retry behavior be redesigned?

**Answer:** Set a maximum number of automatic attempts, add a delay with backoff and jitter, stop retrying after the limit, and provide a manual retry action. Do not use the same policy for validation or authorization errors.

## Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [076 - Fetch data from an API](../lessons/076-fetch-data-from-an-api.md) | [Lesson](../lessons/077-loading-error-empty-and-success-states.md) | [Example](../examples/077-loading-error-empty-and-success-states.md) | [078 - Client-side form validation and user experience](../lessons/078-client-side-form-validation-and-user-experience.md) |
