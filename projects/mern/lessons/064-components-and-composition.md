# 064 - Components and composition

## What a component is

A React component is a JavaScript function that describes a reusable part of the interface. It receives input, usually through props, and returns React elements, commonly written as JSX.

~~~jsx
function WelcomeMessage() {
    return <h1>Welcome to the course</h1>;
}
~~~

Use a component in JSX with a capitalized name:

~~~jsx
function App() {
    return (
        <main>
            <WelcomeMessage />
        </main>
    );
}
~~~

Capitalization matters. JSX treats names beginning with a lowercase letter as built-in HTML tags; capitalized names refer to JavaScript variables that contain components.

A component call such as <code>&lt;WelcomeMessage /&gt;</code> creates an element description for React. It does not mean you should call the component as an ordinary function. Let React render components so it can manage the component tree and its rendering rules.

## Why split an interface into components?

A page may start as one large component. As it grows, one function can end up responsible for unrelated jobs: page layout, navigation, a list, each list row, and an empty state. Splitting those responsibilities makes the interface easier to read and change.

For example, a learning dashboard could have this structure:

~~~text
App
└── PageLayout
    ├── SiteHeader
    ├── CourseNavigation
    └── MainContent
        ├── PageHeading
        ├── ProgressCard
        └── LessonList
            ├── LessonRow
            └── LessonRow
~~~

Each component has a recognizable responsibility. The component tree is also a useful way to discuss how a React interface is assembled. It does not have to mirror every HTML element: create components around meaningful UI responsibilities, not around every individual tag.

## Choose useful component boundaries

A component is a good candidate when one or more of these are true:

- It represents a meaningful piece of the interface, such as a header, form, card, or navigation area.
- It has a clear responsibility that can be described in a short phrase.
- It is repeated in more than one place.
- It has enough markup or behavior to make its parent difficult to scan.
- It can be understood and changed without needing to know the internals of unrelated UI.

A component does not have to be reused to be useful. Extracting a complex page section can improve readability even when it appears only once.

Avoid both extremes:

- A single giant component makes page structure and behavior difficult to locate.
- A component for every wrapper element creates many files and indirection without clarifying the design.

Start with the page structure and split where a meaningful responsibility or stable interface appears. Refactor when repeated markup or complexity makes a boundary useful.

## Composition: build larger UI from smaller UI

Composition means assembling components together to create a larger interface. A parent can render child components directly:

~~~jsx
function LessonPage() {
    return (
        <main>
            <PageHeading />
            <LessonList />
            <HelpPanel />
        </main>
    );
}
~~~

The parent describes the arrangement. Each child owns the details of its own section. This keeps the page's overall structure visible without duplicating the internals of every section.

Composition is the normal way to reuse UI in React. Components are JavaScript functions, but UI reuse usually comes from composing elements and passing data, not from building a class inheritance hierarchy.

## The children pattern

A component can render content that its caller places between its opening and closing tags. React makes that nested content available as the <code>children</code> prop.

~~~jsx
function Panel({ children }) {
    return <section className="panel">{children}</section>;
}

function LessonPage() {
    return (
        <Panel>
            <h2>Next lesson</h2>
            <p>Continue with component props.</p>
        </Panel>
    );
}
~~~

The caller decides what goes inside the panel; the panel controls the shared outer structure. This is useful for cards, panels, dialogs, page shells, and other containers whose content varies.

A component can also accept named areas when the layout has more than one distinct slot:

~~~jsx
function PageLayout({ header, sidebar, children }) {
    return (
        <>
            <header>{header}</header>
            <div className="page-layout">
                <aside>{sidebar}</aside>
                <main>{children}</main>
            </div>
        </>
    );
}
~~~

~~~jsx
function LessonPage() {
    return (
        <PageLayout
            header={<SiteHeader />}
            sidebar={<CourseNavigation />}
        >
            <LessonContent />
        </PageLayout>
    );
}
~~~

Here, <code>header</code> and <code>sidebar</code> are explicit slots, while <code>children</code> is the main content. The next chapter covers props in detail.

## Keep component interfaces understandable

