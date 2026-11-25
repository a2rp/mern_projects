# 085 - State management choices and tradeoffs

State management is the practice of deciding where application data lives, who owns it, how it changes, and which parts of the interface need to read it. A larger state library is not automatically better. Start with the smallest owner that can coordinate the components that actually share the state.

Different state has different needs. A textbox's draft is often local UI state. A filter shared by sibling components may belong in their common parent or the URL. Data fetched from an API has a server-owned source of truth and may need caching and revalidation. Authentication state, a multi-step workflow, and a cached list are not all the same kind of state.

## Learning goals

After this chapter, you should be able to:

- Identify local, shared client, server, URL, and persisted state.
- Choose a clear owner and single source of truth for each value.
- Lift state to a common parent when components need to coordinate.
- Use a reducer when a state transition has several related rules.
- Use Context to provide values through a subtree without threading props through every level.
- Recognize when Context alone is not a complete global state solution.
- Compare a dedicated client-state store with a server-state cache.
- Keep URL and persisted state in sync only when the user needs it.
- Choose a state architecture based on actual access, update, and debugging needs.

## Classify the state before selecting a tool

Start by asking what the value represents and who owns its source of truth.

| State category | Examples | Common owner |
| --- | --- | --- |
| Local UI state | Open menu, input draft, selected tab | The component using it |
| Shared client state | A checkout workflow used by several routes | A common parent, reducer, or client store |
| Server state | Courses, account records, API responses | The API/database, with a client cache |
| URL state | Search term, sort order, current page | The route or query string |
| Persisted preference | Theme choice, dismissed notice | Local storage or a user-settings API |
| Derived state | Filtered list, total count, button disabled flag | Calculated from source state |

Do not copy the same data into several stores without a clear synchronization rule. For each unique piece of state, choose one authoritative owner. Other components can receive props, subscribe to context or a store, or derive a view from the source.

## Start with local state

If one component needs a value, local <code>useState</code> is usually the simplest choice:

~~~jsx
function CourseDisclosure({ summary }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section>
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        {isOpen ? 'Hide summary' : 'Show summary'}
      </button>
      {isOpen && <p>{summary}</p>}
    </section>
  );
}
~~~

A local state variable is private to that component instance. Two rendered disclosures get independent open state. That is often desirable for menus, dialogs, temporary input, and local toggles.

Use a functional update when the next value depends on the current value. This avoids computing from a stale render snapshot.

## Lift state when components must coordinate

If sibling components need the same changing value, move it to their nearest common parent and pass it down with callbacks:

~~~jsx
function CoursePage({ courses }) {
  const [selectedCourseId, setSelectedCourseId] = useState(null);

  return (
    <>
      <CourseList
        courses={courses}
        selectedId={selectedCourseId}
        onSelect={setSelectedCourseId}
      />
      <CourseDetails
        course={courses.find((item) => item.id === selectedCourseId)}
      />
    </>
  );
}
~~~

The parent becomes the owner, so the list and details panel stay in sync. Lifting state too high can make unrelated parts of the application participate in updates. Move it only as high as the components that need to coordinate.

A component can be partly controlled and partly uncontrolled. A reusable input may own focus state while its parent controls the input value. Choose the boundary based on which decisions the parent needs to make.

## Use a reducer for related transitions

Several state fields and actions can become difficult to update consistently with many event handlers. A reducer centralizes the transition rules:

~~~jsx
const initialFilters = {
  search: '',
  category: 'all'
};

function filterReducer(state, action) {
  switch (action.type) {
    case 'searchChanged':
      return { ...state, search: action.value };

    case 'categoryChanged':
      return { ...state, category: action.value };

    case 'reset':
      return initialFilters;

    default:
      return state;
  }
}
~~~

~~~jsx
const [filters, dispatch] = useReducer(filterReducer, initialFilters);

dispatch({ type: 'searchChanged', value: 'react' });
dispatch({ type: 'categoryChanged', value: 'frontend' });
~~~

A reducer receives the current state and an action and returns the next state. Keep it pure: do not fetch, write to storage, or mutate the current object inside it. Perform side effects in an event handler or an appropriate data layer.

Use a reducer because the transition rules benefit from one place, not because every boolean needs a reducer.

## Use Context to provide a value through a subtree

Context lets descendants read a value without every intermediate component forwarding it as a prop. It is useful for values such as theme, locale, or state that belongs to a particular feature subtree.

~~~jsx
import { createContext, useContext, useReducer } from 'react';

const FilterContext = createContext(null);
const FilterDispatchContext = createContext(null);

function FilterProvider({ children }) {
  const [filters, dispatch] = useReducer(filterReducer, initialFilters);

  return (
    <FilterContext value={filters}>
      <FilterDispatchContext value={dispatch}>
        {children}
      </FilterDispatchContext>
    </FilterContext>
  );
}

function useCourseFilters() {
  const value = useContext(FilterContext);
  if (value === null) {
    throw new Error('useCourseFilters must be used inside FilterProvider');
  }
  return value;
}

function useCourseFilterDispatch() {
  const value = useContext(FilterDispatchContext);
  if (value === null) {
    throw new Error('useCourseFilterDispatch must be used inside FilterProvider');
  }
  return value;
}
~~~

React 19 allows the context object itself to be used as a provider. In older React versions, use <code>&lt;FilterContext.Provider value={filters}&gt;</code> and the matching provider for dispatch.

Context is a way to provide and subscribe to a value; it does not itself define update rules or become a complete store. Components that consume a context re-render when its provided value changes. Keep providers near the subtree that needs them, split unrelated contexts, and profile before adding elaborate provider memoization.

