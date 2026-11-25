# 083 - React performance and memoization

React performance work starts with a user-visible problem, not with adding a memoization Hook everywhere. First find the interaction that feels slow, identify where time is spent, and reduce the work that is actually unnecessary.

React re-renders components as their state, props, or context change. Most ordinary rendering is fast enough. For measured bottlenecks, React offers tools such as <code>memo</code>, <code>useMemo</code>, and <code>useCallback</code>. They are performance optimizations; application correctness must not depend on a cached value or skipped render. When React Compiler is enabled, it can automatically memoize many values and components, reducing the need for manual memoization.

## Learning goals

After this chapter, you should be able to:

- Distinguish a render from a DOM commit and recognize why each may happen.
- Measure a slow interaction before choosing an optimization.
- Explain how <code>memo</code>, <code>useMemo</code>, and <code>useCallback</code> differ.
- Use stable props and immutable updates where memoization is useful.
- Avoid stale closures, missing dependencies, and custom-comparator bugs.
- Improve component boundaries and state placement before adding caches.
- Describe the role of React Compiler and why manual memoization may still appear.
- Confirm that an optimization improves the measured interaction.

## What React does during an update

A state update schedules React to render the affected component tree. Rendering means calling component functions and calculating the next UI description. React then compares that description with the current UI and commits necessary changes to the host environment, usually the browser DOM.

A component function running does not mean every descendant caused a DOM update. React may calculate component output and later determine that the DOM does not need a change. Avoid using “render” and “DOM update” as if they mean the same thing.

Common reasons for work include:

- A component's own state changes.
- A parent renders and its child elements are recreated.
- A context value used by a component changes.
- A list filter, sort, or derived calculation runs again.
- An effect schedules additional state updates.
- A component mounts or is removed.

The first question is whether that work is noticeable and costly for the real interaction. A component rendering is not automatically a performance bug.

## Measure before you optimize

Start with an interaction users report as slow. Reproduce it using realistic data and a representative device profile. Use browser performance tools and React DevTools Profiler to identify the slow component tree or JavaScript calculation.

For targeted measurements, React's <code>&lt;Profiler&gt;</code> can report time spent rendering a subtree:

~~~jsx
import { Profiler } from 'react';

function handleRender(id, phase, actualDuration, baseDuration) {
  console.log({ id, phase, actualDuration, baseDuration });
}

<Profiler id="CourseResults" onRender={handleRender}>
  <CourseResults courses={courses} />
</Profiler>
~~~

<code>actualDuration</code> is the time spent rendering the profiled subtree for this update. <code>baseDuration</code> estimates the cost of rendering the subtree without memoization. These measurements are useful signals, not a substitute for profiling the whole browser interaction.

Development measurements may differ from production. Development checks such as Strict Mode may invoke render logic more than once to expose impure code. Profile the production build when investigating production performance, and use the browser's CPU throttling when it helps represent a slower device.

## Fix unnecessary work at its source

Before adding memoization:

- Keep transient state close to the components that use it.
- Avoid lifting form input, hover state, or a local toggle to an unnecessarily high ancestor.
- Pass JSX as children to visual wrappers where appropriate.
- Keep render calculations pure.
- Remove effects that copy derived props into state or create update loops.
- Avoid recreating data in a parent when it does not need to change.
- Improve a costly algorithm or data structure before caching its result.
- Split a large component when a clear responsibility boundary helps isolate updates.

A local state update usually only needs the component that owns it and the necessary descendants. State at the root can cause unrelated regions to participate in updates.

## Use memo for a measured child-render bottleneck

<code>memo(Component)</code> creates a component that can usually skip rendering when its props are unchanged. React compares each prop using <code>Object.is</code> by default. A memoized child still renders when its own state or consumed context changes, and React may render it for other reasons. It is not a correctness guarantee.

~~~jsx
import { memo } from 'react';

export const CourseCard = memo(function CourseCard({ course, onOpen }) {
  return (
    <article>
      <h2>{course.title}</h2>
      <p>{course.summary}</p>
      <button type="button" onClick={() => onOpen(course.id)}>
        Open course
      </button>
    </article>
  );
});
~~~

The optimization can help when a parent updates for unrelated reasons but the card's meaningful props remain stable. It does not help if the parent constructs new object or function props every time.

Do not add custom equality logic casually. A custom comparator must return true only when the old and new props produce equivalent output and behavior. Forgetting to compare a callback can preserve a stale closure. Deep comparison can also cost more than rendering.

## Use useMemo for an expensive calculation

<code>useMemo(calculate, dependencies)</code> caches the result of a pure calculation between renders while the dependencies remain equal by <code>Object.is</code>.

~~~jsx
import { useMemo } from 'react';

function CourseList({ courses, query, sortOrder }) {
  const visibleCourses = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();

    return courses
      .filter((course) =>
        course.title.toLocaleLowerCase().includes(normalizedQuery)
      )
      .toSorted((first, second) =>
        sortOrder === 'title'
          ? first.title.localeCompare(second.title)
          : second.updatedAt.localeCompare(first.updatedAt)
      );
  }, [courses, query, sortOrder]);

  return <CourseRows courses={visibleCourses} />;
}
~~~

This is useful when the filter and sort are measurably expensive or when the stable result lets a memoized child skip work. For a short array, direct calculation may be clearer and fast enough.

The dependency list must include every reactive value used by the calculation. If a dependency changes, React recalculates the result. If an array or object is recreated every render, it changes identity even when its contents look the same.