A component should expose the inputs its caller needs, while keeping its internal markup and implementation private. For example, a reusable button might accept a label, a disabled state, and an event handler. A page should not need to know how the button arranges its internal span and icon.

When a component needs many unrelated options, pause and check whether it has more than one responsibility. Sometimes a smaller composed component or a clearer data object makes the interface easier to use. Do not split or bundle inputs mechanically; choose the shape that makes the caller and component straightforward to understand.

Prefer data and callbacks passed through the component interface over hidden dependencies on unrelated page state. This makes the component's requirements visible.

## Organize components into files

Small examples can keep related components in one file. As an application grows, move a component into its own module when it has a useful boundary or when a file becomes hard to navigate.

A named export is useful when a module exports several related components:

~~~jsx
export function PageHeading({ title }) {
    return <h1>{title}</h1>;
}

export function ProgressCard({ children }) {
    return <section className="progress-card">{children}</section>;
}
~~~

~~~jsx
import { PageHeading, ProgressCard } from "./DashboardComponents.jsx";
~~~

A default export is useful when a file has one primary component:

~~~jsx
export default function LessonList() {
    return <ul>{/* lesson rows */}</ul>;
}
~~~

~~~jsx
import LessonList from "./LessonList.jsx";
~~~

Follow the conventions already used by the project. A component's file name and import path must match the actual file name and casing, especially on case-sensitive deployment systems.

## Components and list identity

When a component is rendered from an array, give the rendered element a stable <code>key</code> so React can match items when the list changes:

~~~jsx
function LessonList({ lessons }) {
    return (
        <ul>
            {lessons.map(lesson => (
                <LessonRow key={lesson.id} lesson={lesson} />
            ))}
        </ul>
    );
}
~~~

<code>key</code> is a special React value used during reconciliation. It is not passed to the component as a normal prop. If <code>LessonRow</code> needs the identifier, pass it explicitly too, for example <code>lessonId={lesson.id}</code>. Use stable identifiers from the data where available, not array indexes for a list that can be inserted into, removed from, or reordered.

## Component boundaries in a MERN application

A MERN application contains several layers, but each React component should focus on its interface responsibility. A display component can render a course or task passed to it. A page-level component can arrange that display with navigation and actions. Application logic can coordinate requests to an API, and the server can validate requests and work with MongoDB.

Keep database queries and secrets out of browser components. The browser talks to the server through an API; it must not connect directly to a protected database. This separation lets the interface and server evolve without making every small UI component responsible for transport or persistence.

## Common mistakes

- Naming a component with a lowercase first letter and expecting JSX to treat it as a custom component.
- Calling a component function directly instead of rendering it with JSX.
- Keeping an entire complex page in one hard-to-scan component.
- Splitting every small HTML wrapper into a component with no meaningful responsibility.
- Copying the same markup into multiple places instead of composing a reusable component.
- Making a container inspect or rewrite arbitrary nested children when explicit slots or a clearer component interface would work.
- Expecting <code>key</code> to be available as an ordinary prop.
- Using an array index as a key for a list whose order or membership can change.
- Putting database access or secret credentials in client-side UI code.
- Creating circular or incorrect import paths when moving components into files.

## Review checklist

- [ ] Each component has a clear UI responsibility.
- [ ] Component names begin with a capital letter.
- [ ] Larger interfaces are composed from smaller components.
- [ ] Container components use <code>children</code> or explicit slots when callers provide variable content.
- [ ] Repeated list items have stable keys.
- [ ] Values needed by a component are passed as ordinary props, not expected from <code>key</code>.
- [ ] Files use consistent, correct export and import paths.
- [ ] React components contain UI responsibilities; database access remains on the server.

## Summary

Components are JavaScript functions that describe pieces of a React interface. Choose boundaries around meaningful responsibilities, then compose components to build pages. Use <code>children</code> or named slots for variable nested content, and organize components into modules as the application grows. Give list elements stable keys, pass any needed identifiers separately, and keep browser UI separate from server-side database access.

## Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [063 - JSX and rendering values](063-jsx-and-rendering-values.md) | [Q&A](../qnas/064-components-and-composition.md) | [Example](../examples/064-components-and-composition.md) | [065 - Props and one-way data flow](065-props-and-one-way-data-flow.md) |