If a provider passes a new object on every render, consumers see a changed value by identity. A reducer dispatch function is stable, so keeping state and dispatch in separate contexts can avoid updating components that only dispatch when state changes. For very high-frequency or selectively subscribed data, a store with selectors may fit better.

## Keep server state separate from client state

Server state is owned by an API or database. The client receives a snapshot that can become stale, fail to load, or be invalidated by a mutation. Treat it differently from local UI state.

A server-state library such as TanStack Query or Redux Toolkit Query can help with:

- Request deduplication and caching.
- Loading, error, and success states.
- Refetching and cache invalidation after mutations.
- Retry and cancellation policies.
- Keeping data fresh across routes and components.

A query cache is not the server itself. It is a client-side copy with a freshness and invalidation policy. Avoid storing an API response in a second global client store unless there is a concrete reason and a clear synchronization strategy.

For a small page, a focused service and local loading state may be sufficient. Use a query library when caching, invalidation, deduplication, or cross-route reuse justify it.

## Know when a dedicated client store helps

A dedicated client-side state store can be useful when many distant components need to coordinate, transitions need consistent rules, actions need middleware, or developers need time-travel debugging and clear event history.

Redux Toolkit with React-Redux is one established option for structured shared client state. Its recommended APIs reduce boilerplate compared with hand-writing a store setup. It is not a requirement for every React app. Zustand and other external stores offer different tradeoffs; evaluate their subscription model, tooling, ecosystem, and maintenance for the project.

Before introducing a global store, confirm that:

- The state is genuinely shared across distant parts of the UI.
- Props, a common parent, or a scoped provider have become awkward.
- There are clear actions and update rules.
- The team benefits from the store's debugging and middleware model.
- Server data is not being put into client state merely by habit.

## Put shareable view state in the URL

Search terms, filters, sort order, and pagination often belong in the URL when users should be able to bookmark, share, refresh, or navigate back to the view.

The URL can be the source of truth for those values. Parse and validate query parameters at the route boundary. Keep temporary keystrokes local when updating the URL on every keypress would be disruptive; commit the value after a submit or debounce when appropriate.

Do not duplicate a query parameter into separate state unless there is a deliberate draft-versus-applied distinction. If both exist, define when they synchronize.

## Persist only what should survive

Local storage can preserve non-sensitive preferences across reloads. A user profile setting may belong on the server so it follows the user across devices. Sensitive credentials should not be put in local storage merely to make state persistent.

Persisted data can outlive the code that wrote it. Handle missing, invalid, or old values safely, and consider versioning when the stored shape changes. Keep storage access outside render and handle browser storage errors where needed.

## Avoid duplicated and derived state

If a value can be calculated cheaply from existing state, calculate it instead of maintaining a second copy:

~~~jsx
const visibleCourses = courses.filter((course) => course.category === category);
const resultCount = visibleCourses.length;
~~~

Storing both <code>courses</code> and <code>visibleCourses</code> creates a synchronization problem. Add memoization only if the calculation is measured as costly.

Avoid storing props into state in an effect unless the component intentionally needs an independent draft or snapshot. For example, an edit form may keep a local draft while the server value remains unchanged; that is a deliberate distinction, not accidental duplication.

## Use external stores through the supported subscription API

If integrating a store outside React, use a supported subscription mechanism. React's <code>useSyncExternalStore</code> is the built-in Hook for subscribing to external stores. Do not read a mutable global value during render and expect React to notice when it changes.

A store subscription should provide a stable snapshot and notify subscribers when the snapshot changes. Follow the store library's React integration rather than writing an ad hoc subscription unless the integration is very small and well understood.

## A practical decision sequence

1. Is only one component using the value? Keep it local.
2. Do nearby components need to stay in sync? Lift it to their common parent.
3. Are there many related transitions? Consider <code>useReducer</code>.
4. Do distant descendants need a stable feature-scoped value? Consider Context.
5. Is the value owned by a server and needs caching or invalidation? Use a server-state approach.
6. Should the current view be bookmarkable or shareable? Put applied view state in the URL.
7. Is state shared across distant workflows with complex actions or tooling needs? Consider a client store.
8. Must a preference survive reloads or devices? Choose local or server persistence according to the requirement.

This is a decision aid, not a rigid hierarchy. A feature can use several approaches for different state categories.

## Common mistakes

- Putting every value in one global store before its scope is understood.
- Lifting local input or hover state to the application root.
- Duplicating server data in both a query cache and a client store.
- Storing derived values and synchronizing them with effects.
- Using Context as if it automatically provides selectors and granular subscriptions.
- Putting shareable filters only in local state so refresh and sharing lose them.
- Persisting secrets or assuming browser storage always succeeds.
- Writing side effects inside reducers.
- Introducing a reducer for state with no related transition rules.
- Using an external store without a React-compatible subscription.
- Treating a global store as the only possible source of truth.
- Adding memoization before measuring provider or consumer updates.

## Chapter checklist

For each state value, record:

- What the value represents and its authoritative source.
- Which components read it and which actions update it.
- Whether it is local UI, shared client, server, URL, or persisted state.
- Whether it can be derived instead of stored.
- Whether it must survive reloads, navigation, or another device.
- Whether an existing mechanism already manages its lifecycle.
- What happens when loading or updating fails.
- Why the chosen tool is simpler than the available alternatives.

## Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [084 - Error boundaries and recovery](084-error-boundaries-and-recovery.md) | [Q&A](../qnas/085-state-management-choices-and-tradeoffs.md) | [Example](../examples/085-state-management-choices-and-tradeoffs.md) | [086 - Build a reusable component system](086-build-a-reusable-component-system.md) |