The calculation must be pure. Do not mutate props or state inside it. React may run it more than once in development to expose impure logic. The cached value is not persistent storage; React can discard it when needed. Never use <code>useMemo</code> as a substitute for state.

## Use useCallback for a function identity

<code>useCallback(fn, dependencies)</code> caches a function identity while dependencies remain equal. It is mainly useful when a function is passed to a memoized child or used as a dependency in another Hook.

~~~jsx
import { useCallback, useState } from 'react';

function CoursePage({ initialCourses }) {
  const [selectedId, setSelectedId] = useState(null);

  const handleOpen = useCallback((courseId) => {
    setSelectedId(courseId);
  }, []);

  return (
    <>
      {initialCourses.map((course) => (
        <CourseCard
          key={course.id}
          course={course}
          onOpen={handleOpen}
        />
      ))}
      {selectedId && <p>Selected course: {selectedId}</p>}
    </>
  );
}
~~~

The function still gets created during render; React returns the cached function when dependencies match. Every reactive value referenced inside the callback must be included in the dependency array. An empty array is correct only when the callback reads no changing props or state.

When a state update depends on the previous value, a functional update can avoid capturing that previous value:

~~~jsx
const addCourse = useCallback((course) => {
  setCourses((currentCourses) => [...currentCourses, course]);
}, []);
~~~

This keeps updates immutable and lets the callback avoid a dependency on the current array.

Do not add <code>useCallback</code> around every event handler. It adds code and dependency reasoning. If the callback is not used for a meaningful identity-sensitive optimization, a normal function is usually clearer.

## Referential identity matters

JavaScript compares objects and functions by identity:

~~~js
({ id: 1 }) === ({ id: 1 }); // false
(() => {}) === (() => {}); // false
~~~

A memoized child sees a new object or function prop as changed even if its contents are equivalent. Consider these options in order:

1. Move a constant object outside the component if it never depends on props or state.
2. Avoid passing data the child does not use.
3. Restructure the component boundary or state ownership.
4. Use <code>useMemo</code> or <code>useCallback</code> when profiling shows identity changes prevent a useful child optimization.

Stable identity is only useful when something relies on it. Do not make code harder to understand merely to keep every reference stable.

## Avoid stale closures and dependency mistakes

A callback closes over values from the render in which it was created. If a changing value is missing from its dependencies, the callback may use an old value.

~~~jsx
const handleSave = useCallback(() => {
  saveCourse(courseId, title);
}, [courseId, title]);
~~~

Keep the dependency list complete and let the React Hooks lint rules help find omissions. Do not silence a dependency warning by adding memoization blindly. Often the better fix is to move a helper into an effect, move a constant outside the component, or use a functional state update.

A custom comparator that says old and new callbacks are “equal” when they are not can preserve a callback with stale values. Correctness comes first.

## Derived values and state

Do not store a value in state when it can be cheaply calculated from existing props or state. Duplicated state can become stale and needs synchronization effects.

~~~jsx
// Usually prefer calculating from the source state:
const completedCount = tasks.filter((task) => task.completed).length;
~~~

If this calculation is measurably costly, memoize the derived value. The source remains the task list; the cached count is not a separate source of truth.

For large lists, memoization may not be the best solution. Consider pagination, server-side filtering, or list virtualization so the browser creates fewer DOM nodes.

## React Compiler

React Compiler can automatically memoize components, values, and functions when it is enabled and the code follows the Rules of React. In a compiler-enabled application, many manual <code>memo</code>, <code>useMemo</code>, and <code>useCallback</code> calls are unnecessary.

The compiler does not remove the need to write pure components, correct state updates, complete dependencies, or good algorithms. Existing manual memoization can remain while a project adopts the compiler; remove it only after understanding and checking the result. In codebases without the compiler, targeted manual memoization remains a tool for measured update work.

Check the project's actual React version and compiler configuration instead of assuming that automatic memoization is active.

## Common performance mistakes

- Adding <code>memo</code>, <code>useMemo</code>, and <code>useCallback</code> everywhere without a measured problem.
- Treating a component render as proof that the DOM changed.
- Passing a freshly created object to a memoized child on every parent render.
- Leaving reactive dependencies out of a memoized callback.
- Mutating an array or object and expecting identity-based comparison to detect changes.
- Using a custom comparator that ignores a changed callback.
- Memoizing a cheap calculation and making code harder to follow.
- Using <code>useMemo</code> as persistent storage or as application state.
- Measuring only development behavior and drawing production conclusions.
- Trying to optimize with memoization when an effect loop is the actual cause.
- Rendering thousands of DOM rows and assuming memoization alone solves the problem.
- Treating React Compiler as a replacement for profiling or correct code.

## Chapter checklist

When an interaction feels slow:

- Reproduce the specific interaction with realistic data.
- Use the React and browser profilers to locate the work.
- Check whether effects, lifted state, or broad context updates cause avoidable work.
- Improve the algorithm or component boundary before adding caches.
- Add memoization only where stable inputs can skip measured work.
- Include every reactive dependency and keep calculations pure.
- Re-measure the same interaction after the change.
- Check that behavior is correct with and without memoization where practical.
- Confirm whether React Compiler is configured for this project.
- Use virtualization or pagination when the DOM size is the bottleneck.

## Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [082 - Component tests with React](082-component-tests-with-react.md) | [Q&A](../qnas/083-react-performance-and-memoization.md) | [Example](../examples/083-react-performance-and-memoization.md) | [084 - Error boundaries and recovery](084-error-boundaries-and-recovery.md) |
